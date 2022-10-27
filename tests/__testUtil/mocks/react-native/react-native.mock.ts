import * as ReactNative from "react-native";

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
  return {
    colors:{
      csBlue:            {hex:'#003E52'},
      csBlueDark:        {hex:'#00283c'},
      csBlueDarker:      {hex:'#00212b'},
      csBlueDarkerDesat: {hex:'#7f9095'},
      csBlueLight:       {hex:'#006f84'},
      csBlueLighter:     {hex:'#00b6cd'},
      csBlueLightDesat:  {hex:'#2c9aa8'},
      csOrange:          {hex:'#ff8400'},
      lightCsOrange:     {hex:'#ffa94d'},
      menuBackground:    {hex:'#00212b'},
      menuText:          {hex:'#fff'},
      white:             {hex:'#fff'},
      black:             {hex:'#000'},
      gray:              {hex:'#ccc'},
      darkGray:          {hex:'#555'},
      darkGray2:         {hex:'#888'},
      lightGray2:        {hex:'#dedede'},
      lightGray:         {hex:'#eee'},
      purple:            {hex:'#8a01ff'},
      darkPurple:        {hex:'#5801a9'},
      darkerPurple:      {hex:'#2a0051'},
      blue:              {hex:'#2daeff'},
      blueDark:          {hex:'#2472ad'},
      blue3:             {hex:'#0075c9'},
      green:             {hex:'#a0eb58'},
      lightGreen2:       {hex:'#bae97b'},
      lightGreen:        {hex:'#caff91'},
      green2:            {hex:'#4cd864'},
      darkGreen:         {hex:'#1f4c43'},
      red:               {hex:'#ff3c00'},
      darkRed:           {hex:'#cc0900'},
      menuRed:           {hex:'#e00'},
      iosBlue:           {hex:'#3478f6'},
      iosBlueDark:       {hex:'#002e5c'},
      lightBlue:         {hex:'#a9d0f1'},
      lightBlue2:        {hex:'#77c2f7'},
      blinkColor1:       {hex:'#41b5ff'},
      blinkColor2:       {hex:'#a5dcff'},
      random: () => {}
    }
  }
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

