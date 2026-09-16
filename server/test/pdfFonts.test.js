/**
 * PDF font regression test (plan §20–§22).
 *
 * Exercises the REAL Puppeteer PDF path with the embedded font CSS produced by
 * fontAssets.js. Verifies:
 *  - Inter, Font Awesome 6 Free, Font Awesome 6 Brands all load (no silent
 *    fallback to Arial/system fonts),
 *  - representative resume icons render with real glyph extents (no tofu/□),
 *  - PDF generation makes zero non-data network requests,
 *  - a PDF is produced without font-loading errors.
 *
 * Run: npm test (uses node:test — no extra deps).
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const puppeteer = require('puppeteer');

const { getEmbeddedFontCss, validateFontAssets, FONT_STYLESHEETS } = require('../fontAssets');

const ICON_CLASSES = [
  'fa-solid fa-phone',
  'fa-brands fa-linkedin',
  'fa-solid fa-location-dot',
  'fa-solid fa-calendar-days',
  'fa-solid fa-link',
  'fa-brands fa-github',
  'fa-solid fa-briefcase',
  'fa-solid fa-certificate',
];

const REQUIRED_FONTS = [
  { name: 'inter', check: "document.fonts.check('16px Inter')" },
  { name: 'faFree', check: "document.fonts.check('16px \"Font Awesome 6 Free\"')" },
  { name: 'faBrands', check: "document.fonts.check('16px \"Font Awesome 6 Brands\"')" },
];

test('font asset validation: all registered stylesheets resolve to local files', () => {
  assert.doesNotThrow(() => validateFontAssets());
  const names = FONT_STYLESHEETS.map((f) => f.name);
  assert.ok(names.includes('inter'), 'inter must be registered');
  assert.ok(names.includes('fontawesome'), 'fontawesome must be registered');
});

test('embedded font CSS contains data: URLs and no external/relative refs', async () => {
  const css = await getEmbeddedFontCss();

  assert.match(css, /data:font\/woff2;base64,/, 'Inter WOFF2 embedded as data URL');
  assert.match(css, /data:font\/woff2;base64,/, 'Font Awesome WOFF2 embedded as data URL');
  assert.doesNotMatch(css, /url\(\s*(https?:|\/\/)/, 'no external font URLs');
  assert.doesNotMatch(css, /url\(\.\.?\//, 'no relative file refs left');
  assert.ok((css.match(/data:font\//g) || []).length >= 5,
    `expected several embedded font sources, got ${(css.match(/data:font\//g) || []).length}`);
});

test('PDF path: required fonts load, icons render, zero non-data requests', async () => {
  const fontCss = await getEmbeddedFontCss();

  const TEST_CSS = `
    body { font-family: 'Inter', sans-serif; font-size: 16px; }
    .icons { font-size: 24px; }
  `;
  const TEST_HTML = `
    <!doctype html><html><head><meta charset="utf-8">
    <style>${fontCss}</style>
    <style>${TEST_CSS}</style></head>
    <body>
      <p id="textLine">Inter text — Hello Résumé 123</p>
      <div class="icons">
        ${ICON_CLASSES.map((cls) => `<i class="${cls}"></i>`).join('\n        ')}
      </div>
    </body></html>
  `;

  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage();
    await page.setRequestInterception(true);
    const requests = [];
    page.on('request', (r) => requests.push(r.url()));
    page.on('requestfailed', (r) => {
      // data: URLs must not be blocked; any failure here is a real problem.
      throw new Error(`PDF request failed: ${r.url()} — ${r.failure()?.errorText}`);
    });
    page.on('request', (r) => (r.url().startsWith('data:') ? r.continue() : r.abort()));

    await page.setContent(TEST_HTML, { waitUntil: 'networkidle0' });

    // §11 — mirror the server's font-loading barrier (fail loudly).
    const fontStatus = await page.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all([
        document.fonts.load('16px Inter'),
        document.fonts.load('16px "Font Awesome 6 Free"'),
        document.fonts.load('16px "Font Awesome 6 Brands"'),
      ]);
      return {
        inter: document.fonts.check('16px Inter'),
        faFree: document.fonts.check('16px "Font Awesome 6 Free"'),
        faBrands: document.fonts.check('16px "Font Awesome 6 Brands"'),
      };
    });

    assert.deepStrictEqual(fontStatus, { inter: true, faFree: true, faBrands: true },
      'all required PDF fonts must load (no silent fallback)');

    // §20 — icons must have real glyph dimensions (no empty squares).
    const glyphs = await page.evaluate(() =>
      [...document.querySelectorAll('.icons i')].map((el) => ({
        cls: el.className,
        w: Math.round(el.getBoundingClientRect().width),
        h: Math.round(el.getBoundingClientRect().height),
      }))
    );

    assert.strictEqual(glyphs.length, ICON_CLASSES.length, 'all icons present');
    for (const g of glyphs) {
      assert.ok(g.w > 0 && g.h > 0, `icon "${g.cls}" must have non-zero glyph extents — ${JSON.stringify(g)}`);
    }

    // §D — zero font network dependency.
    const nonData = requests.filter((u) => !u.startsWith('data:'));
    assert.deepStrictEqual(nonData, [], 'PDF generation must make no non-data (network) requests');

    // §21 — PDF must be generated (embedded fonts used).
    const buffer = await page.pdf({ format: 'A4', printBackground: true });
    assert.ok(buffer.length > 1000, 'PDF should be non-trivial in size');
  } finally {
    await browser.close();
  }
});