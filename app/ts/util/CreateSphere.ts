import {Languages} from "../Languages";
import {Alert} from 'react-native';
import {BluenetPromiseWrapper} from "../native/libInterface/BluenetPromise";
import {CLOUD} from "../cloud/cloudAPI";
import {LOGe} from '../logging/Log'
import {core} from "../Core";
import {LocationTransferNext} from "../cloud/sections/newSync/transferrers/LocationTransferNext";
import {Get} from "./GetUtil";

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("CreateSphere", key)(a,b,c,d,e);
}

export const createNewSphere = function(name) {
  core.eventBus.emit('showLoading', lang("Creating_Sphere___"));
  let newSphereLocalId = null;
  let newSphere_cloud_id = null; // underscores so it is visually distinctive
  return BluenetPromiseWrapper.requestLocation()
    .catch((err) => {
      LOGe.info("Could not get Location when creating a sphere: ", err?.message);
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
      console.log(1)
      // Create initial locations
      return createNewLocation("Living room", "c1-tvSetup2", newSphereLocalId, newSphere_cloud_id);
    })
    .then(() => {
      // Create initial locations
      console.log(2)
      return createNewLocation("Kitchen", "c1-foodWine", newSphereLocalId, newSphere_cloud_id);
    })
    .then(() => {
      // Create initial locations
      console.log(3)
      return createNewLocation("Bedroom", "c1-bed", newSphereLocalId, newSphere_cloud_id);
    })
    .then(() => {
      core.eventBus.emit('hideLoading');
      console.log(4)
      return newSphereLocalId;
    })
    .catch((err) => {
      if (err?.status == 422) {
        return createNewSphere(name + lang("_new"))
      }
      else {
        return new Promise((resolve, reject) => {reject(err);})
      }
    })
    .catch((err) => {
      core.eventBus.emit('hideLoading');
      LOGe.info("Could not create sphere", err?.message);
      Alert.alert(lang("Could_not_create_sphere"), lang("Please_try_again_later_"), [{text:lang("OK")}])
    })
};


export const createNewLocation = async function(name, icon, localSphereId, cloudSphereId) : Promise<void> {
  let locationData = {name: name, icon: icon};
  let newId = LocationTransferNext.createLocal(localSphereId, locationData)
  let location = Get.location(localSphereId, newId);
  await LocationTransferNext.createOnCloud(localSphereId, location);
};