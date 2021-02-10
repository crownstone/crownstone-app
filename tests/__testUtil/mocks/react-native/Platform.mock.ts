import * as ReactNative from "react-native";

export const Platform = {
  ...ReactNative.Platform,
  OS: "ios",
  Version: 123,
  isTesting: true,
  select: objs => objs["ios"]
};


export function mockReactNative() {
  jest.mock("react-native", () => {
    return {
      // ...ReactNative,
      Platform: Platform
    }
  })
}