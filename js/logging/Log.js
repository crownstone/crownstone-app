import {
  LOGGING,
  ERROR_LOGGING,
  DEBUG,
  DEBUG_LOGGING,
  DEBUG_CLOUD,
  DEBUG_BLE,
  DEBUG_STORE,
  DEBUG_SCHEDULER,
} from '../ExternalConfig'
import { AsyncStorage } from 'react-native'
import RNFS from 'react-native-fs'



export const LOG = function() {
  if (LOGGING) {
    let args = ['LOG ------------ :'];
    for (let i = 0; i < arguments.length; i++) {
      args.push(arguments[i]);
    }
    console.log.apply(this, args);
  }
};


export const LOGError = function() {
  if (ERROR_LOGGING) {
    let args = ['LOG ERROR !!!!! -- :'];
    for (let i = 0; i < arguments.length; i++) {
      args.push(arguments[i]);
    }
    console.log.apply(this, args);
  }
};


export const LOGDebug = function() {
  if (DEBUG_LOGGING) {
    let args = ['LOG Debug ------- :'];
    for (let i = 0; i < arguments.length; i++) {
      args.push(arguments[i]);
    }
    console.log.apply(this, args);
  }
};

export const LOGCloud = function() {
  if (DEBUG_CLOUD) {
    let args = ['LOG Cloud ------ :'];
    for (let i = 0; i < arguments.length; i++) {
      args.push(arguments[i]);
    }
    console.log.apply(this, args);
  }
};

export const LOGBle = function() {
  if (DEBUG_BLE) {
    let args = ['LOG BLE -------- :'];
    for (let i = 0; i < arguments.length; i++) {
      args.push(arguments[i]);
    }
    console.log.apply(this, args);
  }
};


export const LOGStore = function() {
  if (DEBUG_STORE) {
    let args = ['LOG Store ------ :'];
    for (let i = 0; i < arguments.length; i++) {
      args.push(arguments[i]);
    }
    console.log.apply(this, args);
  }
};


export const LOGScheduler = function() {
  if (DEBUG_SCHEDULER) {
    let args = ['LOG Scheduler --- :'];
    for (let i = 0; i < arguments.length; i++) {
      args.push(arguments[i]);
    }
    console.log.apply(this, args);
  }
};