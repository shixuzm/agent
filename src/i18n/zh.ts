const zh = {
  // Header
  "app.title": "AI 多智能体系统",
  "app.subtitle": "基于 EdgeOne Makers 运行，支持多智能体协作与技能编排",
  "agent.selector": "选择智能体",
  "agent.auto": "自动调度",

  // Empty state
  "empty.title": "AI 多智能体系统",
  "empty.hint": "我是主智能体，可协调代码、写作、研究、审核等专项智能体为你服务。输入任务后我会自动选择最合适的智能体处理。",
  "empty.features": "多智能体调度 · 技能编排 · 会话记忆",

  // Chat input
  "chat.placeholder": "输入消息...  ⏎ 发送 · Shift+⏎ 换行",
  "chat.hint": "由 OpenAI Agents SDK + EdgeOne Makers 驱动 · 仅供演示",

  // Preset questions
  "preset.1": "北京现在天气怎么样？有什么穿衣建议？",
  "preset.2": "将「你好，欢迎来到北京！」翻译成英文并统计字符数。",

  // Tool indicators
  "tool.weather": "天气",
  "tool.clothing": "穿搭",
  "tool.translate": "翻译",
  "tool.statistics": "统计",

  // Status & errors
  "status.error": "请求失败，请检查后端服务是否正常运行。",
  "status.stopped": "⏹ *已停止生成*",
  "status.backendError": "后端中止请求失败，服务器可能仍在运行。",

  // Debug panel
  "debug.title": "传输流",
  "debug.events": "事件",
  "debug.clear": "清除",
  "debug.empty": "等待 SSE 事件...",
  "debug.emptyHint": "发送消息后，所有原始后端数据将在此处显示。",

  // Conversation sidebar
  "sidebar.label": "会话列表",
  "sidebar.title": "会话",
  "sidebar.newChat": "新建聊天",
  "sidebar.loading": "正在加载会话...",
  "sidebar.loadMore": "加载更多",
  "sidebar.loadingMore": "加载中...",
  "sidebar.emptyTitle": "暂无会话",
  "sidebar.emptyHint": "点击「新建聊天」开始第一段对话。",
  "sidebar.delete": "删除会话",
  "sidebar.deleteConfirm": "确定要永久删除这个会话吗？此操作不可恢复。",

  // Aria labels (button hover/screen-reader)
  "aria.send": "发送",
  "aria.clearHistory": "清除历史",
  "aria.stopGeneration": "停止生成",

  // Language toggle
  "lang.switch": "English",

  // Login
  "login.title": "账户登录",
  "login.username": "用户名",
  "login.usernamePlaceholder": "请输入用户名",
  "login.token": "密码 / Token",
  "login.tokenPlaceholder": "请输入密码或 Token",
  "login.submit": "登录",
  "login.error.empty": "请输入用户名和 Token",
  "login.logout": "退出登录",

  // ─── Floating bottom-right action badges ─────────────────────────────
  "floatingLink.deploy": "一键部署",
  "floatingLink.github": "GitHub",

  // ─── Cloud landing page ──────────────────────────────────────────────
  "cloud.title": "智能体平台",
  "cloud.subtitle": "欢迎使用云端演示",
  "cloud.intro": "这是云端托管的演示入口。你可以浏览产品能力，或获取完整代码与本地安装包，在本地运行私有化多智能体系统。",
  "cloud.featureTitle": "功能亮点",
  "cloud.feature.agentManagement": "智能体管理",
  "cloud.feature.selfGrowth": "自我成长",
  "cloud.feature.multiTurnChat": "多轮对话",
  "cloud.feature.agentManagementDesc": "创建、编排、管理多个专项智能体，构建 1 主 N 从协作网络。",
  "cloud.feature.selfGrowthDesc": "智能体可在运行中持续积累经验，优化提示词与执行策略。",
  "cloud.feature.multiTurnChatDesc": "支持上下文记忆的多轮对话，复杂任务也能连续推进。",
  "cloud.cloneTitle": "克隆仓库",
  "cloud.cloneDescription": "通过 Git 获取完整源代码，本地自由二次开发。",
  "cloud.copyButton": "复制",
  "cloud.copied": "已复制",
  "cloud.downloadTitle": "本地安装包",
  "cloud.downloadDescription": "下载完整的本地安装包，无需配置环境即可开箱即用。",
  "cloud.downloadButton": "下载本地安装包",
  "cloud.quickStartTitle": "快速开始",
  "cloud.quickStartDescription": "克隆仓库后，在终端执行以下命令即可启动本地服务。",
} as const;

export default zh;
