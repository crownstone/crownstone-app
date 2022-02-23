import { by, device, expect, element, waitFor } from 'detox';
import {
  $, delay, replaceText, screenshot, tap,
  tapAlertCancelButton,
  tapAlertOKButton, tapReturnKey,
  tapSingularAlertButton, waitToNavigate, waitToShow
} from "../../util/TestUtil";
import {CONFIG} from "../../testSuite.e2e";


export const TestRegisterNewUser = () => {
  test('should be on the splash screen', async () => {
    await waitToNavigate('LoginSplash');
    await waitToShow('registerButton');
    await screenshot('app has launched');
  })

  test('should go to the register screen', async () => {
    await tap('registerButton');
    await waitToNavigate('registerView');
    await screenshot('name phase of register');
  })

  if (!CONFIG.ONLY_ESSENTIALS) {
    test('register: back should work', async () => {
      await tap('topBarLeftItem');
      await waitToNavigate('LoginSplash');
    });

    test('register: should get popup if there is no name', async () => {
      await tap('registerButton');
      await waitToNavigate('registerView');
      await tap('register-acceptName');
      await screenshot('no name was provided alert');
      await tapSingularAlertButton();
    });

    test('register: should get popup if there is no first name', async () => {
      await replaceText("register-lastName",`LastName`);
      await tapReturnKey("register-lastName");
      await tap('register-acceptName');
      await screenshot('only last name was provided alert');
      await tapSingularAlertButton()
    });
  }

  test('register: should accept only first name', async () => {
    await replaceText("register-firstName",`TestUser`);
    await $("register-lastName").clearText();
    await tapReturnKey("register-lastName");
    await tap('register-acceptName');
    await waitToNavigate('register-Picture')
    await screenshot('picture phase of register');
  });

    test('register: should accept no picture', async () => {
      await tap('register-acceptPicture');
      await waitToNavigate('register-email')
      await screenshot('email phase of register without picture');
    })

  if (!CONFIG.ONLY_ESSENTIALS) {
    test('register: should be able to go back 1 step', async () => {
      await tap('topBarLeftItem');
      await waitToNavigate('register-Picture')
    });

    test('register: can cancel picture popup', async () => {
      await tap('PictureCircle');
      await screenshot('select a profile picture');
      await tap("optionsCancel");
      await delay(300);
      await expect($("optionsCancel")).not.toBeVisible()
    })

    test('register: can add picture from album', async () => {
      await tap('PictureCircle');
      await tap("optionsPhotoLibrary");
      await screenshot('profile picture selected');
      await delay(300);
      await expect($("PictureCircleRemove")).toBeVisible()
    });

    test('register: can can remove picture and cancel that midway', async () => {
      await delay(300);
      await expect($("PictureCircleRemove")).toBeVisible()
      await tap("PictureCircleRemove");
      await screenshot('remove profile picture alert');
      await tapAlertCancelButton();
      await delay(300);
      await expect($("PictureCircleRemove")).toBeVisible()
    });

    test('register: can remove picture again', async () => {
      await tap("PictureCircleRemove");
      await tapAlertOKButton();
      await delay(1000);
      await expect($("PictureCircleRemove")).not.toBeVisible()
    });

    test('register: can add picture from album and continue', async () => {
      await tap('PictureCircle');
      await tap("optionsPhotoLibrary");
      await tap("register-acceptPicture");
      await waitToNavigate('register-AccountCreation');
      await screenshot('email phase of register with picture');
    });

    test('register: cannot make account with no email address', async () => {
      await tap("register-completeRegistration");
      await screenshot('no email address alert');
      await tapSingularAlertButton();
    });

    test('register: cannot make account with invalid email address', async () => {
      await replaceText("register-email",`invalidEmail`);
      await tapReturnKey("register-email");
      await replaceText("register-password",``);
      await tapReturnKey("register-password");
      await tap("register-completeRegistration");
      await screenshot('invalid email address alert');
      await tapSingularAlertButton();
    });

    test('register: cannot make account without password', async () => {
      await replaceText("register-email",`crownstone.main.test@gmail.com`);
      await tapReturnKey("register-email");
      await replaceText("register-password",``);
      await tapReturnKey("register-password");
      await tap("register-completeRegistration");
      await screenshot('no password alert');
      await tapSingularAlertButton();
    });
  }

  test('register: can create account with valid email and password', async () => {
    await replaceText("register-email",`crownstone.main.test@gmail.com`);
    await replaceText("register-password",`testPassword`);
    await tapReturnKey("register-password");
    await tap("register-completeRegistration");
    await delay(300);
    await waitToNavigate('register-finishedCard');
    await screenshot('registration complete');
  });
  test('register: go back to splash', async () => {
    await tap("register-finish");
    await waitToNavigate('LoginSplash');
  });

};
