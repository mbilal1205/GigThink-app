export const cloudTech = {
  id: "cloud",
  name: "Cloud & DevOps",
  description: "Hosting, deployment, CI/CD, and scaling infrastructure.",
  technologies: [
    {
      name: "AWS (Amazon Web Services)",
      bestFor: ["Enterprise scale", "Complex custom architectures", "Healthcare/Fintech (Compliance)"],
      pros: ["Infinite scaling", "Every service imaginable available", "Industry standard"],
      cons: ["Very complex setup", "Can result in surprise billing if misconfigured"],
      pitch: "AWS is the gold standard. We will set up a scalable architecture that grows automatically as you get more users, ensuring 99.99% uptime."
    },
    {
      name: "Vercel",
      bestFor: ["Next.js apps", "Frontend-heavy SaaS", "E-commerce frontends"],
      pros: ["Zero-config deployments", "Global edge network (CDN)", "Built for developer experience"],
      cons: ["Can get expensive for heavy serverless function usage"],
      pitch: "By deploying on Vercel, your site will be hosted on a global Edge network. This means a user in Japan and a user in New York will both get instant page loads."
    },
    {
      name: "DigitalOcean",
      bestFor: ["Budget-conscious startups", "Simple Docker deployments", "Bootstrapped MVPs"],
      pros: ["Predictable flat pricing", "Easy to understand UI", "Great for self-managed VPS"],
      cons: ["Requires some Linux/DevOps knowledge to maintain"],
      pitch: "To keep your monthly server costs low and predictable while you grow, I'll deploy this on a secure DigitalOcean droplet."
    }
  ]
};