import { CandidateProfile } from '../types/candidate';
import { NormalizedJob } from '../sources/types';

export interface MatchResult {
  score: number; // 0-100
  reasons: string[];
  missing_skills: string[];
  matched_skills: string[];
  is_good_match: boolean;
}

export function calculateMatchScore(
  profile: CandidateProfile,
  job: NormalizedJob
): MatchResult {
  const matched_skills: string[] = [];
  const missing_skills: string[] = [];
  const reasons: string[] = [];

  // 1. Skill match (40% weight)
  const userSkills = [...(profile.skills || []), ...(profile.additional_skills || [])];
  const jobSkills = job.skills || [];
  if (jobSkills.length > 0 && userSkills.length > 0) {
    jobSkills.forEach((skill) => {
      if (userSkills.some((u) => u.toLowerCase() === skill.toLowerCase())) {
        matched_skills.push(skill);
      } else {
        missing_skills.push(skill);
      }
    });
  } else if (jobSkills.length === 0) {
    // No skills specified, neutral
  }
  const skillScore = jobSkills.length > 0 ? (matched_skills.length / jobSkills.length) * 100 : 60;

  // 2. Experience level match (15%)
  let experienceScore = 50;
  if (profile.experience_level && job.extra_data?.experience_level) {
    // Map levels to numbers
    const levels = ['junior', 'mid', 'senior', 'lead', 'executive'];
    const userLevel = levels.indexOf(profile.experience_level);
    const jobLevel = levels.indexOf(job.extra_data.experience_level);
    if (userLevel >= jobLevel) {
      experienceScore = 90;
      reasons.push('Experience level matches or exceeds requirement');
    } else if (userLevel + 1 === jobLevel) {
      experienceScore = 70;
      reasons.push('Close to required experience level');
    } else {
      experienceScore = 40;
      reasons.push('Experience level below requirement');
    }
  }

  // 3. Location & remote match (15%)
  let locationScore = 50;
  const userRemotePref = profile.remote_preference || 'any';
  const jobRemote = job.remote_type || 'unknown';
  if (jobRemote === 'remote' && userRemotePref !== 'onsite') {
    locationScore = 95;
    reasons.push('Remote opportunity matches your preference');
  } else if (jobRemote === 'hybrid' && userRemotePref === 'hybrid') {
    locationScore = 85;
    reasons.push('Hybrid opportunity matches');
  } else if (jobRemote === 'onsite' && userRemotePref === 'onsite') {
    locationScore = 80;
  } else {
    locationScore = 40;
    reasons.push('Location/remote preference mismatch');
  }
  // Also check preferred_locations
  if (job.location && profile.preferred_locations && profile.preferred_locations.length > 0) {
    if (profile.preferred_locations.some((loc) => job.location!.toLowerCase().includes(loc.toLowerCase()))) {
      locationScore = Math.max(locationScore, 80);
    } else {
      locationScore = 30;
    }
  }

  // 4. Salary match (15%)
  let salaryScore = 50;
  const userMin = profile.desired_salary_min ?? 0;
  const userMax = profile.desired_salary_max ?? Number.MAX_SAFE_INTEGER;
  const jobMin = job.salary_min ?? 0;
  const jobMax = job.salary_max ?? 0;
  if (jobMin > 0 && jobMax > 0) {
    if (jobMin >= userMin && jobMin <= userMax) {
      salaryScore = 95;
      reasons.push('Salary within your expected range');
    } else if (jobMax >= userMin) {
      salaryScore = 70;
      reasons.push('Salary partially matches');
    } else {
      salaryScore = 20;
      reasons.push('Salary below your expectation');
    }
  } else {
    // Salary not specified
    salaryScore = 60;
  }

  // 5. Role & industry match (15%)
  let roleScore = 50;
  if (job.title && profile.preferred_roles && profile.preferred_roles.length > 0) {
    const jobTitleLower = job.title.toLowerCase();
    if (profile.preferred_roles.some((role) => jobTitleLower.includes(role.toLowerCase()))) {
      roleScore = 90;
      reasons.push(`Role matches your preference (${profile.preferred_roles.join(', ')})`);
    } else {
      roleScore = 30;
    }
  }
  let industryScore = 50;
  if (job.company && profile.preferred_industries && profile.preferred_industries.length > 0) {
    // We don't have industry in NormalizedJob, but maybe in extra_data
    const jobIndustry = job.extra_data?.industry;
    if (jobIndustry && profile.preferred_industries.some((ind) => jobIndustry.toLowerCase().includes(ind.toLowerCase()))) {
      industryScore = 90;
      reasons.push('Industry matches your preference');
    }
  }

  // Weighted total
  const totalScore = Math.round(
    (skillScore * 0.4) +
    (experienceScore * 0.15) +
    (locationScore * 0.15) +
    (salaryScore * 0.15) +
    ((roleScore + industryScore) / 2 * 0.15)
  );

  // Add reasons for skill match
  if (matched_skills.length > 0) {
    reasons.push(`Skills matched: ${matched_skills.join(', ')}`);
  }
  if (missing_skills.length > 0) {
    reasons.push(`Missing skills: ${missing_skills.join(', ')}`);
  }

  return {
    score: totalScore,
    reasons: reasons.length > 0 ? reasons : ['No strong match signals'],
    missing_skills,
    matched_skills,
    is_good_match: totalScore >= 75,
  };
}