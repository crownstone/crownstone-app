

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
  csBlue:        color,
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