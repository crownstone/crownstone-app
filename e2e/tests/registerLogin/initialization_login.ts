import { waitFor } from 'detox';
import {
  $,
  checkBackAndForthOption,
  delay,
  replaceText, screenshot,
  tap,
  tapAlertCancelButton,
  tapAlertOKButton,
  tapReturnKey,
  tapSingularAlertButton,
  waitToNavigate, waitToShow
} from "../../util/TestUtil";
import {CONFIG} from "../../testSuite.e2e";


export const Initialization_loginUser = () => {
  test('should be on the splash screen', async () => {
    await waitToNavigate('LoginSplash');
    await waitToShow('loginButton');
  })

  test('should go to the login screen', async () => {
    await tap('loginButton');
    await waitToNavigate('LoginView');
    await screenshot();
  })

  if (!CONFIG.ONLY_ESSENTIALS) {
    test('login: back should work', async () => {
      await checkBackAndForthOption(
        'topBarLeftItem',
        'LoginSplash',
        'loginButton',
        'LoginView'
      );
    });

    test('login: popup forgot password no email', async () => {
      await replaceText('login_email_address','');
      await tapReturnKey('login_email_address');
      await tapReturnKey('login_password');
      await tap('login_forgotPassword')
      await screenshot();
      await tapSingularAlertButton()
    });

    test('login: popup forgot password invalid email', async () => {
      await replaceText('login_email_address','invalidEmail');
      await tapReturnKey('login_email_address')
      await tapReturnKey('login_password');
      await tap('login_forgotPassword')
      await screenshot();
      await tapSingularAlertButton()
    });

    test('login: popup forgot password valid email, cancel', async () => {
      await replaceText('login_email_address','crownstone.main.test@gmail.com');
      await tapReturnKey('login_email_address')
      await tapReturnKey('login_password');
      await tap('login_forgotPassword')
      await screenshot();
      await tapAlertCancelButton();
    });
  }

  test('login: login', async () => {
    await replaceText('login_email_address','crownstone.main.test@gmail.com');
    await tapReturnKey('login_email_address')
    await replaceText('login_password','testPassword');
    await tapReturnKey('login_password');
    await screenshot();
    await tap('login_big_button')
    await screenshot();
    await delay(1000);
    await waitToNavigate('PermissionIntroduction', 15000);
  });

};
