import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./db-schema";
import { v4 as uuid } from "uuid";

const sqlite = new Database("data/accounting.db");
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

export const db = drizzle(sqlite, { schema });

export function initDatabase() {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      type TEXT NOT NULL DEFAULT 'expense',
      icon TEXT NOT NULL DEFAULT '📦',
      color TEXT NOT NULL DEFAULT '#6b7280',
      is_default INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL DEFAULT 'expense',
      amount REAL NOT NULL,
      category_id TEXT REFERENCES categories(id),
      transaction_date TEXT NOT NULL,
      note TEXT NOT NULL DEFAULT '',
      source TEXT NOT NULL DEFAULT 'ai',
      raw_text TEXT NOT NULL DEFAULT '',
      ai_confidence REAL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS annual_budgets (
      id TEXT PRIMARY KEY,
      year INTEGER NOT NULL,
      total_budget REAL,
      currency TEXT NOT NULL DEFAULT 'CNY',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS category_budgets (
      id TEXT PRIMARY KEY,
      annual_budget_id TEXT REFERENCES annual_budgets(id) ON DELETE CASCADE,
      category_id TEXT REFERENCES categories(id),
      budget_amount REAL NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS chat_messages (
      id TEXT PRIMARY KEY,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      intent TEXT,
      parsed_result TEXT,
      related_transaction_id TEXT,
      created_at TEXT NOT NULL
    );
  `);

  seedDefaults();
}

function seedDefaults() {
  const now = new Date().toISOString();
  const existing = sqlite.prepare("SELECT COUNT(*) as count FROM categories").get() as { count: number };

  if (existing.count === 0) {
    const iconPool = ["🍽️","🚗","🛍️","🧴","🏠","🎮","🏥","📚","✈️","🎁","📱","🐾","💄","☕","🎬","🏋️","🎵","📦"];
    const colorPool = ["#ef4444","#f97316","#eab308","#22c55e","#3b82f6","#8b5cf6","#ec4899","#06b6d4","#14b8a6","#a855f7","#0ea5e9","#d946ef","#f43f5e","#84cc16","#6366f1"];

    const defaults = [
      { name: "日用品", icon: "🧴", color: "#22c55e" },
      { name: "旅行", icon: "✈️", color: "#14b8a6" },
      { name: "娱乐", icon: "🎮", color: "#8b5cf6" },
    ];

    const insert = sqlite.prepare(
      "INSERT INTO categories (id, name, type, icon, color, is_default, created_at, updated_at) VALUES (?, ?, 'expense', ?, ?, 1, ?, ?)"
    );

    for (const cat of defaults) {
      insert.run(uuid(), cat.name, cat.icon, cat.color, now, now);
    }
  }

}

export function randomIcon(): string {
  const icons = ["🍽️","🚗","🛍️","🧴","🏠","🎮","🏥","📚","✈️","🎁","📱","🐾","💄","☕","🎬","🏋️","🎵","📦"];
  return icons[Math.floor(Math.random() * icons.length)];
}

export function randomColor(): string {
  const colors = ["#ef4444","#f97316","#eab308","#22c55e","#3b82f6","#8b5cf6","#ec4899","#06b6d4","#14b8a6","#a855f7","#0ea5e9","#d946ef","#f43f5e","#84cc16","#6366f1"];
  return colors[Math.floor(Math.random() * colors.length)];
}

const iconRules: [string[], string][] = [
  [["餐饮","吃饭","餐厅","外卖","食堂","咖啡","奶茶","火锅","烧烤","麻辣烫","甜品","烘焙","美食","零食","水果","喝酒","酒吧"], "🍜"],
  [["交通","地铁","公交","打车","高铁","火车","飞机","机票","停车","加油","汽车","滴滴","出租车","网约车","代驾","共享单车","电动车"], "🚗"],
  [["购物","衣服","鞋","包","淘宝","京东","拼多多","网购","商场","逛街","服饰","穿搭"], "🛍️"],
  [["日用品","超市","便利店","纸巾","洗衣","牙膏","洗发","沐浴","毛巾","垃圾袋","清洁","家务"], "🧴"],
  [["护肤","化妆品","美容","面膜","精华","口红","粉底","美妆","美发","美甲","理发","剪发","烫发","洗面奶","卸妆","防晒"], "💄"],
  [["居住","房租","房贷","水电","物业","燃气","暖气","网费","话费","维修","装修","家具","家电","空调","冰箱","洗衣机"], "🏠"],
  [["娱乐","电影","游戏","演唱会","KTV","剧本杀","密室","网吧","棋牌","音乐","视频会员"], "🎮"],
  [["运动","健身","游泳","瑜伽","跑步","篮球","足球","滑雪","潜水","攀岩","马拉松"], "🏋️"],
  [["医疗","药","医院","诊所","体检","牙科","眼科","挂号","门诊","看病","手术","保健"], "🏥"],
  [["教育","课程","网课","考试","培训","学费","补习","家教","辅导","学车","驾照","书","文具"], "📚"],
  [["旅行","旅游","酒店","民宿","景点","门票","缆车","导游","跟团","自由行","度假"], "✈️"],
  [["人情","红包","礼物","礼金","份子钱","请客","婚礼","生日","过年","过节","捐款","公益","慈善"], "🎁"],
  [["数码","手机","电脑","平板","耳机","键盘","鼠标","充电器","数据线","手机壳","软件","订阅"], "📱"],
  [["宠物","猫","狗","猫粮","狗粮","猫砂","宠物医院","驱虫","疫苗","遛狗"], "🐾"],
  [["咖啡","奶茶","茶饮","饮料","冷饮","冰淇淋"], "☕"],
  [["电影","电影院","IMAX","票房"], "🎬"],
  [["音乐","唱片","乐器","吉他","钢琴","KTV","唱歌"], "🎵"],
  [["快递","邮寄","邮费","顺丰","圆通","中通"], "📦"],
];

export function smartIcon(name: string): string {
  const lower = name.toLowerCase();
  for (const [keywords, icon] of iconRules) {
    if (keywords.some((kw) => lower.includes(kw))) return icon;
  }
  return randomIcon();
}

export function getDb() {
  return sqlite;
}
