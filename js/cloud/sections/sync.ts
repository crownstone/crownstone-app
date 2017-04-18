import { CLOUD } from '../cloudAPI'
import { LOG } from '../../logging/Log'
import { Util } from '../../util/Util'
import { Platform } from 'react-native'

/**
 * We claim the cloud is leading for the availability of items.
 * @param store
 * @returns {Promise.<TResult>|*}
 */
export const sync = {

  sync: function (store, background = true) {
    let state = store.getState();
    let actions = [];
    let options = { background: background };

    if (!state.user.userId) {
      // do not sync if we're not logged in
      return;
    }

    LOG.cloud("Start Syncing");

    // set the authentication tokens
    let userId = state.user.userId;
    let accessToken = state.user.accessToken;
    CLOUD.setAccess(accessToken);
    CLOUD.setUserId(userId);

    return syncDown( userId, options )
      .then((data: any) => {
        let cloudData = syncSpheres(store, actions, data.spheres, data.spheresData);
        let deletedSphere = syncCleanupLocal(store, actions, cloudData);
        syncKeys(actions, data.keys);
        syncDevices(store, actions, data.devices)
          .then(() => {
            LOG.info("SYNC Dispatching ", actions.length, " actions!");
            actions.forEach((action) => {
              action.triggeredBySync = true;
            });

            if (actions.length > 0) {
              store.batchDispatch(actions);
            }

            this.events.emit("CloudSyncComplete");

            if (cloudData.addedSphere === true || deletedSphere === true) {
              this.events.emit("CloudSyncComplete_spheresChanged");
            }
          })
          .catch((err) => {
            LOG.error(err);
          })
      })
  }
};

const syncDown = function (userId, options) {
  return new Promise((resolve, reject) => {
    let cloudSpheres = [];
    let cloudSpheresData = {};
    let cloudKeys = [];
    let cloudDevices = [];

    let syncPromises = [];

    syncPromises.push(
      CLOUD.getKeys(options)
        .then((data) => {
          cloudKeys = data;
        })
    );
    syncPromises.push(
      CLOUD.forUser(userId).getDevices(options)
        .then((data) => {
          cloudDevices = data;
        })
    );
    syncPromises.push(
      CLOUD.getSpheres(options)
        .then((sphereData) => {
          let sphereDataPromises = [];
          sphereData.forEach((sphere) => {
            cloudSpheres.push(sphere);

            // download all data from the cloud to the phone
            sphereDataPromises.push(CLOUD.forSphere(sphere.id).getSphereData(userId, options)
              .then((result) => {
                cloudSpheresData[sphere.id] = result;
              })
            );
          });
          return Promise.all(sphereDataPromises);
        })
    );

    Promise.all(syncPromises)
      .then(() => {
        resolve({keys: cloudKeys, spheres: cloudSpheres, spheresData: cloudSpheresData, devices: cloudDevices})
      })
      .catch((err) => {
        reject(err);
      })
  });
};

const getTimeDifference = function(localVersion, cloudVersion) {
  return new Date(localVersion.updatedAt).valueOf() - new Date(cloudVersion.updatedAt).valueOf();
};


const syncCleanupLocal = function(store, actions, cloudData) {
  const state = store.getState();
  let sphereIds = Object.keys(state.spheres);
  let deletedSphere = false;

  sphereIds.forEach((sphereId) => {
    if (cloudData.cloudSphereIds[sphereId] === undefined) {
      // we are going to remove this sphere, if it is active we first deactivate it.
      if (state.app.activeSphere == sphereId) {
        store.dispatch({type: 'CLEAR_ACTIVE_SPHERE'});
      }
      actions.push({type: 'REMOVE_SPHERE', sphereId: sphereId});
      deletedSphere = true;
    }
    else {
      // if the sphere also exists in the cloud, check if its member need deletion
      let sphere = state.spheres[sphereId];
      let locationIds = Object.keys(sphere.locations);
      let stoneIds = Object.keys(sphere.stones);
      let applianceIds = Object.keys(sphere.appliances);
      let sphereUserIds = Object.keys(sphere.users);

      // cleanup locations
      locationIds.forEach((locationId) => {
        if (cloudData.cloudLocationIds[locationId] === undefined) {
          actions.push({type: 'REMOVE_LOCATION', sphereId: sphereId, locationId: locationId});
        }
      });

      // cleanup stones
      stoneIds.forEach((stoneId) => {
        if (cloudData.cloudStoneIds[stoneId] === undefined) {
          actions.push({type: 'REMOVE_STONE', sphereId: sphereId, stoneId: stoneId});
        }
      });

      // cleanup appliances
      applianceIds.forEach((applianceId) => {
        if (cloudData.cloudApplianceIds[applianceId] === undefined) {
          actions.push({type: 'REMOVE_APPLIANCE', sphereId: sphereId, applianceId: applianceId});
        }
      });

      // cleanup sphere users
      sphereUserIds.forEach((userId) => {
        if (cloudData.cloudSphereUserIds[sphereId][userId] === undefined) {
          actions.push({type: 'REMOVE_SPHERE_USER', sphereId: sphereId, userId: userId});
        }
      });

    }
  });

  return deletedSphere;
};

const syncSpheres = function(store, actions, spheres, spheresData) {
  let cloudSphereUserIds = {};
  let cloudSphereIds = {};
  let cloudStoneIds = {};
  let cloudLocationIds = {};
  let cloudApplianceIds = {};
  let addedSphere = false;

  LOG.cloud("SyncSpheres", spheresData);

  // get the state here so we did not have to wait with an old state on the down sync.
  const state = store.getState();
  spheres.forEach((sphere) => {
    // put id in map so we can easily find it again
    cloudSphereIds[sphere.id] = true;
    cloudSphereUserIds[sphere.id] = {};

    // local reference to this sphere in our redux database.
    let sphereInState = state.spheres[sphere.id];

    // check if we are an admin in this Sphere.
    let adminInThisSphere = false;

    /**
     * Sync the sphere from the cloud to the database
     */
    if (sphereInState === undefined) {
      addedSphere = true;
      actions.push({
        type:'ADD_SPHERE',
        sphereId: sphere.id,
        data:{
          name: sphere.name,
          iBeaconUUID: sphere.uuid,
          meshAccessAddress: sphere.meshAccessAddress,
          aiName: sphere.aiName,
          aiSex: sphere.aiSex,
          exitDelay: sphere.exitDelay || 120,
          latitude: sphere.gpsLocation && sphere.gpsLocation.lat,
          longitude: sphere.gpsLocation && sphere.gpsLocation.lng
        }
      });
    }
    else if (getTimeDifference(sphereInState.config, sphere) < 0) {
      actions.push({
        type: 'UPDATE_SPHERE_CONFIG',
        sphereId: sphere.id,
        data: {
          name: sphere.name,
          iBeaconUUID: sphere.uuid,
          meshAccessAddress: sphere.meshAccessAddress,
          aiName: sphere.aiName,
          aiSex: sphere.aiSex,
          exitDelay: sphere.exitDelay || 120,
          latitude: sphere.gpsLocation && sphere.gpsLocation.lat,
          longitude: sphere.gpsLocation && sphere.gpsLocation.lng
        }});
      adminInThisSphere = sphereInState.users[state.user.userId] ? sphereInState.users[state.user.userId].accessLevel === 'admin' : false;
    }
    else {
      adminInThisSphere = sphereInState.users[state.user.userId] ? sphereInState.users[state.user.userId].accessLevel === 'admin' : false;
    }

    /**
     * Sync the Admins, members and guests from the cloud to the database.
     */
    // sync admins
    Object.keys(spheresData[sphere.id].admins).forEach((userId) => {
      cloudSphereUserIds[sphere.id][userId] = true;
      let user = spheresData[sphere.id].admins[userId];
      syncSphereUser(actions, sphere, sphereInState, userId, user, state, 'admin');
    });
    // sync members
    Object.keys(spheresData[sphere.id].members).forEach((userId) => {
      cloudSphereUserIds[sphere.id][userId] = true;
      let user = spheresData[sphere.id].members[userId];
      syncSphereUser(actions, sphere, sphereInState, userId, user, state, 'member');
    });
    // sync guests
    Object.keys(spheresData[sphere.id].guests).forEach((userId) => {
      cloudSphereUserIds[sphere.id][userId] = true;
      let user = spheresData[sphere.id].guests[userId];
      syncSphereUser(actions, sphere, sphereInState, userId, user, state, 'guest');
    });
    // sync pending invites
    spheresData[sphere.id].pendingInvites.forEach((invite) => {
      cloudSphereUserIds[sphere.id][invite.email] = true;
      if (sphereInState !== undefined && sphereInState.users[invite.email] === undefined) {
        actions.push({
          type: 'ADD_SPHERE_USER',
          sphereId: sphere.id,
          userId: invite.email,
          data: {
            email: invite.email,
            invitationPending: true,
            accessLevel: invite.role
          }
        });
      }
    });


    /**
     * Sync the locations from the cloud to the database.
     */
    spheresData[sphere.id].locations.forEach((location_from_cloud) => {
      cloudLocationIds[location_from_cloud.id] = true;
      let locationInState = undefined;
      if (sphereInState !== undefined && sphereInState.locations[location_from_cloud.id] !== undefined) {
        locationInState = sphereInState.locations[location_from_cloud.id];
        if (getTimeDifference(sphereInState.locations[location_from_cloud.id].config, location_from_cloud) < 0) {
          actions.push({
            type: 'UPDATE_LOCATION_CONFIG',
            sphereId: sphere.id,
            locationId: location_from_cloud.id,
            data: {name: location_from_cloud.name, icon: location_from_cloud.icon, updatedAt: location_from_cloud.updatedAt}
          });
        }
        else if (getTimeDifference(sphereInState.locations[location_from_cloud.id].config, location_from_cloud) > 0) {
          // update cloud since our data is newer!
          let data = {
            name: locationInState.config.name,
            icon: locationInState.config.icon,
            id: location_from_cloud.id,
            sphereId: sphere.id,
            updatedAt: locationInState.config.updatedAt,
          };
          LOG.info("@SYNC: Updating location", location_from_cloud.id, " in Cloud since our data is newer! remote: ", new Date(location_from_cloud.updatedAt).valueOf(), "local:", locationInState.config.updatedAt, 'diff:', locationInState.config.updatedAt - (new Date(location_from_cloud.updatedAt).valueOf()));
          CLOUD.updateLocation(location_from_cloud.id, data).catch(() => {});
        }
      }
      else {
        actions.push({
          type: 'ADD_LOCATION',
          sphereId: sphere.id,
          locationId: location_from_cloud.id,
          data: {name: location_from_cloud.name, icon: location_from_cloud.icon, updatedAt: location_from_cloud.updatedAt}
        });
      }

      // put the present users from the cloud into the location.
      let peopleInCloudLocations = {};
      if (Array.isArray(location_from_cloud.presentPeople) && location_from_cloud.presentPeople.length > 0) {
        location_from_cloud.presentPeople.forEach((person) => {
          peopleInCloudLocations[person.Id] = true;
          // check if the person exists in our sphere and if we are not that person.
          if (person.id !== state.user.userId && cloudSphereUserIds[person.id] === true) {
            actions.push({type: 'USER_ENTER_LOCATION', sphereId: state.app.activeSphere, locationId: location_from_cloud.id, data: {userId: person.id}});
          }
        });
      }

      // remove the users from this location that are not in the cloud and that are not the current user
      if (locationInState) {
        locationInState.presentUsers.forEach((userId) => {
          if (peopleInCloudLocations[userId] === undefined && userId !== state.user.userId) {
            actions.push({type: 'USER_EXIT_LOCATION', sphereId: state.app.activeSphere, locationId: location_from_cloud.id, data: {userId: userId}});
          }
        })
      }

    });

    /**
     * Sync the stones from the cloud to the database.
     */
    spheresData[sphere.id].stones.forEach((stone_from_cloud) => { // underscores so its visually different from stoneInState
      cloudStoneIds[stone_from_cloud.id] = true; // mark this ID as "yes it is in the cloud"

      // determine the linked location id
      let locationLinkId = null;
      if (stone_from_cloud.locations.length > 0 && stone_from_cloud.locations[0]) {
        locationLinkId = stone_from_cloud.locations[0].id;
      }
      else {
        locationLinkId = null;
      }
      if (sphereInState !== undefined && sphereInState.stones[stone_from_cloud.id] !== undefined) {
        if (getTimeDifference(sphereInState.stones[stone_from_cloud.id].config, stone_from_cloud) < 0) {
          actions.push({
            type:    'UPDATE_STONE_CONFIG',
            sphereId: sphere.id,
            stoneId:  stone_from_cloud.id,
            data: {
              applianceId:     stone_from_cloud.applianceId,
              crownstoneId:    stone_from_cloud.uid,
              icon:            stone_from_cloud.icon,
              firmwareVersion: stone_from_cloud.firmwareVersion,
              iBeaconMajor:    stone_from_cloud.major,
              iBeaconMinor:    stone_from_cloud.minor,
              locationId:      locationLinkId,
              meshNetworkId:   stone_from_cloud.meshNetworkId,
              macAddress:      stone_from_cloud.address,
              name:            stone_from_cloud.name,
              onlyOnWhenDark:  stone_from_cloud.onlyOnWhenDark,
              touchToToggle:   stone_from_cloud.touchToToggle,
              type:            stone_from_cloud.type,
              updatedAt:       stone_from_cloud.updatedAt,
            }
          });
        }
        else if (getTimeDifference(sphereInState.stones[stone_from_cloud.id].config, stone_from_cloud) > 0) {
          // update cloud since our data is newer!
          let stoneInState = sphereInState.stones[stone_from_cloud.id];
          let data = {
            applianceId:     stoneInState.config.applianceId,
            address:         stoneInState.config.macAddress,
            icon:            stoneInState.config.icon,
            id:              stone_from_cloud.id,
            firmwareVersion: stoneInState.firmwareVersion,
            meshNetworkId:   stoneInState.meshNetworkId,
            major:           stoneInState.config.iBeaconMajor,
            minor:           stoneInState.config.iBeaconMinor,
            name:            stoneInState.config.name,
            onlyOnWhenDark:  stoneInState.config.onlyOnWhenDark,
            sphereId:        sphere.id,
            touchToToggle:   stoneInState.config.touchToToggle,
            type:            stoneInState.config.type,
            uid:             stoneInState.config.crownstoneId,
            updatedAt:       stoneInState.config.updatedAt,
          };

          // only admins get to update the behaviour
          if (adminInThisSphere === true) {
            data["json"] = JSON.stringify(stoneInState.behaviour);
          }
          LOG.info("@SYNC: Updating Stone", stone_from_cloud.id, " in Cloud since our data is newer! remote: ", new Date(stone_from_cloud.updatedAt).valueOf(), "local:", stoneInState.config.updatedAt, 'diff:', stoneInState.config.updatedAt - (new Date(stone_from_cloud.updatedAt).valueOf()));
          CLOUD.forSphere(sphere.id).updateStone(stone_from_cloud.id, data).catch(() => {});

          // check if we have to sync the locations:
          if (stoneInState.config.locationId !== locationLinkId) {
            // if the one in the cloud is null, we only create a link
            if (locationLinkId === null && stoneInState.config.locationId !== null) {
              CLOUD.forStone(stone_from_cloud.id).updateStoneLocationLink(stoneInState.config.locationId, sphere.id, stoneInState.config.updatedAt, true).catch(() => {});
            }
            else {
              CLOUD.forStone(stone_from_cloud.id).deleteStoneLocationLink(locationLinkId,  sphere.id, stoneInState.config.updatedAt, true)
                .then(() => {
                  if (stoneInState.config.locationId !== null) {
                    CLOUD.forStone(stone_from_cloud.id).updateStoneLocationLink(stoneInState.config.locationId, sphere.id,  stoneInState.config.updatedAt, true);
                  }
                }).catch(() => {})
            }
          }
        }
      }
      else {
        actions.push({
          type: 'ADD_STONE',
          sphereId: sphere.id,
          stoneId: stone_from_cloud.id,
          data: {
            applianceId:     stone_from_cloud.applianceId,
            crownstoneId:    stone_from_cloud.uid,
            icon:            stone_from_cloud.icon,
            firmwareVersion: stone_from_cloud.firmwareVersion,
            iBeaconMajor:    stone_from_cloud.major,
            iBeaconMinor:    stone_from_cloud.minor,
            locationId:      locationLinkId,
            meshNetworkId:   stone_from_cloud.meshNetworkId,
            macAddress:      stone_from_cloud.address,
            name:            stone_from_cloud.name,
            onlyOnWhenDark:  stone_from_cloud.onlyOnWhenDark,
            touchToToggle:   stone_from_cloud.touchToToggle,
            type:            stone_from_cloud.type,
            updatedAt:       stone_from_cloud.updatedAt,
          }
        });

        // we only download the behaviour the first time we add the stone.
        if (stone_from_cloud.json !== undefined) {
          let behaviour = JSON.parse(stone_from_cloud.json);

          if (behaviour.onHomeEnter)
            actions.push({ type: 'UPDATE_STONE_BEHAVIOUR_FOR_onHomeEnter', sphereId: sphere.id, stoneId: stone_from_cloud.id, data: behaviour.onHomeEnter });
          if (behaviour.onHomeExit)
            actions.push({ type: 'UPDATE_STONE_BEHAVIOUR_FOR_onHomeExit',  sphereId: sphere.id, stoneId: stone_from_cloud.id, data: behaviour.onHomeExit });
          if (behaviour.onRoomEnter)
            actions.push({ type: 'UPDATE_STONE_BEHAVIOUR_FOR_onRoomEnter', sphereId: sphere.id, stoneId: stone_from_cloud.id, data: behaviour.onRoomEnter });
          if (behaviour.onRoomExit)
            actions.push({ type: 'UPDATE_STONE_BEHAVIOUR_FOR_onRoomExit',  sphereId: sphere.id, stoneId: stone_from_cloud.id, data: behaviour.onRoomExit });
          if (behaviour.onNear)
            actions.push({ type: 'UPDATE_STONE_BEHAVIOUR_FOR_onNear', sphereId: sphere.id, stoneId: stone_from_cloud.id, data: behaviour.onNear });
          if (behaviour.onAway)
            actions.push({ type: 'UPDATE_STONE_BEHAVIOUR_FOR_onAway', sphereId: sphere.id, stoneId: stone_from_cloud.id, data: behaviour.onAway });
        }
      }
    });


    /**
     * Sync the appliances from the cloud to the database.
     */
    spheresData[sphere.id].appliances.forEach((appliance_from_cloud) => {
      cloudApplianceIds[appliance_from_cloud.id] = true; // mark this ID as "yes it is in the cloud"
      // check if we have to update of add this appliance
      if (sphereInState !== undefined && sphereInState.appliances[appliance_from_cloud.id] !== undefined) {
        if (getTimeDifference(sphereInState.appliances[appliance_from_cloud.id].config, appliance_from_cloud) < 0) {
          actions.push({
            type: 'UPDATE_APPLIANCE_CONFIG',
            sphereId: sphere.id,
            applianceId: appliance_from_cloud.id,
            data: {name: appliance_from_cloud.name, icon: appliance_from_cloud.icon, updatedAt: appliance_from_cloud.updatedAt}
          });
        }
        else if (getTimeDifference(sphereInState.appliances[appliance_from_cloud.id].config, appliance_from_cloud) > 0) {
          // update cloud since our data is newer!
          LOG.info("@SYNC: Updating appliance", appliance_from_cloud.id, "in Cloud since our data is newer!");
          let applianceInState = sphereInState.appliances[appliance_from_cloud.id];
          let data = {
            name: applianceInState.config.name,
            icon: applianceInState.config.icon,
            id: appliance_from_cloud.id,
            onlyOnWhenDark: appliance_from_cloud.onlyOnWhenDark,
            sphereId: sphere.id,
            updatedAt: applianceInState.config.updatedAt,
          };

          // only admins get to update the behaviour
          if (adminInThisSphere === true) {
            data["json"] = JSON.stringify(applianceInState.behaviour);
          }

          LOG.info("@SYNC: Updating Appliance", appliance_from_cloud.id, " in Cloud since our data is newer! remote: ", new Date(appliance_from_cloud.updatedAt).valueOf(), "local:", applianceInState.config.updatedAt, 'diff:', applianceInState.config.updatedAt - (new Date(appliance_from_cloud.updatedAt).valueOf()));
          CLOUD.forSphere(sphere.id).updateAppliance(appliance_from_cloud.id, data).catch(() => {});
        }
      }
      else {
        actions.push({
          type: 'ADD_APPLIANCE',
          sphereId: sphere.id,
          onlyOnWhenDark: appliance_from_cloud.onlyOnWhenDark,
          applianceId: appliance_from_cloud.id,
          data: {name: appliance_from_cloud.name, icon: appliance_from_cloud.icon, updatedAt: appliance_from_cloud.updatedAt}
        });

        // we only download the behaviour the first time we add the stone.
        if (appliance_from_cloud.json !== undefined) {
          let behaviour = JSON.parse(appliance_from_cloud.json);

          if (behaviour.onHomeEnter)
            actions.push({ type: 'UPDATE_APPLIANCE_BEHAVIOUR_FOR_onHomeEnter', sphereId: sphere.id, applianceId: appliance_from_cloud.id, data: behaviour.onHomeEnter });
          if (behaviour.onHomeExit)
            actions.push({ type: 'UPDATE_APPLIANCE_BEHAVIOUR_FOR_onHomeExit', sphereId: sphere.id, applianceId: appliance_from_cloud.id, data: behaviour.onHomeExit });
          if (behaviour.onRoomEnter)
            actions.push({ type: 'UPDATE_APPLIANCE_BEHAVIOUR_FOR_onRoomEnter', sphereId: sphere.id, applianceId: appliance_from_cloud.id, data: behaviour.onRoomEnter });
          if (behaviour.onRoomExit)
            actions.push({ type: 'UPDATE_APPLIANCE_BEHAVIOUR_FOR_onRoomExit', sphereId: sphere.id, applianceId: appliance_from_cloud.id, data: behaviour.onRoomExit });
          if (behaviour.onNear)
            actions.push({ type: 'UPDATE_APPLIANCE_BEHAVIOUR_FOR_onNear', sphereId: sphere.id, applianceId: appliance_from_cloud.id, data: behaviour.onNear });
          if (behaviour.onAway)
            actions.push({ type: 'UPDATE_APPLIANCE_BEHAVIOUR_FOR_onAway', sphereId: sphere.id, applianceId: appliance_from_cloud.id, data: behaviour.onAway });
        }
      }
    });
  });

  return {
    cloudSphereUserIds,
    cloudSphereIds,
    cloudStoneIds,
    cloudLocationIds,
    cloudApplianceIds,
    addedSphere
  };
};

/**
 * Sync devices
 */
const syncDevices = function(store, actions, cloudDevices) {
  return new Promise((resolve, reject) => {
    const state = store.getState();

    let {name, address, description} = Util.data.getDeviceSpecs(state);

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
      CLOUD.createDevice({name:name, address:address, description: description})
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
            data: {name: name, address: address, description: description, installationId: installation.id}
          });

          // We now push the location of ourselves to the cloud.
          return updateUserLocationInCloud(state, deviceId);
        })
        .then(resolveAndCleanup)
        .catch(reject)
    }
    else if (state.devices[deviceId] === undefined) {
      LOG.info("Sync: User device found in cloud, updating local.");
      // add the device from the cloud to the redux database
      actions.push({
        type: 'ADD_DEVICE',
        deviceId: deviceId,
        data: {name: name, address: deviceAddress, description: description}
      });

      // update our unique identifier to match the new device.
      store.dispatch({
        type: 'SET_APP_IDENTIFIER',
        data: {appIdentifier: deviceAddress}
      });

      resolveAndCleanup();
    }
    else {
      // if the device is known under a different number in the cloud, we update our local identifier
      if (deviceAddress !== address) {
        store.dispatch({
          type: 'SET_APP_IDENTIFIER',
          data: {appIdentifier: deviceAddress}
        });
      }
      // Old bug caused the local db to have a device address of null. This should fix that.
      if (state.devices[deviceId].address !== deviceAddress) {
        LOG.info("update address to", deviceAddress);
        actions.push({
          type:"UPDATE_DEVICE_CONFIG",
          deviceId: deviceId,
          data:{address:deviceAddress}
        });
      }
      // if the tap to toggle calibration is available and different from what we have stored, update it.
      if (matchingDevice.tapToToggleCalibration && state.devices[deviceId].tapToToggleCalibration === null) {
        store.dispatch({
          type: 'SET_TAP_TO_TOGGLE_CALIBRATION',
          deviceId: deviceId,
          data: {tapToToggleCalibration: matchingDevice.tapToToggleCalibration}
        })
      }

      LOG.info("Sync: User device found in cloud, updating location.");
      updateUserLocationInCloud(state, deviceId)
        .then(resolveAndCleanup)
        .catch(reject);
    }
  });
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

const syncSphereUser = function(actions, sphere, sphereInState, userId, user, state, accessLevel) {
  if (sphereInState !== undefined && sphereInState.users[userId] !== undefined) {
    // since we do not get a profile picture via the same way as the rest of the users, we alter the data to contain our own pic.
    let selfId = state.user.userId;
    if (userId == selfId) {
      user.picture = state.user.picture;
    }

    if (getTimeDifference(sphereInState.users[userId], user) > 0) {
      actions.push({
        type: 'UPDATE_SPHERE_USER',
        sphereId: sphere.id,
        userId: user.id,
        data: {
          picture: user.picture,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          accessLevel: accessLevel
        }
      });
    }
  }
  else {
    actions.push({
      type: 'ADD_SPHERE_USER',
      sphereId: sphere.id,
      userId: user.id,
      data: {
        picture: user.picture,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        accessLevel: accessLevel
      }
    });
  }
};

const syncKeys = function(actions, keys) {
  keys.forEach((keySet) => {
    actions.push({type:'SET_SPHERE_KEYS', sphereId: keySet.sphereId, data:{
      adminKey:  keySet.keys.owner  || keySet.keys.admin || null,
      memberKey: keySet.keys.member || null,
      guestKey:  keySet.keys.guest  || null
    }})
  })
};

