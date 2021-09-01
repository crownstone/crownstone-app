import * as ReactNative from "react-native";
import { AppState } from "react-native";

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
  return jest.fn()
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