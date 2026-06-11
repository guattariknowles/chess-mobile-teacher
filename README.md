# 自由象棋

自由象棋是一款面向初学者和本地双人对弈的 Android 国际象棋应用。

项目坚持离线优先、无广告、无账号、无追踪，不依赖付费 API 或云端模型。当前版本专注于稳定的标准国际象棋规则、棋钟和面对面双人操作。

## 当前功能

- 标准 8x8 国际象棋棋盘
- 合法走法提示和非法走法拦截
- 将军、将死与和棋判断
- 王车易位、吃过路兵和兵升变
- 悔棋、重新开始和棋盘翻转
- 无棋钟、固定时间和自定义时间
- 每步加秒、暂停、继续和超时判负
- 黑白双方独立棋钟、认输和悔棋操作
- 对局结束结果弹窗

## 技术栈

- Expo SDK 56
- React Native
- TypeScript
- chess.js

## 本地运行

需要 Node.js、npm，以及用于 Android 测试的 Expo Go 或 Android SDK。

```powershell
npm install
npm run typecheck
npm test
npm run android
```

## 项目状态

阶段 1 棋盘与规则、阶段 2 棋钟已经完成。当前开发阶段是 PGN 保存、导入、本地棋谱库和回放。

完整计划见 [ROADMAP.md](ROADMAP.md)。

## 隐私与联网

- 对局数据默认只保存在本机。
- 应用不包含账号、广告、追踪或云同步功能。
- EAS 仅用于生成 Android 测试安装包，不参与应用运行。

## 版权

项目代码使用 [MIT License](LICENSE)。

依赖项目及其许可证见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。

仓库不会收录来源不明的课程、题库、书籍原文、扫描件或第三方平台素材。
