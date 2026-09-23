export const frontendTech = {
  id: "frontend",
  name: "Frontend Development",
  description: "Technologies for building the user interface, client-side logic, and SEO.",
  technologies: [
    {
      name: "Next.js (React)",
      bestFor: ["SEO-heavy websites", "SaaS platforms", "E-commerce", "Enterprise applications"],
      pros: ["Server-Side Rendering (SSR) for fast loads", "Top-tier SEO capabilities", "Massive ecosystem"],
      cons: ["Steeper learning curve than plain React", "Can be overkill for simple internal dashboards"],
      pitch: "I recommend Next.js because your project requires strong Google rankings (SEO) and lightning-fast page loads, which standard React struggles with out-of-the-box."
    },
    {
      name: "React.js (SPA)",
      bestFor: ["Internal dashboards", "Complex web apps behind a login", "Admin panels"],
      pros: ["Fast client-side routing", "Huge developer community", "Component reusability"],
      cons: ["Poor SEO if not configured properly", "Initial load time can be slow"],
      pitch: "Since this app lives behind a login screen and SEO isn't a factor, a standard React Single Page Application (SPA) is the most cost-effective and fastest way to build this."
    },
    {
      name: "Vue.js / Nuxt.js",
      bestFor: ["Lightweight applications", "Smooth animations", "Rapid prototyping"],
      pros: ["Extremely clean syntax", "Very lightweight", "Great documentation"],
      cons: ["Smaller job market/ecosystem compared to React"],
      pitch: "Vue.js will give your app a buttery-smooth feel with less code complexity, making it easier and cheaper to maintain in the future."
    }
  ],
  recommendationLogic: "Default to Next.js for anything public-facing (E-commerce, SaaS). Use pure React for internal tools."
};