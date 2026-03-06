import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';

const skills = readFileSync('src/components/Skills.astro', 'utf-8');
const pkg = readFileSync('package.json', 'utf-8');

describe('17a — Skill categories', () => {
  const categoryNames = [
    'Languages',
    'Web Development',
    'Cloud & Infrastructure',
    'DevOps & CI/CD',
    'Messaging & Data',
    'AI & Automation',
  ];

  for (const name of categoryNames) {
    it(`has category "${name}"`, () => {
      expect(skills).toContain(name);
    });
  }
});

describe('17a — All 23 skills present', () => {
  const skillNames = [
    'JavaScript', 'Python', 'Java', 'SQL', 'Bash',
    'Node.js', 'React', 'REST APIs', 'Full Stack',
    'GCP / Firebase', 'AWS', 'Docker', 'Terraform',
    'CI/CD Pipelines', 'Testing', 'Linux', 'Git',
    'RabbitMQ', 'SQL Databases',
    'GitHub Copilot', 'Claude', 'Agentic Engineering',
  ];

  for (const name of skillNames) {
    it(`has skill "${name}"`, () => {
      expect(skills).toContain(name);
    });
  }
});

describe('17b — Experience bars', () => {
  it('has bar fill class (bg-accent)', () => {
    expect(skills).toContain('bg-accent');
  });

  it('has bar track class (bg-white/5)', () => {
    expect(skills).toContain('bg-white/5');
  });

  it('has years labels', () => {
    expect(skills).toContain('yrs');
    expect(skills).toContain('yr');
  });
});

describe('17e — simple-icons removed', () => {
  it('does not import simple-icons in Skills.astro', () => {
    expect(skills).not.toContain('simple-icons');
  });

  it('does not have simple-icons in package.json', () => {
    expect(pkg).not.toContain('simple-icons');
  });
});

describe('17 — Preserved IDs', () => {
  it('has #skills section ID', () => {
    expect(skills).toContain('id="skills"');
  });

  it('has #skills-heading ID', () => {
    expect(skills).toContain('id="skills-heading"');
  });
});
