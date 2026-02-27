// parse.ts — Read and parse Plot story files from .plot/board/
import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';

export interface AC {
  id: string;
  what: string;
  status: 'pending' | 'pass' | 'fail';
  proof: string;
}

export interface Task {
  id: string;
  do: string;
  role: string;
  status: 'pending' | 'active' | 'done' | 'skip';
  needs: string[];
  covers: string[];
}

export interface Story {
  id: string;
  title: string;
  status: string;
  priority: string;
  created: string;
  updated: string;
  acceptance_criteria: AC[];
  tasks: Task[];
  why: string;
  body: string; // markdown body after frontmatter
}

export interface BoardConfig {
  project: string;
  prefix: string;
  counter: number;
  ready_when: string[];
  done_when: string[];
  roles: string[];
  max_agents: number;
}

/**
 * Parse YAML frontmatter from a markdown string.
 * Returns { meta, body } where meta is the parsed YAML and body is the remaining markdown.
 */
function parseFrontmatter(content: string): { meta: Record<string, any>; body: string } {
  const match = content.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) {
    return { meta: {}, body: content };
  }
  const meta = yaml.load(match[1]) as Record<string, any>;
  return { meta: meta || {}, body: match[2] || '' };
}

/**
 * Read and parse a single story file.
 */
export function parseStory(filePath: string): Story | null {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const { meta, body } = parseFrontmatter(content);

    return {
      id: meta.id || path.basename(filePath, '.md'),
      title: meta.title || 'Untitled',
      status: meta.status || 'unknown',
      priority: meta.priority || 'medium',
      created: meta.created || '',
      updated: meta.updated || '',
      acceptance_criteria: (meta.acceptance_criteria || []).map((ac: any) => ({
        id: ac.id || '',
        what: ac.what || '',
        status: ac.status || 'pending',
        proof: ac.proof || '',
      })),
      tasks: (meta.tasks || []).map((t: any) => ({
        id: t.id || '',
        do: t.do || '',
        role: t.role || '',
        status: t.status || 'pending',
        needs: t.needs || [],
        covers: t.covers || [],
      })),
      why: meta.why || '',
      body,
    };
  } catch {
    return null;
  }
}

/**
 * Read config from .plot/board/config.yaml
 */
export function readConfig(plotDir: string): BoardConfig {
  const configPath = path.join(plotDir, 'board', 'config.yaml');
  try {
    const content = fs.readFileSync(configPath, 'utf-8');
    const config = yaml.load(content) as any;
    return {
      project: config.project || 'unknown',
      prefix: config.prefix || 'PLOT',
      counter: config.counter || 0,
      ready_when: config.ready_when || [],
      done_when: config.done_when || [],
      roles: config.roles || [],
      max_agents: config.max_agents || 3,
    };
  } catch {
    return {
      project: 'unknown',
      prefix: 'PLOT',
      counter: 0,
      ready_when: [],
      done_when: [],
      roles: [],
      max_agents: 3,
    };
  }
}

/**
 * Scan .plot/board/ for all story files and parse them.
 */
export function scanBoard(plotDir: string): Story[] {
  const boardDir = path.join(plotDir, 'board');
  const stories: Story[] = [];

  try {
    const files = fs.readdirSync(boardDir);
    for (const file of files) {
      if (file.endsWith('.md') && file !== 'config.yaml') {
        const story = parseStory(path.join(boardDir, file));
        if (story) stories.push(story);
      }
    }
  } catch {
    // board dir doesn't exist yet
  }

  // Sort by ID
  stories.sort((a, b) => a.id.localeCompare(b.id));
  return stories;
}

/**
 * Scan .plot/archive/ for archived stories.
 */
export function scanArchive(plotDir: string): Story[] {
  const archiveDir = path.join(plotDir, 'archive');
  const stories: Story[] = [];

  try {
    const files = fs.readdirSync(archiveDir);
    for (const file of files) {
      if (file.endsWith('.md')) {
        const story = parseStory(path.join(archiveDir, file));
        if (story) stories.push(story);
      }
    }
  } catch {
    // archive dir doesn't exist yet
  }

  stories.sort((a, b) => a.id.localeCompare(b.id));
  return stories;
}
