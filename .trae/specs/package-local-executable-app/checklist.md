# Checklist

- [ ] 已调研当前 Capacitor / 移动端打包方案与项目结构
- [ ] `@capacitor/core`、`@capacitor/cli`、`@capacitor/android`、`@capacitor/ios`、`@capacitor/preferences` 已安装
- [ ] `capacitor.config.ts` 已创建并配置正确
- [ ] `android/` 和 `ios/` 平台工程已初始化
- [ ] 前端 `Settings.tsx` 设置页面已创建并添加到路由
- [ ] 移动端设置入口已添加
- [ ] `@capacitor/preferences` 已实现配置本地持久化
- [ ] 前端 API 调用已从运行时配置读取 baseUrl / apiKey / model
- [ ] 配置缺失时提示用户进入设置
- [ ] `harmony/` 鸿蒙最小工程已创建
- [ ] 鸿蒙 WebView 可加载本地前端资源
- [ ] `scripts/package-mobile.js` 打包脚本已创建
- [ ] `npm run package:mobile` 可生成移动端产物
- [ ] `README.md` 已更新为移动应用使用说明
- [ ] `npx tsc --noEmit` 无类型错误
- [ ] `npm run build` 构建成功
- [ ] `npm run mobile:sync` 同步成功
