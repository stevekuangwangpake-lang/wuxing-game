Original prompt: 用户要求使用 Vite + React + TypeScript + Zustand + Tailwind CSS 实现 2 人 Hotseat《五行湮灭》原型，核心规则必须严格正确，尤其是“谁拿牌谁出牌；谁出牌谁结束自己的出牌回合”，并按指定顺序输出完整代码与运行测试说明。

- 已读取 develop-web-game 技能说明。
- 待办：初始化前端项目；实现 types/store/gameLogic/App；运行基础检查并补充测试说明。

## 本轮实现记录
- 已手工创建 Vite + React + TypeScript + Zustand + Tailwind 项目结构与配置文件。
- 已实现 `src/types.ts`、`src/store/gameStore.ts`、`src/utils/gameLogic.ts`、`src/App.tsx`。
- 核心逻辑已覆盖：合法组合校验、有效顶元素判定、相克/被克制惩罚、连续同元素组退回、拿过程堆继续出牌、胜利即时判定。

## 测试与限制
- 尝试执行 `npm create vite@latest . -- --template react-ts --force` 失败：网络受限（`getaddrinfo ENOTFOUND registry.npmjs.org`）。
- 因依赖无法下载，本地未执行 `npm install`、`npm run dev`、`npm run build`。

## 后续建议
- 网络可用后先执行安装，再运行并按极端用例逐条手测。

## 本轮 UI 升级记录
- 新增高视觉卡牌组件：`src/components/Card.tsx`（元素配色、精通发光、阴阳鱼 SVG、正反面翻转、hover 放大）。
- 新增手牌区组件：`src/components/Hand.tsx`（横向滚动、多选策略、拖拽到过程堆出牌）。
- 新增过程堆组件：`src/components/ProcessPile.tsx`（3-5 张叠加可视、顶牌突出、详情弹窗）。
- 重写 `src/App.tsx` 为响应式战场布局（顶部状态、中部过程堆、侧栏操作、底部手牌）。
- 扩展 store：增加 `setSelectedCardIds`、`playCards` 以支持拖拽直接出牌。
- 加入 `framer-motion` 依赖声明与全局样式（字体、滚动条、抖动动画）。

## 待验证
- 需在网络可用环境执行 `npm install` 后运行 `npm run dev`，人工验证拖拽命中、非法出牌提示与移动端排版。
