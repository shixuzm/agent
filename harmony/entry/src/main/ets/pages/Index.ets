import { webview } from '@kit.ArkWeb';

@Entry
@Component
struct Index {
  controller: webview.WebviewController = new webview.WebviewController();

  aboutToAppear() {
    // 配置 Web 隐私模式
    webview.WebviewController.setWebDebuggingAccess(false);
  }

  build() {
    Column() {
      Web({ src: $rawfile('index.html'), controller: this.controller })
        .width('100%')
        .height('100%')
        .javaScriptAccess(true)
        .domStorageAccess(true)
        .fileAccess(true)
        .mixedMode(MixedMode.All)
        .onPageBegin(() => {
          console.info('Web page begin loading');
        })
        .onPageEnd(() => {
          console.info('Web page loaded');
        })
        .onErrorReceive((error) => {
          console.error('Web error: ' + JSON.stringify(error));
        })
    }
    .width('100%')
    .height('100%')
  }
}
