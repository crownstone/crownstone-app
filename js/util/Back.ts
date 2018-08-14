import { Platform } from 'react-native'
import {LOG, LOGe} from "../logging/Log";
const Actions = require('react-native-router-flux').Actions;


export const BackAction = function(popToName?) {
  try {
    if (popToName) {
      // account for the differences in routers here, not in every usage of this.
      // We use the iOS key names in the app code.
      if (popToName === 'sphereOverview') {
        if (Platform.OS === 'android') {
          popToName = 'drawer'
        }
      }
      Actions.popTo(popToName)
    }
    else {
      Actions.pop();
    }
  } catch (popErr) {
    LOGe.info("Pop error:", popErr);
  }
};