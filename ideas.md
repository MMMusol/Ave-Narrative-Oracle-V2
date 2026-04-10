# Ave Narrative Oracle — 设计构思

## 选定方案：极简金融终端美学（Minimal Financial Terminal Aesthetic）

**Design Movement**: 新极简主义金融终端 × 苹果式高端产品设计

**Core Principles**:
1. 信息密度与呼吸感并存——数据丰富但绝不拥挤，每个元素都有充足的负空间
2. 黑白为主，极少量金色/深绿色点缀——传递机构级专业感
3. 精确的排版层次——Display字体大标题 + Mono字体数据 + Sans字体正文
4. 动态进入感——每个数据块以错落时序淡入，模拟真实数据加载过程

**Color Philosophy**:
- 背景：#FBFBFD（苹果式柔和白，非纯白）
- 主文本：#1D1D1F（深木炭，非纯黑）
- 副文本：#86868B（中性灰）
- 边框：#E5E5EA（极淡）
- 强调色：#000000（纯黑按钮）
- 数据高亮：#00C853（深绿，正向数据）/ #FF3B30（红，负向数据）

**Layout Paradigm**:
- Landing页：非对称布局，左侧大标题+搜索框，右侧浮动示例卡片
- Dashboard：60/40分栏，左侧量化指标，右侧叙事雷达图
- 避免完全居中的"AI slop"布局

**Signature Elements**:
1. 圆形分数环（Hold Value Score）——精确的SVG圆弧进度条
2. 六维叙事雷达图——极简黑白线条风格
3. 顶部细线进度条——API加载状态指示器

**Interaction Philosophy**:
- 搜索框聚焦时微妙扩展动画
- 卡片hover时轻微上浮（translateY -2px）+ 阴影加深
- 数字计数动画——分数从0增长到目标值

**Animation**:
- 页面进入：staggered fadeInUp（每个section延迟0.1s）
- 数据加载：骨架屏 → 真实数据淡入
- 雷达图：从中心向外展开绘制
- 分数环：顺时针绘制动画

**Typography System**:
- Display: "Syne" (bold, 700) — 大标题
- Mono: "JetBrains Mono" — 数字/地址/代码
- Sans: "Inter" — 正文
