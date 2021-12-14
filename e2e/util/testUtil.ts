import { by, device, expect, element, waitFor } from 'detox';

export function $(id) {
  return element(by.id(id))
}
export function alertButton(index: number = 0) {
  return element(by.type('_UIAlertControllerActionView')).atIndex(index)
}

export async function tapAlertButton(index: number = 0) {
  await expect(alertButton(index)).toBeVisible();
  await alertButton(index).tap()
  await expect(alertButton(index)).not.toBeVisible();
}
export async function tapAlertCancelButton() {
  await tapAlertButton(0)
}
export async function tapAlertOKButton() {
  await tapAlertButton(1);

}

function delay(num) : Promise<void> {
  return new Promise((resolve, reject) => {
    setTimeout(() => { resolve() }, num)
  })
}