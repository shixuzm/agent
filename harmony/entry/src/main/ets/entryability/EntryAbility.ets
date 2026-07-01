import { UIAbility, AbilityConstant, Want } from '@kit.AbilityKit';
import { webview } from '@kit.ArkWeb';
import { window } from '@kit.ArkUI';

export default class EntryAbility extends UIAbility {
  onCreate(want: Want, launchParam: AbilityConstant.LaunchParam) {
    console.info('EntryAbility onCreate');
  }

  onWindowStageCreate(windowStage: window.WindowStage) {
    console.info('EntryAbility onWindowStageCreate');

    windowStage.loadContent('pages/Index', (err) => {
      if (err.code) {
        console.error('Failed to load content. Cause: ' + JSON.stringify(err));
        return;
      }
      console.info('Succeeded in loading content.');
    });
  }
}
