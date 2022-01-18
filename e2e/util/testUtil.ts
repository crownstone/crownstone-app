import { by, device, expect, element, waitFor } from 'detox';

export function $(id) {
  return element(by.id(id))
}
export function iosAlertButton(index: number = 0) {
  return element(by.type('_UIAlertControllerActionView')).atIndex(index)
}
export function androidAlertButton(index: number = 0) {
  switch (index) {
    case 0:
      return $("@id/button1")
    case 1:
      return $("@id/button2")
    case 2:
      return $("@id/button3")
  }
}

export async function tapAlertButton(index: number = 0) {
  await expect(iosAlertButton(index)).toBeVisible();
  await iosAlertButton(index).tap()
  await expect(iosAlertButton(index)).not.toBeVisible();
}
export async function tapAlertCancelButton() {
  if (Platform() === 'ios') {
    await tapAlertButton(0)
  }
  else {
    await tapAlertButton(1)
  }
}
export async function tapAlertOKButton() {
  if (Platform() === 'ios') {
    await tapAlertButton(1)
  }
  else {
    await tapAlertButton(0)
  }

}

function delay(num) : Promise<void> {
  return new Promise((resolve, reject) => {
    setTimeout(() => { resolve() }, num)
  })
}

export function Platform() {
  try {
    // @ts-ignore
    let platform = process.env.PLATFORM;
    if (platform !== 'ios' && platform !== 'android') {
      throw new Error("Platform launch argument must be provided!")
    }
    return platform;
  }
  catch (err) {
    console.log("Cloud not get launch arguments", err);
    throw new Error("Platform launch argument must be provided!")
  }
}