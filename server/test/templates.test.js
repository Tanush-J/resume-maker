'use strict';

const test = require('node:test');
const assert = require('node:assert');

// Require server modules
const { getTemplateRenderer, listTemplateRenderers } = require('../templates/registry');
require('../templates/classic');
require('../templates/professional');

const sampleResume = {
  schemaVersion: 2,
  id: 'test-resume-1',
  ownerId: 'user-123',
  name: 'Test Resume',
  templateId: 'professional',
  templateVersion: 1,
  content: {
    header: {
      name: 'Jane Doe',
      title: 'Senior Software Engineer',
      contact: '+1 234 567 890',
      email: 'jane@example.com',
      link: 'https://linkedin.com/in/janedoe',
      location: 'San Francisco, CA',
    },
    sections: [
      {
        id: 'summary',
        record: 'SummarySection',
        enabled: true,
        column: 0,
        name: 'Summary',
        items: [{ id: 'sum-1', text: 'Experienced software engineer specializing in distributed systems.' }],
      },
      {
        id: 'experience',
        record: 'ExperienceSection',
        enabled: true,
        column: 0,
        name: 'Experience',
        items: [
          {
            id: 'exp-1',
            designation: 'Staff Engineer',
            company: 'Acme Corp',
            start: '2021',
            end: 'Present',
            location: 'Remote',
            description: ['Architected cloud infrastructure.', 'Reduced latencies by 40%.'],
          },
        ],
      },
      {
        id: 'skills',
        record: 'SkillsSection',
        enabled: true,
        column: 0,
        name: 'Skills',
        items: [{ id: 'sk-1', tags: ['TypeScript', 'Node.js', 'React', 'Go'] }],
      },
    ],
  },
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

test('Template registry contains both Classic and Professional v1', () => {
  const templates = listTemplateRenderers();
  const ids = templates.map((t) => `${t.id}:v${t.version}`);

  assert.ok(ids.includes('classic:v1'), 'classic:v1 must be registered');
  assert.ok(ids.includes('professional:v1'), 'professional:v1 must be registered');
});

test('getTemplateRenderer returns renderer for known templates', () => {
  const classic = getTemplateRenderer('classic', 1);
  assert.equal(typeof classic.render, 'function');

  const professional = getTemplateRenderer('professional', 1);
  assert.equal(typeof professional.render, 'function');
});

test('getTemplateRenderer throws 422 for unknown template or version', () => {
  assert.throws(
    () => getTemplateRenderer('nonexistent', 1),
    (err) => err.statusCode === 422 && /Unsupported resume template/i.test(err.message),
  );

  assert.throws(
    () => getTemplateRenderer('classic', 99),
    (err) => err.statusCode === 422 && /Unsupported resume template/i.test(err.message),
  );
});

test('Professional renderer produces HTML containing header title, summary, and skills', () => {
  const renderer = getTemplateRenderer('professional', 1);
  const { html, css } = renderer.render(sampleResume);

  assert.ok(html.includes('Jane Doe'), 'Must render name');
  assert.ok(html.includes('Senior Software Engineer'), 'Must render job title');
  assert.ok(html.includes('Experienced software engineer'), 'Must render summary');
  assert.ok(html.includes('Staff Engineer'), 'Must render experience designation');
  assert.ok(html.includes('TypeScript'), 'Must render skill tags');
  assert.ok(html.includes('professionalTemplate'), 'Must wrap in professionalTemplate class');
  assert.ok(css.includes('.professionalTemplate'), 'CSS must include scoped professional styles');
});

test('Classic renderer produces HTML containing summary when present', () => {
  const classicResume = { ...sampleResume, templateId: 'classic' };
  const renderer = getTemplateRenderer('classic', 1);
  const { html } = renderer.render(classicResume);

  assert.ok(html.includes('Jane Doe'), 'Must render name');
  assert.ok(html.includes('Experienced software engineer'), 'Must render summary');
});
