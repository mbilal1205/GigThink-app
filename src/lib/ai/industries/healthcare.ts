export const healthcareIndustry = {
  id: "healthcare",
  name: "Healthcare & Telemedicine",
  description: "Digital health solutions, clinic websites, and patient portals.",
  targetAudience: ["Patients", "Doctors", "Clinic Administrators", "Caregivers"],
  painPoints: [
    "Strict regulatory compliance (HIPAA) blocking fast development",
    "Inefficient manual patient intake and scheduling",
    "Scattered patient records across different systems",
    "Lack of secure remote consultation tools"
  ],
  commonGoals: [
    "Ensure 100% HIPAA/Data Compliance and Security",
    "Streamline telemedicine appointments",
    "Improve patient outcomes through better UI/UX",
    "Digitize and secure Electronic Health Records (EHR)"
  ],
  recommendedFeatures: [
    "Secure Patient Portal & Dashboard",
    "Telehealth Video Consultation module",
    "End-to-End Encrypted Messaging",
    "Automated Appointment Reminders (SMS/Email)",
    "Digital Prescription Management"
  ],
  integrations: ["EHR/EMR Systems (Epic, Cerner)", "Twilio (Video/SMS)", "Stripe (Medical Billing)", "Auth0"],
  jargon: ["HIPAA", "EHR/EMR", "Telehealth", "PHI (Protected Health Information)", "Interoperability"],
  complianceRequirements: ["HIPAA (USA)", "GDPR (Europe)", "HITECH", "FDA (if SaMD)"]
};