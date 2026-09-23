export const travelIndustry = {
  id: "travel",
  name: "Travel & Hospitality",
  description: "Booking engines, travel agency websites, and hotel management systems.",
  targetAudience: ["Tourists", "Business Travelers", "Backpackers", "Travel Agencies"],
  painPoints: [
    "Complex booking flows causing users to abandon mid-way",
    "Managing real-time availability across global time zones",
    "Handling multi-currency and multi-language requirements",
    "Integration with legacy airline/hotel APIs"
  ],
  commonGoals: [
    "Create a frictionless search-to-booking experience",
    "Boost upselling (car rentals, insurance, upgrades)",
    "Improve customer support automation",
    "Showcase destinations with high-end visuals"
  ],
  recommendedFeatures: [
    "Dynamic Search & Real-time Booking Engine",
    "Multi-Language & Multi-Currency Support",
    "Dynamic Pricing Engine based on demand",
    "Itinerary Builder & Downloadable PDFs",
    "Reviews & User Generated Content (UGC)"
  ],
  integrations: ["Amadeus/Sabre API", "Stripe/PayPal", "Google Maps", "SendGrid (Confirmations)"],
  jargon: ["GDS (Global Distribution System)", "OTA (Online Travel Agency)", "Dynamic Pricing", "RevPAR"],
  complianceRequirements: ["PCI-DSS", "GDPR", "Consumer Protection Laws"]
};