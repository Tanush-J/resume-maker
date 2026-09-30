const fs = require('fs');
const path = require('path');

// ── Shared CSS (single source of truth, byte-identical to client) ─────────────
const PROFESSIONAL_CSS = fs.readFileSync(path.join(__dirname, 'professional.css'), 'utf8');

// ── Page dimensions (must match professionalTemplate.page in templates.ts) ──
const PAGE = {
  widthPx: 794,
  heightPx: 1123,
  paddingTop: 60,
  paddingRight: 60,
  paddingBottom: 0,
  paddingLeft: 60,
};

// ── Content normalization ────────────────────────────────────────────────────
const toFlatContent = (content) => {
  if (!content || !Array.isArray(content.sections)) {
    return content;
  }

  const flat = {
    headerSection: content.header
      ? { ...content.header }
      : { name: '', title: '', contact: '', email: '', link: '', location: '' },
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

// ── HTML helpers ──────────────────────────────────────────────────────────────

const escapeHtml = (value) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

const icon = (className) => `<i class="${escapeHtml(className)}"></i>`;
const separator = '<div class="pItemSeparator"></div>';

// ── Block HTML Map (keyed by client semantic ids) ─────────────────────────────

const buildBlockMap = (resume) => {
  const map = new Map();
  const content = toFlatContent(resume.content);

  // ── Summary ──
  if (content.summarySection) {
    map.set('summary-heading', `<div class="pSectionHeadingWrapper"><div class="pSectionHeading"><h2>Summary</h2></div></div>`);
    content.summarySection.forEach((item, i) => {
      if (!item.text) return;
      map.set(`summary-${i}`, `<div class="pSummarySection"><div class="pItem"><p>${escapeHtml(item.text)}</p></div></div>`);
    });
  }

  // ── Experience ──
  if (content.experienceSection) {
    map.set('experience-heading', `<div class="pSectionHeadingWrapper"><div class="pSectionHeading"><h2>Experience</h2></div></div>`);
    content.experienceSection.forEach((item) => {
      const bullets = item.description?.length ? item.description : [''];
      bullets.forEach((bullet, i) => {
        const headerHtml = i === 0 ? `
          <div class="pItemHeaderRow">
            <div>
              ${item.designation ? `<h3>${escapeHtml(item.designation)}</h3>` : ''}
              ${item.company ? `<h4>${escapeHtml(item.company)}</h4>` : ''}
            </div>
            <div class="pItemMeta">
              <span><i class="fa-solid fa-calendar-days"></i>${escapeHtml(item.start)} - ${escapeHtml(item.end)}</span>
              ${item.location ? `<span><i class="fa-solid fa-location-dot"></i>${escapeHtml(item.location)}</span>` : ''}
            </div>
          </div>
          ${item.link ? `<a class="pItemLink" target="_blank" href="${escapeHtml(item.link)}"><i class="fa-solid fa-link"></i>Link</a>` : ''}` : '';
        const blockId = i === 0 ? `${item.id}-head` : `${item.id}-bullet-${i}`;
        map.set(blockId, `<div class="pExperienceSection"><div class="pItem" data-layout-block="${escapeHtml(blockId)}">${headerHtml}<ul><li>${escapeHtml(bullet)}</li></ul></div></div>`);
      });
    });
  }

  // ── Projects ──
  if (content.projectsSection) {
    map.set('projects-heading', `<div class="pSectionHeadingWrapper"><div class="pSectionHeading"><h2>Projects</h2></div></div>`);
    content.projectsSection.forEach((item) => {
      if (!item.show) return;
      const bullets = item.description?.length ? item.description : [''];
      bullets.forEach((bullet, i) => {
        const headerHtml = i === 0 ? `
          <div class="pItemHeaderRow">
            <h3>${escapeHtml(item.title)}</h3>
          </div>
          ${item.link ? `<div class="pLinkField"><a target="_blank" href="${escapeHtml(item.link)}"><i class="fa-solid fa-link fa-xs"></i>${escapeHtml(item.link)}</a></div>` : ''}` : '';
        const blockId = i === 0 ? `${item.id}-head` : `${item.id}-bullet-${i}`;
        map.set(blockId, `<div class="pProjectsSection"><div class="pItem" data-layout-block="${escapeHtml(blockId)}">${headerHtml}<ul><li>${escapeHtml(bullet)}</li></ul></div></div>`);
      });
    });
  }

  // ── Skills ──
  if (content.skillsSection) {
    map.set('skills-heading', `<div class="pSectionHeadingWrapper"><div class="pSectionHeading"><h2>Skills</h2></div></div>`);
    map.set('skills', `<div class="pSkillsSection"><div class="pSkillChips">${content.skillsSection.map((skill) => `<span class="pSkillChip">${escapeHtml(skill)}</span>`).join('')}</div></div>`);
  }

  // ── Social ──
  if (content.socialSection) {
    map.set('social-heading', `<div class="pSectionHeadingWrapper"><div class="pSectionHeading"><h2>Find Me Online</h2></div></div>`);
    content.socialSection.forEach((item, i) => {
      const sep = i < content.socialSection.length - 1 ? separator : '';
      map.set(`social-${i}`, `<div class="pSocialSection"><div class="pItem"><div class="pSocialRow">${icon(item.icon)}<p>${escapeHtml(item.name)}</p></div><div class="pLinkField"><span>${escapeHtml(item.link)}</span></div></div>${sep}</div>`);
    });
  }

  // ── Education ──
  if (content.educationSection) {
    map.set('education-heading', `<div class="pSectionHeadingWrapper"><div class="pSectionHeading"><h2>Education</h2></div></div>`);
    content.educationSection.forEach((item, i) => {
      if (!item.show) return;
      const sep = i < content.educationSection.length - 1 ? separator : '';
      const gpaHtml = item.gpa?.type ? `
        <div class="pEducationGpa">
          <span>${escapeHtml(item.gpa.type)}</span>: <span>${escapeHtml(item.gpa.score)}</span> / <span>${escapeHtml(item.gpa.outOf)}</span>
        </div>` : '';
      map.set(`education-${i}`, `<div class="pEducationSection"><div class="pItem"><div class="pItemHeaderRow"><div><h3>${escapeHtml(item.degree)}</h3><h4>${escapeHtml(item.location)}</h4></div><div class="pItemMeta"><span>${escapeHtml(item.start)} - ${escapeHtml(item.end)}</span></div></div>${gpaHtml}</div>${sep}</div>`);
    });
  }

  // ── Training / Courses ──
  if (content.trainingCoursesSection) {
    map.set('trainingCourses-heading', `<div class="pSectionHeadingWrapper"><div class="pSectionHeading"><h2>Training / Courses</h2></div></div>`);
    content.trainingCoursesSection.forEach((item, i) => {
      if (!item.show) return;
      const sep = i < content.trainingCoursesSection.length - 1 ? separator : '';
      map.set(`trainingCourses-${i}`, `<div class="pTrainingCoursesSection"><div class="pItem"><div class="pLinkContainer"><h4>${escapeHtml(item.title)}</h4><a class="pCertificateLink" target="_blank" href="${escapeHtml(item.link)}">${icon('fa-solid fa-link fa-base')}</a></div><p>${escapeHtml(item.description)}</p></div>${sep}</div>`);
    });
  }

  // ── Achievements ──
  if (content.achievementsSection) {
    map.set('achievements-heading', `<div class="pSectionHeadingWrapper"><div class="pSectionHeading"><h2>Achievements</h2></div></div>`);
    content.achievementsSection.forEach((item, i) => {
      const sep = i < content.achievementsSection.length - 1 ? separator : '';
      map.set(`achievements-${i}`, `<div class="pAchievementsSection"><div class="pItem"><div class="pLinkContainer"><h4>${escapeHtml(item.title)}</h4><a class="pCertificateLink" target="_blank" href="${escapeHtml(item.link)}">${icon('fa-solid fa-link fa-base')}</a></div><p>${escapeHtml(item.description)}</p></div>${sep}</div>`);
    });
  }

  return map;
};

// ── Full document renderer ────────────────────────────────────────────────────

const renderResumeDocument = (resume, layoutPlan) => {
  const content = toFlatContent(resume.content);
  const header = content.headerSection;

  // Title fallback
  const firstExpDesignation = content.experienceSection?.[0]?.designation || '';
  const title = header.title || firstExpDesignation;

  const headerHtml = `
    <div class="pHeader">
      <h1>${escapeHtml(header.name)}</h1>
      ${title ? `<p class="pHeaderTitle">${escapeHtml(title)}</p>` : ''}
      <div class="pHeaderContact">
        ${header.location ? `<span><i class="fa-solid fa-location-dot fa-xs"></i>${escapeHtml(header.location)}</span>` : ''}
        ${header.email ? `<span><i class="fa-solid fa-at fa-xs"></i>${escapeHtml(header.email)}</span>` : ''}
        ${header.contact ? `<span><i class="fa-solid fa-phone fa-xs"></i>${escapeHtml(header.contact)}</span>` : ''}
        ${header.link ? `<span><i class="fa-solid fa-link fa-xs"></i>${escapeHtml(header.link)}</span>` : ''}
      </div>
    </div>`;

  const pageStyle = `width:${PAGE.widthPx}px; min-height:${PAGE.heightPx}px; padding:${PAGE.paddingTop}px ${PAGE.paddingRight}px ${PAGE.paddingBottom}px ${PAGE.paddingLeft}px; box-sizing:border-box; background:white; margin:0 auto; page-break-after:always;`;

  // ── Plan-driven rendering (exact parity with client DOM measurements) ──────
  if (layoutPlan && Array.isArray(layoutPlan.pages) && layoutPlan.pages.length > 0) {
    const blockMap = buildBlockMap(resume);

    const renderContinuation = (block, titleFromId) => {
      const metaTitle = block.continuationMetadata?.title;
      const headingTitle = metaTitle || titleFromId || 'Continued';
      return `<div class="pSectionContinuationHeading"><h2>${escapeHtml(headingTitle)}</h2></div>`;
    };

    const renderBlock = (block) => {
      if (block.isContinuation || block.id.endsWith('-continuation')) {
        let legacyTitle = '';
        const id = block.id;
        if (id.startsWith('summary')) legacyTitle = 'Summary (continued)';
        else if (id.startsWith('experience')) legacyTitle = 'Experience (continued)';
        else if (id.startsWith('project')) legacyTitle = 'Projects (continued)';
        else if (id.startsWith('education')) legacyTitle = 'Education (continued)';
        else if (id.startsWith('training')) legacyTitle = 'Training / Courses (continued)';
        else if (id.startsWith('achievement')) legacyTitle = 'Achievements (continued)';
        else if (id.startsWith('social')) legacyTitle = 'Find Me Online (continued)';
        return renderContinuation(block, legacyTitle);
      }
      return blockMap.get(block.id) || '';
    };

    const pages = layoutPlan.pages.map((page, pageIndex) => {
      const mainRegion = page.regions?.find((r) => r.id === 'main');
      const mainHtml = (mainRegion?.blocks || []).map(renderBlock).join('');

      return `
        <div class="resumePage professionalTemplate" style="${pageStyle}">
          <div class="pResumeBody">
            ${pageIndex === 0 ? headerHtml : ''}
            <div class="pRegion">${mainHtml}</div>
          </div>
        </div>`;
    });

    if (pages.length > 0) {
      pages[pages.length - 1] = pages[pages.length - 1].replace('page-break-after:always', 'page-break-after:auto');
    }

    return { html: pages.join('\n'), css: PROFESSIONAL_CSS };
  }

  // Fallback if no layoutPlan is provided: render everything on a single page
  const blockMap = buildBlockMap(resume);
  const allBlocksHtml = Array.from(blockMap.values()).join('\n');
  const pageHtml = `
    <div class="resumePage professionalTemplate" style="${pageStyle} page-break-after:auto;">
      <div class="pResumeBody">
        ${headerHtml}
        <div class="pRegion">${allBlocksHtml}</div>
      </div>
    </div>`;

  return { html: pageHtml, css: PROFESSIONAL_CSS };
};

// ── Registry registration ────────────────────────────────────────────────────
const { registerTemplateRenderer } = require('./registry');

registerTemplateRenderer({
  id: 'professional',
  version: 1,
  render: renderResumeDocument,
});

module.exports = { renderResumeDocument };
