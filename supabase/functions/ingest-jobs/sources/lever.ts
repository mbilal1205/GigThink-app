// supabase/functions/ingest-jobs/sources/lever.ts
import { NormalizedJob } from '../types.ts';

interface LeverJob {
  id: string;
  text: string;
  createdAt: number;
  categories?: { commitment?: string; team?: string; location?: string };
  hostedUrl: string;
  applyUrl: string;
  description?: string;
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

export async function fetchLeverJobs(companyToken: string): Promise<NormalizedJob[]> {
  const url = `https://api.lever.co/v0/postings/${companyToken}?mode=json`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Lever API error: ${response.status} ${response.statusText}`);
  }
  const data = await response.json();
  const jobs: LeverJob[] = data.jobs || [];

  return jobs.map((job) => {
    const source_id = job.id;
    const description = job.description || job.text || '';
    const location = job.categories?.location || 'Unknown';
    const requirements = extractList(description, 'requirements');
    const skills = commonSkills.filter((skill) =>
      description.toLowerCase().includes(skill.toLowerCase())
    );

    return {
      source: 'lever',
      source_id,
      source_job_key: `lever:${source_id}`,
      company: companyToken.replace(/-/g, ' '),
      title: job.text,
      department: job.categories?.team,
      location,
      remote_type: detectRemote(location),
      employment_type: job.categories?.commitment || 'full-time',
      posted_at: new Date(job.createdAt).toISOString(),
      updated_at_source: new Date(job.createdAt).toISOString(),
      apply_url: job.applyUrl,
      source_url: job.hostedUrl || job.applyUrl,
      description,
      requirements,
      skills,
      extra_data: {
        categories: job.categories,
      },
    };
  });
}