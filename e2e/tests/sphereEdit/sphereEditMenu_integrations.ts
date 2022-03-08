import {
  $, checkBackOption, delay, longPress, replaceText, screenshot, tap,
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
    await checkBackOption("closeModal","SphereIntegrations", "Integration_Toon", "ToonAdd");
  })

  test('should go to the Alexa overview', async () => {
    await tap('Integration_Alexa');
    await waitToNavigate('AlexaOverview');
    await screenshot();
    await checkBackOption("BackButton","SphereIntegrations", "Integration_Alexa", "AlexaOverview");
  })

  test('should go to the GoogleAssistant overview', async () => {
    await tap('Integration_Google_Assistant');
    await waitToNavigate('GoogleAssistantOverview');
    await screenshot();
    await checkBackOption("BackButton","SphereIntegrations", "Integration_Google_Assistant", "GoogleAssistantOverview");
  })

  test('should go back to the sphereEdit menu', async () => {
    await checkBackOption("BackButton","SphereEdit", "SphereEdit_integrations", "SphereIntegrations");
  })
};
