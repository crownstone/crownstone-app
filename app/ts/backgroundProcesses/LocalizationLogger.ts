import { Scheduler } from "../logic/Scheduler";
import { FileUtil } from "../util/FileUtil";
import { LOCALIZATION_LOG_MAX_STORAGE_TIME_DAYS, LOG_MAX_STORAGE_TIME_DAYS } from "../ExternalConfig";
import { getLoggingFilename, LOG_PREFIX } from "../logging/LogUtil";
import { core } from "../Core";
import { MapProvider } from "./MapProvider";
import { LOG, LOGw } from "../logging/Log";
import { DataUtil } from "../util/DataUtil";

const RNFS = require('react-native-fs');

const Localization_LOG_PREFIX = 'Localization_Dataset_';

class LocalizationLoggerClass {
  _initialized : boolean = false;
  _unsubscribeListeners = [];
  _data = [];
  _futureClassification = [];
  _lastClassifications : locationDataContainer[] = [];

  init() {
    if (this._initialized === false) {
      this._unsubscribeListeners.push(core.nativeBus.on(core.nativeBus.topics.iBeaconAdvertisement,  (ibeaconData: ibeaconPackage[]) => { this._store(ibeaconData); }))
      this._unsubscribeListeners.push(core.nativeBus.on(core.nativeBus.topics.enterRoom,(data : locationDataContainer) => {
        // no duplicates in this set.
        removeExistingClassifications(this._lastClassifications, data);
        // place the most recent one first.
        this._lastClassifications.unshift(data);

        // only need the last 5 unique ones.
        if (this._lastClassifications.length > 5) {
          this._lastClassifications.pop();
        }
      })); // data = {region: sphereId, location: locationId}
    }
    this._initialized = true;
  }

  _store(data: ibeaconPackage[]) {
    let set = [];
    let now = Date.now()
    for (let ibeaconData of data) {
      let ibeaconString = (ibeaconData.uuid + '_' + ibeaconData.major + '_' + ibeaconData.minor).toLowerCase();
      let crownstoneId = MapProvider.stoneIBeaconMap[ibeaconString]?.cid || null;
      if (crownstoneId) {
        set.push([now, ibeaconData.id, ibeaconData.rssi]);
      }
    }
    this._data.push(set);
    // do not store more than 1 hour of data.
    if (this._data.length > 3600) {
      this._data.shift()
    };

    if (this._futureClassification.length > 0 && this._futureClassification[0] <= now) {
      this.classify(this._futureClassification[1], this._futureClassification[2]);
      this._futureClassification = [];
    }
  }

  async classify(secondsToLookBack: number, location: LocationData) : Promise<number> {
    let data = this._data.slice(this._data.length - 1 - secondsToLookBack);
    let length = data.length;
    let name = Localization_LOG_PREFIX + location.config.name + "_" + location.config.uid + "_";

    let state = core.store.getState();
    let sphereId = state.app.activeSphere;
    let sphere = state.spheres[sphereId];

    await writeLocalizationDataset(name, {
      sphereCloudId: sphere.config.cloudId,
      sphere: sphere.config,
      location: {
        name: location.config.name,
        uid: location.config.uid,
      },
      dataset: data
    });
    this._data = []
    return length;
  }

  classifyAfter(secondsFromNow: number, location: LocationData) {
    this._futureClassification = [Date.now() + 1000*secondsFromNow, secondsFromNow, location];
  }

  destroy() {
    // this will clear the in-memory db, remove the listener, remove the data files.
    this._unsubscribeListeners.forEach((unsub) => { unsub(); });
    this._unsubscribeListeners = [];
    this._initialized = false;
    this._data = [];
    this._futureClassification = [];
    this.clearDataFiles()
  }

  clearDataFiles() {
    deleteDataFiles()
  }

  async getURLS() : Promise<string[]> {
    return await getDatasetUrls()
  }

  async storeFingerprints() : Promise<string> {
    let state = core.store.getState()
    let data = {spheres:{}};
    Object.keys(state.spheres).forEach((sphereId) => {
      let sphere = state.spheres[sphereId];
      data.spheres[sphere.config.cloudId] = {};
      Object.keys(sphere.locations).forEach((locationId) => {
        let location = sphere.locations[locationId];
        data.spheres[sphere.config.cloudId][location.config.uid] = {
          name: location.config.name,
          cloudId: location.config.cloudId,
          fingerprint: location.config.fingerprintRaw
        };
      })
    })

    return await writeLocalizationDataset("Fingerprints", data, true);
  }


}

export const LocalizationLogger = new LocalizationLoggerClass();



async function writeLocalizationDataset(labelName: string, data, ignoreDatetime = false) {
  // create a path you want to write to
  let logPath = FileUtil.getPath();

  // generate filename based on current date.
  let filename = ignoreDatetime ? `${labelName}.json` : getLoggingFilename(Date.now(), labelName, true).replace(".log", ".json");
  let filePath = logPath + '/' + filename;

  // create string
  let str = JSON.stringify(data, null, 2);

  // write the file
  await RNFS.writeFile(filePath, str, 'utf8').catch((err) => {})

  return filePath;
}


async function deleteDataFiles() {
  let logPath = FileUtil.getPath();
  try {
    let urls = await getDatasetUrls()
    for (let i = 0; i < urls.length; i++) {
      FileUtil.safeDeleteFile(urls[i]).catch(()=>{});
    }
  }
  catch (err) {
    // ignore.
  }
}


async function getDatasetUrls() {
  let filePath = FileUtil.getPath();
  let urls = [];
  try {
    let files = await RNFS.readdir(filePath)
    for (let i = 0; i < files.length; i++) {
      if (files[i].substr(0,Localization_LOG_PREFIX.length) === Localization_LOG_PREFIX) {
        urls.push(filePath + '/' + files[i]);
      }
    }
    return urls;
  }
  catch (err) {
    LOGw.info("Could not get localization urls");
    return [];
  }
}

function removeExistingClassifications(set: locationDataContainer[], data: locationDataContainer) {
  for (let i = set.length-1; i >= 0; i--) {
    if (set[i].region === data.region && set[i].location === data.location) {
      set.splice(i, 1)
    }
  }
}