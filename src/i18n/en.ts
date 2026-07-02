const en = {
  // Header
  "app.title": "AI Multi-Agent System",
  "app.subtitle": "Running on EdgeOne Makers with multi-agent collaboration & skill orchestration",
  "agent.selector": "Select Agent",
  "agent.auto": "Auto Route",

  // Empty state
  "empty.title": "AI Multi-Agent System",
  "empty.hint": "I'm the Super Agent. I coordinate specialist agents for coding, writing, research, and review. Just describe your task and I'll route it to the best agent.",
  "empty.features": "Multi-Agent Routing · Skill Orchestration · Session Memory",

  // Chat input
  "chat.placeholder": "Type a message...  ⏎ Send · Shift+⏎ Newline",
  "chat.hint": "Powered by OpenAI Agents SDK + EdgeOne Makers · Demo only",

  // Preset questions
  "preset.1": "What is the weather like in Beijing now? Any clothing suggestions?",
  "preset.2": "Translate \"Hello, welcome to Beijing!\" into Chinese and count the characters.",

  // Tool indicators
  "tool.weather": "Weather",
  "tool.clothing": "Clothing",
  "tool.translate": "Translate",
  "tool.statistics": "Statistics",

  // Status & errors
  "status.error": "Request failed. Please check if the backend service is running.",
  "status.stopped": "⏹ *Generation stopped*",
  "status.backendError": "Backend abort request failed. The server may still be running.",

  // Debug panel
  "debug.title": "Trace",
  "debug.events": "events",
  "debug.clear": "Clear",
  "debug.empty": "Waiting for SSE events...",
  "debug.emptyHint": "After sending a message, all raw backend data will be displayed here.",

  // Conversation sidebar
  "sidebar.label": "Conversation list",
  "sidebar.title": "Chats",
  "sidebar.newChat": "New chat",
  "sidebar.loading": "Loading conversations...",
  "sidebar.loadMore": "Load more",
  "sidebar.loadingMore": "Loading...",
  "sidebar.emptyTitle": "No conversations yet",
  "sidebar.emptyHint": "Click \"New chat\" to start your first conversation.",
  "sidebar.delete": "Delete conversation",
  "sidebar.deleteConfirm": "Permanently delete this conversation? This cannot be undone.",

  // Aria labels (button hover/screen-reader)
  "aria.send": "Send",
  "aria.clearHistory": "Clear history",
  "aria.stopGeneration": "Stop generation",

  // Language toggle
  "lang.switch": "中文",

  // Login
  "login.title": "Account Login",
  "login.username": "Username",
  "login.usernamePlaceholder": "Enter your username",
  "login.token": "Password / Token",
  "login.tokenPlaceholder": "Enter password or token",
  "login.submit": "Sign In",
  "login.error.empty": "Please enter username and token",
  "login.logout": "Log out",

  // ─── Floating bottom-right action badges ─────────────────────────────
  "floatingLink.deploy": "Deploy",
  "floatingLink.github": "GitHub",

  // ─── Cloud landing page ──────────────────────────────────────────────
  "cloud.title": "Agent Platform",
  "cloud.subtitle": "Welcome to the cloud demo",
  "cloud.intro": "This is the cloud-hosted demo entry. Explore the capabilities, or grab the full source code and local package to run a private multi-agent system on your machine.",
  "cloud.featureTitle": "Highlights",
  "cloud.feature.agentManagement": "Agent Management",
  "cloud.feature.selfGrowth": "Self Growth",
  "cloud.feature.multiTurnChat": "Multi-turn Chat",
  "cloud.feature.agentManagementDesc": "Create, orchestrate, and manage specialist agents to build a 1-master-N-worker collaboration network.",
  "cloud.feature.selfGrowthDesc": "Agents continuously accumulate experience and refine prompts and execution strategies at runtime.",
  "cloud.feature.multiTurnChatDesc": "Context-aware multi-turn conversations keep complex tasks moving forward smoothly.",
  "cloud.cloneTitle": "Clone Repository",
  "cloud.cloneDescription": "Get the full source code via Git and customize it locally.",
  "cloud.copyButton": "Copy",
  "cloud.copied": "Copied",
  "cloud.downloadTitle": "Local Package",
  "cloud.downloadDescription": "Download the full local package and get started without any environment setup.",
  "cloud.downloadButton": "Download Local Package",
  "cloud.quickStartTitle": "Quick Start",
  "cloud.quickStartDescription": "After cloning, run the following commands in your terminal to start the local service.",

  // ─── Settings panel ─────────────────────────────────────────────────
  "settings.title": "Settings",
  "settings.apiKey": "AI Gateway API Key",
  "settings.baseUrl": "AI Gateway Base URL",
  "settings.model": "AI Gateway Model",
  "settings.save": "Save",
  "settings.cancel": "Cancel",
  "settings.clear": "Clear",
  "settings.saved": "Settings saved.",
  "settings.cleared": "Settings cleared.",
  "settings.firstRunHint": "Please configure your API key before using the assistant.",
  "settings.closeUnconfiguredHint": "API key is still empty. The assistant may not work until it is configured.",

  // ─── Memory management ───────────────────────────────────────────────
  "settings.memory.title": "Memory",
  "settings.memory.enabled": "Memory enabled",
  "settings.memory.disabled": "Memory disabled",
  "settings.memory.desktopOnly": "Memory management is available on desktop.",
  "settings.memory.total": "Total memories",
  "settings.memory.size": "Database size",
  "settings.memory.clear": "Clear all memories",
  "settings.memory.clearConfirm": "Permanently clear all memories? This cannot be undone.",
  "settings.memory.clearSuccess": "All memories cleared.",

  // ─── Context management ──────────────────────────────────────────────
  "settings.context.title": "Context",
  "settings.context.window": "Context Window Size (tokens)",
  "settings.context.checkpointThreshold": "Checkpoint Threshold",
  "settings.context.rebuildThreshold": "Rebuild Threshold",
  "settings.context.recentMessagesRatio": "Recent Messages Ratio",
  "settings.context.memoryRatio": "Memory Injection Ratio",
  "settings.context.taskProgressRatio": "Task Progress Injection Ratio",
} as const;

export default en;
