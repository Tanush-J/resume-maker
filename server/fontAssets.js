/**
 * Embedded font-asset loader for PDF generation.
 *
 * Reads registered local font stylesheets, resolves every local url(...)
 * reference to a base64 data: URL, and caches the result. The PDF renderer
 * injects the generated CSS directly into the HTML — no HTTP fetch, no CORS,
 * no localhost dependency.
 *
 * §3   — dedicated server-side font asset loader
 * §4   — generic registry (add fonts without modifying renderers)
 * §5   — resolve local url(...) references generically
 * §6   — reject external font URLs
 * §10  — cache generated CSS in memory
 * §14  — future-font support (just register a new entry)
 * §19  — font asset validation
 */

const fs = require('fs');
const path = require('path');

// ── Font registry ────────────────────────────────────────────────────────────
// To add a new font later, just push another entry here. §14

const FONT_STYLESHEETS = [
  {
    name: 'inter',
    cssPath: path.join(__dirname, 'assets/fonts/inter.css'),
  },
  {
    name: 'fontawesome',
    cssPath: path.join(__dirname, 'assets/fontawesome/css/all.min.css'),
  },
];

// ── MIME helpers ─────────────────────────────────────────────────────────────

const MIME_MAP = {
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
};

/**
 * Convert an absolute file path to a data: URL.
 * §5 — supported formats: woff2, woff, ttf, otf.
 */
const fileToDataUrl = (filePath) => {
  const ext = path.extname(filePath).toLowerCase();
  const mime = MIME_MAP[ext];
  if (!mime) {
    throw new Error(`Unsupported font file extension "${ext}" for ${filePath}.`);
  }
  const data = fs.readFileSync(filePath);
  return `data:${mime};base64,${data.toString('base64')}`;
};

// ── URL resolution inside CSS ────────────────────────────────────────────────

/**
 * Match url(...) in CSS — handles quoted and unquoted paths, single or double
 * quotes. Captures the path in group 1.
 */
const URL_REGEX = /url\(\s*['"]?([^'")]+?)['"]?\s*\)/g;

/**
 * Match one `@font-face` `src` entry: `url(...) format(...)` optionally
 * followed by a comma. Used so a dropped source removes its format token too.
 * Group 1 = raw path.
 */
const SRC_ENTRY_REGEX =
  /url\(\s*['"]?([^'")]+?)['"]?\s*\)(?:\s*format\(\s*['"]?[^'")]+?['"]?\s*\))?\s*,?/gi;

/**
 * A single @font-face block references several local font files as fallback
 * sources (e.g. FA lists both `woff2` and `ttf` per family, but the vendored
 * copy only ships the `woff2` — matching `vite-client/public/fontawesome/`).
 *
 * Embedded URLs make every byte expensive, so instead of failing on a missing
 * fallback source we drop only the unresolvable candidates from that
 * @font-face. We hard-fail if:
 *   - an external (http/https/protocol-relative) URL is referenced anywhere (§6), or
 *   - an @font-face ends up with NO loadable local source.
 *
 * The runtime `document.fonts.check()` gate in the PDF endpoint remains the
 * final authority on whether the required families actually loaded.
 */
const rewriteUrls = (cssText, cssFilePath) => {
  const cssDir = path.dirname(cssFilePath);
  let anyFontFaceDroppedToZero = false;

  const rewritten = cssText.replace(
    /(@font-face\s*\{[^}]*\})/gi,
    (block) => {
      const sources = [];
      let blockHasExternal = false;
      let outerMatch = '';

      block = block.replace(SRC_ENTRY_REGEX, (entry, rawPath) => {
        outerMatch = entry;
        // §6 — reject external URLs
        if (/^(https?:|\/\/)/.test(rawPath)) {
          blockHasExternal = true;
          return entry; // replaced with a hard error below
        }

        const absPath = path.resolve(cssDir, rawPath);

        if (!fs.existsSync(absPath)) {
          return ''; // drop unresolvable fallback source (woff2 candidates remain)
        }

        sources.push(absPath);
        return entry.replace(URL_REGEX, () => `url(${fileToDataUrl(absPath)})`);
      });

      if (blockHasExternal) {
        throw new Error(
          `External font URL detected in ${cssFilePath}: "${outerMatch}". ` +
          'PDF fonts must be local bundled files only.'
        );
      }

      if (sources.length === 0) {
        anyFontFaceDroppedToZero = true;
      }

      return block;
    }
  );

  if (anyFontFaceDroppedToZero) {
    const faceNames = [...cssText.matchAll(/@font-face\s*\{[^}]*?font-family:\s*([^;}]+)/gi)]
      .map((m) => m[1].trim().replace(/^['"]|['"]$/g, ''));
    throw new Error(
      `[PDF fonts] A required @font-face in ${cssFilePath} has no loadable ` +
      `local font source (all fallback files missing). Families: ${faceNames.join(', ')}\n` +
      'Ensure the font files exist on disk — PDF generation must not silently fall back to system fonts.'
    );
  }

  return rewritten;
};

// ── Public API ───────────────────────────────────────────────────────────────

let embeddedCssCache = null;

/**
 * Build (or return cached) embedded font CSS string for all registered
 * font stylesheets.
 *
 * @param {object}  [options]
 * @param {string[]} [options.fonts] — optional subset of registered font names
 *                                     to include. If omitted, all registered
 *                                     fonts are embedded (§15).
 * @returns {Promise<string>} — combined CSS with data: URL font sources
 */
const getEmbeddedFontCss = async ({ fonts } = {}) => {
  if (embeddedCssCache && !fonts) return embeddedCssCache;

  const registry = fonts
    ? FONT_STYLESHEETS.filter((entry) => fonts.includes(entry.name))
    : FONT_STYLESHEETS;

  if (registry.length === 0) {
    throw new Error('No matching font stylesheets registered for the requested font names.');
  }

  const parts = [];

  for (const { name, cssPath } of registry) {
    // §19 — validate CSS file exists
    if (!fs.existsSync(cssPath)) {
      throw new Error(
        `[PDF fonts] Registered font stylesheet missing: "${name}" at ${cssPath}`
      );
    }

    const raw = fs.readFileSync(cssPath, 'utf8');
    const embedded = rewriteUrls(raw, cssPath);
    parts.push(`/* ── ${name} (embedded) ── */\n${embedded}`);
  }

  const combined = parts.join('\n\n');

  // Cache for all-fonts requests (§10)
  if (!fonts) embeddedCssCache = combined;

  return combined;
};

/**
 * Validate that all registered font assets exist and resolve.
 * Call at server startup for fail-fast behaviour (§19).
 *
 * - External font URLs (http/https/protocol-relative) → hard error (§6).
 * - A @font-face whose local sources all fail to resolve → hard error.
 * - A missing fallback source (e.g. `ttf` when `woff2` exists) → warning only,
 *   matching policy: the remaining `woff2` still loads fine.
 *
 * @throws on the first fatal condition above.
 */
const validateFontAssets = () => {
  for (const { name, cssPath } of FONT_STYLESHEETS) {
    if (!fs.existsSync(cssPath)) {
      throw new Error(`[PDF fonts] Missing stylesheet for "${name}": ${cssPath}`);
    }

    const raw = fs.readFileSync(cssPath, 'utf8');
    const cssDir = path.dirname(cssPath);

    let match;
    URL_REGEX.lastIndex = 0; // reset regex state
    while ((match = URL_REGEX.exec(raw)) !== null) {
      const ref = match[1];

      // §6 — external URL guard
      if (/^(https?:|\/\/)/.test(ref)) {
        throw new Error(
          `[PDF fonts] External URL found in registered font "${name}": ${ref}`
        );
      }

      const abs = path.resolve(cssDir, ref);
      if (!fs.existsSync(abs)) {
        // woff2 candidates remain — the @font-face is still loadable.
        // Log a warning instead of hard-failing so we don't break the PDF
        // for a fallback format the browser never uses.
        console.warn(
          `[PDF fonts] Missing fallback font file for "${name}" (skipping, ` +
          `other sources remain): ${abs}`
        );
        continue;
      }

      const ext = path.extname(abs).toLowerCase();
      if (!MIME_MAP[ext]) {
        throw new Error(
          `[PDF fonts] Unsupported font extension "${ext}" for "${name}": ${abs}`
        );
      }
    }
  }
};

module.exports = { getEmbeddedFontCss, validateFontAssets, FONT_STYLESHEETS };
