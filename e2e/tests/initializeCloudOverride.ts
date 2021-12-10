import { by, device, expect, element, waitFor } from 'detox';
import {$} from "../util/testUtil";

let IP_ADDRESS = '10.0.1.76'

export const TestCustomCloudOverride = () => {
  test('should have welcome screen', async () => {
    await expect($('LoginSplash')).toBeVisible();
  });

  test('should set the custom cloud address', async () => {
    await waitFor($('LoginSplash')).toBeVisible().withTimeout(10000);
    let versionElement = $('VersionHiddenButton');
    await versionElement.multiTap(5)

    await waitFor($('TestConfigurationCloud')).toBeVisible().withTimeout(1000);

    await $("cloudV1Input").replaceText(`http://${IP_ADDRESS}:3000/api/`);
    await $("cloudV2Input").replaceText(`http://${IP_ADDRESS}:3050/api/`);

    await $('closeModal').tap()
    await waitFor($('LoginSplash')).toBeVisible().withTimeout(1000);
  });
};

