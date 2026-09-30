import type { ResumeContent } from '../resumeModel';

export const demoResumeContent: ResumeContent = {
  header: {
    name: 'Alex Morgan',
    title: 'Software Engineer',
    contact: '+1 (555) 234-5678',
    email: '[EMAIL_REDACTED]',
    link: 'https://linkedin.com/in/alex-morgan-demo',
    location: 'Austin, TX',
  },
  sections: [
    {
      id: 'summary',
      record: 'SummarySection',
      enabled: true,
      column: 0,
      name: 'Summary',
      items: [
        {
          id: 'summary-demo',
          text: 'Software Engineer with experience building scalable web applications, developer tooling, and user-focused products. Skilled in modern TypeScript, React, Node.js, and cloud architectures with a passion for clean code and intuitive user interfaces.',
        },
      ],
    },
    {
      id: 'experience',
      record: 'ExperienceSection',
      enabled: true,
      column: 0,
      name: 'Experience',
      items: [
        {
          id: 'experience-example-tech',
          designation: 'Software Engineer',
          company: 'Example Technologies',
          start: '01/2023',
          end: 'Present',
          location: 'Austin, TX',
          link: 'https://example.com',
          description: [
            'Architected and delivered scalable web applications serving 50,000+ active users with high reliability.',
            'Led frontend performance optimizations, reducing initial page load times and bundle sizes by 35%.',
            'Built real-time collaborative features and streamlined state management across complex user workflows.',
            'Partnered with cross-functional product, UX, and QA teams to rapidly iterate on core product features.',
          ],
        },
        {
          id: 'experience-northstar',
          designation: 'Junior Software Engineer',
          company: 'Northstar Labs',
          start: '06/2021',
          end: '12/2022',
          location: 'San Francisco, CA',
          link: 'https://example.com/northstar',
          description: [
            'Developed reusable UI component libraries and interactive dashboards using React and TypeScript.',
            'Designed RESTful API endpoints and integrated microservices with automated testing pipelines.',
            'Improved test coverage across core modules from 60% to 92% using modern testing frameworks.',
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
          id: 'project-cloud-canvas',
          title: 'Cloud Canvas — Visual Collaboration Platform',
          link: 'https://example.com/projects/cloud-canvas',
          description: [
            'Built a collaborative visual workspace with real-time multi-user synchronization and canvas rendering.',
            'Engineered modular plugin architecture enabling users to create custom widgets and workflow templates.',
          ],
          show: true,
        },
        {
          id: 'project-api-toolkit',
          title: 'API Toolkit — Developer CLI & Gateway',
          link: 'https://example.com/projects/api-toolkit',
          description: [
            'Developed an open-source CLI utility for schema validation, mocking, and automated documentation generation.',
            'Implemented token-bucket rate limiting and distributed caching with sub-millisecond response overhead.',
          ],
          show: true,
        },
        {
          id: 'project-data-pulse',
          title: 'Data Pulse — Metrics & Analytics Dashboard',
          link: 'https://example.com/projects/data-pulse',
          description: [
            'Created an analytics dashboard visualizing time-series performance metrics with interactive charts.',
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
          tags: [
            'TypeScript',
            'JavaScript',
            'React',
            'Node.js',
            'Next.js',
            'Express.js',
            'Python',
            'PostgreSQL',
            'MongoDB',
            'GraphQL',
            'Docker',
            'AWS',
            'Tailwind CSS',
            'Git',
            'CI/CD',
          ],
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
        {
          id: 'social-github',
          icon: 'fa-brands fa-github fa-xl',
          name: 'GitHub',
          link: 'https://github.com/example',
        },
        {
          id: 'social-linkedin',
          icon: 'fa-brands fa-linkedin fa-xl',
          name: 'LinkedIn',
          link: 'https://linkedin.com/in/example',
        },
        {
          id: 'social-portfolio',
          icon: 'fa-solid fa-globe fa-xl',
          name: 'Portfolio',
          link: 'https://example.com',
        },
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
          id: 'education-bs-cs',
          degree: 'B.S. in Computer Science',
          location: 'Example State University',
          start: '2017',
          end: '2021',
          gpa: { type: 'GPA', score: '3.8', outOf: '4.0' },
          show: true,
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
          id: 'course-cloud-architect',
          title: 'Cloud Solutions Architect Certification',
          link: 'https://example.com/certificates/cloud',
          description:
            'Comprehensive certification covering scalable, fault-tolerant cloud architecture, microservices, and security best practices.',
          show: true,
        },
        {
          id: 'course-fullstack-mastery',
          title: 'Modern Full Stack Web Development',
          link: 'https://example.com/certificates/fullstack',
          description:
            'Advanced training in React, Node.js, distributed database design, and end-to-end testing methodologies.',
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
          id: 'achievement-hackathon',
          title: '1st Place — National Developer Hackathon 2023',
          link: 'https://example.com/awards/hackathon',
          description:
            'Led a 4-person engineering team to design and build an AI-powered accessibility tool within 48 hours, winning first place out of 120 teams.',
        },
        {
          id: 'achievement-opensource',
          title: 'Open Source Contributor & Maintainer',
          link: 'https://example.com/awards/opensource',
          description:
            'Active contributor to widely used open-source frontend libraries and developer workflow tools.',
        },
      ],
    },
  ],
};
