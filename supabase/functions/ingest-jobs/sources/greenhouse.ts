// supabase/functions/ingest-jobs/sources/greenhouse.ts
import { NormalizedJob } from '../types.ts';

interface GreenhouseJob {
  id: number;
  internal_job_id: number;
  title: string;
  updated_at: string;
  absolute_url: string;
  location?: { name: string };
  departments?: { name: string }[];
  content?: string;
  metadata?: unknown;
}

function extractCompanyFromUrl(url: string, boardToken: string): string {
  const match = url.match(/boards\.greenhouse\.io\/([^\/]+)/);
  return match && match[1] ? match[1].replace(/-/g, ' ') : boardToken;
}

function detectRemote(location: string): NormalizedJob['remote_type'] {
  const lower = location.toLowerCase();
  if (lower.includes('remote')) return 'remote';
  if (lower.includes('hybrid')) return 'hybrid';
  return 'unknown';
}

function extractList(description: string, sectionName: string): string[] {
  const result: string[] = [];
  const lines = description.split('\n');
  let inSection = false;
  for (const line of lines) {
    const trimmed = line.trim();
    if (new RegExp(`^${sectionName}`, 'i').test(trimmed)) {
      inSection = true;
      continue;
    }
    if (inSection && (trimmed.startsWith('-') || trimmed.startsWith('•'))) {
      result.push(trimmed.replace(/^[-•]\s*/, ''));
    }
    if (inSection && trimmed.length === 0) {
      inSection = false;
    }
  }
  return result.slice(0, 10);
}

const commonSkills = [
  'Python', 'Java', 'JavaScript', 'TypeScript', 'React', 'Node.js',
  'AWS', 'Azure', 'GCP', 'SQL', 'PostgreSQL', 'MongoDB', 'Docker',
  'Kubernetes', 'CI/CD', 'REST', 'GraphQL', 'Microservices',
];

export async function fetchGreenhouseJobs(boardToken: string): Promise<NormalizedJob[]> {
  const url = `https://boards-api.greenhouse.io/v1/boards/${boardToken}/jobs?content=true`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Greenhouse API error: ${response.status} ${response.statusText}`);
  }
  const data = await response.json();
  const jobs: GreenhouseJob[] = data.jobs || [];

  return jobs.map((job) => {
    const source_id = String(job.id);
    const description = job.content || '';
    const location = job.location?.name || 'Unknown';
    const requirements = extractList(description, 'requirements');
    const skills = commonSkills.filter((skill) =>
      description.toLowerCase().includes(skill.toLowerCase())
    );

    return {
      source: 'greenhouse',
      source_id,
      source_job_key: `greenhouse:${source_id}`,
      company: extractCompanyFromUrl(job.absolute_url, boardToken),
      title: job.title,
      department: job.departments?.[0]?.name,
      location,
      remote_type: detectRemote(location),
      employment_type: 'full-time',
      posted_at: job.updated_at,
      updated_at_source: job.updated_at,
      apply_url: job.absolute_url,
      source_url: job.absolute_url,
      description,
      requirements,
      skills,
      extra_data: {
        internal_job_id: job.internal_job_id,
        metadata: job.metadata,
      },
    };
  });
}