import {
  $, delay, longPress, replaceText, screenshot, tap,
  tapAlertCancelButton,
  tapAlertOKButton, tapReturnKey,
  tapSingularAlertButton, waitToNavigate, waitToShow, waitToStart
} from "../../util/TestUtil";
import {by, device, expect, element, waitFor} from 'detox';
import {Assistant, CONFIG} from "../../testSuite.e2e";

export const SphereEditMenu_users = () => {
  if (CONFIG.ONLY_ESSENTIALS === true) { return; }

  test('should be on the SphereEdit view', async () => {
    await waitToStart('SphereEdit');
  })

  test('should go to the SphereEdit user overview', async () => {
    await tap('SphereEdit_users')
    await waitToNavigate('SphereUserOverview');
    await screenshot();
  })

  test('should be able invite a user', async () => {
    await tap('AddUser')
    await waitToNavigate('SphereUserInvite');
    await screenshot();
  })

  test('should warn no email adress is supplied', async () => {
    await tap('SendInvitation')
    await screenshot();
    await tapSingularAlertButton();
  })

  test('should warn invalid email adress is supplied', async () => {
    await replaceText('email', 'invalidEmail');
    await tapReturnKey('email');
    await tap('SendInvitation')
    await screenshot();
    await tapSingularAlertButton();
  })

  test('should invite a new user', async () => {
    await replaceText('email', 'crownstone.test.member@gmail.com');
    await tapReturnKey('email');
    await tap('SendInvitation');
    await screenshot();
    await tapSingularAlertButton();
    await waitToNavigate('SphereUserInvite');
  })

  test('should get the user invite detail view', async () => {
    await screenshot();
    await tap('user:crownstone.test.member@gmail.com');
    await waitToNavigate('SphereInvitedUser');
  })

  test('should be able to resend the invitation', async () => {
    await screenshot();
    await tap('ResendInvitation');
    await tapAlertCancelButton();
    await tap('ResendInvitation');
    await screenshot();
    await tapAlertOKButton();
    await delay(500);
    await tapSingularAlertButton();
  })

  test('should be able to revoke the invitation', async () => {
    await tap('RevokeInvitation');
    await screenshot();
    await tapAlertCancelButton();
    await tap('RevokeInvitation');
    await tapAlertOKButton();
    await delay(1000);
    await tapSingularAlertButton();
    await waitToNavigate('SphereUserOverview');
  })

  test('should go back to Sphere Edit overview', async () => {
    await tap("BackButton")
    await waitToNavigate('SphereEdit');
  })
};
