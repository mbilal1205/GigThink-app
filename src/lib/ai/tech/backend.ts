export const backendTech = {
  id: "backend",
  name: "Backend Development",
  description: "Server-side logic, API development, and business rules.",
  technologies: [
    {
      name: "Node.js (Express / NestJS)",
      bestFor: ["Real-time apps (chat, live tracking)", "Full-stack JS teams", "Microservices"],
      pros: ["Non-blocking I/O (great for concurrent requests)", "Same language as frontend (TypeScript/JS)", "Massive package library (npm)"],
      cons: ["Not ideal for heavy CPU-intensive tasks (like video rendering)"],
      pitch: "By using Node.js, we keep the entire codebase in JavaScript/TypeScript. This reduces development time and makes future maintenance much easier."
    },
    {
      name: "Python (Django / FastAPI)",
      bestFor: ["AI/Machine Learning integrations", "Data-heavy applications", "Fintech"],
      pros: ["Best ecosystem for AI and Data Science", "FastAPI is incredibly fast and auto-generates docs", "Django has built-in admin panels"],
      cons: ["Slightly slower execution time than Node or Go"],
      pitch: "Since your app involves data analysis/AI, Python is the absolute best choice. It allows us to seamlessly integrate machine learning models in the future."
    },
    {
      name: "Go (Golang)",
      bestFor: ["High-performance microservices", "Scalable enterprise systems", "Fintech trading engines"],
      pros: ["Incredibly fast execution", "Handles thousands of concurrent users easily", "Strong security types"],
      cons: ["Smaller talent pool", "Takes longer to build MVPs compared to Node/Python"],
      pitch: "For the scale you are aiming for, Go is required. It's the same technology used by Uber and Twitch to handle massive traffic without crashing."
    }
  ]
};