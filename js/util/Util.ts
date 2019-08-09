import ImageResizer from 'react-native-image-resizer';

import { screenWidth, screenHeight, pxRatio } from '../views/styles'

import { MeshUtil } from './MeshUtil'
import { DataUtil } from './DataUtil'
import {EventUtil} from "./EventUtil";
import { FileUtil } from "./FileUtil";
import { Scheduler } from "../logic/Scheduler";
import { Permissions } from "../backgroundProcesses/PermissionManager";
import { ALWAYS_DFU_UPDATE_BOOTLOADER, ALWAYS_DFU_UPDATE_FIRMWARE } from "../ExternalConfig";
import { xUtil } from "./StandAloneUtil";

export const emailChecker = function(email) {
  let reg = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return reg.test(email);
};


export const characterChecker = function (value) {
  let reg = /[\D]/g;
  return reg.test(value);
};


export const numberChecker = function (value) {
  let reg = /[0-9]/g;
  return reg.test(value);
};


export const getImageFileFromUser = function(email) {
  return email.replace(/[^\w\s]/gi, '') + '.jpg';
};


export const processImage = function(pictureURI, targetFilename, scaleFactor = 0.5) {
  return new Promise((resolve, reject) => {
    if (!pictureURI) { return resolve(); }

    let targetPath = FileUtil.getPath(targetFilename);

    ImageResizer.createResizedImage(pictureURI, screenWidth * pxRatio * scaleFactor, screenHeight * pxRatio * scaleFactor, 'JPEG', 90)
      .then(({uri}) => {
        return FileUtil.safeMoveFile(uri, targetPath);
      })
      .then(() => {
        return FileUtil.safeDeleteFile(pictureURI);
      })
      .then(() => {
        resolve(targetPath);
      })
      .catch((err) => {
        reject("picture resizing error:" + err.message);
      });
  })
};




export const addDistanceToRssi = function(rssi, distanceInMeters) {
  let newDistance = Math.pow(10,(-(rssi + 60)/(10 * 2))) + distanceInMeters; // the + 0.5 meter makes sure the user is not defining a place where he will sit: on the threshold.
  let newRssi = -(10*2)*Math.log10(newDistance) - 60;
  return newRssi;
};


export const delay = function(ms, performAfterDelay = null) {
  return new Promise((resolve, reject) => {
    // we use the scheduleCallback instead of setTimeout to make sure the process won't stop because the user disabled his screen.
    Scheduler.scheduleCallback(() => {
      if (performAfterDelay !== null && typeof performAfterDelay === 'function') {
        performAfterDelay()
      }
      resolve();
    }, ms, 'dfuDelay');
  })
};

export const Util = {
  mesh: MeshUtil,
  data: DataUtil,
  events: EventUtil,

  canUpdate: function(stone, state) {
    // only admins are allowed to update
    if (Permissions.activeSphere().seeUpdateCrownstone) {
      if (ALWAYS_DFU_UPDATE_FIRMWARE || ALWAYS_DFU_UPDATE_BOOTLOADER) {
        return true;
      }

      let firmwareVersionsAvailable = state.user.firmwareVersionsAvailable || {};
      return xUtil.versions.isLower(stone.config.firmwareVersion, firmwareVersionsAvailable[stone.config.hardwareVersion.substr(0,11)]);
    }
    return false;
  }
};

