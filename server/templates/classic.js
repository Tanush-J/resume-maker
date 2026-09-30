const fs = require('fs');
const path = require('path');

// ── Shared CSS (single source of truth, also imported by the client) ──────────
const CLASSIC_CSS = fs.readFileSync(path.join(__dirname, 'classic.css'), 'utf8');

// ── Page dimensions (must match classicTemplate.page in templates.ts) ─────────
const PAGE = {
  widthPx: 794,
  heightPx: 1123,
  paddingTop: 60,
  paddingRight: 60,
  paddingBottom: 0,
  paddingLeft: 60,
};

const usableHeight = PAGE.heightPx - PAGE.paddingTop - PAGE.paddingBottom;

// ── Content normalization ────────────────────────────────────────────────────
//
// The client now persists resume content in a generic `sections[]` array
// (schemaVersion 2, Enhancv-style). To keep the server renderers stable, we
// normalize that shape into the flat field names the rest of this file uses.
// Legacy v1 documents (flat `content.*Section`) pass through unchanged.
const toFlatContent = (content) => {
  if (!content || !Array.isArray(content.sections)) {
    // Already flat (v1) or absent — pass through (v1 uses headerSection).
    return content;
  }

  const flat = {
    headerSection: content.header
      ? { ...content.header }
      : { name: '', contact: '', email: '', link: '', location: '' },
    summarySection: [],
    experienceSection: [],
    projectsSection: [],
    skillsSection: [],
    socialSection: [],
    educationSection: [],
    trainingCoursesSection: [],
    achievementsSection: [],
  };

  const byId = (id) => content.sections.find((section) => section.id === id);

  const summary = byId('summary');
  if (summary) flat.summarySection = summary.items ?? [];

  const experience = byId('experience');
  if (experience) flat.experienceSection = experience.items ?? [];

  const projects = byId('projects');
  if (projects) flat.projectsSection = projects.items ?? [];

  const skills = byId('skills');
  if (skills) flat.skillsSection = skills.items?.[0]?.tags ?? [];

  const social = byId('social');
  if (social) flat.socialSection = social.items ?? [];

  const education = byId('education');
  if (education) flat.educationSection = education.items ?? [];

  const trainingCourses = byId('trainingCourses');
  if (trainingCourses) flat.trainingCoursesSection = trainingCourses.items ?? [];

  const achievements = byId('achievements');
  if (achievements) flat.achievementsSection = achievements.items ?? [];

  return flat;
};

/**
 * Return a v1-style configuration `placements` list derived from EITHER the
 * legacy `resume.configuration` (v1) OR the generic `resume.content.sections`
 * (v2). This lets the placement-based renderers work unchanged for both.
 */
const getPlacements = (resume) => {
  if (resume.configuration?.placements?.length) return resume.configuration.placements;

  const sections = resume.content?.sections;
  if (!Array.isArray(sections)) return [];

  return sections.map((section, order) => ({
    sectionId: section.id,
    regionId: section.column === 1 ? 'sidebar' : 'main',
    order,
    visible: section.enabled !== false,
  }));
};

/** v1-style visibility map (for legacy sectionVisibility). */
const getLegacyVisibility = (resume) => resume.configuration?.sectionVisibility || {};

// ── HTML helpers ──────────────────────────────────────────────────────────────

const escapeHtml = (value) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

const icon = (className) => `<i class="${escapeHtml(className)}"></i>`;
const bullets = (items = []) => `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`;
const separator = '<div class="itemSeperator"></div>';

const renderExperience = (items = []) => items.map((item) => {
  const description = item.description?.length ? item.description : [''];
  return description.map((bullet, index) => `
    <div class="itemObject resumeItemFragment" data-layout-block="${escapeHtml(item.id)}-bullet-${index}" data-source-id="${escapeHtml(item.id)}">
      ${index === 0 ? `
        ${item.designation ? `<h3>${escapeHtml(item.designation)}</h3>` : ''}
        ${item.company ? `<h4>${escapeHtml(item.company)}</h4>` : ''}
        <div class="experienceItemIconContainer">
          <span>${icon('fa-solid fa-calendar-days')}${escapeHtml(item.start)} - ${escapeHtml(item.end)}&nbsp;</span>
          ${item.location ? `<span>${icon('fa-solid fa-location-dot')}${escapeHtml(item.location)}</span>` : ''}
          ${item.link ? `<a class="experienceItemLink" target="_blank" href="${escapeHtml(item.link)}">${icon('fa-solid fa-link')}Link</a>` : ''}
        </div>` : ''}
      <ul><li>${escapeHtml(bullet)}</li></ul>
    </div>`).join('');
}).join('');

const renderProjects = (items = []) => items.filter((item) => item.show).map((item) => {
  const description = item.description?.length ? item.description : [''];
  return description.map((bullet, index) => `
    <div class="itemObject resumeItemFragment" data-layout-block="${escapeHtml(item.id)}-bullet-${index}" data-source-id="${escapeHtml(item.id)}">
      ${index === 0 ? `<h3>${escapeHtml(item.title)}</h3>
      <div class="linkField"><a target="_blank" href="${escapeHtml(item.link)}">${icon('fa-solid fa-link fa-xs')}${escapeHtml(item.link)}</a></div>` : ''}
      <ul><li>${escapeHtml(bullet)}</li></ul>
    </div>`).join('');
}).join('');

const renderSocial = (items = []) => items.map((item, index) => `
  <div class="itemObject">
    <div class="socialIconContainer">${icon(item.icon)}<p>${escapeHtml(item.name)}</p></div>
    <div class="linkField"><span>${escapeHtml(item.link)}</span></div>
  </div>${index < items.length - 1 ? separator : ''}`).join('');

const renderEducation = (items = []) => items.filter((item) => item.show).map((item, index, visibleItems) => `
  <div class="itemObject educationItem">
    <div>
      <h3>${escapeHtml(item.degree)}</h3>
      <h4>${escapeHtml(item.location)}</h4>
      <span>${escapeHtml(item.start)} - ${escapeHtml(item.end)}</span>
    </div>
    <div class="educationItemGpa">
      <p>${escapeHtml(item.gpa.type)}</p>
      <div><span class="score">${escapeHtml(item.gpa.score)}</span><span> / </span><span>${escapeHtml(item.gpa.outOf)}</span></div>
    </div>
  </div>${index < visibleItems.length - 1 ? separator : ''}`).join('');

const renderCourses = (items = []) => items.filter((item) => item.show).map((item, index, visibleItems) => `
  <div class="itemObject">
    <div class="linkContainer">
      <h4>${escapeHtml(item.title)}</h4>
      <a class="certificateItemLink" target="_blank" href="${escapeHtml(item.link)}">${icon('fa-solid fa-link fa-base')}</a>
    </div>
    <p>${escapeHtml(item.description)}</p>
  </div>${index < visibleItems.length - 1 ? separator : ''}`).join('');

const renderAchievements = (items = []) => items.map((item, index) => `
  <div class="itemObject">
    <div class="linkContainer">
      <h4>${escapeHtml(item.title)}</h4>
      <a class="certificateItemLink" target="_blank" href="${escapeHtml(item.link)}">${icon('fa-solid fa-link fa-base')}</a>
    </div>
    <p>${escapeHtml(item.description)}</p>
  </div>${index < items.length - 1 ? separator : ''}`).join('');

const section = (visible, className, title, body, sectionId) => visible
  ? `<div class="${className}" data-section-id="${escapeHtml(sectionId)}"><div class="sectionHeading" data-layout-block="${escapeHtml(sectionId)}-heading"><h2>${title}</h2></div>${body}</div>`
  : '';

const renderPlacedSections = (resume, regionId, sections) => {
  const placements = resume.configuration?.placements;
  const legacyVisibility = resume.configuration?.sectionVisibility || {};
  const defaultRegion = (sectionId) => ['summary', 'experience', 'projects'].includes(sectionId) ? 'main' : 'sidebar';
  const placementFor = (sectionId) => placements?.find((item) => item.sectionId === sectionId);

  return sections
    .filter((sectionItem) => {
      const placement = placementFor(sectionItem.id);
      return (placement?.regionId ?? defaultRegion(sectionItem.id)) === regionId
        && (placement?.visible ?? legacyVisibility[sectionItem.id]);
    })
    .sort((first, second) => (placementFor(first.id)?.order ?? first.defaultOrder) - (placementFor(second.id)?.order ?? second.defaultOrder))
    .map((sectionItem) => sectionItem.html)
    .join('');
};

// ── Pagination ────────────────────────────────────────────────────────────────
//
// The server paginates using the same bullet-fragment model as the client's
// flattenLayoutBlocks + paginateLayout pipeline.  Each fragment already has
// a natural height estimated conservatively; Puppeteer wraps each page in an
// explicit .resumePage div so @page and page-break rules are reliable.

/** Estimate the rendered height of a text string at 13px/1.4 line-height in a given column width. */
const estimateBulletHeight = (text, colWidthPx = 440) => {
  const charsPerLine = Math.floor(colWidthPx / 7.5); // ~7.5px per char at 13px
  const lines = Math.max(1, Math.ceil(text.length / charsPerLine));
  return lines * 19 + 8; // 13px * 1.4 lh ≈ 18.2px; +8px padding
};

const HEADING_H = 44;        // sectionHeading (h2 + padding)
const ITEM_HEADER_H = 70;    // designation + company + icon row
const SIDEBAR_BLOCK_H = 120; // approximate for sidebar sections (skills/social/etc.)

/**
 * Build an array of layout fragments for the main column from the resume content
 * and placement settings.  Each fragment knows:
 *   - html  : the HTML string for this fragment
 *   - height: conservative estimated height in px
 *   - isContinuationHeading: true when it is a section-continuation heading
 */
const buildMainFragments = (resume) => {
  const content = toFlatContent(resume.content);
  const placements = getPlacements(resume);
  const legacyVisibility = getLegacyVisibility(resume);
  const isSectionVisible = (id) => placements.find((p) => p.sectionId === id)?.visible ?? legacyVisibility[id] ?? true;
  const sectionInRegion = (id) => {
    const p = placements.find((pl) => pl.sectionId === id);
    return p ? p.regionId : (['summary', 'experience', 'projects'].includes(id) ? 'main' : 'sidebar');
  };
  const sectionOrder = (id) => placements.find((p) => p.sectionId === id)?.order ?? 999;

  const mainSections = ['summary', 'experience', 'projects']
    .filter((id) => isSectionVisible(id) && sectionInRegion(id) === 'main')
    .sort((a, b) => sectionOrder(a) - sectionOrder(b));

  const fragments = [];

  for (const sectionId of mainSections) {
    const continuationHeadingHtml = sectionId === 'summary'
      ? `<div class="sectionContinuationHeading"><h2>Summary (continued)</h2></div>`
      : sectionId === 'experience'
      ? `<div class="sectionContinuationHeading"><h2>Experience (continued)</h2></div>`
      : `<div class="sectionContinuationHeading"><h2>Projects (continued)</h2></div>`;

    if (sectionId === 'summary') {
      fragments.push({ html: `<div class="resumeSummarySection"><div class="sectionHeading"><h2>Summary</h2></div></div>`, height: HEADING_H, sectionId, continuationHeadingHtml });
      for (const item of content.summarySection) {
        if (!item.text) continue;
        fragments.push({
          html: `<div class="resumeSummarySection"><div class="itemObject"><p>${escapeHtml(item.text)}</p></div></div>`,
          height: estimateBulletHeight(item.text),
          sectionId,
          continuationHeadingHtml,
        });
      }
    }

    if (sectionId === 'experience') {
      fragments.push({ html: `<div class="resumeExperienceSection"><div class="sectionHeading"><h2>Experience</h2></div></div>`, height: HEADING_H, sectionId, continuationHeadingHtml });
      for (const item of content.experienceSection) {
        const bullets = item.description?.length ? item.description : [''];
        bullets.forEach((bullet, i) => {
          const headerHtml = i === 0 ? `
            ${item.designation ? `<h3>${escapeHtml(item.designation)}</h3>` : ''}
            ${item.company ? `<h4>${escapeHtml(item.company)}</h4>` : ''}
            <div class="experienceItemIconContainer">
              <span><i class="fa-solid fa-calendar-days"></i>${escapeHtml(item.start)} - ${escapeHtml(item.end)}&nbsp;</span>
              ${item.location ? `<span><i class="fa-solid fa-location-dot"></i>${escapeHtml(item.location)}</span>` : ''}
              ${item.link ? `<a class="experienceItemLink" target="_blank" href="${escapeHtml(item.link)}"><i class="fa-solid fa-link"></i>Link</a>` : ''}
            </div>` : '';
          const bulletHtml = `<ul><li>${escapeHtml(bullet)}</li></ul>`;
          const height = (i === 0 ? ITEM_HEADER_H : 0) + estimateBulletHeight(bullet);
          fragments.push({
            html: `<div class="resumeExperienceSection"><div class="itemObject resumeItemFragment">${headerHtml}${bulletHtml}</div></div>`,
            height,
            sectionId,
            continuationHeadingHtml,
          });
        });
      }
    }

    if (sectionId === 'projects') {
      const visibleProjects = content.projectsSection.filter((p) => p.show);
      if (!visibleProjects.length) continue;
      fragments.push({ html: `<div class="resumeProjectsSection"><div class="sectionHeading"><h2>Projects</h2></div></div>`, height: HEADING_H, sectionId, continuationHeadingHtml });
      for (const item of visibleProjects) {
        const bullets = item.description?.length ? item.description : [''];
        bullets.forEach((bullet, i) => {
          const headerHtml = i === 0 ? `
            <h3>${escapeHtml(item.title)}</h3>
            <div class="linkField"><a target="_blank" href="${escapeHtml(item.link)}"><i class="fa-solid fa-link fa-xs"></i>${escapeHtml(item.link)}</a></div>` : '';
          const height = (i === 0 ? 48 : 0) + estimateBulletHeight(bullet);
          fragments.push({
            html: `<div class="resumeProjectsSection"><div class="itemObject resumeItemFragment">${headerHtml}<ul><li>${escapeHtml(bullet)}</li></ul></div></div>`,
            height,
            sectionId,
            continuationHeadingHtml,
          });
        });
      }
    }
  }

  return fragments;
};

/**
 * Paginate an array of fragments into pages.
 * Returns an array of pages; each page is an array of html strings.
 */
const paginateFragments = (fragments, availableHeight) => {
  const pages = [[]];
  const pageHeights = [0];
  // Track which section last opened a continuation heading on this page
  const pageLastSection = [''];

  for (const fragment of fragments) {
    const currentPage = pages.length - 1;
    const currentHeight = pageHeights[currentPage];
    const fits = currentHeight + fragment.height <= availableHeight;

    if (!fits && currentPage === 0 && currentHeight === 0) {
      // Oversized single fragment — force onto current page anyway
      pages[currentPage].push(fragment.html);
      pageHeights[currentPage] += fragment.height;
    } else if (!fits) {
      // Start a new page; add a continuation heading if mid-section
      pages.push([]);
      pageHeights.push(0);
      const newPage = pages.length - 1;
      pageLastSection[newPage] = '';

      if (fragment.continuationHeadingHtml && fragment.sectionId !== pageLastSection[newPage]) {
        pages[newPage].push(fragment.continuationHeadingHtml);
        pageHeights[newPage] += HEADING_H;
        pageLastSection[newPage] = fragment.sectionId;
      }
      pages[newPage].push(fragment.html);
      pageHeights[newPage] += fragment.height;
    } else {
      pages[currentPage].push(fragment.html);
      pageHeights[currentPage] += fragment.height;
      if (fragment.sectionId) pageLastSection[currentPage] = fragment.sectionId;
    }
  }

  return pages;
};

// ── Block HTML Map (used for layoutPlan-driven rendering) ─────────────────────

const buildBlockMap = (resume) => {
  const map = new Map();
  const content = toFlatContent(resume.content);

  // ── Summary ──
  if (content.summarySection) {
    map.set('summary-heading', `<div class="resumeSummarySection"><div class="sectionHeading"><h2>Summary</h2></div></div>`);
    content.summarySection.forEach((item, i) => {
      if (!item.text) return;
      map.set(`summary-${i}`, `<div class="resumeSummarySection"><div class="itemObject"><p>${escapeHtml(item.text)}</p></div></div>`);
    });
  }

  // ── Experience ──
  if (content.experienceSection) {
    map.set('experience-heading', `<div class="resumeExperienceSection"><div class="sectionHeading"><h2>Experience</h2></div></div>`);
    content.experienceSection.forEach((item) => {
      const bullets = item.description?.length ? item.description : [''];
      bullets.forEach((bullet, i) => {
        const headerHtml = i === 0 ? `
          ${item.designation ? `<h3>${escapeHtml(item.designation)}</h3>` : ''}
          ${item.company ? `<h4>${escapeHtml(item.company)}</h4>` : ''}
          <div class="experienceItemIconContainer">
            <span><i class="fa-solid fa-calendar-days"></i>${escapeHtml(item.start)} - ${escapeHtml(item.end)}&nbsp;</span>
            ${item.location ? `<span><i class="fa-solid fa-location-dot"></i>${escapeHtml(item.location)}</span>` : ''}
            ${item.link ? `<a class="experienceItemLink" target="_blank" href="${escapeHtml(item.link)}"><i class="fa-solid fa-link"></i>Link</a>` : ''}
          </div>` : '';
        // Semantic blocks: `${id}-head` carries header + first bullet (atomic);
        // `${id}-bullet-N` (N ≥ 1) carries flowing bullets only.
        const blockId = i === 0 ? `${item.id}-head` : `${item.id}-bullet-${i}`;
        map.set(blockId, `<div class="resumeExperienceSection"><div class="itemObject resumeItemFragment" data-layout-block="${escapeHtml(blockId)}">${headerHtml}<ul><li>${escapeHtml(bullet)}</li></ul></div></div>`);
      });
    });
  }

  // ── Projects ──
  if (content.projectsSection) {
    map.set('projects-heading', `<div class="resumeProjectsSection"><div class="sectionHeading"><h2>Projects</h2></div></div>`);
    content.projectsSection.forEach((item) => {
      if (!item.show) return;
      const bullets = item.description?.length ? item.description : [''];
      bullets.forEach((bullet, i) => {
        const headerHtml = i === 0 ? `
          <h3>${escapeHtml(item.title)}</h3>
          <div class="linkField"><a target="_blank" href="${escapeHtml(item.link)}"><i class="fa-solid fa-link fa-xs"></i>${escapeHtml(item.link)}</a></div>` : '';
        const blockId = i === 0 ? `${item.id}-head` : `${item.id}-bullet-${i}`;
        map.set(blockId, `<div class="resumeProjectsSection"><div class="itemObject resumeItemFragment" data-layout-block="${escapeHtml(blockId)}">${headerHtml}<ul><li>${escapeHtml(bullet)}</li></ul></div></div>`);
      });
    });
  }

  // ── Sidebar sections (each item split as an individual block) ──
  map.set('skills', `<div class="resumeSkillSection"><div class="sectionHeading"><h2>Skills</h2></div><div class="itemObject skillContainer">${content.skillsSection.map((skill) => `<span>${escapeHtml(skill)}</span>`).join('')}</div></div>`);

  // Social
  map.set('social-heading', `<div class="resumeFindMeOnlineSection"><div class="sectionHeading"><h2>Find Me Online</h2></div></div>`);
  content.socialSection.forEach((item, i) => {
    const sep = i < content.socialSection.length - 1 ? separator : '';
    map.set(`social-${i}`, `<div class="resumeFindMeOnlineSection"><div class="itemObject"><div class="socialIconContainer">${icon(item.icon)}<p>${escapeHtml(item.name)}</p></div><div class="linkField"><span>${escapeHtml(item.link)}</span></div></div>${sep}</div>`);
  });

  // Education
  map.set('education-heading', `<div class="resumeEducationSection"><div class="sectionHeading"><h2>Education</h2></div></div>`);
  content.educationSection.forEach((item, i) => {
    if (!item.show) return;
    const sep = i < content.educationSection.length - 1 ? separator : '';
    map.set(`education-${i}`, `<div class="resumeEducationSection"><div class="itemObject educationItem"><div><h3>${escapeHtml(item.degree)}</h3><h4>${escapeHtml(item.location)}</h4><span>${escapeHtml(item.start)} - ${escapeHtml(item.end)}</span></div><div class="educationItemGpa"><p>${escapeHtml(item.gpa.type)}</p><div><span class="score">${escapeHtml(item.gpa.score)}</span><span> / </span><span>${escapeHtml(item.gpa.outOf)}</span></div></div></div>${sep}</div>`);
  });

  // Training / Courses
  map.set('trainingCourses-heading', `<div class="resumeTrainingCoursesSection"><div class="sectionHeading"><h2>Training / Courses</h2></div></div>`);
  content.trainingCoursesSection.forEach((item, i) => {
    if (!item.show) return;
    const sep = i < content.trainingCoursesSection.length - 1 ? separator : '';
    map.set(`trainingCourses-${i}`, `<div class="resumeTrainingCoursesSection"><div class="itemObject"><div class="linkContainer"><h4>${escapeHtml(item.title)}</h4><a class="certificateItemLink" target="_blank" href="${escapeHtml(item.link)}">${icon('fa-solid fa-link fa-base')}</a></div><p>${escapeHtml(item.description)}</p></div>${sep}</div>`);
  });

  // Achievements
  map.set('achievements-heading', `<div class="resumeAchievementsSection"><div class="sectionHeading"><h2>Achievements</h2></div></div>`);
  content.achievementsSection.forEach((item, i) => {
    const sep = i < content.achievementsSection.length - 1 ? separator : '';
    map.set(`achievements-${i}`, `<div class="resumeAchievementsSection"><div class="itemObject"><div class="linkContainer"><h4>${escapeHtml(item.title)}</h4><a class="certificateItemLink" target="_blank" href="${escapeHtml(item.link)}">${icon('fa-solid fa-link fa-base')}</a></div><p>${escapeHtml(item.description)}</p></div>${sep}</div>`);
  });

  return map;
};

// ── Full document renderer ────────────────────────────────────────────────────

const renderResumeDocument = (resume, layoutPlan) => {
  const content = toFlatContent(resume.content);
  const header = content.headerSection;
  const headerHtml = `
    <div class="resumeHeader">
      <h1>${escapeHtml(header.name)}</h1>
      <div class="contactInfo">
        <span><i class="fa-solid fa-phone fa-xs"></i>${escapeHtml(header.contact)}</span>
        <span><i class="fa-solid fa-at fa-xs"></i>${escapeHtml(header.email)}</span>
        <span><i class="fa-brands fa-linkedin"></i>${escapeHtml(header.link)}</span>
        <span><i class="fa-solid fa-location-dot fa-xs"></i>${escapeHtml(header.location)}</span>
      </div>
    </div>`;

  const pageStyle = `width:${PAGE.widthPx}px; min-height:${PAGE.heightPx}px; padding:${PAGE.paddingTop}px ${PAGE.paddingRight}px ${PAGE.paddingBottom}px ${PAGE.paddingLeft}px; box-sizing:border-box; background:white; margin:0 auto; page-break-after:always;`;

  // ── Plan-driven rendering (exact parity with client DOM measurements) ──────
  if (layoutPlan && Array.isArray(layoutPlan.pages) && layoutPlan.pages.length > 0) {
    const blockMap = buildBlockMap(resume);

    /**
     * Resolve a continuation block to HTML. Prefers the explicit
     * `continuationMetadata` serialized by the client layout engine; falls
     * back to legacy block-id sniffing only for plans that predate the
     * metadata (transitional compatibility).
     */
    const renderContinuation = (block, titleFromId) => {
      const metaTitle = block.continuationMetadata?.title;
      const title = metaTitle || titleFromId || 'Continued';
      return `<div class="sectionContinuationHeading"><h2>${escapeHtml(title)}</h2></div>`;
    };

    const renderBlock = (block) => {
      if (block.isContinuation || block.id.endsWith('-continuation')) {
        // Legacy id-derived title, used only when explicit metadata is absent.
        let legacyTitle = '';
        const id = block.id;
        if (id.startsWith('experience') || block.sourceId?.startsWith('experience')) legacyTitle = 'Experience (continued)';
        else if (id.startsWith('project') || block.sourceId?.startsWith('project')) legacyTitle = 'Projects (continued)';
        else if (id.startsWith('education') || block.sourceId?.startsWith('education')) legacyTitle = 'Education (continued)';
        else if (id.startsWith('training') || block.sourceId?.startsWith('training')) legacyTitle = 'Training / Courses (continued)';
        else if (id.startsWith('achievement') || block.sourceId?.startsWith('achievement')) legacyTitle = 'Achievements (continued)';
        else if (id.startsWith('social') || block.sourceId?.startsWith('social')) legacyTitle = 'Find Me Online (continued)';
        return renderContinuation(block, legacyTitle);
      }
      return blockMap.get(block.id) || '';
    };

    const pages = layoutPlan.pages.map((page, pageIndex) => {
      const mainRegion = page.regions?.find((r) => r.id === 'main');
      const sidebarRegion = page.regions?.find((r) => r.id === 'sidebar');

      const mainHtml = (mainRegion?.blocks || []).map(renderBlock).join('');
      const sidebarHtml = (sidebarRegion?.blocks || []).map(renderBlock).join('');

      return `
        <div class="resumePage" style="${pageStyle}">
          <div class="resumeBackground">
            <div class="resumeBody">
              ${pageIndex === 0 ? headerHtml : ''}
              <div class="resumeInfoBody">
                <div class="resumeBodyCol">${mainHtml}</div>
                <div class="resumeBodyCol">${sidebarHtml}</div>
              </div>
            </div>
          </div>
        </div>`;
    });

    if (pages.length > 0) {
      // The last page must not force a trailing page break in the PDF/print.
      pages[pages.length - 1] = pages[pages.length - 1].replace('page-break-after:always', 'page-break-after:auto');
    }

    return { html: pages.join('\n'), css: CLASSIC_CSS };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // LEGACY COMPATIBILITY FALLBACK (no layoutPlan supplied)
  //
  // The client ALWAYS sends a layoutPlan; this branch exists only for
  // out-of-band/server-side-only renders (e.g. API clients, tests, manual
  // debugging) using ESTIMATED heights. It is NOT a competing layout engine —
  // it is the legacy approximation, deliberately isolated below and kept
  // byte-stable so it cannot silently drift into the primary path.
  //
  // Known legacy limitation (retained intentionally): the sidebar is
  // estimation-based and only rendered on page 0.
  // ═══════════════════════════════════════════════════════════════════════════
  const renderLegacyFallback = () => {
    const placements = getPlacements(resume);
    const legacyVisibility = getLegacyVisibility(resume);
    const isSectionVisible = (id) => placements.find((p) => p.sectionId === id)?.visible ?? legacyVisibility[id] ?? true;
    const sectionInRegion = (id) => {
      const p = placements.find((pl) => pl.sectionId === id);
      return p ? p.regionId : (['experience', 'projects'].includes(id) ? 'main' : 'sidebar');
    };
    const sectionOrder = (id) => placements.find((p) => p.sectionId === id)?.order ?? 999;

    const sidebarSections = ['skills', 'social', 'education', 'trainingCourses', 'achievements']
      .filter((id) => isSectionVisible(id) && sectionInRegion(id) === 'sidebar')
      .sort((a, b) => sectionOrder(a) - sectionOrder(b));

    const sidebarHtmlParts = sidebarSections.map((id) => {
      if (id === 'skills') return section(true, 'resumeSkillSection', 'Skills',
        `<div class="itemObject skillContainer">${content.skillsSection.map((s) => `<span>${escapeHtml(s)}</span>`).join('')}</div>`, 'skills');
      if (id === 'social') return section(true, 'resumeFindMeOnlineSection', 'Find Me Online', renderSocial(content.socialSection), 'social');
      if (id === 'education') return section(true, 'resumeEducationSection', 'Education', renderEducation(content.educationSection), 'education');
      if (id === 'trainingCourses') return section(true, 'resumeTrainingCoursesSection', 'Training / Courses', renderCourses(content.trainingCoursesSection), 'trainingCourses');
      if (id === 'achievements') return section(true, 'resumeAchievementsSection', 'Achievements', renderAchievements(content.achievementsSection), 'achievements');
      return '';
    });
    const sidebarHtml = sidebarHtmlParts.join('');

    const fragments = buildMainFragments(resume);
    const HEADER_H = 110;
    const sentinelFragment = { html: '', height: HEADER_H, sectionId: '', continuationHeadingHtml: '' };
    const allFragments = [sentinelFragment, ...fragments];
    const rawPages = paginateFragments(allFragments, usableHeight);

    const mainPages = rawPages.map((pageFragments, i) =>
      i === 0 ? pageFragments.filter((h) => h !== '') : pageFragments
    );

    const pages = mainPages.map((mainFrags, pageIndex) => `
      <div class="resumePage" style="${pageStyle}">
        <div class="resumeBackground">
          <div class="resumeBody">
            ${pageIndex === 0 ? headerHtml : ''}
            <div class="resumeInfoBody">
              <div class="resumeBodyCol">${mainFrags.join('')}</div>
              <div class="resumeBodyCol">${pageIndex === 0 ? sidebarHtml : ''}</div>
            </div>
          </div>
        </div>
      </div>`);

    if (pages.length > 0) {
      pages[pages.length - 1] = pages[pages.length - 1].replace('page-break-after:always', 'page-break-after:auto');
    }

    return { html: pages.join('\n'), css: CLASSIC_CSS };
  };

  return renderLegacyFallback();
};

// ── Registry registration ────────────────────────────────────────────────────
// Self-register this template into the server template registry so routes can
// resolve renderers generically by (id, version).
const { registerTemplateRenderer } = require('./registry');

registerTemplateRenderer({
  id: 'classic',
  version: 1,
  render: renderResumeDocument,
});

module.exports = { renderResumeDocument };
