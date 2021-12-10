import { by, device, expect, element, waitFor } from 'detox';
import {$} from "../util/testUtil";

let IP_ADDRESS = '10.0.1.76'

export const EnableTestOverrides = () => {
  test('should set the custom cloud address', async () => {
    await waitFor($('LoginSplash')).toBeVisible().withTimeout(10000);
    let versionElement = $('VersionHiddenButton');
    await versionElement.multiTap(5)

    await waitFor($('TestConfiguration')).toBeVisible().withTimeout(1000);

    await $("cloudV1Input").replaceText(`http://${IP_ADDRESS}:3000/api/`);
    await $("cloudV2Input").replaceText(`http://${IP_ADDRESS}:3050/api/`);
    await $("mockImageLibrary").tap();
    await $("mockBluenetPromise").tap();

    await $('closeModal').tap()
    await waitFor($('LoginSplash')).toBeVisible().withTimeout(1000);
  });
};

