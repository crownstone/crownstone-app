/**
 *
 * Sync the preferences from the cloud to the database.
 *
 */

import {CLOUD} from "../../../cloudAPI";
import {Util} from "../../../../util/Util";
import {SyncingBase} from "./SyncingBase";
import {core} from "../../../../Core";
import {MapProvider} from "../../../../backgroundProcesses/MapProvider";

export class PreferenceSyncer extends SyncingBase {
  deviceId: string;

  constructor(
    actions: any[],
    transferPromises : any[],
    globalCloudIdMap? : syncIdMap,
  ) {
    super(actions, transferPromises, globalCloudIdMap);
  }

  download() {
    return CLOUD.forDevice(this.deviceId).getPreferences();
  }


  sync(state) {
    this.deviceId = this._getDeviceId(state);
    if (!this.deviceId) { return; }

    return this.download()
      .then((preferences_in_cloud) => {
        let preferenceMap = PreferenceProcessor.mapPreferences(state);
        this.checkInferredPreferences(preferenceMap, preferences_in_cloud, []);

        return Promise.all(this.transferPromises);
      })
      .catch((err) => { console.warn("PresenceSyncer: Error during sync.", err?.message); })
      .then(() => { return this.actions; });
  }


  /**
   * Used once at login.
   */
  async applyDevicePreferences() {
    let state = core.store.getState();
    this.deviceId = this._getDeviceId(state);
    if (!this.deviceId) { return; }

    let preferences_in_cloud = await this.download();
    PreferenceProcessor.applyPreferences(state, preferences_in_cloud);
  }


  /**
   * Check if these preferences need to be updated or deleted.
   * @param preferenceMap
   * @param preferences_in_cloud
   * @param unusedPreferences
   */
  checkInferredPreferences(preferenceMap, preferences_in_cloud, unusedPreferences = []) {
    let usedProperty = {};

    // check if we have to update the preference in the cloud.
    preferences_in_cloud.forEach((preference_in_cloud) => {
      let cloudId = preference_in_cloud.id;
      let property = preference_in_cloud.property;
      usedProperty[property] = true;

      // this cleans up preferences from older versions of the app.
      if (preferenceMap[property] === undefined) {
        unusedPreferences.push(cloudId);
      }
      else {
        if (preferenceMap[property].value !== preference_in_cloud.value) {
          // update value of property in cloud
          this.transferPromises.push(
            CLOUD.forDevice(this.deviceId).updatePreference(cloudId, { property: property, value: preferenceMap[property].value })
          );
        }
      }
    });

    // create property entries for the ones that are not uploaded.
    let propertyMap = Object.keys(preferenceMap);
    propertyMap.forEach((property) => {
      if (!usedProperty[property]) {
        this.transferPromises.push(
          CLOUD.forDevice(this.deviceId).createPreference({ property: property, value: preferenceMap[property].value })
        );
      }
    });


    // delete all unusedPreferences.
    unusedPreferences.forEach((unusedId) => {
      this.transferPromises.push( CLOUD.forDevice(this.deviceId).deletePreference(unusedId) );
    })
  }


  _getDeviceId(state) {
    let deviceIds = Object.keys(this.globalCloudIdMap.devices);
    if (deviceIds.length == 0) {
      let deviceId = Util.data.getCurrentDeviceId(state);
      return deviceId;
    }

    return deviceIds[0];
  }
}



const PreferenceProcessor = {
  // here we'll map certain values from our state to the cloud preferences map.
  // preferences are stored per device.
  mapPreferences(state) {
    let preferenceMap = {};

    let spheres = state.spheres;
    let sphereIds = Object.keys(spheres);
    sphereIds.forEach((sphereId) => {
      let sphere = state.spheres[sphereId];

      // SETUP PREFERENCES FOR TOON
      let toons = spheres[sphereId].thirdParty.toons;
      let toonIds = Object.keys(toons);
      toonIds.forEach((toonId) => {
        let toon : ToonData = toons[toonId];
        let property = prepareProperty(sphere, `toon_enabled.${toon.cloudId}`);
        if (preferenceMap[property] === undefined) {
          preferenceMap[property] = {value: {}};
        }
        preferenceMap[property].value = { enabled: toon.enabled };
      });

      // store locations of rooms in sphere overview
      let locations = spheres[sphereId].locations;
      let positions = {};
      for (let locationId in locations) {
        let location : LocationData = locations[locationId];
        console.log(location.layout.x, typeof location.layout.x)
        positions[location.config.cloudId || locationId] = {x: Math.round(location.layout.x), y: Math.round(location.layout.y)};
      }
      preferenceMap[prepareProperty(sphere, 'sphere_overview_positions')] = {value: positions};
    });

    return preferenceMap;
  },


  applyPreferences(state, preferences_in_cloud : cloud_Preference[]) {
    let actions = [];
    for (let preference of preferences_in_cloud) {
      let {sphereId, property, props} = processProperty(preference.property);
      switch (property) {
        case 'sphere_overview_positions':
          let positions = preference.value;
          for (let locationCloudId in positions) {
            let localLocationId = MapProvider.cloud2localMap.locations[locationCloudId] || locationCloudId;
            actions.push({type:"SET_LOCATION_POSITIONS", sphereId, locationId: localLocationId, data: positions[locationCloudId]})
          }
          break;
        case 'toon_enabled':
          let toonId = props[0];
          let data = preference.value;
          let localToonId = MapProvider.cloud2localMap.toons[toonId];
            actions.push({type:"TOON_UPDATE_SETTINGS", sphereId, toonId: localToonId, data: {enabled: data.enabled}})
          break;
      }
    }

    if (actions.length > 0) {
      console.log("DISPATCHING", actions)
      core.store.batchDispatch(actions);
    }
  }
}

// the property of the preference is ${sphereId}_{$propertyName}.${props}
function processProperty(fullProperty: string) : {sphereId: string, sphereCloudId: string, property: string, props: string[]} {
  let fullPropertyArray = fullProperty.split("_")
  let sphereCloudId = fullPropertyArray[0];
  let property = fullProperty.substr(sphereCloudId.length + 1);
  let propertyArr = property.split(".");
  let sphereId = MapProvider.cloud2localMap.spheres[sphereCloudId] || sphereCloudId;
  return {sphereId, sphereCloudId, property: propertyArr[0], props: propertyArr.slice(1)};
}

function prepareProperty(sphere: SphereData, key) {
  return `${sphere.config.cloudId}_${key}`
}