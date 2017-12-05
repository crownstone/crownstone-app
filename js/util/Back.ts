import { Platform } from 'react-native'
import {LOG} from "../logging/Log";
const Actions = require('react-native-router-flux').Actions;


export const BackAction = function(amount = 1) {
  if (Platform.OS === 'android') {
    try {
      for (let i = 0; i < amount; i++) {
        Actions.pop({popNum: 1});
      }
    } catch (popErr) {
      LOG.error("Pop error:", popErr);
    }
  }
  else {
    Actions.pop({popNum: amount});
  }
}