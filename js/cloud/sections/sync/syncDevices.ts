/**
 * Sync devices
 */
import { Platform } from 'react-native'
import {Util} from "../../../util/Util";
import {LOG} from "../../../logging/Log";
import {CLOUD} from "../../cloudAPI";
import {NotificationHandler} from "../../../backgroundProcesses/NotificationHandler";
import {APP_NAME} from "../../../ExternalConfig";

export const syncDevices = function(store, actions, cloudDevices) {
  return new Promise((resolve, reject) => {
    const state = store.getState();

    let { name, address, description, os, userAgent, locale, deviceType, model } = Util.data.getDeviceSpecs(state);

    let deviceId = undefined;
    let deviceAddress = address;
    let matchingDevice = undefined;
    for (let i = 0; i < cloudDevices.length; i++) {
      let cloudDevice = cloudDevices[i];
      if (cloudDevice.address === address) {
        deviceId = cloudDevice.id;
        matchingDevice = cloudDevice;
        break;
      }
      else if (cloudDevice.name === name && cloudDevice.description === description) {
        deviceId = cloudDevice.id;
        deviceAddress = cloudDevice.address;
        matchingDevice = cloudDevice;
      }
      else if (cloudDevice.description === description) {
        deviceId = cloudDevice.id;
        deviceAddress = cloudDevice.address;
        matchingDevice = cloudDevice;
      }
    }


    // this method will clean up any devices that are in our local database but not in the cloud. Cloud is leading.
    // It will also resolve the promise so the sync can continue.
    let resolveAndCleanup = () => {
      // cleanup
      let deleteActions = [];
      let cloudDeviceIdList = {};
      for (let i = 0; i < cloudDevices.length; i++) {
        cloudDeviceIdList[cloudDevices[i].id] = true;
      }
      let localDeviceIdList = Object.keys(store.getState().devices);
      for (let i = 0; i < localDeviceIdList.length; i++) {
        if (cloudDeviceIdList[localDeviceIdList[i]] === undefined) {
          deleteActions.push({type: 'REMOVE_DEVICE', deviceId: localDeviceIdList[i]});
        }
      }
      if (deleteActions.length > 0) {
        LOG.cloud("REMOVING ", deleteActions.length, " devices since they are not in the cloud anymore");
        store.batchDispatch(deleteActions);
      }

      resolve();
    };

    if (deviceId === undefined) {
      let newDevice = null;
      LOG.info("Sync: Create new device in cloud", name, address, description);
      let deviceInfo = {
        name:name,
        address:address,
        description: description,
      };
      if (state.user.uploadDeviceDetails) {
        deviceInfo["os"] = os;
        deviceInfo["deviceType"] = deviceType;
        deviceInfo["userAgent"] = userAgent;
        deviceInfo["model"] = model;
        deviceInfo["locale"] = locale;
      }
      CLOUD.createDevice(deviceInfo)
        .then((device) => {
          newDevice = device;
          return CLOUD.forDevice(device.id).createInstallation({
            deviceType: Platform.OS,
          })
        })
        .then((installation) => {
          actions.push({
            type: 'ADD_INSTALLATION',
            installationId: installation.id,
            data: {deviceToken: null}
          });

          actions.push({
            type: 'ADD_DEVICE',
            deviceId: newDevice.id,
            data: {
              name: name,
              address: address,
              description: description,
              os: os,
              model: model,
              deviceType: deviceType,
              userAgent: userAgent,
              locale: locale,
              installationId: installation.id
            }
          });

          // We now push the location of ourselves to the cloud.
          return updateUserLocationInCloud(state, newDevice.id);
        })
        .then(resolveAndCleanup)
        .catch(reject)
    }
    else if (state.devices[deviceId] === undefined) {
      LOG.info("Sync: User device found in cloud, updating local.");
      let installationId = getInstallationIdFromDevice(matchingDevice.installations);

      // add the device from the cloud to the redux database
      actions.push({
        type: 'ADD_DEVICE',
        deviceId: deviceId,
        data: {
          name: name,
          address: deviceAddress,
          description: description,
          os: os,
          model: model,
          deviceType: deviceType,
          userAgent: userAgent,
          locale: locale,
          installationId: installationId,
          tapToToggleCalibration: matchingDevice.tapToToggleCalibration,
          hubFunction: matchingDevice.hubFunction,
        }
      });

      // update our unique identifier to match the new device.
      store.dispatch({
        type: 'SET_APP_IDENTIFIER',
        data: {appIdentifier: deviceAddress}
      });

      verifyInstallation(state, deviceId, installationId, actions)
        .then(resolveAndCleanup)
        .catch(reject);
    }
    else {
      let installationId = getInstallationIdFromDevice(matchingDevice.installations);

      // if the device is known under a different number in the cloud, we update our local identifier
      if (deviceAddress !== address) {
        store.dispatch({
          type: 'SET_APP_IDENTIFIER',
          data: {appIdentifier: deviceAddress}
        });
      }
      // Old bug caused the local db to have a device address of null. This should fix that.
      if (state.devices[deviceId].address !== deviceAddress) {
        LOG.info("Sync: update address to", deviceAddress);
        actions.push({
          type:"UPDATE_DEVICE_CONFIG",
          deviceId: deviceId,
          data:{
            name: name,
            address: deviceAddress,
            description: description,
            os: os,
            model: model,
            deviceType: deviceType,
            userAgent: userAgent,
            installationId: installationId,
            hubFunction: matchingDevice.hubFunction,
            locale: locale,
          }
        });

        // if we use this device as a hub, make sure we request permission for notifications.
        LOG.info("Sync: Requesting notification permissions during updating of the device.");
        NotificationHandler.request();
      }

      // if the tap to toggle calibration is available and different from what we have stored, update it.
      if (matchingDevice.tapToToggleCalibration && state.devices[deviceId].tapToToggleCalibration === null) {
        store.dispatch({
          type: 'SET_TAP_TO_TOGGLE_CALIBRATION',
          deviceId: deviceId,
          data: {
            tapToToggleCalibration: matchingDevice.tapToToggleCalibration
          }
        })
      }

      LOG.info("Sync: User device found in cloud, updating installation: ", installationId);
      verifyInstallation(state, deviceId, installationId, actions)
        .then(() => {
          LOG.info("Sync: User device found in cloud, updating location.");
          return updateUserLocationInCloud(state, deviceId)
        })
        .then(resolveAndCleanup)
        .catch(reject);
    }
  });
};



const verifyInstallation = function(state, deviceId, installationId, actions) {
  if (installationId) {
    return CLOUD.getInstallation(installationId)
      .then((installation) => {
        actions.push({
          type: 'ADD_INSTALLATION',
          installationId: installation.id,
          data: {deviceToken: installation.deviceToken}
        });
      })
  }
  else if (deviceId && state && state.devices && state.devices[deviceId] && state.devices[deviceId].installationId === null) {
    return CLOUD.forDevice(deviceId).createInstallation({
      deviceType: Platform.OS,
    })
      .then((installation) => {
        actions.push({
          type: 'ADD_INSTALLATION',
          installationId: installation.id,
          data: {deviceToken: null}
        });
        actions.push({
          type: 'UPDATE_DEVICE_CONFIG',
          deviceId: deviceId,
          data: {installationId: installation.id}
        });
      })
  }
  else {
    return new Promise((resolve, reject) => { resolve(); });
  }
};



const getInstallationIdFromDevice = function(installations) {
  if (installations && Array.isArray(installations) && installations.length > 0) {
    for (let i = 0; i < installations.length; i++) {
      if (installations[i].appName === APP_NAME) {
        return installations[i].id;
      }
    }
  }
  return null;
};



const updateUserLocationInCloud = function(state, deviceId) {
  return new Promise((resolve, reject) => {
    if (state.user.uploadLocation === true) {
      if (state.user.userId) {
        let userLocation = findUserLocation(state, state.user.userId);

        CLOUD.forDevice(deviceId).updateDeviceLocation(userLocation.locationId)
          .then(resolve)
          .catch(reject)
      }
      else {
        resolve();
      }
    }
    else {
      resolve();
    }
  });
};



const findUserLocation = function(state, userId) {
  let presentSphereId = null;
  let presentLocationId = null;

  // first we determine in which sphere we are:
  let sphereIds = Object.keys(state.spheres);
  sphereIds.forEach((sphereId) => {
    if (state.spheres[sphereId].config.present === true) {
      presentSphereId = sphereId;
    }
  });

  // if the user is in a sphere, search for his location.
  if (presentSphereId) {
    let locationIds = Object.keys(state.spheres[presentSphereId].locations);
    locationIds.forEach((locationId) => {
      let location = state.spheres[presentSphereId].locations[locationId];
      let userIndex = location.presentUsers.indexOf(userId);
      if (userIndex !== -1) {
        presentLocationId = locationId;
      }
    });
  }

  return { sphereId: presentSphereId, locationId: presentLocationId };
};