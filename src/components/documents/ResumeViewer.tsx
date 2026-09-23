import { StructuredResume } from "@/lib/ai/resume-tailor";

interface ResumeViewerProps {
  resume: StructuredResume;
}

// Safe join helper: handles string, array, undefined
function joinTechnologies(tech: any): string {
  if (Array.isArray(tech)) return tech.join(", ");
  if (typeof tech === "string") return tech;
  return "";
}

export default function ResumeViewer({ resume }: ResumeViewerProps) {
  return (
    <div className="bg-white text-gray-900 rounded-xl p-8 shadow-lg max-w-3xl mx-auto">
      {/* Header */}
      <header className="border-b-2 border-gray-800 pb-4 mb-6">
        <h1 className="text-3xl font-bold tracking-tight">{resume.fullName}</h1>
        <p className="text-lg text-gray-700 mt-1">{resume.headline}</p>
      </header>

      {/* Summary */}
      <section className="mb-6">
        <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500 border-b border-gray-300 pb-1 mb-3">
          Professional Summary
        </h2>
        <p className="text-sm leading-relaxed">{resume.summary}</p>
      </section>

      {/* Skills */}
      {resume.skills && resume.skills.length > 0 && (
        <section className="mb-6">
          <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500 border-b border-gray-300 pb-1 mb-3">
            Core Skills
          </h2>
          <div className="flex flex-wrap gap-2">
            {resume.skills.map((skill, idx) => (
              <span key={idx} className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-xs font-medium">
                {skill}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Work Experience */}
      {resume.workExperience && resume.workExperience.length > 0 && (
        <section className="mb-6">
          <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500 border-b border-gray-300 pb-1 mb-3">
            Work Experience
          </h2>
          {resume.workExperience.map((exp, idx) => (
            <div key={idx} className="mb-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-base">{exp.title}</h3>
                  <p className="text-gray-700 text-sm">{exp.company}</p>
                </div>
                <p className="text-xs text-gray-500 whitespace-nowrap">
                  {exp.startDate} - {exp.endDate || "Present"}
                </p>
              </div>
              {exp.achievements && exp.achievements.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {exp.achievements.map((ach, i) => (
                    <li key={i} className="text-sm text-gray-700 flex items-start">
                      <span className="mr-2 mt-1">â€¢</span>
                      {ach}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </section>
      )}

      {/* Projects */}
      {resume.projects && resume.projects.length > 0 && (
        <section className="mb-6">
          <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500 border-b border-gray-300 pb-1 mb-3">
            Projects
          </h2>
          {resume.projects.map((proj, idx) => (
            <div key={idx} className="mb-3">
              <h3 className="font-semibold text-base">{proj.name}</h3>
              <p className="text-sm text-gray-700">{proj.description}</p>
              <p className="text-xs text-gray-500 mt-1">
                <strong>Technologies:</strong> {joinTechnologies(proj.technologies)}
              </p>
            </div>
          ))}
        </section>
      )}

      {/* Education */}
      {resume.education && resume.education.length > 0 && (
        <section className="mb-6">
          <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500 border-b border-gray-300 pb-1 mb-3">
            Education
          </h2>
          {resume.education.map((edu, idx) => (
            <div key={idx} className="mb-3">
              <h3 className="font-semibold text-base">{edu.degree} in {edu.field}</h3>
              <p className="text-sm text-gray-700">{edu.institution}</p>
              <p className="text-xs text-gray-500">
                {edu.startDate} - {edu.endDate || "Present"}
              </p>
            </div>
          ))}
        </section>
      )}

      {/* Certifications */}
      {resume.certifications && resume.certifications.length > 0 && (
        <section>
          <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500 border-b border-gray-300 pb-1 mb-3">
            Certifications
          </h2>
          <ul className="list-disc list-inside text-sm text-gray-700">
            {resume.certifications.map((cert, idx) => (
              <li key={idx}>{cert}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}