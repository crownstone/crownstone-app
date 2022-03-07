import {by, device, expect, element, waitFor} from 'detox';
import fs from "fs"
import { CONFIG } from "../testSuite.e2e";

export function $(id) {
  return element(by.id(id))
}
export function iosSingleAlertButton() {
  return element(by.type('_UIAlertControllerActionView')).atIndex(0)
}
export function iosIndexAlertButton(index: number = 0) {
  return element(by.type('_UIAlertControllerActionView')).atIndex(index)
}
export function androidSingleAlertButton() {
  return element(by.type('androidx.appcompat.widget.AppCompatButton'))
}
export function androidIndexAlertButton(index: number = 0) {
  return element(by.type('androidx.appcompat.widget.AppCompatButton')).atIndex(index);
}

async function tapAlertButton(buttonElement, timeout = 1000) {
  await delay(100);
  await waitFor(buttonElement).toBeVisible().withTimeout(timeout);
  await buttonElement.tap()
  await delay(100);
}

export async function replaceText(id, text, timeout = 1000) {
  await delay(100);
  let item = $(id);
  await waitFor(item).toBeVisible().withTimeout(timeout);
  await item.replaceText(text)
  await delay(100);
}

export async function clearText(id, timeout = 1000) {
  await delay(100);
  let item = $(id);
  await waitFor(item).toBeVisible().withTimeout(timeout);
  await item.clearText();
  await delay(100);
}

export async function tap(id, timeout = 1000) {
  await delay(100);
  let item = $(id);
  await waitFor(item).toBeVisible(100).withTimeout(timeout);
  await item.tap();
  await delay(200);
}

export async function longPress(id, duration= 2000, timeout = 1000) {
  await delay(100);
  let item = $(id);
  await waitFor(item).toBeVisible(100).withTimeout(timeout);
  await item.longPress(duration);
  await delay(200);
}

export async function tapReturnKey(id, timeout = 1000) {
  await delay(100);
  let item = $(id);
  await waitFor(item).toBeVisible().withTimeout(timeout);
  await item.tapReturnKey()
  await delay(300);
}

export async function waitToShow(id, timeout = 1500) {
  await delay(100);
  let item = $(id);
  await waitFor(item).toBeVisible().withTimeout(timeout);
  await delay(100);
}

export async function waitToNavigate(id, timeout = 3000) {
  await delay(300);
  let item = $(id);
  await waitFor(item).toBeVisible().withTimeout(timeout);
  await delay(300);
}

export async function waitToDisappear(id, timeout = 10000) {
  await delay(300);
  let item = $(id);
  await waitFor(item).not.toBeVisible().withTimeout(timeout);
  await delay(300);
}
export async function waitToStart(id, timeout = 8000) {
  await delay(500);
  let item = $(id);
  await waitFor(item).toBeVisible(100).withTimeout(timeout);
  await delay(500);
}

export async function scrollDownUntilVisible( itemId, scrollViewId ) {
  await waitFor($(itemId)).toBeVisible(100).whileElement(by.id(scrollViewId)).scroll(150, 'down');
}

export async function scrollUpUntilVisible( itemId, scrollViewId ) {
  await waitFor($(itemId)).toBeVisible(100).whileElement(by.id(scrollViewId)).scroll(150, 'up');
}

export async function swipeNext( itemId ) {
  await $(itemId).swipe('left');
}


export async function tapSingularAlertButton() {
  if (isIos()) {
    await tapAlertButton(iosSingleAlertButton());
  }
  else {
    await tapAlertButton(androidSingleAlertButton())
  }
}

export async function tapAlertCancelButton() {
  if (Platform() === 'ios') {
    await tapAlertButton(iosIndexAlertButton(0));
  }
  else {
    await tapAlertButton(androidIndexAlertButton(0))
  }
}
export async function tapAlertOKButton() {
  if (Platform() === 'ios') {
    await tapAlertButton(iosIndexAlertButton(1));
  }
  else {
    await tapAlertButton(androidIndexAlertButton(1))
  }
}

export function delay(ms) : Promise<void> {
  return new Promise((resolve, reject) => {
    setTimeout(() => { resolve() }, ms)
  })
}

export function Platform() {
  return device.getPlatform();
}
export function isAndroid() {
  return device.getPlatform() === 'android';
}
export function isIos() {
  return device.getPlatform() === 'ios';
}

let screenshot_count = 0;
export async function screenshot() {
  screenshot_count++;
  let tmpPath = await device.takeScreenshot(`${screenshot_count}_`);
  return tmpPath;
}


export async function visitLink(id) {
  await tap(id);
  await delay(CONFIG.LINK_DELAY);
  await screenshot();
  if (isAndroid()) {
    await device.pressBack();
  }
  else {
    await device.sendToHome();
  }
  await device.launchApp({ newInstance: false });
}



export async function goToSettingsTab() {
  await waitFor($('bottomTab_settings')).toBeVisible(100).withTimeout(8000);
  await tap('bottomTab_settings');
  await waitToNavigate('SettingsOverview');
}

export async function goToScenesTab() {
  await waitFor($('bottomTab_scenes')).toBeVisible(100).withTimeout(8000);
  await tap('bottomTab_scenes');
  await waitToNavigate('ScenesOverview');
}

export async function goToSphereOverviewTab() {
  await waitFor($('bottomTab_overview')).toBeVisible(100).withTimeout(8000);
  await tap('bottomTab_overview');
  await waitToNavigate('SphereOverview');
}

export async function goToMessagesTab() {
  await waitFor($('bottomTab_messages')).toBeVisible(100).withTimeout(8000);
  await tap('bottomTab_messages');
  await waitToNavigate('MessageInbox');
}

export async function backButtonOrTap(id) {
  if (CONFIG.USE_ANDROID_BACK_BUTTON) {
    await device.pressBack();
  }
  else {
    await tap(id);
  }
}