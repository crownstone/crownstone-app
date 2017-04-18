import { Alert } from 'react-native';
import { BluenetPromiseWrapper } from "../native/libInterface/BluenetPromise";
import { CLOUD } from "../cloud/cloudAPI";
import { Actions } from "react-native-router-flux";
import { LOG } from '../logging/Log'

export const createNewSphere = function(eventBus, store, name) {
  eventBus.emit('showLoading', 'Creating Sphere...');
  return BluenetPromiseWrapper.requestLocation()
    .catch((err) => {
      LOG.error("Could not get Location when creating a sphere: ", err);
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
      eventBus.emit('hideLoading');
      let state = store.getState();
      let title = state.spheres[sphereId].config.name;
      (Actions as any).settingsSphere({sphereId: sphereId, title: title})
    })
    .catch((err) => {
      if (err.status == 422) {
        return this.createNewSphere(eventBus, store, name + ' new')
      }
      else {
        return new Promise((resolve, reject) => {reject(err);})
      }
    })
    .catch((err) => {
      eventBus.emit('hideLoading');
      LOG.error("Could not create sphere", err);
      Alert.alert("Could not create sphere", "Please try again later.", [{text:'OK'}])
    })
};