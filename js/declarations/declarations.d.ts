

// declare module 'react-native-image-resizer' {
//   const createResizedImage: any;
//   export default createResizedImage;
// }

declare const global: {
  __DEV__: boolean
};

interface locationDataContainer {
  region:   string,
  location: string,
}

type map = { [proptype: string] : boolean } | {}
type numberMap = { [proptype: string] : number } | {}
type stringMap = { [proptype: string] : string } | {}


type PromiseCallback = (any) => Promise<any>

interface ActivityContainer {
  [key: string]: {
    logData : transferNewToCloudStoneData[],
    newRangeData : transferNewToCloudStoneData[],
    updatedRangeData : transferNewToCloudStoneData[],
  }
}

interface color {
  hex:string,
  rgb?:{r:number,g:number,b:number},
  rgba?(number) : string,
  name?: string,
  hsv?:string,
  blend?(any, number) : color,
  hsvBlend?(any, number) : color,
}

interface colorInterface {
  darkBackground: color,
  darkBackgroundOverlay: color,
  csBlue:        color,
  csBlueDark:    color,
  csBlueLight:   color,
  csOrange:      color,
  darkCsOrange:  color,
  lightCsOrange: color,
  menuBackground:       color,
  menuBackgroundDarker: color,
  menuText:             color,
  menuTextSelected:     color,
  white:        color,
  black:        color,
  gray:         color,
  notConnected: color,
  darkGray:     color,
  darkGray2:    color,
  lightGray2:   color,
  lightGray:    color,
  purple:       color,
  darkPurple:   color,
  darkerPurple: color,
  blue:         color,
  blue2:        color,
  green:        color,
  lightGreen:   color,
  darkGreen:    color,
  green2:       color,
  orange:       color,
  red:          color,
  darkRed:      color,
  menuRed:      color,
  iosBlue:      color,
  lightBlue:    color,
  lightBlue2:   color,
  blinkColor1:  color,
  blinkColor2:  color,
  random() : any
}

interface NativeBusTopics {
  setupAdvertisement:              string,
  dfuAdvertisement:                string,
  advertisement:                   string,
  crownstoneAdvertisementReceived: string,
  unverifiedAdvertisementData:     string,
  setupProgress:                   string,
  dfuProgress:                     string,
  bleStatus:                       string,
  locationStatus:                  string,

  nearest:                         string,
  nearestSetup:                    string,

  iBeaconAdvertisement:            string,
  enterSphere:                     string,
  exitSphere:                      string,
  enterRoom:                       string,
  exitRoom:                        string,
  currentRoom:                     string,

  libAlert:                        string,
  libPopup:                        string,

  classifierProbabilities:         string,
  classifierResult:                string,

  callbackUrlInvoked:              string,
}

interface NativeBus {
  topics: NativeBusTopics,
  on(topic : string, callback) : () => void,
  clearAllEvents() : void,
}

interface core {
  background: {
    main                   : any,
    menu                   : any,
    mainRemoteNotConnected : any,
    menuRemoteNotConnected : any,
    mainDarkLogo           : any,
    mainDark               : any,
    light                  : any,
    detailsDark            : any,
  },
  store: any,
  storeInitialized: boolean,
  eventBus: any,
  nativeBus: NativeBus,
  sessionMemory: {
    loginEmail: string,
    cameraSide: string,
    cacheBusterUniqueElement: number,
    developmentEnvironment: boolean,
  }
}