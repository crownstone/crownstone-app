/**
 *
 * Sync the preferences from the cloud to the database.
 *
 */

import {CLOUD} from "../../../cloudAPI";
import {Util} from "../../../../util/Util";
import {SyncingBase} from "./SyncingBase";

export class PreferenceSyncer extends SyncingBase {
  deviceId: string;

  constructor(
    actions: any[],
    transferPromises : any[],
    applyPreferences: boolean,
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


        let preferenceMap = this.mapPreferences(state);
        this.checkInferredPreferences(preferenceMap, preferences_in_cloud, []);

        return Promise.all(this.transferPromises);
      })
      .catch((err) => { console.warn("PresenceSyncer: Error during sync.", err?.message); })
      .then(() => { return this.actions; });
  }

  // here we'll map certain values from our state to the cloud preferences map.
  // preferences are stored per device.
  mapPreferences(state) {
    let preferenceMap = {};

    let spheres = state.spheres;
    let sphereIds = Object.keys(spheres);
    sphereIds.forEach((sphereId) => {

      // SETUP PREFERENCES FOR TOON
      let toons = spheres[sphereId].thirdParty.toons;
      let toonIds = Object.keys(toons);
      toonIds.forEach((toonId) => {
        let property = 'toon_enabled_agreementId.' + toons[toonId].toonAgreementId;
        preferenceMap[property] = {value: toons[toonId].enabled};
      });

      // store locations of rooms in sphere overview
      let locations = spheres[sphereId].locations;
      let positions = {};
      for (let locationId in locations) {
        let location : LocationData = locations[locationId];
        positions[locationId] = {x:location.layout.x, y:location.layout.y};
      }
      preferenceMap['sphere_overview_positions'] = {value: positions};
    });

    return preferenceMap;
  }

  applyPreferences(preferences_in_cloud) {

  }


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
