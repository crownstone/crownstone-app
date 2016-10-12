import { CLOUD } from '../cloudAPI'
import { LOG, LOGDebug } from '../../logging/Log'

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
    return syncDown( state, options )
      .then((data) => {
        let cloudData = syncSpheres(state, actions, data.spheres, data.spheresData);
        let deletedSphere = syncCleanupLocal(store, state, actions, cloudData);
        syncKeys(actions, data.keys);

        LOG("SYNC Dispatching ", actions.length, " actions!");
        actions.forEach((action) => {
          action.triggeredBySync = true;
        });

        if (actions.length > 0)
          store.batchDispatch(actions);

        this.events.emit("CloudSyncComplete");

        if (cloudData.addedSphere === true || deletedSphere === true) {
          this.events.emit("CloudSyncComplete_spheresChanged");
        }
      })


  }
};

const syncDown = function (state, options) {
  return new Promise((resolve, reject) => {
    let userId = state.user.userId;
    let accessToken = state.user.accessToken;

    CLOUD.setAccess(accessToken);
    CLOUD.setUserId(userId);

    let cloudSpheres = [];
    let cloudSpheresData = {};
    let cloudKeys = [];

    let syncPromises = [];

    syncPromises.push(
      CLOUD.getKeys(options)
        .then((data) => {
          cloudKeys = data;
        }).catch()
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
        }).catch()
    );

    Promise.all(syncPromises)
      .then(() => {
        resolve({keys: cloudKeys, spheres: cloudSpheres, spheresData: cloudSpheresData})
      })
      .catch((err) => {
        reject(err);
      })
  });
};

const getTimeDifference = function(localVersion, cloudVersion) {
  return localVersion.updatedAt - new Date(cloudVersion.updatedAt).valueOf();
};


const syncCleanupLocal = function(store, state, actions, cloudData) {
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
        if (cloudData.cloudSphereMemberIds[sphereId][userId] === undefined) {
          actions.push({type: 'REMOVE_SPHERE_USER', sphereId: sphereId, userId: userId});
        }
      });

    }
  });

  return deletedSphere;
};

const syncSpheres = function(state, actions, spheres, spheresData) {
  let cloudSphereMemberIds = {};
  let cloudSphereIds = {};
  let cloudStoneIds = {};
  let cloudLocationIds = {};
  let cloudApplianceIds = {};
  let addedSphere = false;

  LOGDebug("SyncSpheres", spheresData);

  spheres.forEach((sphere) => {
    // put id in map so we can easily find it again
    cloudSphereIds[sphere.id] = true;
    cloudSphereMemberIds[sphere.id] = {};

    // local reference to this sphere in our redux database.
    let sphereInState = state.spheres[sphere.id];

    // check if we are an admin in this Sphere.
    let adminInThisSphere = sphereInState.users[state.user.userId] ? sphereInState.users[state.user.userId].accessLevel === 'admin' : false;

    // add or update the sphere.
    if (sphereInState === undefined) {
      addedSphere = true;
      actions.push({type:'ADD_SPHERE', sphereId: sphere.id, data:{name: sphere.name, iBeaconUUID: sphere.uuid}});
    }
    else if (getTimeDifference(sphereInState.config, sphere) < 0) {
      actions.push({type: 'UPDATE_SPHERE', sphereId: sphere.id, data: {name: sphere.name, iBeaconUUID: sphere.uuid}});
    }

    /**
     * Sync the locations from the cloud to the database.
     */
    spheresData[sphere.id].locations.forEach((location) => {
      cloudLocationIds[location.id] = true;
      if (sphereInState !== undefined && sphereInState.locations[location.id] !== undefined) {
        if (getTimeDifference(sphereInState.locations[location.id].config, location) < 0) {
          actions.push({
            type: 'UPDATE_LOCATION_CONFIG',
            sphereId: sphere.id,
            locationId: location.id,
            data: {name: location.name, icon: location.icon, updatedAt: location.updatedAt}
          });
        }
        else if (getTimeDifference(sphereInState.locations[location.id].config, location) > 0) {
          // update cloud since our data is newer!
          let locationInState = sphereInState.locations[location.id];
          let data = {
            name: locationInState.config.name,
            icon: locationInState.config.icon,
            id: location.id,
            sphereId: sphere.id,
            updatedAt: locationInState.config.updatedAt,
          };
          LOG("@SYNC: Updating location", location.id, " in Cloud since our data is newer! remote: ", new Date(location.updatedAt).valueOf(), "local:", locationInState.config.updatedAt, 'diff:', locationInState.config.updatedAt - (new Date(location.updatedAt).valueOf()));
          CLOUD.updateLocation(location.id, data).catch(() => {});
        }
      }
      else {
        actions.push({
          type: 'ADD_LOCATION',
          sphereId: sphere.id,
          locationId: location.id,
          data: {name: location.name, icon: location.icon, updatedAt: location.updatedAt}
        });
      }
    });


    /**
     * Sync the stones from the cloud to the database.
     */
    spheresData[sphere.id].stones.forEach((stone) => {
      cloudStoneIds[stone.id] = true; // mark this ID as "yes it is in the cloud"

      // determine the linked location id
      let locationLinkId = null;
      if (stone.locations.length > 0 && stone.locations[0]) {
        locationLinkId = stone.locations[0].id;
      }
      else {
        locationLinkId = null;
      }
      if (sphereInState !== undefined && sphereInState.stones[stone.id] !== undefined) {
        if (getTimeDifference(sphereInState.stones[stone.id].config, stone) < 0) {
          actions.push({
            type: 'UPDATE_STONE_CONFIG',
            sphereId: sphere.id,
            stoneId: stone.id,
            data: {
              name: stone.name,
              icon: stone.icon,
              applianceId: stone.applianceId,
              locationId: locationLinkId,
              macAddress: stone.address,
              iBeaconMajor: stone.major,
              iBeaconMinor: stone.minor,
              crownstoneId: stone.uid,
              updatedAt: stone.updatedAt,
            }
          });
        }
        else if (getTimeDifference(sphereInState.stones[stone.id].config, stone) > 0) {
          // update cloud since our data is newer!
          let stoneInState = sphereInState.stones[stone.id];
          let data = {
            name: stoneInState.config.name,
            address: stoneInState.config.macAddress,
            icon: stoneInState.config.icon,
            id: stone.id,
            applianceId: stoneInState.config.applianceId,
            sphereId: sphere.id,
            major: stoneInState.config.iBeaconMajor,
            minor: stoneInState.config.iBeaconMinor,
            uid: stoneInState.config.crownstoneId,
            updatedAt: stoneInState.config.updatedAt,
          };

          // only admins get to update the behaviour
          if (adminInThisSphere === true) {
            data.json = JSON.stringify(stoneInState.behaviour);
          }
          LOG("@SYNC: Updating Stone", stone.id, " in Cloud since our data is newer! remote: ", new Date(stone.updatedAt).valueOf(), "local:", stoneInState.config.updatedAt, 'diff:', stoneInState.config.updatedAt - (new Date(stone.updatedAt).valueOf()));
          CLOUD.forSphere(sphere.id).updateStone(stone.id, data).catch(() => {});

          // check if we have to sync the locations:
          if (stoneInState.config.locationId !== locationLinkId) {
            // if the one in the cloud is null, we only create a link
            if (locationLinkId === null && stoneInState.config.locationId !== null) {
              CLOUD.forStone(stone.id).updateStoneLocationLink(stoneInState.config.locationId, stoneInState.config.updatedAt, true);
            }
            else {
              CLOUD.forStone(stone.id).deleteStoneLocationLink(locationLinkId, stoneInState.config.updatedAt, true)
                .then(() => {
                  if (stoneInState.config.locationId !== null) {
                    CLOUD.forStone(stone.id).updateStoneLocationLink(stoneInState.config.locationId, stoneInState.config.updatedAt, true);
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
          stoneId: stone.id,
          data: {
            name: stone.name,
            icon: stone.icon,
            applianceId: stone.applianceId,
            locationId: locationLinkId,
            macAddress: stone.address,
            iBeaconMajor: stone.major,
            iBeaconMinor: stone.minor,
            crownstoneId: stone.uid,
            updatedAt: stone.updatedAt,
          }
        });

        // we only download the behaviour the first time we add the stone.
        if (stone.json !== undefined) {
          let behaviour = JSON.parse(stone.json);

          if (behaviour.onHomeEnter)
            actions.push({ type: 'UPDATE_STONE_BEHAVIOUR_FOR_onHomeEnter', sphereId: sphere.id, stoneId: stone.id, data: behaviour.onHomeEnter });
          if (behaviour.onHomeExit)
            actions.push({ type: 'UPDATE_STONE_BEHAVIOUR_FOR_onHomeExit', sphereId: sphere.id, stoneId: stone.id, data: behaviour.onHomeExit });
          if (behaviour.onRoomEnter)
            actions.push({ type: 'UPDATE_STONE_BEHAVIOUR_FOR_onRoomEnter', sphereId: sphere.id, stoneId: stone.id, data: behaviour.onRoomEnter });
          if (behaviour.onRoomExit)
            actions.push({ type: 'UPDATE_STONE_BEHAVIOUR_FOR_onRoomExit', sphereId: sphere.id, stoneId: stone.id, data: behaviour.onRoomExit });
          if (behaviour.onNear)
            actions.push({ type: 'UPDATE_STONE_BEHAVIOUR_FOR_onNear', sphereId: sphere.id, stoneId: stone.id, data: behaviour.onNear });
          if (behaviour.onAway)
            actions.push({ type: 'UPDATE_STONE_BEHAVIOUR_FOR_onAway', sphereId: sphere.id, stoneId: stone.id, data: behaviour.onAway });
        }
      }
    });


    /**
     * Sync the appliances from the cloud to the database.
     */
    spheresData[sphere.id].appliances.forEach((appliance) => {
      cloudApplianceIds[appliance.id] = true; // mark this ID as "yes it is in the cloud"
      // check if we have to update of add this appliance
      if (sphereInState !== undefined && sphereInState.appliances[appliance.id] !== undefined) {
        if (getTimeDifference(sphereInState.appliances[appliance.id].config, appliance) < 0) {
          actions.push({
            type: 'UPDATE_APPLIANCE_CONFIG',
            sphereId: sphere.id,
            applianceId: appliance.id,
            data: {name: appliance.name, icon: appliance.icon, updatedAt: appliance.updatedAt}
          });
        }
        else if (getTimeDifference(sphereInState.appliances[appliance.id].config, appliance) > 0) {
          // update cloud since our data is newer!
          LOG("@SYNC: Updating appliance", appliance.id, "in Cloud since our data is newer!");
          let applianceInState = sphereInState.appliances[appliance.id];
          let data = {
            name: applianceInState.config.name,
            icon: applianceInState.config.icon,
            id: appliance.id,
            sphereId: sphere.id,
            updatedAt: applianceInState.config.updatedAt,
          };

          // only admins get to update the behaviour
          if (adminInThisSphere === true) {
            data.json = JSON.stringify(applianceInState.behaviour);
          }

          LOG("@SYNC: Updating Appliance", appliance.id, " in Cloud since our data is newer! remote: ", new Date(appliance.updatedAt).valueOf(), "local:", applianceInState.config.updatedAt, 'diff:', applianceInState.config.updatedAt - (new Date(appliance.updatedAt).valueOf()));
          CLOUD.forSphere(sphere.id).updateAppliance(appliance.id, data).catch(() => {});
        }
      }
      else {
        actions.push({
          type: 'ADD_APPLIANCE',
          sphereId: sphere.id,
          applianceId: appliance.id,
          data: {name: appliance.name, icon: appliance.icon, updatedAt: appliance.updatedAt}
        });

        // we only download the behaviour the first time we add the stone.
        if (appliance.json !== undefined) {
          let behaviour = JSON.parse(appliance.json);

          if (behaviour.onHomeEnter)
            actions.push({ type: 'UPDATE_APPLIANCE_BEHAVIOUR_FOR_onHomeEnter', sphereId: sphere.id, applianceId: appliance.id, data: behaviour.onHomeEnter });
          if (behaviour.onHomeExit)
            actions.push({ type: 'UPDATE_APPLIANCE_BEHAVIOUR_FOR_onHomeExit', sphereId: sphere.id, applianceId: appliance.id, data: behaviour.onHomeExit });
          if (behaviour.onRoomEnter)
            actions.push({ type: 'UPDATE_APPLIANCE_BEHAVIOUR_FOR_onRoomEnter', sphereId: sphere.id, applianceId: appliance.id, data: behaviour.onRoomEnter });
          if (behaviour.onRoomExit)
            actions.push({ type: 'UPDATE_APPLIANCE_BEHAVIOUR_FOR_onRoomExit', sphereId: sphere.id, applianceId: appliance.id, data: behaviour.onRoomExit });
          if (behaviour.onNear)
            actions.push({ type: 'UPDATE_APPLIANCE_BEHAVIOUR_FOR_onNear', sphereId: sphere.id, applianceId: appliance.id, data: behaviour.onNear });
          if (behaviour.onAway)
            actions.push({ type: 'UPDATE_APPLIANCE_BEHAVIOUR_FOR_onAway', sphereId: sphere.id, applianceId: appliance.id, data: behaviour.onAway });
        }
      }
    });


    /**
     * Sync the Admins from the cloud to the database.
     */
    Object.keys(spheresData[sphere.id].admins).forEach((userId) => {
      cloudSphereMemberIds[sphere.id][userId] = true;
      let user = spheresData[sphere.id].admins[userId];
      syncSphereUser(actions, sphere, sphereInState, userId, user, state, 'admin');
    });
    Object.keys(spheresData[sphere.id].members).forEach((userId) => {
      cloudSphereMemberIds[sphere.id][userId] = true;
      let user = spheresData[sphere.id].members[userId];
      syncSphereUser(actions, sphere, sphereInState, userId, user, state, 'member');
    });
    Object.keys(spheresData[sphere.id].guests).forEach((userId) => {
      cloudSphereMemberIds[sphere.id][userId] = true;
      let user = spheresData[sphere.id].guests[userId];
      syncSphereUser(actions, sphere, sphereInState, userId, user, state, 'guest');
    });
  });

  return {
    cloudSphereMemberIds,
    cloudSphereIds,
    cloudStoneIds,
    cloudLocationIds,
    cloudApplianceIds,
    addedSphere
  }
};

const syncSphereUser = function(actions, sphere, sphereInState, userId, user, state, accessLevel) {
  if (sphereInState !== undefined && sphereInState.users[userId] !== undefined) {
    // since we do not get a profile picture via the same way as the rest of the users, we alter the data to contain our own pic.
    let selfId = state.user.userId;
    if (userId == selfId) {
      user.picture = state.user.picture;
    }

    if (getTimeDifference(sphereInState.users[userId], user)) {
      actions.push({
        type: 'UPDATE_SPHERE_USER',
        sphereId: sphere.id,
        userId: user.id,
        data: {
          picture: user.picture,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          emailVerified: user.emailVerified,
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
        emailVerified: user.emailVerified,
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

