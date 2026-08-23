# 🕵️ 谁是卧底 (Who's The Spy)

一个基于 Web 的多人"谁是卧底"派对游戏，无需下载 App，手机浏览器扫码即可开玩。

## 玩法

1. 房主创建房间，获得 6 位房间码（或分享二维码）
2. 每位玩家加入后获得一个词语——平民拿到相同词语，卧底拿到不同的近似词语
3. 玩家轮流发言描述自己的词语，通过推理找出卧底
4. 房主可逐一点名投票，最终揭晓身份

## 功能

- 创建 / 加入房间，支持二维码快速加入
- 房主管理：开始游戏、重开、重置、点名、揭晓
- 本地玩家管理（线下同屏玩法）
- 20 大分类 × 50 组 = 1000 组词对题库
- 可调节游戏人数与卧底比例

## 技术栈

- **前端 / 后端**：Next.js 16 (App Router, Turbopack)
- **部署平台**：Cloudflare Workers + Durable Objects（[OpenNext Cloudflare](https://opennext.js.org/cloudflare) 适配器）
- **状态持久化**：Durable Object SQLite 存储，房间状态在 Worker 重启后不丢失
- **样式**：Tailwind CSS 4

## 线上地址

https://spy-game.138887.xyz

## 本地开发

```bash
npm install
npm run dev
```

打开 http://localhost:3000 即可游玩。

## 部署到 Cloudflare Workers

```bash
# 1. 登录 Cloudflare（浏览器授权）
npx wrangler login

# 2. 构建并部署
npm run deploy
```

部署后 Worker 会绑定自定义域名 `spy-game.138887.xyz`（见 `wrangler.jsonc` 的 `routes` 配置）。

本地预览（含 Durable Object 模拟）：

```bash
npm run preview
```

## 项目结构

```
app/                    # Next.js App Router（页面 + API 路由）
lib/                    # 业务逻辑（词库、房间操作、客户端封装）
durable-objects/        # Cloudflare Durable Object（房间状态持久化）
worker.ts               # Worker 入口（导出 DO 类）
wrangler.jsonc          # Cloudflare 部署配置
open-next.config.ts     # OpenNext 配置
```

## License

MIT
