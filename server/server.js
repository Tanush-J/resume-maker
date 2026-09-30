const express = require('express');
const cors = require('cors');
const path = require('path');
const puppeteer = require('puppeteer');

const { auth, db } = require('./firebase');
const { getTemplateRenderer } = require('./templates/registry');
const { validateResume, validateLayoutPlan, validateLimits } = require('./validation');
const { getEmbeddedFontCss, validateFontAssets } = require('./fontAssets');

// Ensure templates are registered (side-effect imports).
require('./templates/classic');
require('./templates/professional');

// §19 — fail fast if required font assets are missing.
validateFontAssets();

const app = express();
const PORT = process.env.PORT || 5000;
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173')
  .split(',').map((origin) => origin.trim()).filter(Boolean);



const loadResume = async (userId, resumeId) => {
  const resumeSnapshot = await db.collection('users').doc(userId)
    .collection('resumes').doc(resumeId).get();

  if (!resumeSnapshot.exists) {
    const error = new Error('Resume not found.');
    error.statusCode = 404;
    throw error;
  }

  const resume = resumeSnapshot.data();
  if (resume.ownerId !== userId) {
    const error = new Error('Resume ownership mismatch.');
    error.statusCode = 403;
    throw error;
  }

  return resume;
};

// §9 — inject embedded font CSS directly (no network fetch needed).
const documentMarkup = ({ html, css, fontCss }) => `
<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <style>${fontCss}</style>
  <style>${css}</style>
</head>
<body>${html}</body>
</html>`;

app.use(cors({ origin: allowedOrigins }));
app.use(express.json({ limit: '32kb' }));

const authenticateRequest = async (req, res, next) => {
  const authorization = req.get('authorization') || '';
  const token = authorization.startsWith('Bearer ')
    ? authorization.slice('Bearer '.length)
    : null;

  if (!token) return res.status(401).json({ message: 'Missing Firebase ID token.' });

  try {
    req.user = await auth.verifyIdToken(token);
    return next();
  } catch (error) {
    console.error('Firebase token verification failed:', error.code || error.message);
    return res.status(401).json({ message: 'Invalid Firebase ID token.' });
  }
};

app.get('/health', (_req, res) => res.status(200).json({ status: 'ok' }));

// ── Puppeteer browser reuse (plan §24) ───────────────────────────────────────
let browserInstance = null;

const getBrowser = async () => {
  if (browserInstance && browserInstance.connected) return browserInstance;
  browserInstance = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  return browserInstance;
};

// ── PDF endpoint ─────────────────────────────────────────────────────────────

const PDF_TIMEOUT_MS = 30000; // 30s hard cap per render

app.post('/api/resumes/:resumeId/pdf', authenticateRequest, async (req, res) => {
  const { resumeId } = req.params;

  try {
    // 1. Resolve resume (body or Firestore)
    const resume = req.body?.resume
      ? { ...req.body.resume, ownerId: req.user.uid }  // never trust client ownerId
      : await loadResume(req.user.uid, resumeId);

    // 2. Validate resume shape
    validateResume(resume);

    // 3. Validate layout plan shape + template/version match
    const layoutPlan = req.body?.layoutPlan;
    if (layoutPlan) {
      validateLayoutPlan(layoutPlan, resume);
    }

    // 4. Validate limits (sections count, items, field lengths, block count)
    validateLimits(resume, layoutPlan);

    // 5. Resolve renderer via template registry
    const renderer = getTemplateRenderer(resume.templateId, resume.templateVersion);

    // 6. Render HTML + CSS
    const { html, css } = renderer.render(resume, layoutPlan);

    // 7. Embedded font CSS (§3) — no HTTP fetch, no CORS, no localhost dep.
    const fontCss = await getEmbeddedFontCss();

    // 8. PDF generation with timeout + SSRF guard
    const browser = await getBrowser();
    const page = await browser.newPage();

    // Prevent the renderer from fetching arbitrary external resources.
    // Allow only localhost (existing assets) and data: URLs (embedded fonts).
    await page.setRequestInterception(true);
    page.on('request', (request) => {
      const url = request.url();
      if (url.startsWith('data:')) {
        request.continue();
        return;
      }
      let hostname = '';
      try {
        hostname = new URL(url).hostname;
      } catch {
        request.abort(); // malformed URL — never fetch
        return;
      }
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        request.continue();
      } else {
        request.abort();
      }
    });

    let pdfBuffer;
    try {
      const setContentPromise = page.setContent(
        documentMarkup({ html, css, fontCss }),
        { waitUntil: 'networkidle0' },
      );
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Puppeteer page.setContent timed out.')), PDF_TIMEOUT_MS)
      );
      await Promise.race([setContentPromise, timeoutPromise]);

      // §11 — Font-loading barrier: page.setContent resolves when the DOM
      // is parsed, not when @font-face resources are finished. Rendering the
      // PDF before Inter / Font Awesome load would fall back to Arial and
      // produce glyph-less icons and different wrapping than the client's
      // measured layoutPlan. Block until fonts are ready, then explicitly
      // verify the families the resume depends on — fail loudly if any
      // required font is missing (§11, no silent catch).
      await page.evaluate(async () => {
        await document.fonts.ready;

        await Promise.all([
          document.fonts.load('16px Inter'),
          document.fonts.load('16px "Font Awesome 6 Free"'),
          document.fonts.load('16px "Font Awesome 6 Brands"'),
        ]);

        const status = {
          inter: document.fonts.check('16px Inter'),
          fontAwesomeFree: document.fonts.check('16px "Font Awesome 6 Free"'),
          fontAwesomeBrands: document.fonts.check('16px "Font Awesome 6 Brands"'),
        };

        if (!status.inter || !status.fontAwesomeFree || !status.fontAwesomeBrands) {
          throw new Error(
            `Required PDF fonts failed to load: ${JSON.stringify(status)}`
          );
        }
      });

      pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        preferCSSPageSize: true,
      });
    } finally {
      await page.close().catch(() => {}); // always close the page
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${resumeId}.pdf"`);
    return res.send(pdfBuffer);
  } catch (error) {
    const status = error.statusCode || 500;
    console.error(`PDF generation failed [${status}]:`, error.message || error);
    return res.status(status).json({ message: error.message || 'Unable to generate PDF.' });
  }
});

// Graceful shutdown: close Puppeteer browser on process exit.
process.on('SIGTERM', async () => {
  if (browserInstance) await browserInstance.close().catch(() => {});
  process.exit(0);
});
process.on('SIGINT', async () => {
  if (browserInstance) await browserInstance.close().catch(() => {});
  process.exit(0);
});

app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));