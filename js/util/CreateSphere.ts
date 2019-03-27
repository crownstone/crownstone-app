import { Alert } from 'react-native';
import { BluenetPromiseWrapper } from "../native/libInterface/BluenetPromise";
import { CLOUD } from "../cloud/cloudAPI";
import {LOGe} from '../logging/Log'
import { core } from "../core";

export const createNewSphere = function(eventBus, store, name) {
  core.eventBus.emit('showLoading', 'Creating Sphere...');
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
      return CLOUD.createNewSphere(store, name, eventBus, latitude, longitude)
    })
    .then((sphereId) => {
      core.eventBus.emit('hideLoading');
      return sphereId;
    })
    .catch((err) => {
      if (err.status == 422) {
        return createNewSphere(eventBus, store, name + ' new')
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