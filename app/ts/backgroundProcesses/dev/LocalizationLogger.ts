import { FileUtil } from "../../util/FileUtil";
import { getLoggingFilename} from "../../logging/LogUtil";
import { core } from "../../Core";
import { MapProvider } from "./../MapProvider";
import { LOGw } from "../../logging/Log";
import { DataUtil } from "../../util/DataUtil";

const RNFS = require('react-native-fs');

const Localization_LOG_PREFIX = 'Localization_Dataset_';

class LocalizationLoggerClass {
  _initialized : boolean = false;
  _unsubscribeListeners = [];
  _data = [];
  _lastClassifications : classificationContainer[] = [];

  init() {
    if (this._initialized === false) {
      this._unsubscribeListeners.push(core.nativeBus.on(core.nativeBus.topics.iBeaconAdvertisement,
        (ibeaconData: ibeaconPackage[]) => { this._store(ibeaconData); }))
      this._unsubscribeListeners.push(core.eventBus.on('enterRoom',
        (data : locationDataContainer) => {
        // no duplicates in this set.
        removeExistingClassifications(this._lastClassifications, data);
        // place the most recent one first.
        this._lastClassifications.unshift({timestamp : Date.now(), sphereId: data.sphereId, locationId: data.locationId});

        // only need the last 10 unique ones.
        if (this._lastClassifications.length > 10) {
          this._lastClassifications.pop();
        }

      })); // data = {region: sphereId, location: locationId}
    }
    this._initialized = true;
  }


  getClassificationOptions(minutesToLookBack: number) : classificationContainer[] {
    let sinceDate = Date.now() - minutesToLookBack * 60000;
    let collection = [];
    for (let i = 0; i < this._lastClassifications.length; i++) {
      if (this._lastClassifications[i].timestamp >= sinceDate) {
        collection.push(this._lastClassifications[i]);
      }
    }

    // if the last classification happened before you wanted to store, it is the most recent one.
    if (collection.length === 0 && this._lastClassifications.length > 0) {
      collection.push(this._lastClassifications[0]);
    }

    return collection
  }

  resetMeasurement() {
    this._data = [];
  }

  _store(data: ibeaconPackage[]) {
    let set = {};
    let now = Date.now()
    for (let ibeaconData of data) {
      let ibeaconString = (ibeaconData.uuid + '_' + ibeaconData.major + '_' + ibeaconData.minor).toLowerCase();
      let crownstoneId = MapProvider.stoneIBeaconMap[ibeaconString]?.cid || null;
      if (crownstoneId) {
        set[ibeaconData.id] = ibeaconData.rssi;
      }
    }
    this._data.push({timestamp:now, devices:set});
    // do not store more than 1 hour of data.
    if (this._data.length > 3600) {
      this._data.shift()
    }
  }


  async classify(secondsToLookBack: number, location: LocationData, annotation: string) : Promise<number> {
    let lastTimestamp = Date.now() - secondsToLookBack*1000;
    // find until where we need to get the data
    // we start with the assumption of 1 sample per second and go from there.
    let index = 0;

    // never go below 0!
    let initialSearchPoint = Math.max(0,this._data.length - secondsToLookBack - 1);
    for (let i = initialSearchPoint; i < this._data.length; i++) {
      // if this point is in the future, we're good!
      if (this._data[i].timestamp >= lastTimestamp) {
        index = i;
        break;
      }
    }

    let data = this._data.slice(index);
    let length = data.length;
    let name = Localization_LOG_PREFIX + location.config.name + "_" + location.config.uid + "_";

    let state = core.store.getState();
    let sphereId = state.app.activeSphere;
    let sphere = state.spheres[sphereId];

    let device = DataUtil.getDevice(state);

    let dataset: AppDatasetFormat = {
      sphereCloudId: sphere.config.cloudId,
      sphere: sphere.config,
      annotation: annotation,
      device: {
        name: device?.name,
        deviceType: device?.deviceType,
        model: device?.model,
      },
      location: {
        name: location.config.name,
        uid: String(location.config.uid),
      },
      dataset: data
    }

    await writeLocalizationDataset(name, dataset);
    this.resetMeasurement();
    return length;
  }


  destroy() {
    // this will clear the in-memory db, remove the listener, remove the data files.
    this._unsubscribeListeners.forEach((unsub) => { unsub(); });
    this._unsubscribeListeners = [];
    this._initialized = false;
    this.resetMeasurement();
    this._lastClassifications = [];
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
    let data : AppFingerprintFormat = {spheres:{}};
    Object.keys(state.spheres).forEach((sphereId) => {
      let sphere = state.spheres[sphereId];
      data.spheres[sphere.config.cloudId] = {sphere: sphere.config, fingerprints: {}};

      Object.keys(sphere.locations).forEach((locationId) => {
        let location = sphere.locations[locationId];
        data.spheres[sphere.config.cloudId].fingerprints[location.config.uid] = {
          name: location.config.name,
          cloudId: location.config.cloudId,
          fingerprint: JSON.parse(location.config.fingerprintRaw)
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
  try {
    let urls = await getDatasetUrls()
    for (let i = 0; i < urls.length; i++) {
      await FileUtil.safeDeleteFile(urls[i]).catch(()=>{});
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

function removeExistingClassifications(set: classificationContainer[], data: locationDataContainer) {
  for (let i = set.length-1; i >= 0; i--) {
    if (set[i].sphereId === data.sphereId && set[i].locationId === data.locationId) {
      set.splice(i, 1)
    }
  }
}