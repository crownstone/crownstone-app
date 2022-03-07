import {
  $, backButtonOrTap, delay, longPress, replaceText, screenshot, tap,
  tapAlertCancelButton,
  tapAlertOKButton, tapReturnKey,
  tapSingularAlertButton, waitToNavigate, waitToShow, waitToStart
} from "../../util/TestUtil";
import {by, device, expect, element, waitFor} from 'detox';
import {Assistant, CONFIG} from "../../testSuite.e2e";

export const SphereEditMenu_integrations = () => {
  if (CONFIG.ONLY_ESSENTIALS === true) { return; }

  test('should be on the SphereEdit view', async () => {
    await waitToStart('SphereEdit');
  })

  test('should go to the sphereIntegrations view', async () => {
    await tap("SphereEdit_integrations");
    await waitToNavigate('SphereIntegrations');
    await screenshot();
  })

  test('should go to the Add Toon view', async () => {
    await tap('Integration_Toon');
    await waitToNavigate('ToonAdd');
    await screenshot();
    await backButtonOrTap('closeModal');
    await waitToNavigate('SphereIntegrations');
  })

  test('should go to the Alexa overview', async () => {
    await tap('Integration_Alexa');
    await waitToNavigate('AlexaOverview');
    await screenshot();
    await backButtonOrTap('BackButton');
    await waitToNavigate('SphereIntegrations');
  })

  test('should go to the GoogleAssistant overview', async () => {
    await tap('Integration_Google_Assistant');
    await waitToNavigate('GoogleAssistantOverview');
    await screenshot();
    await backButtonOrTap('BackButton');
    await waitToNavigate('SphereIntegrations');
  })

  test('should go back to the sphereEdit menu', async () => {
    await backButtonOrTap('BackButton');
    await waitToStart('SphereEdit');
  })
};
