import { Alert } from 'react-native';
import { BluenetPromiseWrapper } from "../native/libInterface/BluenetPromise";
import { CLOUD } from "../cloud/cloudAPI";
import {LOGe} from '../logging/Log'
import { core } from "../core";
import { xUtil } from "./StandAloneUtil";
import { transferLocations } from "../cloud/transferData/transferLocations";
import { MapProvider } from "../backgroundProcesses/MapProvider";

export const createNewSphere = function(name) {
  core.eventBus.emit('showLoading', 'Creating Sphere...');
  let newSphereId = null;
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
    .then((sphereId) => {
      newSphereId = sphereId;
      // Create initial locations
      return createNewLocation("Living room", "c1-tvSetup2", newSphereId);
    })
    .then(() => {
      // Create initial locations
      return createNewLocation("Kitchen", "c1-foodWine", newSphereId);
    })
    .then(() => {
      // Create initial locations
      return createNewLocation("Bedroom", "c1-bed", newSphereId);
    })
    .then(() => {
      core.eventBus.emit('hideLoading');
      return newSphereId;
    })
    .catch((err) => {
      if (err.status == 422) {
        return createNewSphere(name + ' new')
      }
      else {
        return new Promise((resolve, reject) => {reject(err);})
      }
    })
    .catch((err) => {
      core.eventBus.emit('hideLoading');
      LOGe.info("Could not create sphere", err);
      Alert.alert("Could not create sphere", "Please try again later.", [{text:'OK'}])
    })
};


export const createNewLocation = function(name, icon, sphereId) {
  let localId = xUtil.getUUID();
  let actions = [];
  actions.push({type:'ADD_LOCATION', sphereId: sphereId, locationId: localId, data:{name: name, icon: icon}});
  return transferLocations.createOnCloud(actions, {
    localId: localId,
    localData: {
      config: {
        name: name,
        icon: icon,
      },
    },
    localSphereId: sphereId,
    cloudSphereId: MapProvider.local2cloudMap.spheres[sphereId]
  })
    .then(() => {
      core.store.batchDispatch(actions);
    })
}