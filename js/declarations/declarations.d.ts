

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
  blend?(color, number) : color,
  hsvBlend?(color, number) : color,
}

interface colorInterface {
  csBlue:        color,
  csBlueDark:    color,
  csBlueDarker:  color,
  csBlueLight:   color,
  csBlueLighter: color,
  csBlueLightDesat:   color,
  csOrange:      color,
  darkCsOrange:  color,
  lightCsOrange: color,
  menuBackground:       color,
  menuBackgroundDarker: color,
  menuText:             color,
  menuTextSelected:     color,
  menuTextSelectedDark: color,
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
  lightGreen2:  color,
  darkGreen:    color,
  green2:       color,
  orange:       color,
  red:          color,
  darkRed:      color,
  menuRed:      color,
  iosBlue:      color,
  iosBlueDark:  color,
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
    mainDarkLogo           : any,
    mainRemoteNotConnected : any,
    mainDark               : any,
    light                  : any,
    detailsDark            : any,
  },
  store: any,
  eventBus: any,
  nativeBus: NativeBus,
  sessionMemory: {
    loginEmail: string,
    cameraSide: string,
    cacheBusterUniqueElement: number,
    developmentEnvironment: boolean,
  }
}


interface interviewOption {
  label: string,
  icon?: any,
  image?: any,
  nextCard?: string,
  dangerous?: boolean,
  response?: string,
  dynamicResponse?: (value: {textfieldState: string, customElementState: any}) => string | string,
  textAlign?: string,
  onSelect?: (value: interviewReturnData) => boolean | void | string,
  editable?: boolean,
  theme?: "default" | "create"
}


interface interviewReturnData {
  customElementState: any,
  textfieldState: any
}

interface interviewCard {
  header?: string,
  subHeader?: string,
  explanation?: string,
  textColor?: string,
  component?: any,
  image?: any,
  editableItem?: (state, setState) => any,
  backgroundImage?: any
  hasTextInputField?: boolean
  placeholder?: string
  optionsCenter?: boolean,
  optionsBottom?: boolean
  options: interviewOption[]
}

interface interviewCards {
  start: interviewCard,
  [key: string]: interviewCard,
}

interface onScreenNotificationPayload {
  source: string,
  id: string,
  label: string,
  sphereId?: string,
  icon?: string,
  iconSize?: number,
  callback: () => void
}

type StackData = { component: any } | { stack: any } | { bottomTabs: any }
