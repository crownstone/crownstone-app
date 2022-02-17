import { waitFor } from 'detox';
import {
  $,
  delay,
  replaceText,
  tap,
  tapAlertCancelButton,
  tapAlertOKButton,
  tapReturnKey,
  tapSingularAlertButton,
  waitToNavigate, waitToShow,
} from "../util/testUtil";
import {CONFIG} from "../testSuite.e2e";


export const LoginUser = () => {
  test('should be on the splash screen', async () => {
    await waitToNavigate('LoginSplash');
    await waitToShow('loginButton');
  })

  test('should go to the login screen', async () => {
    await tap('loginButton');
    await waitToNavigate('LoginView');
  })

  if (!CONFIG.ONLY_ESSENTIALS) {
    test('login: back should work', async () => {
      await tap('topBarLeftItem')
      await waitToNavigate('LoginSplash');
      await tap('loginButton')
    });

    test('login: popup forgot password no email', async () => {
      await replaceText('login_email_address','');
      await tapReturnKey('login_email_address');
      await tapReturnKey('login_password');
      await tap('login_forgotPassword')
      await tapSingularAlertButton()
    });

    test('login: popup forgot password invalid email', async () => {
      await replaceText('login_email_address','bob');
      await tapReturnKey('login_email_address')
      await tapReturnKey('login_password');
      await tap('login_forgotPassword')
      await tapSingularAlertButton()
    });

    test('login: popup forgot password valid email, cancel', async () => {
      await replaceText('login_email_address','crownstone.main.test@gmail.com');
      await tapReturnKey('login_email_address')
      await tapReturnKey('login_password');
      await tap('login_forgotPassword')
      await tapAlertCancelButton();
    });
  }


  test('login: login', async () => {
    await replaceText('login_email_address','crownstone.main.test@gmail.com');
    await tapReturnKey('login_email_address')
    await replaceText('login_password','testPassword');
    await tapReturnKey('login_password')
    await tap('login_big_button')
  });

};
