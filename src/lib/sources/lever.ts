import axios from 'axios';
import { NormalizedJob, JobSourceAdapter } from './types';

interface LeverJob {
  id: string;
  text: string;
  createdAt: number;
  categories: { commitment?: string; team?: string; location?: string } | null;
  hostedUrl: string;
  applyUrl: string;
  description: string;
}

interface LeverResponse {
  jobs: LeverJob[];
}

export class LeverAdapter implements JobSourceAdapter {
  provider = 'lever';

  async fetchJobs(companyToken: string, config?: any): Promise<NormalizedJob[]> {
    const url = `https://api.lever.co/v0/postings/${companyToken}?mode=json`;
    const response = await axios.get<LeverResponse>(url, { timeout: 15000 });
    const jobs: LeverJob[] = response.data.jobs || [];

    return jobs.map((job) => this.normalizeJob(job, companyToken));
  }

  private normalizeJob(job: LeverJob, companyToken: string): NormalizedJob {
    const source_id = job.id;
    const source = 'lever';
    const source_job_key = `${source}:${source_id}`;
    const apply_url = job.applyUrl;
    const location = job.categories?.location || 'Unknown';
    const remote_type = this.detectRemote(location);

    const description = job.description || job.text || '';
    const requirements = this.extractRequirements(description);
    const skills = this.extractSkills(description);

    return {
      source,
      source_id,
      source_job_key,
      company: companyToken.replace(/-/g, ' '),
      title: job.text,
      department: job.categories?.team,
      location,
      remote_type,
      employment_type: job.categories?.commitment || 'full-time',
      posted_at: new Date(job.createdAt).toISOString(),
      updated_at_source: new Date(job.createdAt).toISOString(),
      apply_url,
      source_url: job.hostedUrl || apply_url,
      description,
      requirements,
      skills,
      extra_data: {
        categories: job.categories,
      },
    };
  }

  private detectRemote(location: string): 'remote' | 'hybrid' | 'onsite' | 'unknown' {
    const lower = location.toLowerCase();
    if (lower.includes('remote')) return 'remote';
    if (lower.includes('hybrid')) return 'hybrid';
    return 'unknown';
  }

  private extractRequirements(description: string): string[] {
    const requirements: string[] = [];
    const lines = description.split('\n');
    let inRequirements = false;
    for (const line of lines) {
      const trimmed = line.trim();
      if (/^requirements/i.test(trimmed)) {
        inRequirements = true;
        continue;
      }
      if (inRequirements && trimmed.startsWith('-') || trimmed.startsWith('•')) {
        requirements.push(trimmed.replace(/^[-•]\s*/, ''));
      }
      if (inRequirements && trimmed.length === 0) {
        inRequirements = false;
      }
    }
    return requirements.slice(0, 10);
  }

  private extractSkills(description: string): string[] {
    const skillsList = [
      'Python', 'Java', 'JavaScript', 'TypeScript', 'React', 'Node.js',
      'AWS', 'Azure', 'GCP', 'SQL', 'PostgreSQL', 'MongoDB', 'Docker',
      'Kubernetes', 'CI/CD', 'REST', 'GraphQL', 'Microservices',
    ];
    return skillsList.filter((skill) =>
      description.toLowerCase().includes(skill.toLowerCase())
    );
  }
}