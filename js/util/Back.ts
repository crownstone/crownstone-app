import { Platform } from 'react-native'
import {LOG} from "../logging/Log";
const Actions = require('react-native-router-flux').Actions;


export const BackAction = function(popToName?) {
  try {
    if (popToName) {
      Actions.popTo(popToName)
    }
    else {
      Actions.pop();
    }
  } catch (popErr) {
    LOG.error("Pop error:", popErr);
  }
}