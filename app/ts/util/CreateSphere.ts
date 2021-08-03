import { Languages } from "../Languages";

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("CreateSphere", key)(a,b,c,d,e);
}

import { Alert } from 'react-native';
import { BluenetPromiseWrapper } from "../native/libInterface/BluenetPromise";
import { CLOUD } from "../cloud/cloudAPI";
import {LOGe} from '../logging/Log'
import { core } from "../Core";
import { xUtil } from "./StandAloneUtil";
import { transferLocations } from "../cloud/transferData/transferLocations";

export const createNewSphere = function(name) {
  core.eventBus.emit('showLoading', lang("Creating_Sphere___"));
  let newSphereLocalId = null;
  let newSphere_cloud_id = null; // underscores so it is visually distinctive
  return BluenetPromiseWrapper.requestLocation()
    .catch((err) => {
      LOGe.info("Could not get Location when creating a sphere: ", err);
    })
    .then((location) => {
      let latitude = undefined;
      let longitude = undefined;
      if (location && location.latitude && location.longitude) {
        latitude = location.latitude;
        longitude = location.longitude;
      }
      return CLOUD.createNewSphere(name, latitude, longitude)
    })
    .then((sphereIdData) => {
      newSphereLocalId = sphereIdData.localId;
      newSphere_cloud_id = sphereIdData.cloudId;
      // Create initial locations
      return createNewLocation("Living room", "c1-tvSetup2", newSphereLocalId, newSphere_cloud_id);
    })
    .then(() => {
      // Create initial locations
      return createNewLocation("Kitchen", "c1-foodWine", newSphereLocalId, newSphere_cloud_id);
    })
    .then(() => {
      // Create initial locations
      return createNewLocation("Bedroom", "c1-bed", newSphereLocalId, newSphere_cloud_id);
    })
    .then(() => {
      core.eventBus.emit('hideLoading');
      return newSphereLocalId;
    })
    .catch((err) => {
      if (err?.code == 422) {
        return createNewSphere(name + lang("_new"))
      }
      else {
        return new Promise((resolve, reject) => {reject(err);})
      }
    })
    .catch((err) => {
      core.eventBus.emit('hideLoading');
      LOGe.info("Could not create sphere", err);
      Alert.alert(lang("Could_not_create_sphere"), lang("Please_try_again_later_"), [{text:lang("OK")}])
    })
};


export const createNewLocation = function(name, icon, localSphereId, cloudSphereId) {
  let localId = xUtil.getUUID();
  let actions = [];
  actions.push({type:'ADD_LOCATION', sphereId: localSphereId, locationId: localId, data:{name: name, icon: icon}});
  return transferLocations.createOnCloud(actions, {
    localId: localId,
    localData: {
      config: {
        name: name,
        icon: icon,
      },
    },
    localSphereId: localSphereId,
    cloudSphereId: cloudSphereId
  })
    .then(() => {
      core.store.batchDispatch(actions);
    })
};