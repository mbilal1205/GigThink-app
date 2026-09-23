export const mobileTech = {
  id: "mobile",
  name: "Mobile App Development",
  description: "Frameworks for building iOS and Android applications.",
  technologies: [
    {
      name: "React Native (Expo)",
      bestFor: ["Startups needing both iOS & Android fast", "Apps that mirror web functionality"],
      pros: ["One codebase for both platforms", "Uses web developers' JavaScript skills", "Fast over-the-air updates"],
      cons: ["Not ideal for heavy 3D gaming or extreme CPU tasks"],
      pitch: "Building separate iOS and Android apps doubles your cost. I will use React Native to build both from a single codebase, saving you 50% on development while maintaining a native feel."
    },
    {
      name: "Flutter",
      bestFor: ["Highly custom UI/UX", "Apps needing complex animations"],
      pros: ["Beautiful UI engine", "Compiles to native code", "Great performance"],
      cons: ["Uses Dart (smaller talent pool than JS)"],
      pitch: "Your app's design is highly custom. Flutter allows us to build a pixel-perfect, beautiful UI that looks identical and runs at 60fps on both iPhones and Androids."
    },
    {
      name: "Swift / Kotlin (Native)",
      bestFor: ["Hardware-heavy apps (Bluetooth, AR, IoT)", "Enterprise banking apps"],
      pros: ["Maximum performance", "Deepest access to phone hardware APIs"],
      cons: ["Requires two separate teams/codebases", "Most expensive approach"],
      pitch: "Because this app relies heavily on custom Bluetooth hardware integrations, we must go with fully Native development (Swift/Kotlin) to ensure zero latency."
    }
  ]
};