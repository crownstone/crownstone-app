import {by, device, expect, element, waitFor} from 'detox';

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

async function tapAlertButton(buttonElement) {
  await delay(100);
  await expect(buttonElement).toBeVisible();
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
export async function waitToStart(id, timeout = 8000) {
  await delay(500);
  let item = $(id);
  await waitFor(item).toBeVisible(100).withTimeout(timeout);
  await delay(500);
}

export async function scrollDownUntilVisible( itemId, scrollViewId ) {
  await waitFor($(itemId)).toBeVisible().whileElement(by.id(scrollViewId)).scroll(100, 'down');
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
  return device.getPlatform()
}
export function isAndroid() {
  return device.getPlatform() === 'android';
}
export function isIos() {
  return device.getPlatform() === 'ios';
}

let screenshot_count = 0;
export async function screenshot(prefix?: string) {
  screenshot_count++;
  if (prefix) {
    await device.takeScreenshot(`${screenshot_count}_${prefix}_`)
  }
  else {
    await device.takeScreenshot(`${screenshot_count}_`)
  }
}