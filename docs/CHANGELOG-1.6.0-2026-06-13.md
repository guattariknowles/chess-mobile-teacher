# Free Chess 1.6.0

构建日期：2026-06-13

## 本次内容

- 新增三档完全离线的简单 AI。
- 新手 AI 随机选择合法走法。
- 初级 AI 有吃子机会时优先吃子，否则随机走合法步。
- 中级 AI 使用一步子力评分，并优先完成一步将死。
- 真人可以选择执白、执黑或随机执色。
- 人机模式兼容现有棋钟、投降、悔棋、棋谱保存和回放。
- AI 使用固定名称，不创建本地档案；棋谱只关联真人档案。
- 人机模式禁用自定义局面和系列赛，避免混用不兼容流程。

本版本没有实施教学分类栏 UI 和互动教学修改。这些内容按用户要求保留到
阶段 7。

## 自动验证

- `npm run typecheck`：通过。
- `npm test`：53 项通过。
- 本地 AI 新增 12 项测试，覆盖合法走法、随机选择、吃子优先、黑方评分、
  一步将死、升变、终局、同分随机和棋谱档案关联。
- `git diff --check`：通过。

## Android 验收

- 模拟器：`Chess_Android_36`，Android API 36。
- 已检查新手、初级和中级 AI 的正常回应。
- 已检查真人执白和执黑、人机棋盘方向、AI 执白自动首步。
- 已检查有棋钟时 AI 等待开始、超时结果和人机棋谱保存。
- 已检查 AI 回应前撤回一步、回应后撤回两步，并确认旧 AI 任务不会补走。
- 已检查人机模式禁用自定义局面和系列赛。
- Release APK 已覆盖安装并在不连接 Metro 的情况下独立启动。
- 实体 Android 手机尚未验收。

## 本地 APK

- 文件：`builds/free-chess-1.6.0-2026-06-13-local.apk`
- 包名：`com.knowles.freechess`
- 版本名：`1.6.0`
- Android 版本号：`8`
- 最低 SDK：`24`
- 目标 SDK：`36`
- 文件大小：`67,827,293` 字节
- SHA-256：
  `157B6F50F81D88162A809F246CA7D5EF7A3689FFBD7773BEA6427D8E2A7E8CC3`
- 签名：Android 本地调试证书，APK Signature Scheme v2 验证通过。

## EAS 与发布状态

- EAS preview 已提交，构建 ID：
  `790d8fcf-8bd0-4504-bba3-0deb932d2c5c`
- EAS 构建日志：
  `https://expo.dev/accounts/knowles/projects/chess-mobile-teacher/builds/790d8fcf-8bd0-4504-bba3-0deb932d2c5c`
- 提交时状态：已成功上传并进入 EAS 构建流程，未等待免费队列完成。
- GitHub Release：
  `https://github.com/guattariknowles/free-chess/releases/tag/v1.6.0`
- 本地 APK：
  `https://github.com/guattariknowles/free-chess/releases/download/v1.6.0/free-chess-1.6.0-2026-06-13-local.apk`
- EAS APK 尚未完成，因此当前发布物仍标记为本地测试版。

## 已知风险

- 中级 AI 只看当前一步，不会预判对手反击，强度明显低于 Stockfish。
- 随机执色的多次重开、只有一个档案时的完整流程尚未逐项手动验收。
- 暂停恰好发生在 AI 约 450 毫秒等待期间的情况主要由代码保护，尚未单独
  完成手动时序测试。
- 尚未在实体 Android 手机上检查性能、字体和触控体验。
