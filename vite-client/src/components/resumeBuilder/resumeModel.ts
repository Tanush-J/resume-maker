// ─── Header ───────────────────────────────────────────────────────────────────

export interface ResumeHeader {
  name: string;
  contact: string;
  email: string;
  link: string;
  location: string;
}

// ─── Item shapes (nested under each generic section) ─────────────────────────

export interface ExperienceItem {
  id: string;
  designation: string;
  company: string;
  start: string;
  end: string;
  location: string;
  link?: string;
  description: string[];
}

export interface ProjectItem {
  id: string;
  title: string;
  link: string;
  description: string[];
  show: boolean;
}

export interface SkillItem {
  /** Skills are stored as a tag list, mirroring Enhancv's TechnologyItem. */
  id: string;
  tags: string[];
}

export interface SocialItem {
  id: string;
  icon: string;
  name: string;
  link: string;
}

export interface EducationItem {
  id: string;
  degree: string;
  location: string;
  start: string;
  end: string;
  gpa: {
    type: string;
    score: string;
    outOf: string;
  };
  show: boolean;
}

export interface TrainingCourseItem {
  id: string;
  title: string;
  link: string;
  description: string;
  show: boolean;
}

export interface AchievementItem {
  id: string;
  title: string;
  link: string;
  description: string;
}

// ─── Generic section array (Enhancv-style) ───────────────────────────────────

/** Canonical section ids used by the editor, controls, and templates. */
export type ResumeSectionId =
  | 'experience'
  | 'projects'
  | 'skills'
  | 'social'
  | 'education'
  | 'trainingCourses'
  | 'achievements';

/** Enhancv-parity `record` discriminator for each section type. */
export type SectionRecord =
  | 'ExperienceSection'
  | 'ProjectsSection'
  | 'SkillsSection'
  | 'SocialSection'
  | 'EducationSection'
  | 'TrainingCoursesSection'
  | 'AchievementsSection';

/** Layout column: 0 = main, 1 = sidebar. */
export type SectionColumn = 0 | 1;

/** Shared fields present on every entry of the generic `sections[]` array. */
interface BaseResumeSection {
  id: ResumeSectionId;
  /** Stable type discriminator; templates key their renderers on this. */
  record: SectionRecord;
  /** Whether the section is rendered/hidden. */
  enabled: boolean;
  /** Layout column: 0 = main, 1 = sidebar. */
  column: SectionColumn;
  /** Human-friendly display name (used by editors/controls). */
  name: string;
}

export interface ExperienceSection extends BaseResumeSection {
  record: 'ExperienceSection';
  items: ExperienceItem[];
}

export interface ProjectsSection extends BaseResumeSection {
  record: 'ProjectsSection';
  items: ProjectItem[];
}

export interface SkillsSection extends BaseResumeSection {
  record: 'SkillsSection';
  items: SkillItem[];
}

export interface SocialSection extends BaseResumeSection {
  record: 'SocialSection';
  items: SocialItem[];
}

export interface EducationSection extends BaseResumeSection {
  record: 'EducationSection';
  items: EducationItem[];
}

export interface TrainingCoursesSection extends BaseResumeSection {
  record: 'TrainingCoursesSection';
  items: TrainingCourseItem[];
}

export interface AchievementsSection extends BaseResumeSection {
  record: 'AchievementsSection';
  items: AchievementItem[];
}

export type ResumeSection =
  | ExperienceSection
  | ProjectsSection
  | SkillsSection
  | SocialSection
  | EducationSection
  | TrainingCoursesSection
  | AchievementsSection;

// ─── Content ──────────────────────────────────────────────────────────────────

/**
 * Template-agnostic resume content.
 *
 * `sections[]` is a generic list: every template reads the entries it knows
 * via the `record` discriminator and ignores the rest. Adding a new section
 * type is additive — it never changes this interface.
 */
export interface ResumeContent {
  /** Header is a dedicated field (Enhancv keeps it outside sections too). */
  header: ResumeHeader;
  sections: ResumeSection[];
}

export interface ResumeDocument {
  schemaVersion: 2;
  id: string;
  ownerId: string;
  name: string;
  templateId: string;
  templateVersion: number;
  /** Column/order/visibility live on each section; there is no separate config. */
  content: ResumeContent;
  createdAt: string;
  updatedAt: string;
}

// ─── Section helpers ──────────────────────────────────────────────────────────

/** Map a section id to its Enhancv-parity `record` string. */
export const SECTION_RECORDS: Record<ResumeSectionId, SectionRecord> = {
  experience: 'ExperienceSection',
  projects: 'ProjectsSection',
  skills: 'SkillsSection',
  social: 'SocialSection',
  education: 'EducationSection',
  trainingCourses: 'TrainingCoursesSection',
  achievements: 'AchievementsSection',
};

export const RECORD_TO_SECTION_ID: Record<SectionRecord, ResumeSectionId> = {
  ExperienceSection: 'experience',
  ProjectsSection: 'projects',
  SkillsSection: 'skills',
  SocialSection: 'social',
  EducationSection: 'education',
  TrainingCoursesSection: 'trainingCourses',
  AchievementsSection: 'achievements',
};

/** Find a section in the generic array by its id. */
export const sectionById = (
  sections: ResumeSection[],
  id: ResumeSectionId,
): ResumeSection | undefined => sections.find((section) => section.id === id);

/** Find a section in the generic array by its `record` discriminator. */
export const sectionByRecord = (
  sections: ResumeSection[],
  record: SectionRecord,
): ResumeSection | undefined => sections.find((section) => section.record === record);

/** Items of a section, typed; empty when the section is absent. */
export const sectionItems = (
  sections: ResumeSection[],
  id: ResumeSectionId,
): unknown[] => sectionById(sections, id)?.items ?? [];

// ─── Generic section array (Enhancv-style) ───────────────────────────────────

export const defaultResumeContent: ResumeContent = {
  header: {
    name: 'Tanush Jangid',
    contact: '+91 7420842106',
    email: 'tanushjangid1234@gmail.com',
    link: 'https://linkedin.com/in/tanush-jangid-496232194',
    location: 'Mumbai',
  },
  sections: [
    {
      id: 'experience',
      record: 'ExperienceSection',
      enabled: true,
      column: 0,
      name: 'Experience',
      items: [
        {
          id: 'experience-blaccsckull',
          designation: 'SDE',
          company: 'BlaccSckull',
          start: '04/2024',
          end: 'Present',
          location: 'Pune',
          description: [
            'Planned and built key features for video uploads and processing, helping grow the application from 500 to 17K+ users.',
            'Added deep and universal links to the mobile app, improving new-user onboarding and making navigation smoother and more reliable.',
            'Implemented online payments, referral programs, advertising campaigns, and user analytics across web and mobile apps, helping teams understand user behavior and improve conversion rates.',
            'Developed user-facing screens and workflows that securely handled payments, tracked user interactions, and kept app data consistent across sessions.',
            'Improved app speed and responsiveness by optimizing how data was fetched, reducing repeat request times from 1–1.5 seconds to 10–20 milliseconds.',
            'Worked on a scalable system for storing and delivering user media using cloud services, ensuring fast access and reliable performance.',
          ],
        },
        {
          id: 'experience-capgemini',
          designation: 'Software Engineer Trainee',
          company: 'Capgemini',
          start: '08/2022',
          end: '12/2022',
          location: 'Pune',
          link: 'https://drive.google.com/file/d/1vTqdxP0s9AifCj1zC6aHpKuQ8G4WRKl9/view?usp=sharing',
          description: [
            'Contributed to an industry 4.0 project "Intelligence Operation Platform (IOP)" involving data integration from various factories and machines into Azure tables.',
            'My contribution to the project was to develop a user-friendly interface for creating, modifying, and deleting complex Key Performance Indicators',
            'These KPIs served to monitor and analyze crucial performance metrics such as design speed, uptime, downtime, and overall machine performance.',
          ],
        },
      ],
    },
    {
      id: 'projects',
      record: 'ProjectsSection',
      enabled: true,
      column: 0,
      name: 'Projects',
      items: [
        {
          id: 'project-resume-maker',
          title: 'Resume Maker App — EnhanCV Clone',
          link: 'https://github.com/Tanush-J/resume-maker',
          description: [
            'Currently building an EnhanCV-inspired resume-maker app, enabling users to select templates, input details, and download resumes as PDFs. This resume was created and downloaded using my app.',
            'The project leverages React.js and react-router for the front end, Express.js and Node.js for the backend, and Firebase for database management and authentication.',
            'Currently exploring AI-powered NLP features that can read existing resumes or career documents, extract key career details, and auto-generate tailored sentences to pre-fill resume templates, making the process faster, smarter, and more personalized.',
          ],
          show: true,
        },
        {
          id: 'project-hydroponic',
          title: 'Monitoring Of Indoor Hydroponic Farm System Using IOT and Machine Learning',
          link: 'https://docs.google.com/document/d/1pWMDoQ9_hkl8_vUoZID55tSH44DsGZlVX4EyZs82lBQ/edit',
          description: [
            'This project aims to develop a remote hydroponic system that monitors various parameters and metrics for trained and untrained individuals.',
            'The system used sensors to measure pH, humidity, water level, and temperature, along with a camera module to capture plant leaf images. A machine learning model analyzed these images to detect diseases and recommend treatments.',
            'The tech stack included microcontrollers, a Python-based machine learning model, a web server for data transmission, and a website for user interaction and analytics.',
          ],
          show: false,
        },
        {
          id: 'project-foodle',
          title: 'Foodle Website — A food detail website',
          link: 'https://foodles.onrender.com/',
          description: [
            'A food details website where you can learn about different food shops around you and the food items they sell.',
            'You can view the different dishes available and get the location of the shop where they sell them.',
            'You can also log in or sign up to leave a review for the dish.',
          ],
          show: false,
        },
        {
          id: 'project-elearn',
          title: 'E-Learn Website — An online E-learn website',
          link: 'https://github.com/Tanush-J/WTLmini',
          description: [
            'Our project aimed to create an online learning platform website where you create your account Or sign in to the website, to view and watch different courses.',
            'This was my college mini-project for one of the subjects. So, my friend and I worked on this website.',
            'The website provides diverse courses that require login/signup for access. Users can view courses and post their own by creating a YouTube playlist and sharing the link on the site. The platform allows direct viewing of entire playlists on the website.',
          ],
          show: false,
        },
        {
          id: 'project-bank-security',
          title: 'Bank Security Application — Backend',
          link: 'https://github.com/Tanush-J/Bank-Security-Application',
          description: [
            'A Spring Boot-based backend for a secure banking application that handles user registration, login, account management, and transaction operations. It includes authentication, authorization, and role-based access control to enhance banking security.',
            'The project is made using Java 17 and Spring Boot, implementing JWT-based authentication with Spring Security and database operations with Spring Data JPA. Utilized H2 for in-memory data storage, JavaMailSender for OTP-based email verification, and Lombok to streamline code.',
          ],
          show: true,
        },
        {
          id: 'project-news-agent',
          title: 'AI-Powered News-to-Email Agent',
          link: 'https://dev.to/tanush_j_582df12547e80167/ai-powered-news-to-email-agent-3h1d',
          description: [
            "Built an AI-driven agent using n8n and Bright Data to automate fetching news, processing it through an LLM, and delivering table-based HTML newsletters via email. The pipeline used Bright Data for structured news, a Function Node for cleaning content, and Hugging Face's Llama-3.1-8B-Instruct for generating formatted summaries.",
            'Ensured consistent rendering across Gmail, Outlook, and Apple Mail by using inline CSS, table layouts, and preheaders for email optimization. Added summaries with "Read more" links to balance readability and engagement.',
          ],
          show: false,
        },
      ],
    },
    {
      id: 'skills',
      record: 'SkillsSection',
      enabled: true,
      column: 1,
      name: 'Skills',
      items: [
        {
          id: 'skills-default',
          tags: ['HTML', 'CSS', 'Javascript', 'Typescript', 'React.js', 'Angular', 'Next.js', 'React-Native', 'Node.js', 'Express.js', 'Spring-Boot', 'MongoDB', 'MySQL', 'Java', 'Gen-AI', 'N8N'],
        },
      ],
    },
    {
      id: 'social',
      record: 'SocialSection',
      enabled: true,
      column: 1,
      name: 'Social links',
      items: [
        { id: 'social-github', icon: 'fa-brands fa-github fa-xl', name: 'Github Profile', link: 'https://github.com/Tanush-J' },
        { id: 'social-portfolio', icon: 'fa-solid fa-briefcase fa-xl', name: 'Portfolio website', link: 'https://tanushjangid.site' },
      ],
    },
    {
      id: 'education',
      record: 'EducationSection',
      enabled: true,
      column: 1,
      name: 'Education',
      items: [
        {
          id: 'education-btech',
          degree: 'B.Tech, Computer Science Engineering',
          location: 'MIT WPU, Pune',
          start: '2019',
          end: '2023',
          gpa: { type: 'CGPA', score: '9.5', outOf: '10' },
          show: true,
        },
        {
          id: 'education-class-xii',
          degree: 'Class XII',
          location: 'Sri Chaitanaya Junior College',
          start: '2018',
          end: '2019',
          gpa: { type: 'Percentage', score: '67', outOf: '100' },
          show: false,
        },
        {
          id: 'education-class-x',
          degree: 'Class X',
          location: 'Kendriya Vidhayala R.H.E',
          start: '2016',
          end: '2017',
          gpa: { type: 'CGPA', score: '9.0', outOf: '10' },
          show: false,
        },
      ],
    },
    {
      id: 'trainingCourses',
      record: 'TrainingCoursesSection',
      enabled: true,
      column: 1,
      name: 'Training / Courses',
      items: [
        {
          id: 'course-vector-search',
          title: 'Oracle AI Vector Search Certified Professional 2025',
          link: 'https://drive.google.com/file/d/1xp8WPlIs9OlVrRDVWvgjaGLwZEAqFqCZ/view?usp=sharing',
          description: 'Certified Oracle University course on vector data storage, indexing, embeddings, and building RAG applications using PL/SQL and Python.',
          show: true,
        },
        {
          id: 'course-oci-foundation',
          title: 'OCI 2023 Certified Foundation Associate',
          link: 'https://catalog-education.oracle.com/pls/certview/sharebadge?id=D2AA7E9D37E1C3F2F8C4C992ED8AFAA2CEE64B842480FBD0B0CF00EA57F00959',
          description: 'Certified course from Oracle University covering concepts of Oracle Cloud Infrastructure',
          show: false,
        },
        {
          id: 'course-react-guide',
          title: 'React - The Complete Guide 2023',
          link: 'https://www.udemy.com/certificate/UC-dc85e03c-8e0a-4eaa-a109-8e75a6b9f66d/',
          description: 'Udemy course covering fundamental and advanced react and redux concepts.',
          show: true,
        },
        {
          id: 'course-web-developer',
          title: 'The Web Developer Bootcamp 2022',
          link: 'https://www.udemy.com/certificate/UC-b2f2e176-92b8-4dbe-b568-b491b99de90a/',
          description: 'Udemy course covering HTML, CSS, Javascript, Express.js, Node.js, and MongoDB concepts.',
          show: false,
        },
      ],
    },
    {
      id: 'achievements',
      record: 'AchievementsSection',
      enabled: true,
      column: 1,
      name: 'Achievements',
      items: [
        {
          id: 'achievement-hackstudio',
          title: "HackStudio Hackathon Winner - Sept'25",
          link: 'https://drive.google.com/file/d/1DsYE0mfDamCnmtcQQcPt2H8dD-YuetTu/view?usp=sharing',
          description: 'Recognized for building a scalable backend solution with a functional frontend in a competitive hackathon. Evaluated through problem-solving, live demos, and presentations among top peers.',
        },
        {
          id: 'achievement-hacktoberfest',
          title: 'Completed Hacktoberfest 2023',
          link: 'https://www.holopin.io/hacktoberfest2023/userbadge/clu59cgms132960fl91gdlecye',
          description: 'Hacktoberfest, organized by GitHub, provides an opportunity to contribute to open-source projects. I got a chance to contribute to repositories such as Ibm-products and Tooljet during the event.',
        },
      ],
    },
  ],
};

/**
 * Create a brand-new resume document for a user with the default content.
 */
export const createDefaultResume = (ownerId: string, content: ResumeContent): ResumeDocument => {
  const now = new Date().toISOString();

  return {
    schemaVersion: 2,
    id: 'default',
    ownerId,
    name: 'My Resume',
    templateId: 'classic',
    templateVersion: 1,
    content: structuredClone(content),
    createdAt: now,
    updatedAt: now,
  };
};

/**
 * Build a fresh, empty item for the given section with a stable id.
 * `skills` is handled separately because its section stores `SkillItem` objects.
 */
export const createEmptySectionItem = (
  sectionId: Exclude<ResumeSectionId, 'skills'>,
  id: string,
): ExperienceItem | ProjectItem | SocialItem | EducationItem | TrainingCourseItem | AchievementItem => {
  switch (sectionId) {
    case 'experience':
      return { id, designation: '', company: '', start: '', end: '', location: '', link: '', description: [''] };
    case 'projects':
      return { id, title: '', link: '', description: [''], show: true };
    case 'social':
      return { id, icon: 'fa-solid fa-link fa-xl', name: '', link: '' };
    case 'education':
      return { id, degree: '', location: '', start: '', end: '', gpa: { type: '', score: '', outOf: '' }, show: true };
    case 'trainingCourses':
      return { id, title: '', link: '', description: '', show: true };
    case 'achievements':
      return { id, title: '', link: '', description: '' };
  }
};