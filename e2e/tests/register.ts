import { by, device, expect, element, waitFor } from 'detox';
import {$, alertButton, tapAlertButton} from "../util/testUtil";

export const TestRegisterNewUser = () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  test('should start at the welcome screen', async () => {
    await expect($('LoginSplash')).toBeVisible();
  });

  test('should go to the register screen', async () => {
    await $('registerButton').tap()
    await waitFor($('registerView')).toBeVisible().withTimeout(1000);
  })

  test('register: should get popup if there is no name', async () => {
    await $('register-acceptName').tap()
    await tapAlertButton(2)
  });
  test('register: should get popup if there is no first name', async () => {
    await $("register-lastName").replaceText(`LastName`);
    await $('register-acceptName').tap()
    await tapAlertButton()
  });
  test('register: should accept only first name', async () => {
    await $("register-firstName").replaceText(`Testy`);
    await $("register-lastName").clearText();
    await $('register-acceptName').tap();
    await expect($('register-Picture')).toBeVisible();
  });

};
