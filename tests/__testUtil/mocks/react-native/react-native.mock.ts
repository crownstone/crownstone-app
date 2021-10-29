import * as ReactNative from "react-native";
import { AppState } from "react-native";
import { AsyncHookResult, PowerState } from "react-native-device-info/src/internal/types";

export const Platform = {
  ...ReactNative.Platform,
  OS: "ios",
  Version: 123,
  isTesting: true,
  select: objs => objs["ios"]
};


export function mockReactNative() {
  let mockRN = {
    appState: "active",
    reset: null,
  }
  jest.mock("react-native", () => {
    return {
      // ...ReactNative,
      Platform: Platform,
      AppState: {
        currentState: mockRN.appState
      }
    }
  })

  mockRN.reset = () => { mockRN.appState = 'active' }
  return mockRN;
}
jest.mock("react-native-navigation", () => {
  return {
    Navigation:{
      events:jest.fn()
    }}
})

jest.mock("react-native-extra-dimensions-android", () => {
  return jest.fn()
})

jest.mock("react-native-device-info", () => {
  return {
    getApplicationName: jest.fn(),
    getBrand: jest.fn(),
    getBuildNumber: jest.fn(),
    getBundleId: jest.fn(),
    getDeviceId: jest.fn(),
    getDeviceType: jest.fn(),
    getManufacturer: jest.fn(),
    getManufacturerSync: jest.fn(),
    getModel: jest.fn(),
    getPowerState: jest.fn(),
    getPowerStateSync: jest.fn(),
    getReadableVersion: jest.fn(),
    getSystemName: jest.fn(),
    getSystemVersion: jest.fn(),
    getUniqueId: jest.fn(),
    getVersion: jest.fn(),
    hasNotch: jest.fn(),
    hasSystemFeature:jest.fn(),
    hasSystemFeatureSync: jest.fn(),
    isLandscape:jest.fn(),
    isLandscapeSync: jest.fn(),
    isTablet: jest.fn(),
    supported32BitAbis: jest.fn(),
    supported32BitAbisSync: jest.fn(),
    supported64BitAbis: jest.fn(),
    supported64BitAbisSync: jest.fn(),
    supportedAbis: jest.fn(),
    supportedAbisSync: jest.fn(),
    useBatteryLevel: jest.fn(),
    useBatteryLevelIsLow: jest.fn(),
    useDeviceName: jest.fn(),
    useFirstInstallTime: jest.fn(),
    useHasSystemFeature: jest.fn(),
    useIsEmulator: jest.fn(),
    usePowerState: jest.fn(),
    useManufacturer: jest.fn(),
    useIsHeadphonesConnected: jest.fn(),
  }
})

jest.mock("react-native-image-resizer", () => {
  return jest.fn()
})

jest.mock("../../../../app/ts/views/styles", () => {
  return jest.fn()
})

jest.mock("react-native-localize", () => {
  return jest.fn()
})

jest.mock("@react-native-async-storage/async-storage", () => {
  return jest.fn()
})

jest.mock("react-native-fs", () => {
  return jest.fn()
})

jest.mock("@bugsnag/react-native", () => {
  return jest.fn()
})

