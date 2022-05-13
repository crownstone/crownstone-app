import { Platform } from 'react-native'

import { iconCorrectionsAndroid } from './iconCorrectionsAndroid'
import { iconCorrectionsIOS }     from './iconCorrectionsIOS'



export const iconCorrections = {
  c1:            Platform.OS === 'android' ? iconCorrectionsAndroid.c1            : iconCorrectionsIOS.c1,
  c2:            Platform.OS === 'android' ? iconCorrectionsAndroid.c2            : iconCorrectionsIOS.c2,
  c3:            Platform.OS === 'android' ? iconCorrectionsAndroid.c3            : iconCorrectionsIOS.c3,
  entypo:        Platform.OS === 'android' ? iconCorrectionsAndroid.entypo        : iconCorrectionsIOS.entypo,
  fontAwesome5:  Platform.OS === 'android' ? iconCorrectionsAndroid.fontAwesome5  : iconCorrectionsIOS.fontAwesome5,
  materialIcons: Platform.OS === 'android' ? iconCorrectionsAndroid.materialIcons : iconCorrectionsIOS.materialIcons,
  ionicons:      Platform.OS === 'android' ? iconCorrectionsAndroid.ionicons      : iconCorrectionsIOS.ionicons,
  ionicons5:     Platform.OS === 'android' ? iconCorrectionsAndroid.ionicons5     : iconCorrectionsIOS.ionicons5,
  evilIcons:     Platform.OS === 'android' ? iconCorrectionsAndroid.evilIcons     : iconCorrectionsIOS.evilIcons,
  fiCS1:         Platform.OS === 'android' ? iconCorrectionsAndroid.fiCS1         : iconCorrectionsIOS.fiCS1,
  fiHS:          Platform.OS === 'android' ? iconCorrectionsAndroid.fiHS          : iconCorrectionsIOS.fiHS,
  fiE:           Platform.OS === 'android' ? iconCorrectionsAndroid.fiE           : iconCorrectionsIOS.fiE,
};
