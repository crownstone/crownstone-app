/**
 * Sync schedules in this stone.
 * @param actions
 * @param transferPromises
 * @param state
 * @param cloudSpheresData
 * @param sphere
 * @param stone_from_cloud
 * @param cloudScheduleIds
 * @param sphereInState
 */

import { Platform } from 'react-native'
import {Util} from "../../../../util/Util";
import {SyncingBase} from "./SyncingBase";
import {CLOUD} from "../../../cloudAPI";
import {LOG} from "../../../../logging/Log";
import {APP_NAME} from "../../../../ExternalConfig";
import { base_core } from "../../../../Base_core";
import { BluenetPromiseWrapper } from "../../../../native/libInterface/BluenetPromise";
import DeviceInfo from "react-native-device-info";


interface matchingSpecs {
  id:            string,
  address:       string,
  deviceInCloud: any,
  uid:           number,
}


export class DeviceSyncer extends SyncingBase {
  userId: string;
  hasAllTrackingNumbers = false;
  currentDeviceId = null;


  download() {
    return CLOUD.forUser(this.userId).getDevices()
  }


  sync(state) {
    this.userId = state.user.userId;
    this.hasAllTrackingNumbers = false;
    return this.download()
      .then((devicesInCloud) => {
        this._constructLocalIdMap();

        this.syncDown(state, state.devices, devicesInCloud);
        this.syncUp(state, state.devices, devicesInCloud);

        return Promise.all(this.transferPromises);
      })
      .then(() => {
        // check if we have a tracking token for all spheres.
        // - if not, check if we can use dynamic background broadcasts
        if (this.hasAllTrackingNumbers === false) {
          return this.handleTrackingNumbers(state);
        }
      })
  }


  handleTrackingNumbers(state) {
    return BluenetPromiseWrapper.canUseDynamicBackgroundBroadcasts()
      .then((canUseDynamicBackground) => {
        if (canUseDynamicBackground === true) {
          // we do not have to use tracking numbers since the phone can broadcast it's own data in the background.
          return;
        }

        // get tracking numbers! Every sphere will have it's own tracking number for this device.
        let transferPromises = [];
        let sphereIds = Object.keys(this.globalLocalIdMap.spheres);
        let localDevice = state.devices[this.currentDeviceId];
        if (localDevice) {
          for (let i = 0; i < sphereIds.length; i++) {
            let sphereId = sphereIds[i];
            if (localDevice.trackingNumbers === undefined || localDevice.trackingNumbers[sphereId] === undefined) {
              transferPromises.push(CLOUD.getTrackingNumberInSphere(sphereId)
                .then((trackingNumber) => {
                  this.actions.push({
                    type: "SET_TRACKING_NUMBER",
                    deviceId: this.currentDeviceId,
                    data: {
                      sphereId: sphereId,
                      trackingNumber: Number(trackingNumber)
                    }
                  })
                })
                .catch((err) => {
                  console.log("Err getting trackingNumber", err);
                }))
            }
          }
        }
        return Promise.all(transferPromises);
      })
  }

  syncUp(state, devicesInState, devicesInCloud) {
    // cleanup. remove local devices that do not exist in the cloud.
    let cloudDeviceIdList = {};
    for (let i = 0; i < devicesInCloud.length; i++) {
      if (devicesInCloud[i]["DELETED"] !== true) {
        cloudDeviceIdList[devicesInCloud[i].id] = true;
      }
    }

    let deviceIds = Object.keys(devicesInState);
    for (let i = 0; i < deviceIds.length; i++) {
      let device = devicesInState[deviceIds[i]];
      if (cloudDeviceIdList[device.cloudId] === undefined) {
        this.actions.push({type: 'REMOVE_DEVICE', deviceId: deviceIds[i]});
      }
    }
  }


  syncDown(state, devicesInState, devicesInCloud) {
    // get local device Info:
    let specs = Util.data.getDeviceSpecs(state);

    // find matching local device
    let matchingSpecs = this._findMatchingDeviceInCloud(specs, devicesInCloud);

    // device is not in the cloud!
    if (matchingSpecs.id === undefined) {
      this._createNewDeviceInCloud(specs, state);
    }
    else if (state.devices[matchingSpecs.id] === undefined) {
      // download device data and store locally.
      this._createNewDeviceLocally(state, specs, matchingSpecs);
      this.globalCloudIdMap.devices[matchingSpecs.id] = matchingSpecs.id;
      this.currentDeviceId = matchingSpecs.id;
    }
    else {
      // this
      this._updateLocalDevice(state, specs, devicesInState[matchingSpecs.id], matchingSpecs);
      this.globalCloudIdMap.devices[matchingSpecs.id] = matchingSpecs.id
      this.currentDeviceId = matchingSpecs.id;
    }
  }


  _getAppVersion() {
    let appVersionArray = DeviceInfo.getReadableVersion().split(".");
    let appVersion = "UNKNOWN";
    if (Array.isArray(appVersionArray) && appVersionArray.length >= 3) {
      appVersion = appVersionArray[0] + '.' + appVersionArray[1] + '.' + appVersionArray[2];
    }
    return appVersion;
  }

  _createNewDeviceInCloud(specs, state) {
    let newDevice = null;
    LOG.info("Sync: Create new device in cloud", specs.name, specs.address, specs.description);
    let deviceInfo = {
      name:        specs.name,
      address:     specs.address,
      description: specs.description,
    };

    deviceInfo["deviceType"] =  specs.deviceType;
    deviceInfo["locale"]     =  specs.locale;

    if (state.user.uploadDeviceDetails) {
      deviceInfo["os"] =          specs.os;
      deviceInfo["userAgent"] =   specs.userAgent;
      deviceInfo["model"] =       specs.model;
    }

    this.transferPromises.push(
      CLOUD.createDevice(deviceInfo)
        .then((device) => {
          newDevice = device;
          return CLOUD.forDevice(device.id).createInstallation({
            developmentApp: base_core.sessionMemory.developmentEnvironment,
            appVersion: this._getAppVersion(),
            deviceType: Platform.OS,
          })
        })
        .then((installation) => {
          this.actions.push({
            type: 'ADD_INSTALLATION',
            installationId: installation.id,
            data: {deviceToken: null}
          });

          this.currentDeviceId = newDevice.id;
          this.actions.push({
            type: 'ADD_DEVICE',
            deviceId: newDevice.id,
            data: {
              name:        specs.name,
              address:     specs.address,
              description: specs.description,
              os:          specs.os,
              model:       specs.model,
              deviceType:  specs.deviceType,
              userAgent:   specs.userAgent,
              locale:      specs.locale,
              installationId: installation.id
            }
          });
          this.globalCloudIdMap.devices[newDevice.id] = newDevice.id;

          // We now push the location of ourselves to the cloud.
          this._updateUserLocationInCloud(state, newDevice.id);
        })
    );
  }

  _updateLocalDevice(state, specs, localDevice, matchingSpecs : matchingSpecs) {
    let installationId = this._getInstallationIdFromDevice(matchingSpecs.deviceInCloud.installations);

    // if the device is known under a different number in the cloud, we update our local identifier
    if (specs.address !== matchingSpecs.address) {
      this.actions.push({
        type: 'SET_APP_IDENTIFIER',
        data: {appIdentifier: matchingSpecs.address}
      });
    }

    // Old bug caused the local db to have a device address of null. This should fix that.
    if (localDevice.address !== matchingSpecs.address) {
      LOG.info("Sync: update address to", matchingSpecs.address);
      this.actions.push({
        type:"UPDATE_DEVICE_CONFIG",
        deviceId: matchingSpecs.id,
        data: {
          name:        specs.name,
          address:     matchingSpecs.address,
          description: specs.description,
          cloudId:     matchingSpecs.id,
          uid:         matchingSpecs.uid,
          os:          specs.os,
          model:       specs.model,
          deviceType:  specs.deviceType,
          userAgent:   specs.userAgent,
          locale:      specs.locale,
        }
      });
    }

    // if our locale and deviceType is different or missing in the cloud, we restore it
    if (specs.locale !== matchingSpecs.deviceInCloud.locale || specs.deviceType !== matchingSpecs.deviceInCloud.deviceType) {
      LOG.info("Sync: Updating cloud device with deviceType and locale.");
      this.transferPromises.push(
        CLOUD.updateDevice(matchingSpecs.id, {
          locale: specs.locale,
          deviceType: specs.deviceType,
        })
      );
    }

    // check if we have stored a tracking number for ALL spheres we are currently in. If not, this information is
    // propagated to the next step which determines if this is required.
    let sphereIds = Object.keys(this.globalLocalIdMap.spheres);
    if (localDevice.trackingNumbers) {
      this.hasAllTrackingNumbers = true;
      for (let i = 0; i < sphereIds.length; i++) {
        if (localDevice.trackingNumbers[sphereIds[i]] === undefined) {
          this.hasAllTrackingNumbers = false;
          break;
        }
      }
    }

    LOG.info("Sync: User device found in cloud, updating installation: ", installationId);
    this._verifyInstallation(state, matchingSpecs.id, installationId);
    this._updateUserLocationInCloud(state, matchingSpecs.id);
  }

  _createNewDeviceLocally(state, specs, matchingSpecs : matchingSpecs) {
    LOG.info("Sync: User device found in cloud, updating local.");
    let installationId = this._getInstallationIdFromDevice(matchingSpecs.deviceInCloud.installations);

    // add the device from the cloud to the redux database
    this.actions.push({
      type: 'ADD_DEVICE',
      deviceId: matchingSpecs.id,
      data: {
        name:         specs.name,
        address:      matchingSpecs.address,
        description:  specs.description,
        os:           specs.os,
        uid:          matchingSpecs.uid,
        model:        specs.model,
        cloudId:      matchingSpecs.id,
        deviceType:   specs.deviceType,
        userAgent:    specs.userAgent,
        locale:       specs.locale,
        installationId: installationId,
        tapToToggleCalibration: matchingSpecs.deviceInCloud.tapToToggleCalibration,
      }
    });

    // update our unique identifier to match the new device.
    this.actions.push({
      type: 'SET_APP_IDENTIFIER',
      data: {appIdentifier: matchingSpecs.address}
    });

    this._verifyInstallation(state, matchingSpecs.id, installationId);
    // We now push the location of ourselves to the cloud.
    this._updateUserLocationInCloud(state, matchingSpecs.id);
  }


  _verifyInstallation(state, deviceId, installationId) {
    let appVersion = this._getAppVersion();
    if (installationId) {
      this.transferPromises.push(CLOUD.getInstallation(installationId)
        .then((installation) => {
          let notificationToken = state.app.notificationToken || state.installations[installationId];
          if (installation.deviceToken !== notificationToken || installation.appVersion !== appVersion) {
            this.transferPromises.push(CLOUD.updateInstallation(installationId, {deviceToken: notificationToken, appVersion: appVersion, }))
          }

          if (!state.installations[installationId]) {
            this.actions.push({
              type: 'ADD_INSTALLATION',
              installationId: installation.id,
              data: { deviceToken: notificationToken }
            });
          }

          // check if we have to update this installation in the cloud.
          if (installation.developmentApp !== base_core.sessionMemory.developmentEnvironment) {
            return CLOUD.updateInstallation(installationId, {developmentApp: base_core.sessionMemory.developmentEnvironment, appVersion: appVersion}).catch(() => {})
          }
        }))
    }
    else if (deviceId && state && state.devices && state.devices[deviceId] && state.devices[deviceId].installationId === null) {
      // we have not installation, create one!

      // check if we have a notification token that we can use.
      let notificationToken = state.app.notificationToken || undefined;

      this.transferPromises.push(
        CLOUD.forDevice(deviceId).createInstallation({ deviceType: Platform.OS, developmentApp: base_core.sessionMemory.developmentEnvironment, appVersion: appVersion, deviceToken: notificationToken })
          .then((installation) => {
            this.actions.push({
              type: 'ADD_INSTALLATION',
              installationId: installation.id,
              data: { deviceToken: notificationToken }
            });
            this.actions.push({
              type: 'UPDATE_DEVICE_CONFIG',
              deviceId: deviceId,
              data: {installationId: installation.id}
            });
          })
      );
    }
  }


  _getCloudLocationId(localId) {
    if (!localId) { return null; }
    return this.globalLocalIdMap.locations[localId];
  }


  _getCloudSphereId(localId) {
    if (!localId) { return null; }
    return this.globalLocalIdMap.spheres[localId];
  }


  _updateUserLocationInCloud(state, deviceId) {
    if (state.user.uploadLocation === true && state.app.indoorLocalizationEnabled === true) {
      if (state.user.userId) {
        let userLocationMap = Util.data.getUserLocations(state, state.user.userId);
        let presentSphereIds = Object.keys(userLocationMap);

        if (presentSphereIds.length === 0 ) {
          this.transferPromises.push(CLOUD.forDevice(deviceId).exitSphere("*").catch((err) => {}));
        }
        else {
          presentSphereIds.forEach((sphereId) => {
            let cloudSphereId = this._getCloudSphereId(sphereId);
            let cloudLocationId = this._getCloudLocationId(userLocationMap[sphereId]);

            if (cloudLocationId === null) {
              this.transferPromises.push( CLOUD.forDevice(deviceId).exitLocation(cloudSphereId,"*").catch((err) => {}) );
              this.transferPromises.push( CLOUD.forDevice(deviceId).inSphere( cloudSphereId).catch((err) => {}) );
            }
            else {
              this.transferPromises.push( CLOUD.forDevice(deviceId).inLocation(cloudSphereId, cloudLocationId).catch((err) => {}) );
            }
          });
        }
      }
    }
  };


  _findMatchingDeviceInCloud(localDeviceSpecs, devicesInCloud) : matchingSpecs {
    let deviceId = undefined;
    let uid = 0;
    let address = localDeviceSpecs.address;
    let matchingDevice = undefined;

    let hasMatchingAddress = false;
    // sort this list so we deterministically get the deviceUID
    devicesInCloud.sort((a,b) => { return new Date(a.updatedAt).valueOf() - new Date(b.updatedAt).valueOf(); })

    for (let i = 0; i < devicesInCloud.length; i++) {
      let cloudDevice = devicesInCloud[i];
      if (cloudDevice.address === localDeviceSpecs.address) {
        if (hasMatchingAddress === false) {
          deviceId = cloudDevice.id;
          matchingDevice = cloudDevice;
          uid = i;
          hasMatchingAddress = true;
        }
        else {
          this.transferPromises.push(CLOUD.deleteDevice(cloudDevice.id));
          devicesInCloud[i]["DELETED"] = true;
        }
      }
      else if (cloudDevice.name === localDeviceSpecs.name && cloudDevice.description === localDeviceSpecs.description) {
        deviceId = cloudDevice.id;
        address = cloudDevice.address;
        matchingDevice = cloudDevice;
        uid = i;
      }
      else if (cloudDevice.description === localDeviceSpecs.description) {
        deviceId = cloudDevice.id;
        address = cloudDevice.address;
        matchingDevice = cloudDevice;
        uid = i;
      }
    }

    return { id: deviceId, address: address, deviceInCloud: matchingDevice, uid: uid };
  }


  _getInstallationIdFromDevice(installations) {
    if (installations && Array.isArray(installations) && installations.length > 0) {
      for (let i = 0; i < installations.length; i++) {
        if (installations[i].appName === APP_NAME) {
          return installations[i].id;
        }
      }
    }
    return null;
  }

}
