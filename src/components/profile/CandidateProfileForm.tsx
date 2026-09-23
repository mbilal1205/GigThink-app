"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Plus, Trash2 } from "lucide-react";

interface WorkExperience {
  company: string;
  title: string;
  start_date: string;
  end_date: string;
  description: string;
}

interface Education {
  institution: string;
  degree: string;
  field: string;
  start_date: string;
  end_date: string;
}

interface Project {
  name: string;
  description: string;
  technologies: string;
}

interface Certification {
  name: string;
}

interface FormState {
  full_name: string;
  headline: string;
  summary: string;
  skills: string;
  experience_level: string;
  preferred_roles: string;
  preferred_industries: string;
  desired_salary_min: string;
  desired_salary_max: string;
  preferred_locations: string;
  remote_preference: string;
  career_goals: string;
  workExperience: WorkExperience[];
  education: Education[];
  projects: Project[];
  certifications: Certification[];
}

export function CandidateProfileForm({ initialData }: { initialData?: any }) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>({
    full_name: initialData?.full_name || "",
    headline: initialData?.headline || "",
    summary: initialData?.summary || "",
    skills: initialData?.skills?.join(", ") || "",
    experience_level: initialData?.experience_level || "mid",
    preferred_roles: initialData?.preferred_roles?.join(", ") || "",
    preferred_industries: initialData?.preferred_industries?.join(", ") || "",
    desired_salary_min: initialData?.desired_salary_min || "",
    desired_salary_max: initialData?.desired_salary_max || "",
    preferred_locations: initialData?.preferred_locations?.join(", ") || "",
    remote_preference: initialData?.remote_preference || "any",
    career_goals: initialData?.career_goals || "",
    workExperience: initialData?.work_experience || [],
    education: initialData?.education || [],
    projects: initialData?.projects || [],
    certifications: initialData?.certifications || [],
  });
  const [saving, setSaving] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Work Experience handlers
  const addWorkExperience = () => {
    setForm({
      ...form,
      workExperience: [...form.workExperience, { company: "", title: "", start_date: "", end_date: "", description: "" }],
    });
  };
  const updateWorkExperience = (index: number, field: keyof WorkExperience, value: string) => {
    const updated = [...form.workExperience];
    updated[index][field] = value;
    setForm({ ...form, workExperience: updated });
  };
  const removeWorkExperience = (index: number) => {
    setForm({ ...form, workExperience: form.workExperience.filter((_, i) => i !== index) });
  };

  // Education handlers
  const addEducation = () => {
    setForm({
      ...form,
      education: [...form.education, { institution: "", degree: "", field: "", start_date: "", end_date: "" }],
    });
  };
  const updateEducation = (index: number, field: keyof Education, value: string) => {
    const updated = [...form.education];
    updated[index][field] = value;
    setForm({ ...form, education: updated });
  };
  const removeEducation = (index: number) => {
    setForm({ ...form, education: form.education.filter((_, i) => i !== index) });
  };

  // Projects handlers
  const addProject = () => {
    setForm({
      ...form,
      projects: [...form.projects, { name: "", description: "", technologies: "" }],
    });
  };
  const updateProject = (index: number, field: keyof Project, value: string) => {
    const updated = [...form.projects];
    updated[index][field] = value;
    setForm({ ...form, projects: updated });
  };
  const removeProject = (index: number) => {
    setForm({ ...form, projects: form.projects.filter((_, i) => i !== index) });
  };

  // Certifications handlers
  const addCertification = () => {
    setForm({ ...form, certifications: [...form.certifications, { name: "" }] });
  };
  const updateCertification = (index: number, value: string) => {
    const updated = [...form.certifications];
    updated[index].name = value;
    setForm({ ...form, certifications: updated });
  };
  const removeCertification = (index: number) => {
    setForm({ ...form, certifications: form.certifications.filter((_, i) => i !== index) });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        full_name: form.full_name,
        headline: form.headline,
        summary: form.summary,
        skills: form.skills.split(',').map(s => s.trim()).filter(Boolean),
        experience_level: form.experience_level,
        preferred_roles: form.preferred_roles.split(',').map(s => s.trim()).filter(Boolean),
        preferred_industries: form.preferred_industries.split(',').map(s => s.trim()).filter(Boolean),
        desired_salary_min: form.desired_salary_min ? Number(form.desired_salary_min) : null,
        desired_salary_max: form.desired_salary_max ? Number(form.desired_salary_max) : null,
        preferred_locations: form.preferred_locations.split(',').map(s => s.trim()).filter(Boolean),
        remote_preference: form.remote_preference,
        career_goals: form.career_goals,
        work_experience: form.workExperience.filter(exp => exp.company || exp.title),
        education: form.education.filter(edu => edu.institution || edu.degree),
        projects: form.projects.filter(proj => proj.name || proj.description),
        certifications: form.certifications.filter(cert => cert.name),
        onboarding_completed: true,
      };

      const res = await fetch("/api/candidate-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save profile");
      toast.success("Profile saved successfully!");
      router.push("/career-feed");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Basic Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Full Name</label>
          <Input name="full_name" value={form.full_name} onChange={handleChange} className="mt-1" />
        </div>
        <div>
          <label className="text-sm font-medium">Headline</label>
          <Input name="headline" value={form.headline} onChange={handleChange} className="mt-1" placeholder="Senior Backend Engineer" />
        </div>
        <div className="md:col-span-2">
          <label className="text-sm font-medium">Summary</label>
          <Textarea name="summary" value={form.summary} onChange={handleChange} rows={3} className="mt-1" />
        </div>
        <div>
          <label className="text-sm font-medium">Skills (comma separated)</label>
          <Input name="skills" value={form.skills} onChange={handleChange} className="mt-1" />
        </div>
        <div>
          <label className="text-sm font-medium">Experience Level</label>
          <select name="experience_level" value={form.experience_level} onChange={handleChange} className="mt-1 w-full bg-white/5 border border-white/10 rounded-xl p-2 text-sm">
            <option value="junior">Junior</option>
            <option value="mid">Mid</option>
            <option value="senior">Senior</option>
            <option value="lead">Lead</option>
            <option value="executive">Executive</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium">Preferred Roles (comma separated)</label>
          <Input name="preferred_roles" value={form.preferred_roles} onChange={handleChange} className="mt-1" />
        </div>
        <div>
          <label className="text-sm font-medium">Preferred Industries (comma separated)</label>
          <Input name="preferred_industries" value={form.preferred_industries} onChange={handleChange} className="mt-1" />
        </div>
        <div>
          <label className="text-sm font-medium">Desired Salary Min ($)</label>
          <Input name="desired_salary_min" type="number" value={form.desired_salary_min} onChange={handleChange} className="mt-1" />
        </div>
        <div>
          <label className="text-sm font-medium">Desired Salary Max ($)</label>
          <Input name="desired_salary_max" type="number" value={form.desired_salary_max} onChange={handleChange} className="mt-1" />
        </div>
        <div>
          <label className="text-sm font-medium">Preferred Locations (comma separated)</label>
          <Input name="preferred_locations" value={form.preferred_locations} onChange={handleChange} className="mt-1" />
        </div>
        <div>
          <label className="text-sm font-medium">Remote Preference</label>
          <select name="remote_preference" value={form.remote_preference} onChange={handleChange} className="mt-1 w-full bg-white/5 border border-white/10 rounded-xl p-2 text-sm">
            <option value="any">Any</option>
            <option value="remote">Remote</option>
            <option value="hybrid">Hybrid</option>
            <option value="onsite">Onsite</option>
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="text-sm font-medium">Career Goals</label>
          <Textarea name="career_goals" value={form.career_goals} onChange={handleChange} rows={2} className="mt-1" />
        </div>
      </div>

      {/* Work Experience Section */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-semibold">Work Experience</h3>
          <Button type="button" variant="outline" size="sm" onClick={addWorkExperience}>
            <Plus className="h-4 w-4 mr-1" /> Add
          </Button>
        </div>
        {form.workExperience.map((exp, idx) => (
          <div key={idx} className="border border-white/10 rounded-xl p-4 mb-3 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="Company" value={exp.company} onChange={(e) => updateWorkExperience(idx, 'company', e.target.value)} />
              <Input placeholder="Title" value={exp.title} onChange={(e) => updateWorkExperience(idx, 'title', e.target.value)} />
              <Input type="month" placeholder="Start Date" value={exp.start_date} onChange={(e) => updateWorkExperience(idx, 'start_date', e.target.value)} />
              <Input type="month" placeholder="End Date (or leave blank)" value={exp.end_date} onChange={(e) => updateWorkExperience(idx, 'end_date', e.target.value)} />
            </div>
            <Textarea placeholder="Description / Achievements" value={exp.description} onChange={(e) => updateWorkExperience(idx, 'description', e.target.value)} rows={2} />
            <Button type="button" variant="ghost" size="sm" onClick={() => removeWorkExperience(idx)} className="text-red-400">
              <Trash2 className="h-4 w-4 mr-1" /> Remove
            </Button>
          </div>
        ))}
      </div>

      {/* Education Section */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-semibold">Education</h3>
          <Button type="button" variant="outline" size="sm" onClick={addEducation}>
            <Plus className="h-4 w-4 mr-1" /> Add
          </Button>
        </div>
        {form.education.map((edu, idx) => (
          <div key={idx} className="border border-white/10 rounded-xl p-4 mb-3 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="Institution" value={edu.institution} onChange={(e) => updateEducation(idx, 'institution', e.target.value)} />
              <Input placeholder="Degree" value={edu.degree} onChange={(e) => updateEducation(idx, 'degree', e.target.value)} />
              <Input placeholder="Field of Study" value={edu.field} onChange={(e) => updateEducation(idx, 'field', e.target.value)} />
              <div className="flex gap-2">
                <Input type="number" placeholder="Start Year" value={edu.start_date} onChange={(e) => updateEducation(idx, 'start_date', e.target.value)} />
                <Input type="number" placeholder="End Year" value={edu.end_date} onChange={(e) => updateEducation(idx, 'end_date', e.target.value)} />
              </div>
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={() => removeEducation(idx)} className="text-red-400">
              <Trash2 className="h-4 w-4 mr-1" /> Remove
            </Button>
          </div>
        ))}
      </div>

      {/* Projects Section */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-semibold">Projects</h3>
          <Button type="button" variant="outline" size="sm" onClick={addProject}>
            <Plus className="h-4 w-4 mr-1" /> Add
          </Button>
        </div>
        {form.projects.map((proj, idx) => (
          <div key={idx} className="border border-white/10 rounded-xl p-4 mb-3 space-y-2">
            <Input placeholder="Project Name" value={proj.name} onChange={(e) => updateProject(idx, 'name', e.target.value)} />
            <Textarea placeholder="Description" value={proj.description} onChange={(e) => updateProject(idx, 'description', e.target.value)} rows={2} />
            <Input placeholder="Technologies (comma separated)" value={proj.technologies} onChange={(e) => updateProject(idx, 'technologies', e.target.value)} />
            <Button type="button" variant="ghost" size="sm" onClick={() => removeProject(idx)} className="text-red-400">
              <Trash2 className="h-4 w-4 mr-1" /> Remove
            </Button>
          </div>
        ))}
      </div>

      {/* Certifications */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-semibold">Certifications</h3>
          <Button type="button" variant="outline" size="sm" onClick={addCertification}>
            <Plus className="h-4 w-4 mr-1" /> Add
          </Button>
        </div>
        {form.certifications.map((cert, idx) => (
          <div key={idx} className="flex gap-2 mb-2">
            <Input placeholder="Certification Name" value={cert.name} onChange={(e) => updateCertification(idx, e.target.value)} />
            <Button type="button" variant="ghost" size="icon" onClick={() => removeCertification(idx)} className="text-red-400 shrink-0">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      <Button type="submit" disabled={saving} className="btn-gradient h-11 px-6 w-full sm:w-auto">
        {saving ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
        {saving ? "Saving..." : "Save Profile"}
      </Button>
    </form>
  );
}