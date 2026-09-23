export const restaurantIndustry = {
  id: "restaurant",
  name: "Restaurant & Food Service",
  description: "Websites and apps for dine-in, takeout, delivery, and culinary experiences.",
  targetAudience: ["Foodies", "Local Residents", "Tourists", "Event Planners"],
  painPoints: [
    "High commission fees on third-party delivery apps (Foodpanda, UberEats)",
    "Difficulty managing table reservations efficiently",
    "Outdated online menus that are hard to update",
    "Lack of customer loyalty tracking and rewards"
  ],
  commonGoals: [
    "Increase direct online orders to save commissions",
    "Streamline table booking and reduce wait times",
    "Build a loyal customer base through digital rewards",
    "Enhance brand aesthetic and showcase food visually"
  ],
  recommendedFeatures: [
    "Digital Menu with High-Quality Imagery & Allergens Info",
    "Direct Online Ordering & Payment Gateway (Stripe, Square)",
    "Real-time Table Reservation System",
    "Customer Loyalty & Rewards Dashboard",
    "POS (Point of Sale) Integration"
  ],
  integrations: ["Square POS", "Toast", "OpenTable", "Stripe", "Mailchimp"],
  jargon: ["FOH/BOH", "Turnover rate", "POS", "Omnichannel ordering", "Upselling"],
  complianceRequirements: ["PCI-DSS (for payments)", "GDPR/CCPA (for customer data)", "ADA Accessibility"]
};