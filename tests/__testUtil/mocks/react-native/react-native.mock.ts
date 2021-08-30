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

jest.mock("@bugsnag/react-native", () => {
  return jest.fn()
})