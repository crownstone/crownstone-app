import ImageResizer from 'react-native-image-resizer';

import { screenWidth, screenHeight, pxRatio } from '../views/styles'

const SunCalc = require('suncalc');

import { DataUtil }    from './DataUtil'
import { EventUtil }   from "./EventUtil";
import { FileUtil }    from "./FileUtil";
import { Scheduler }   from "../logic/Scheduler";
import { Permissions } from "../backgroundProcesses/PermissionManager";
import { ALWAYS_DFU_UPDATE_BOOTLOADER, ALWAYS_DFU_UPDATE_FIRMWARE } from "../ExternalConfig";
import { xUtil }       from "./StandAloneUtil";
import { core }        from "../Core";
import { LOGd }        from "../logging/Log";
import { Platform } from "react-native";
import { PICTURE_GALLERY_TYPES, SCENE_STOCK_PICTURE_LIST } from "../views/scenesViews/constants/SceneConstants";

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


export const processImage = function(pictureURI, targetFilename, scaleFactor = 0.5) : Promise<string | void> {
  return new Promise((resolve, reject) => {
    if (!pictureURI) { return resolve(); }

    let rotation = 0;
    if (Platform.OS === 'android') {
      let cameraSourceURI = 'content://rocks.crownstone.consumerapp.provider';
      if (pictureURI.substr(0, cameraSourceURI.length) === cameraSourceURI) {
        rotation = 90;
      }
    }

    let targetPath = FileUtil.getPath(targetFilename);

    ImageResizer.createResizedImage(pictureURI, screenWidth * pxRatio * scaleFactor, screenHeight * pxRatio * scaleFactor, 'JPEG', 90, rotation)
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
        reject(new Error("picture resizing error:" + err?.message));
      });
  })
};



export const processStockCustomImage = function(targetName, picture, source) : Promise<{pictureURI: any, picture: string, source: string}> {
  return new Promise((resolve, reject) => {
      if (source === PICTURE_GALLERY_TYPES.CUSTOM) {
        processImage(picture, targetName + ".jpg")
          .then((newPicturePath) => {
            if (newPicturePath) {
              resolve({
                picture: newPicturePath,
                pictureURI: { uri: xUtil.preparePictureURI(newPicturePath) },
                source: source
              })
            }
          })
      }
      else {
        resolve({picture: picture, pictureURI: SCENE_STOCK_PICTURE_LIST[picture], source: source})
     }
  })
};

export const removeStockCustomImage = function(picture, source) {
  if (source === PICTURE_GALLERY_TYPES.CUSTOM) {
    if (picture) {
      FileUtil.safeDeleteFile(picture).catch((e) => {console.log("ER", e)});
    }
  }
};




export const addDistanceToRssi = function(rssi, distanceInMeters) {
  let newDistance = Math.pow(10,(-(rssi + 60)/(10 * 2))) + distanceInMeters; // the + 0.5 meter makes sure the user is not defining a place where he will sit: on the threshold.
  let newRssi = -(10*2)*Math.log10(newDistance) - 60;
  return newRssi;
};


export const delay = function(ms, performAfterDelay = null) : Promise<void>  {
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
  data: DataUtil,
  events: EventUtil,

  bleWatcherEffect(setState) {
    let bleStatusCleaner = core.nativeBus.on(core.nativeBus.topics.bleStatus, (status) => {
      switch (status) {
        case "poweredOn":
          setState(true);
          break;
        default:
          setState(false);
          break;
      }
    });
    let bleCastStatusCleaner = core.nativeBus.on(core.nativeBus.topics.bleBroadcastStatus, (status) => {
      switch (status) {
        case "authorized":
          setState(true);
          break;
        default:
          setState(false);
          break;
      }
    });
    return () => { bleCastStatusCleaner(); bleStatusCleaner(); }
  },

  narrowScreen: function() {
    return screenWidth < 340;
  },

  shortScreen: function() {
    return screenHeight < 600;
  },

  canUpdate: function(stone, state) {
    // only admins are allowed to update
    if (Permissions.activeSphere().seeUpdateCrownstone) {
      if (ALWAYS_DFU_UPDATE_FIRMWARE || ALWAYS_DFU_UPDATE_BOOTLOADER) {
        return true;
      }

      if (!stone.config.hardwareVersion) {
        return false;
      }

      let firmwareVersionsAvailable = state.user.firmwareVersionsAvailable || {};

      if (xUtil.versions.isValidSemver(stone.config.firmwareVersion) === false) {
        return false;
      }

      return xUtil.versions.isLower(stone.config.firmwareVersion, firmwareVersionsAvailable[stone.config.hardwareVersion.substr(0,11)]);
    }
    return false;
  },

  getSphereLocation: function(sphereId) : {latitude: number, longitude: number } {
    // position of Crownstone HQ.
    let latitude = 51.923611570463152;
    let longitude = 4.4667693378575288;
    if (sphereId) {
      let state = core.store.getState();
      let sphere = state.spheres[sphereId];
      if (sphere) {
        latitude = sphere.config.latitude || latitude;
        longitude = sphere.config.longitude || longitude;
      }
    }

    return {latitude: latitude, longitude: longitude };
  },

  getSunTimes: function(sphereId) {
    let coordinates = Util.getSphereLocation(sphereId);
    var times = SunCalc.getTimes(new Date(), coordinates.latitude, coordinates.longitude);

    let sunriseTime = new Date(times.sunriseEnd).valueOf();
    let sunsetTime  = new Date(times.sunset).valueOf();

    return { sunrise: sunriseTime, sunset: sunsetTime };
  },

  getSunTimesInSecondsSinceMidnight: function(sphereId) {
    let sunTimes = Util.getSunTimes(sphereId);
    let midnightSunrise = new Date(sunTimes.sunrise).setHours(0,0,0,0).valueOf();
    let midnightSunset  = new Date(sunTimes.sunset).setHours(0,0,0,0).valueOf();
    LOGd.info("sunTimes", sunTimes, midnightSunrise, midnightSunset);

    return {
      sunrise: Math.round(0.001*(sunTimes.sunrise - midnightSunrise)),
      sunset:  Math.round(0.001*(sunTimes.sunset  - midnightSunset)),
    }
  },


  getNearestCity: function({latitude, longitude}) {
    const cities = require('../../data/cities.json');
    let deg2Rad = (deg) => {
      return deg * Math.PI / 180;
    }

    const pythagorasEquirectangular = function(lat1, lon1, lat2, lon2) {
      const R = 6371;
      const x = (lon2 - lon1) * Math.cos((lat1 + lat2) / 2);
      const y = (lat2 - lat1);
      const d = Math.sqrt(x * x + y * y) * R;
      return d;
    }

    let mindif = 99999;
    let closest = null;
    let latitude_Radians = deg2Rad(latitude);
    let longitude_Radians = deg2Rad(longitude);
    for (let i = 0; i < cities.length; ++i) {
      const dif = pythagorasEquirectangular(latitude_Radians, longitude_Radians, cities[i][1], cities[i][2]);
      if (dif < mindif) {
        closest = i;
        mindif = dif;
      }
    }
    if (closest !== null) {
      return cities[closest][0]
    }
    return null;
  }
};

