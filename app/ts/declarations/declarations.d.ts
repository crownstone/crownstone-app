

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

interface classificationContainer {
  timestamp:  number,
  sphereId:   string,
  locationId: string,
}

type map = { [proptype: string] : boolean } | {}
type numberMap = { [proptype: string] : number } | {}
type stringMap = { [proptype: string] : string } | {}


type PromiseCallback = (any) => Promise<any>

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
  menuTextSelected    : color,
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
  blue3:         color,
  blue2:        color,
  blue:        color,
  blueDark:    color,
  green:        color,
  green2:       color,
  lightGreen:   color,
  lightGreen2:  color,
  darkGreen:    color,
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
  bleBroadcastStatus:              string,
  locationStatus:                  string,

  nearest:                         string,
  nearestSetup:                    string,

  iBeaconAdvertisement:            string,
  enterSphere:                     string,
  exitSphere:                      string,
  enterRoom:                       string,
  exitRoom:                        string,
  currentRoom:                     string,
  currentLocationKNN:              string,

  libAlert:                        string,
  libPopup:                        string,

  classifierProbabilities:         string,
  classifierResult:                string,

  callbackUrlInvoked:              string,
  localizationPausedState:         string,
  connectedToPeripheral:           string,
  connectedToPeripheralFailed:     string,
  disconnectedFromPeripheral:      string,
}

interface NativeBus {
  topics: NativeBusTopics,
  on(topic : string, callback) : () => void,
  clearAllEvents() : void,
}

interface background {
  main                   : any,
  menu                   : any,
  mainDarkLogo           : any,
  mainRemoteNotConnected : any,
  mainDark               : any,
  light                  : any,
  lightBlur              : any,
  lightBlurLighter       : any,
  lightBlurBW            : any,
  detailsDark            : any,
}

interface core {
  bleState: {
    bleAvailable: boolean,
    bleBroadcastAvailable: boolean,
  },
  store: any,
  eventBus: any,
  nativeBus: NativeBus,
}

interface base_core {
  store: any,
  sessionMemory: {
    loginEmail: string,
    cameraSide: string,
    cacheBusterUniqueElement: number,
    developmentEnvironment: boolean,
  }
}


type onSelectResult = boolean | void | string | Promise
interface interviewOption {
  label: string,
  subLabel?: string,
  icon?: any,
  image?: imageData,
  nextCard?: string,
  dangerous?: boolean,
  response?: string,
  dynamicResponse?: (value: {textfieldState: string, customElementState: any}) => string | string,
  textAlign?: string,
  onSelect?: (value: interviewReturnData) => onSelectResult,
  editable?: boolean,
  theme?: "default" | "create"
}

interface imageData {
  source:        any, // image require(...)
  sourceWidth?:  number,
  sourceHeight?: number,
  width?:        number,
  height?:       number,
  tintColor?:    string,
}

interface interviewReturnData {
  customElementState: any,
  textfieldState: any
}

interface interviewCard {
  header?: string,
  headerMaxNumLines?: number,
  subHeader?: string,
  explanation?: string,
  optionsExplanation?: string,
  textColor?: string,
  image?: imageData,
  component?: any,
  editableItem?: (state, setState) => any,
  backgroundImage?: any
  hasTextInputField?: boolean
  placeholder?: string
  optionsHiddenIfNotOnTop?: boolean,
  optionsAlwaysOnTop?: boolean,
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
  iconColor?: string,
  backgroundColor? : string,
  callback: () => void
}

type StackData = { component: any } | { stack: any } | { bottomTabs: any }

interface GraphData {
  x: number,
  y: number,
}

type sphereId = string
type stoneId  = string

interface HubDataReply {
  protocolVersion: number,
  type:            string, // is the string name of the ReplyTypes. As of writing: success | error | dataReply
  errorType:       number // can be null
  dataType:        number // can be null
  message:         string // default empty string ""
}
