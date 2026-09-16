/**
 * Server-side template registry.
 *
 * Mirrors the client template registry (vite-client/src/components/resumeBuilder/templates.ts):
 * the server resolves a renderer by `(templateId, templateVersion)` instead of
 * hard-coding Classic into generic server code.
 *
 * Only `classic` v1 is implemented today; adding a template requires a new
 * renderer module registered here — and the matching client adapter.
 */

/** A renderer turns resume + layoutPlan into `{ html, css }`. */
const templateRenderers = new Map();

/**
 * Register a template renderer.
 * @param {{ id: string, version: number, render: (resume: object, layoutPlan?: object) => { html: string, css: string } }} renderer
 */
const registerTemplateRenderer = (renderer) => {
  if (!renderer?.id || typeof renderer.version !== 'number' || typeof renderer.render !== 'function') {
    throw new Error('Invalid template renderer registration.');
  }
  const key = `${renderer.id}:v${renderer.version}`;
  if (templateRenderers.has(key)) {
    throw new Error(`Template renderer already registered: ${key}`);
  }
  templateRenderers.set(key, renderer);
};

/**
 * Resolve a renderer by template identity.
 * @throws {Error} with `statusCode = 422` when the template/version is unknown.
 */
const getTemplateRenderer = (templateId, templateVersion) => {
  const renderer = templateRenderers.get(`${templateId}:v${templateVersion}`);
  if (!renderer) {
    const error = new Error(`Unsupported resume template: ${templateId} v${templateVersion}.`);
    error.statusCode = 422;
    throw error;
  }
  return renderer;
};

const listTemplateRenderers = () =>
  Array.from(templateRenderers.values()).map((r) => ({ id: r.id, version: r.version }));

module.exports = { registerTemplateRenderer, getTemplateRenderer, listTemplateRenderers };