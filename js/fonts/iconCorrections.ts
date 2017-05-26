import { Platform } from 'react-native'

import { iconCorrectionsAndroid } from './iconCorrectionsAndroid'
import { iconCorrectionsIOS } from './iconCorrectionsIOS'



export const iconCorrections = {
  c1:       Platform.OS === 'android' ? iconCorrectionsAndroid.c1 : iconCorrectionsIOS.c1,
  c2:       Platform.OS === 'android' ? iconCorrectionsAndroid.c2 : iconCorrectionsIOS.c2,
  ionicons: Platform.OS === 'android' ? iconCorrectionsAndroid.ionicons : iconCorrectionsIOS.ionicons,
};