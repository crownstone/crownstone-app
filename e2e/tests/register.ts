import { by, device, expect, element, waitFor } from 'detox';
import {$, alertButton, tapAlertButton, tapAlertCancelButton, tapAlertOKButton} from "../util/testUtil";


export const TestRegisterNewUser = () => {
  test('should be on the splash screen', async () => {
    await waitFor($('LoginSplash')).toBeVisible().withTimeout(2000);
    await waitFor($('registerButton')).toBeVisible().withTimeout(1000);
  })

  test('should go to the register screen', async () => {
    await $('registerButton').tap()
    await waitFor($('registerView')).toBeVisible().withTimeout(1000);
  })

  test('register: back should work', async () => {
    await $('topBarLeftItem').tap()
    await waitFor($('LoginSplash')).toBeVisible().withTimeout(1000);
  });

  test('register: should get popup if there is no name', async () => {
    await $('registerButton').tap()
    await waitFor($('registerView')).toBeVisible().withTimeout(1000);
    await $('register-acceptName').tap()
    await tapAlertButton();
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

  test('register: should accept no picture', async () => {
    await $('register-acceptPicture').tap();
    await expect($('register-AccountCreation')).toBeVisible();
  })

  test('register: should be able to go back 1 step', async () => {
    await $('topBarLeftItem').tap()
    await expect($('register-Picture')).toBeVisible();
  });

  test('register: can cancel picture popup', async () => {
    await $('PictureCircle').tap();
    await $("optionsCancel").tap();
    await expect($("optionsCancel")).not.toBeVisible()
  })

  test('register: can add picture from album', async () => {
    await $('PictureCircle').tap();
    await $("optionsPhotoLibrary").tap();
    await expect($("PictureCircleRemove")).toBeVisible()
  });

  test('register: can can remove picture and cancel that midway', async () => {
    await expect($("PictureCircleRemove")).toBeVisible()
    await $("PictureCircleRemove").tap();
    await tapAlertCancelButton();
    await expect($("PictureCircleRemove")).toBeVisible()
  });

  test('register: can remove picture again', async () => {
    await $("PictureCircleRemove").tap();
    await tapAlertOKButton();
    await expect($("PictureCircleRemove")).not.toBeVisible()
  });

  test('register: can add picture from album and continue', async () => {
    await $('PictureCircle').tap();
    await $("optionsPhotoLibrary").tap();
    await $("register-acceptPicture").tap();
    await expect($('register-AccountCreation')).toBeVisible();
  });

  test('register: cannot make account with no email address', async () => {
    await $("register-completeRegistration").tap();
    await tapAlertButton();
  });

  test('register: cannot make account with invalid email address', async () => {
    await $("register-email").replaceText(`invalidEmail`);
    await $("register-completeRegistration").tap();
    await tapAlertButton();
  });

  test('register: cannot make account without password', async () => {
    await $("register-email").replaceText(`crownstone.main.test@gmail.com`);
    await $("register-completeRegistration").tap();
    await tapAlertButton();
  });

  test('register: can create account with valid email and password', async () => {
    await $("register-email").replaceText(`crownstone.main.test@gmail.com`);
    await $("register-password").replaceText(`testPassword`);
    await $("register-completeRegistration").tap();
    await expect($('register-finishedCard')).toBeVisible();
  });
  test('register: go back to splash', async () => {
    await $("register-finish").tap();
    await waitFor($('LoginSplash')).toBeVisible().withTimeout(2000);
  });

};
