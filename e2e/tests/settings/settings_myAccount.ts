import {
  $, delay, replaceText, screenshot, tap,
  tapAlertCancelButton,
  tapAlertOKButton, tapReturnKey,
  tapSingularAlertButton, waitToNavigate, waitToShow, waitToStart
} from "../../util/TestUtil";
import {Assistant, CONFIG} from "../../testSuite.e2e";
import { device } from "detox";

export const Settings_myAccount = () => {
  test('should be on the SettingsOverview', async () => {
    await waitToNavigate('SettingsOverview');
  })

  test('should be able to go to my Account', async () => {
    await tap('myAccount');
    await waitToNavigate('SettingsProfile')
  })

  if (!CONFIG.ONLY_ESSENTIALS) {
    test('should be able to remove the profile picture and set a new one', async () => {
      await tap('PictureCircleRemove');
      await tapAlertCancelButton();
      await tap('PictureCircleRemove');
      await screenshot();
      await tapAlertOKButton();
      await delay(500);

      await Assistant.update();
      if (Assistant.db.user.profilePicId !== null) {
        throw new Error("Failed to remove the user profile picture from the cloud.");
      }

      await tap('PictureCircle');
      await await tap("optionsPhotoLibrary");
      await delay(500);

      await Assistant.update();
      if (Assistant.db.user.profilePicId === null) {
        throw new Error("Failed to upload the new profile picture to the cloud.");
      }
    })
  }

  test('should be able to change my first name', async () => {
    await replaceText('firstName', 'James');
    await tapReturnKey('firstName');
    await delay(500);

    await Assistant.update();

    if (Assistant.db.user.firstName !== "James") {
      throw new Error("Failed to change first name.");
    }
  })

  test('should be able to change my last name', async () => {
    await replaceText('lastName', 'Blonde');
    await tapReturnKey('lastName');
    await delay(500);

    await Assistant.update();

    if (Assistant.db.user.lastName !== "Blonde") {
      throw new Error("Failed to change last name.");
    }
  })

  if (!CONFIG.ONLY_ESSENTIALS) {
    test('should be able to change password (show popup only)', async () => {
      await tap('changePassword');
      await screenshot();
      await tapAlertCancelButton();
    })

    test('should be able to go to the data management', async () => {
      await tap('DataManagement');
      await delay(1000);
      await screenshot();
      await device.sendToHome();
      await device.launchApp({ newInstance: false });
    })
  }

  test('should be able to go back to the settings overview', async () => {
    await tap('BackButton');
    await waitToNavigate('SettingsOverview')
  })
};
