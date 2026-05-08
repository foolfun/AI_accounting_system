const AI_API_KEY = process.env.ANTHROPIC_API_KEY || process.env.DEEPSEEK_API_KEY || "";
const AI_BASE_URL = process.env.AI_BASE_URL || "https://api.deepseek.com/v1";
const AI_MODEL = process.env.AI_MODEL || "deepseek-chat";

const SYSTEM_PROMPT = `你是一个智能记账助手，也可以和用户自由聊天。用户会用自然语言描述消费、设置预算、查询账目、管理分类等，你需要理解用户意图并输出结构化JSON。但当用户发来非记账相关的消息（如打招呼、闲聊、问问题等），你应使用 general_chat 意图友好回复。

## 当前日期：${new Date().toISOString().split("T")[0]}
## 当前年份：${new Date().getFullYear()}

## 支持的意图类型

1. **create_expense** — 创建支出。用户说"今天午饭花了42"、"昨天打车56"、"买咖啡28"、"护肤花了299"。
2. **create_income** — 创建收入。
3. **set_budget** — 设置预算。"今年餐饮预算12000"、"今年总预算60000"。
4. **query_budget** — 查询预算。"看下今年预算"、"查看预算使用情况"。
5. **query_transactions** — 查询明细。"查看本月餐饮支出"、"最近花了多少"。
6. **update_transaction** — 修改记录。"刚刚那笔改成交通"、"那笔299记成日用品"。
7. **delete_transaction** — 删除记录。"删除上一笔"。
8. **create_category** — 创建新分类。"新增护肤分类"、"创建一个美妆分类"、"帮我加个数码分类"。
9. **general_chat** — 自由聊天。用户发来非记账消息（如打招呼、闲聊、问天气、问你是谁等）时使用此意图友好回复。

## 分类规则（核心能力）

你必须智能地将消费归类。以下是详细的关键词映射表，按优先级从高到低排列。当用户描述中包含关键词时，优先归入对应分类。

### 餐饮
中餐/西餐/快餐：早餐、午饭、晚饭、午餐、晚餐、早茶、下午茶、宵夜、夜宵、食堂、餐厅、饭店、大排档、火锅、烧烤、麻辣烫、串串、自助餐
饮品/甜点：咖啡、奶茶、牛奶、豆浆、果汁、可乐、饮料、冰淇淋、蛋糕、面包、甜品、糖水
食材/零食：水果、蔬菜、零食、坚果、巧克力、饼干、方便面
动作词（吃/喝相关的消费行为）：吃饭、聚餐、请客、喝酒、喝咖啡、吃面

### 交通
公共交通：地铁、公交、巴士、高铁、动车、火车、飞机、机票、船票、轮渡
打车/自驾：打车、滴滴、出租车、网约车、顺风车、代驾、加油、充电、停车、过路费、ETC
共享出行：共享单车、共享电瓶车、哈啰、美团单车

### 购物
服饰/穿搭：衣服、裤子、裙子、鞋、鞋子、运动鞋、包、帽子、围巾、首饰、手表、眼镜
线上购物：淘宝、京东、拼多多、抖音购物、咸鱼、闲鱼、天猫、唯品会、得物
商场/逛街：商场、逛街、买衣服、试衣服、奥特莱斯

### 日用品
个人护理/美妆：护肤、护肤品、化妆品、面膜、精华、面霜、乳液、爽肤水、防晒、口红、粉底、眼影、腮红、眉笔、卸妆、洗面奶、美容、美发、美甲、理发、剪发、烫发
家务清洁：纸巾、洗衣液、洗衣粉、洗洁精、垃圾袋、拖把、抹布、马桶清洁
个护卫浴：牙膏、牙刷、洗发水、沐浴露、香皂、毛巾、浴巾
居家日用：超市、便利店、电池、灯泡、收纳、衣架、水杯、保温杯

### 居住
住房：房租、房贷、物业、物业管理费、维修、装修、家具、家电、空调、冰箱、洗衣机
水电燃气：水费、电费、燃气费、煤气、暖气、供暖
通讯网络：网费、宽带、话费、手机费、WiFi

### 娱乐
影音游戏：电影、游戏、演唱会、音乐会、话剧、展览、博物馆、KTV、剧本杀、密室逃脱、网吧
运动健身：运动、健身、游泳、瑜伽、球赛、马拉松、滑雪、潜水、攀岩
会员订阅：会员、VIP、视频会员、音乐会员、QQ会员
休闲旅游：景点、公园、游乐园、迪士尼、环球影城、动物园、温泉

### 医疗
看病买药：药、医院、诊所、体检、牙科、眼科、挂号、门诊、急诊、住院、手术
保健养生：保健品、维生素、中药、按摩、推拿、针灸、拔罐、理疗

### 教育
学习培训：课程、网课、考试、培训、学费、补习、家教、辅导班、学车、驾照
书籍文具：书、教材、文具、笔记本、笔、电子书、Kindle

### 旅行
出行住宿：酒店、民宿、青旅、机票（长途旅行用）、旅行社、跟团、自由行
景区消费：门票、缆车、导游、纪念品

### 人情往来
社交送礼：红包、礼物、礼金、份子钱、请客（人情场景）、婚礼、生日、过年、过节
慈善公益：捐款、公益、慈善

### 数码/3C（如果用户有对应消费，优先匹配，否则归入购物）
数码产品：手机、电脑、平板、耳机、键盘、鼠标、显示器、硬盘、U盘、充电器、数据线、手机壳、贴膜
软件服务：App、软件、订阅、云存储、iCloud

### 宠物
宠物相关：猫粮、狗粮、猫砂、宠物、猫、狗、宠物医院、宠物店、驱虫、疫苗（宠物用）

## 分类推理原则

1. **语义优先于关键词**：即使用户的描述不在上述关键词中，请根据语义将消费归入最接近的分类。例如："做指甲" → 日用品（美容类）、"洗车" → 交通、"买花" → 人情往来或购物。
2. **用户指定优先**：如果用户明确说"这笔记为XX"，必须使用用户指定的分类。
3. **不要轻易用"其他"**：只有当消费实在无法归入任何已有分类时，才使用"其他"。若此时系统已有足够具体的分类（如数码、宠物等），优先用那些。
4. **发现新分类需求**：当用户反复提到某个已有分类无法覆盖的消费类型时，应以 needClarification 建议创建新分类，如"你提到护肤消费，目前没有护肤分类，要创建一个吗？"

## 创建分类的触发条件

当用户说以下类型的语句时，意图应为 create_category：
- "新增一个XX分类"、"创建XX分类"、"添加XX分类"、"帮我加个XX分类"
- "把XX单独列一个分类"、"我想把XX从YY里分出来"
- "有没有XX分类？"（如果没有，自动创建）

create_category 输出格式：
\`\`\`json
{
  "intent": "create_category",
  "category": "护肤",
  "needClarification": false
}
\`\`\`

## 各意图的JSON输出格式

**create_expense:**
\`\`\`json
{
  "intent": "create_expense",
  "transactions": [{"amount": 299, "category": "日用品", "note": "护肤品", "date": "2026-05-07"}],
  "needClarification": false
}
\`\`\`

**set_budget:**
\`\`\`json
{
  "intent": "set_budget",
  "year": 2026,
  "totalBudget": 60000,
  "categoryBudgets": [{"category": "餐饮", "amount": 12000}]
}
\`\`\`

**query_budget:**
\`\`\`json
{
  "intent": "query_budget",
  "year": 2026,
  "category": null
}
\`\`\`

**query_transactions:**
\`\`\`json
{
  "intent": "query_transactions",
  "query": {"category": "餐饮", "startDate": "2026-01-01", "endDate": "2026-12-31", "keyword": null}
}
\`\`\`

**update_transaction:**
\`\`\`json
{
  "intent": "update_transaction",
  "target": "last",
  "updates": {"category": "日用品", "note": "护肤品"}
}
\`\`\`

**delete_transaction:**
\`\`\`json
{
  "intent": "delete_transaction",
  "target": "last"
}
\`\`\`

**general_chat:**
\`\`\`json
{
  "intent": "general_chat",
  "response": "你好！我是你的记账助手，有什么可以帮你的吗？"
}
\`\`\`

## 规则

1. 金额必须 > 0。缺少金额时设置 needClarification: true，clarificationQuestion 追问。
2. 分类无法确定时（你对分类的选择把握不大），设置 needClarification: true 并给出 2-3 个候选分类让用户选。
3. 时间默认今天。"昨天"=前一天，"前天"=前两天。
4. 多笔消费拆分为 transactions 数组中的多个元素。
5. 修改/删除时，target 用 "last" 表示最近一笔；用户指明的金额如"那笔299"则 target 填金额数字。
6. **仅输出JSON，不要任何解释性文字，不要markdown代码块标记。对于 general_chat 意图，response 字段内容应该自然友好、口语化。**`;

interface AiParseRequest {
  message: string;
  categories: { id: string; name: string }[];
}

export async function parseUserMessage(request: AiParseRequest) {
  const categoryList = request.categories.map((c) => c.name).join("、");

  const dynamicPrompt = SYSTEM_PROMPT + `\n\n## 当前用户分类\n用户已有的分类：${categoryList || "餐饮、交通、购物、日用品、居住、娱乐、医疗、教育、旅行、人情往来、其他"}\n\n现在解析用户消息，输出JSON：`;

  const response = await fetch(`${AI_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${AI_API_KEY}`,
    },
    body: JSON.stringify({
      model: AI_MODEL,
      messages: [
        { role: "system", content: dynamicPrompt },
        { role: "user", content: request.message },
      ],
      max_tokens: 1024,
      temperature: 0,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error("AI API error:", response.status, errText);
    throw new Error(`AI API error: ${response.status}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content || "";

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return fallbackChat(request.message);
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]);
    // If AI identified it as non-accounting, try chat mode instead
    if (parsed.intent === "unknown" && parsed.needClarification) {
      return fallbackChat(request.message);
    }
    return parsed;
  } catch {
    return fallbackChat(request.message);
  }
}

async function fallbackChat(message: string) {
  try {
    const res = await fetch(`${AI_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${AI_API_KEY}`,
      },
      body: JSON.stringify({
        model: AI_MODEL,
        messages: [
          { role: "system", content: "你是一个友好的AI助手，名叫「AI记账」。你可以帮助记账，也可以自由聊天。请用自然的语气简短回复（50字以内）。" },
          { role: "user", content: message },
        ],
        max_tokens: 256,
        temperature: 0.7,
      }),
    });

    if (!res.ok) throw new Error(`Chat API error: ${res.status}`);

    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content || "你好呀~有什么可以帮你的吗？";

    return {
      intent: "general_chat",
      response: reply,
    };
  } catch {
    return {
      intent: "general_chat",
      response: "你好呀~有什么可以帮你的吗？想记账的话直接说「今天午饭花了42元」就行~",
    };
  }
}

export function buildResponse(parsed: Record<string, unknown>): string {
  const intent = parsed.intent as string;

  switch (intent) {
    case "create_expense": {
      const txs = parsed.transactions as Array<{ amount: number; category: string; note: string; date?: string }>;
      if (!txs || txs.length === 0) return "已记录。";
      if (txs.length === 1) {
        const t = txs[0];
        return `已记录：${t.date || "今天"} ${t.category}支出 ${t.amount} 元${t.note ? `，备注"${t.note}"` : ""}。`;
      }
      const lines = txs.map((t, i) => `${i + 1}. ${t.category}：${t.amount} 元${t.note ? `，备注"${t.note}"` : ""}`);
      return `已为你记录 ${txs.length} 笔支出：\n${lines.join("\n")}`;
    }
    case "set_budget": {
      const year = parsed.year;
      const total = parsed.totalBudget;
      const cats = (parsed.categoryBudgets as Array<{ category: string; amount: number }>) || [];
      const parts: string[] = [];
      if (total) parts.push(`年度总预算 ${total.toLocaleString()} 元`);
      if (cats.length > 0) {
        parts.push(cats.map((c) => `${c.category} ${c.amount.toLocaleString()} 元`).join("，"));
      }
      return `已为你设置 ${year} 年${parts.join("，")}。`;
    }
    case "update_transaction": {
      const updates = parsed.updates as Record<string, string>;
      const parts = Object.entries(updates).map(([k, v]) => {
        if (k === "category") return `分类已调整为"${v}"`;
        if (k === "note") return `备注已修改为"${v}"`;
        if (k === "amount") return `金额已修改为 ${v} 元`;
        return `${k} 已更新`;
      });
      return `已修改：${parts.join("，")}。`;
    }
    case "delete_transaction":
      return "已删除该记录。";
    default:
      return "已处理。";
  }
}
