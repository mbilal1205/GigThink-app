import axios from 'axios';
import { NormalizedJob, JobSourceAdapter } from './types';

interface GreenhouseJob {
  id: number;
  internal_job_id: number;
  title: string;
  updated_at: string;
  absolute_url: string;
  location: { name: string };
  departments?: { name: string }[];
  metadata?: any;
  office?: string;
  content?: string;
}

interface GreenhouseResponse {
  jobs: GreenhouseJob[];
}

export class GreenhouseAdapter implements JobSourceAdapter {
  provider = 'greenhouse';

  async fetchJobs(boardToken: string, config?: any): Promise<NormalizedJob[]> {
    const baseUrl = `https://boards-api.greenhouse.io/v1/boards/${boardToken}/jobs`;
    const response = await axios.get<GreenhouseResponse>(baseUrl, {
      params: { content: 'true' }, // to get description
      timeout: 15000,
    });

    const jobs: GreenhouseJob[] = response.data.jobs || [];

    return jobs.map((job) => this.normalizeJob(job, boardToken));
  }

  private normalizeJob(job: GreenhouseJob, boardToken: string): NormalizedJob {
    const source_id = String(job.id);
    const source = 'greenhouse';
    const source_job_key = `${source}:${source_id}`;
    const apply_url = job.absolute_url;
    const location = job.location?.name || 'Unknown';
    const remote_type = this.detectRemote(location);

    // Extract description fields using simple parsing; AI can enrich later
    const description = job.content || '';
    const requirements = this.extractRequirements(description);
    const skills = this.extractSkills(description);

    return {
      source,
      source_id,
      source_job_key,
      company: this.extractCompanyFromUrl(apply_url, boardToken),
      title: job.title,
      department: job.departments?.[0]?.name,
      location,
      remote_type,
      employment_type: 'full-time',
      posted_at: job.updated_at,
      updated_at_source: job.updated_at,
      apply_url,
      source_url: apply_url,
      description,
      requirements,
      skills,
      extra_data: {
        internal_job_id: job.internal_job_id,
        office: job.office,
        metadata: job.metadata,
      },
    };
  }

  private detectRemote(location: string): 'remote' | 'hybrid' | 'onsite' | 'unknown' {
    const lower = location.toLowerCase();
    if (lower.includes('remote')) return 'remote';
    if (lower.includes('hybrid')) return 'hybrid';
    return 'unknown';
  }

  private extractCompanyFromUrl(url: string, boardToken: string): string {
    // Try to extract from url: e.g., https://boards.greenhouse.io/companyname/jobs/...
    const match = url.match(/boards\.greenhouse\.io\/([^\/]+)/);
    if (match && match[1]) return match[1].replace(/-/g, ' ');
    return boardToken;
  }

  private extractRequirements(description: string): string[] {
    // Simple extraction: lines starting with "Requirements" or bullet points
    // For production, AI will improve this.
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
    // Simple skill extraction: look for common programming languages/tech
    const skillsList = [
      'Python', 'Java', 'JavaScript', 'TypeScript', 'React', 'Node.js',
      'AWS', 'Azure', 'GCP', 'SQL', 'PostgreSQL', 'MongoDB', 'Docker',
      'Kubernetes', 'CI/CD', 'REST', 'GraphQL', 'Microservices',
    ];
    const foundSkills = skillsList.filter((skill) =>
      description.toLowerCase().includes(skill.toLowerCase())
    );
    return foundSkills;
  }
}