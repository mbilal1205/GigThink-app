export const databaseTech = {
  id: "database",
  name: "Database Systems",
  description: "Data storage, retrieval, and caching architectures.",
  technologies: [
    {
      name: "PostgreSQL",
      bestFor: ["Complex relational data", "Financial systems", "SaaS with structured users"],
      pros: ["ACID compliant (100% data reliability)", "Handles complex queries beautifully", "Open-source"],
      cons: ["Harder to scale horizontally compared to NoSQL"],
      pitch: "I strongly recommend PostgreSQL. Your data (users, orders, payments) is highly relational, and Postgres ensures zero data corruption during transactions."
    },
    {
      name: "MongoDB",
      bestFor: ["Unstructured data", "Content Management Systems", "Rapid prototyping"],
      pros: ["Flexible schema", "Easy to scale horizontally", "Great for JSON-heavy apps"],
      cons: ["No strict relations can lead to messy data if not managed well"],
      pitch: "Because your data structure might change frequently as you grow, MongoDB gives us the flexibility to evolve the database without breaking the app."
    },
    {
      name: "Supabase / Firebase (BaaS)",
      bestFor: ["MVPs", "Mobile apps", "Real-time sync"],
      pros: ["Out-of-the-box auth and real-time sockets", "Speeds up development by 40%"],
      cons: ["Vendor lock-in", "Can get expensive at massive scale"],
      pitch: "To save your budget and launch the MVP 3 weeks faster, we will use Supabase. It provides enterprise-grade database features without needing a dedicated backend engineer."
    }
  ]
};