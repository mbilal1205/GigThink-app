export const securityTech = {
  id: "security",
  name: "Security & Authentication",
  description: "Tools and practices to keep the application and users safe.",
  technologies: [
    {
      name: "Auth0 / Clerk",
      bestFor: ["SaaS platforms", "Enterprise SSO (Single Sign-On)", "B2C apps"],
      pros: ["Handles passwords securely", "Easy Social Logins (Google, Apple)", "Compliant with GDPR/SOC2"],
      cons: ["Third-party dependency", "Pricing scales with active users"],
      pitch: "I never recommend building authentication from scratch due to security risks. I will integrate Clerk to handle your users' data with bank-level encryption and easy Google sign-ins."
    },
    {
      name: "Stripe",
      bestFor: ["Any app accepting payments", "Subscriptions", "Marketplaces"],
      pros: ["PCI-DSS compliant", "Handles subscriptions natively", "Incredible developer APIs"],
      cons: ["Standard 2.9% + 30c fee"],
      pitch: "For payments, we will use Stripe. It completely offloads the legal liability of storing credit cards from your servers, making you instantly PCI compliant."
    },
    {
      name: "Cloudflare",
      bestFor: ["All web applications", "Preventing DDoS attacks"],
      pros: ["Free SSL", "Web Application Firewall (WAF)", "Global CDN"],
      cons: ["Advanced security features require paid plans"],
      pitch: "I will route your traffic through Cloudflare. This acts as a shield, blocking malicious bot attacks and DDoS attempts before they even reach your servers."
    }
  ]
};