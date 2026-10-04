/**
 * Input validation for the PDF rendering endpoint.
 *
 * Validates:
 *  - Resume shape (schemaVersion, id, templateId, templateVersion, content)
 *  - Layout plan shape (templateId, templateVersion, pages, regions, blocks)
 *  - Template/version match between resume and layout plan
 *  - URL fields (only http/https schemes allowed)
 *
 * Rejects malformed input with structured errors carrying a statusCode.
 * Does not trust client-supplied ownerId — that is set by the auth middleware.
 */

// ── Helpers ──────────────────────────────────────────────────────────────────

const httpError = (status, message) => {
  const err = new Error(message);
  err.statusCode = status;
  return err;
};

/**
 * Validate a URL field.  Accepts empty string (optional fields) and
 * http/https URLs.  Rejects javascript:, data:, file:, or other schemes.
 */
const ALLOWED_URL_SCHEMES = /^(https?:\/\/)/i;

const validateUrl = (value, fieldName) => {
  if (value === '' || value === undefined || value === null) return true;
  if (typeof value !== 'string') throw httpError(422, `${fieldName} must be a string.`);
  if (!ALLOWED_URL_SCHEMES.test(value)) {
    throw httpError(422, `${fieldName} must use http:// or https:// scheme.`);
  }
  return true;
};

// ── Resume validation ────────────────────────────────────────────────────────

const REQUIRED_SECTION_IDS = [
  'experience', 'projects', 'skills', 'social', 'education', 'trainingCourses', 'achievements',
];

const validateDesignOverrides = (designOverrides) => {
  if (designOverrides === undefined) return;
  if (!designOverrides || typeof designOverrides !== 'object' || Array.isArray(designOverrides)) {
    throw httpError(422, 'Resume designOverrides must be an object when provided.');
  }
  const numberFields = ['pageMargin', 'fontSize', 'lineHeight', 'sectionSpacing', 'itemSpacing', 'sidebarWidth', 'columnGap'];
  numberFields.forEach((field) => {
    if (designOverrides[field] !== undefined) {
      if (typeof designOverrides[field] !== 'number' || !Number.isFinite(designOverrides[field])) {
        throw httpError(422, `Resume designOverrides.${field} must be a finite number.`);
      }
    }
  });
  const allowedFonts = ['Inter', 'Arial', 'Georgia'];
  if (designOverrides.fontFamily !== undefined && !allowedFonts.includes(designOverrides.fontFamily)) {
    throw httpError(422, `Resume designOverrides.fontFamily must be one of: ${allowedFonts.join(', ')}.`);
  }
};

const validateResume = (resume) => {
  if (!resume || typeof resume !== 'object') {
    throw httpError(422, 'Resume must be a non-null object.');
  }

  if (resume.schemaVersion !== 2) {
    throw httpError(422, `Unsupported schemaVersion: ${resume.schemaVersion}. Expected 2.`);
  }

  if (typeof resume.id !== 'string' || !resume.id) {
    throw httpError(422, 'Resume id is required.');
  }

  if (typeof resume.templateId !== 'string' || !resume.templateId) {
    throw httpError(422, 'Resume templateId is required.');
  }

  if (typeof resume.templateVersion !== 'number' || resume.templateVersion < 1) {
    throw httpError(422, 'Resume templateVersion must be a positive integer.');
  }

  // Content
  const content = resume.content;
  if (!content || typeof content !== 'object') {
    throw httpError(422, 'Resume content is required.');
  }

  validateDesignOverrides(resume.designOverrides);

  if (!content.header || typeof content.header !== 'object') {
    throw httpError(422, 'Resume content.header is required.');
  }

  // Header URL fields
  validateUrl(content.header.link, 'header.link');

  if (!Array.isArray(content.sections)) {
    throw httpError(422, 'Resume content.sections must be an array.');
  }

  // Section shape
  content.sections.forEach((section, i) => {
    if (!section || typeof section !== 'object') {
      throw httpError(422, `Section at index ${i} must be an object.`);
    }
    if (typeof section.id !== 'string') {
      throw httpError(422, `Section at index ${i} must have a string id.`);
    }
    if (typeof section.enabled !== 'boolean') {
      throw httpError(422, `Section "${section.id}" must have a boolean enabled field.`);
    }
    if (section.column !== 0 && section.column !== 1) {
      throw httpError(422, `Section "${section.id}" column must be 0 (main) or 1 (sidebar).`);
    }
    if (!Array.isArray(section.items)) {
      throw httpError(422, `Section "${section.id}" must have an items array.`);
    }

    // Section-specific item validation
    if (section.id === 'experience' || section.id === 'projects') {
      section.items.forEach((item, j) => {
        if (section.id === 'experience') {
          validateUrl(item.link, `experience.items[${j}].link`);
          if (!Array.isArray(item.description)) {
            throw httpError(422, `experience.items[${j}].description must be an array.`);
          }
        }
        if (section.id === 'projects') {
          validateUrl(item.link, `projects.items[${j}].link`);
          if (!Array.isArray(item.description)) {
            throw httpError(422, `projects.items[${j}].description must be an array.`);
          }
        }
      });
    }

    if (section.id === 'social') {
      section.items.forEach((item, j) => {
        validateUrl(item.link, `social.items[${j}].link`);
      });
    }

    if (section.id === 'education') {
      section.items.forEach((item, j) => {
        // education items don't have link fields — skip
      });
    }

    if (section.id === 'trainingCourses') {
      section.items.forEach((item, j) => {
        validateUrl(item.link, `trainingCourses.items[${j}].link`);
      });
    }

    if (section.id === 'achievements') {
      section.items.forEach((item, j) => {
        validateUrl(item.link, `achievements.items[${j}].link`);
      });
    }
  });
};

// ── Layout plan validation ───────────────────────────────────────────────────

const validateLayoutPlan = (layoutPlan, resume) => {
  if (!layoutPlan || typeof layoutPlan !== 'object') {
    throw httpError(422, 'Layout plan must be a non-null object.');
  }

  if (!Array.isArray(layoutPlan.pages) || layoutPlan.pages.length === 0) {
    throw httpError(422, 'Layout plan must have at least one page.');
  }

  if (!layoutPlan.page || typeof layoutPlan.page !== 'object') {
    throw httpError(422, 'Layout plan must have a page definition.');
  }

  if (typeof layoutPlan.page.width !== 'number' || typeof layoutPlan.page.height !== 'number') {
    throw httpError(422, 'Layout plan page must have numeric width and height.');
  }

  // Template/version match
  if (layoutPlan.templateId && layoutPlan.templateId !== resume.templateId) {
    throw httpError(422,
      `Layout plan templateId "${layoutPlan.templateId}" does not match resume templateId "${resume.templateId}".`);
  }

  if (layoutPlan.templateVersion && layoutPlan.templateVersion !== resume.templateVersion) {
    throw httpError(422,
      `Layout plan templateVersion ${layoutPlan.templateVersion} does not match resume templateVersion ${resume.templateVersion}.`);
  }

  // Pages structure
  layoutPlan.pages.forEach((page, i) => {
    if (typeof page.index !== 'number') {
      throw httpError(422, `Layout plan page ${i} must have a numeric index.`);
    }
    if (!Array.isArray(page.regions)) {
      throw httpError(422, `Layout plan page ${i} must have a regions array.`);
    }
    page.regions.forEach((region, j) => {
      if (typeof region.id !== 'string') {
        throw httpError(422, `Layout plan page ${i}, region ${j} must have a string id.`);
      }
      if (!Array.isArray(region.blocks)) {
        throw httpError(422, `Layout plan page ${i}, region "${region.id}" must have a blocks array.`);
      }
      region.blocks.forEach((block, k) => {
        if (typeof block.id !== 'string') {
          throw httpError(422, `Layout plan page ${i}, region "${region.id}", block ${k} must have a string id.`);
        }
        if (typeof block.height !== 'number' || block.height < 0) {
          throw httpError(422, `Layout plan block "${block.id}" must have a non-negative numeric height.`);
        }
      });
    });
  });
};

// ── Max limits ───────────────────────────────────────────────────────────────

const MAX_SECTIONS = 20;
const MAX_ITEMS_PER_SECTION = 100;
const MAX_FIELD_LENGTH = 2000;
const MAX_LAYOUT_BLOCKS = 500;

const validateLimits = (resume, layoutPlan) => {
  if (resume.content.sections.length > MAX_SECTIONS) {
    throw httpError(422, `Too many sections (max ${MAX_SECTIONS}).`);
  }

  resume.content.sections.forEach((section) => {
    if (section.items.length > MAX_ITEMS_PER_SECTION) {
      throw httpError(422, `Section "${section.id}" has too many items (max ${MAX_ITEMS_PER_SECTION}).`);
    }
  });

  // Check field lengths on key text fields
  const checkLength = (val, path) => {
    if (typeof val === 'string' && val.length > MAX_FIELD_LENGTH) {
      throw httpError(422, `Field ${path} exceeds maximum length of ${MAX_FIELD_LENGTH} characters.`);
    }
  };

  checkLength(resume.content.header.name, 'header.name');
  checkLength(resume.content.header.email, 'header.email');
  checkLength(resume.content.header.contact, 'header.contact');

  resume.content.sections.forEach((section) => {
    section.items.forEach((item, i) => {
      if (section.id === 'experience') {
        checkLength(item.designation, `${section.id}.items[${i}].designation`);
        checkLength(item.company, `${section.id}.items[${i}].company`);
      }
      if (section.id === 'projects') {
        checkLength(item.title, `${section.id}.items[${i}].title`);
      }
    });
  });

  // Layout plan block count
  if (layoutPlan) {
    let blockCount = 0;
    layoutPlan.pages.forEach((page) => {
      page.regions.forEach((region) => {
        blockCount += region.blocks.length;
      });
    });
    if (blockCount > MAX_LAYOUT_BLOCKS) {
      throw httpError(422, `Layout plan has too many blocks (max ${MAX_LAYOUT_BLOCKS}).`);
    }
  }
};

module.exports = {
  httpError,
  validateResume,
  validateLayoutPlan,
  validateLimits,
  validateUrl,
};