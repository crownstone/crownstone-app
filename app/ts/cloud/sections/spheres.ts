
import {MapProvider} from "../../backgroundProcesses/MapProvider";
import { FileUtil } from "../../util/FileUtil";
import { user } from "./user";
import { core } from "../../Core";
import { CLOUD } from "../cloudAPI";
import { SphereTransferNext } from "./newSync/transferrers/SphereTransferNext";
import {cloudApiBase} from "./cloudApiBase";
import {CloudAddresses} from "../../backgroundProcesses/indirections/CloudAddresses";

export const spheres = {

  /**
   * self contained method to create a sphere and set the keys and users correctly.
   * @param sphereName
   * @param latitude
   * @param longitude
   * @returns {Promise.<T>}
   */
  createNewSphere(sphereName, latitude, longitude) : {cloudId: string, localId: string} {
    let state = core.store.getState();
    let creationActions = [];

    // only write gps coordinates if we have them.
    let payload = { name: sphereName };
    if (latitude && longitude) {
      payload['gpsLocation'] = {lat:latitude, lng: longitude}
    }
    let localId;
    let sphereCloudId = null;
    return CLOUD.forUser(state.user.userId).createSphere(payload, false)
      .then((response) => {
        sphereCloudId = response.id;
        // add the sphere to the database once it had been added in the cloud.
        localId = SphereTransferNext.createLocal(SphereTransferNext.mapCloudToLocal(response))
      })
      .then(() => {
        creationActions.push({type:'USER_UPDATE', data: { new: false }});

        // add yourself to the sphere members as admin
        creationActions.push({
          type: 'ADD_SPHERE_USER',
          sphereId: localId,
          userId: state.user.userId,
          data:{
            picture: state.user.picture,
            pictureId: state.user.pictureId,
            firstName: state.user.firstName,
            lastName: state.user.lastName,
            email: state.user.email,
            accessLevel: 'admin'
          }
        });

        // get all encryption keys the user has access to and store them in the appropriate spheres.
        return user.getKeys()
      })
      .then((keyResult) => {
        if (Array.isArray(keyResult)) {
          keyResult.forEach((keySet) => {
            // these sets are per sphere.
            let localSphereId = MapProvider.cloud2localMap[keySet.sphereId] || localId;
            keySet.sphereKeys.forEach((sphereKey) => {
              creationActions.push({type:'ADD_SPHERE_KEY', sphereId: localSphereId, keyId: sphereKey.id, data: {
                key: sphereKey.key,
                keyType: sphereKey.keyType,
                createdAt: new Date(sphereKey.createdAt).valueOf(),
                ttl: sphereKey.ttl
              }})
            })
          });

          core.store.batchDispatch(creationActions);
          core.eventBus.emit('sphereCreated');

          return {localId: localId, cloudId: sphereCloudId};
        }
        else {
          throw new Error("Key data is not an array.")
        }
      })
  },


  updateSphere: function(localSphereId, data, background = true) {
    let cloudSphereId = MapProvider.local2cloudMap.spheres[localSphereId] || localSphereId; // the OR is in case a cloudId has been put into this method.
    return CLOUD._setupRequest(
      'PUT',
      '/Spheres/' + cloudSphereId,
      {background: background, data: data},
      'body'
    );
  },

  inviteUser: function(email, permission = "") {
    permission = permission.toLowerCase();
    switch (permission) {
      case 'admin':
        return CLOUD._setupRequest('PUT', '/Spheres/{id}/admins', { data: { email: email }});
      case 'member':
        return CLOUD._setupRequest('PUT', '/Spheres/{id}/members', { data: { email: email }});
      case 'guest':
        return CLOUD._setupRequest('PUT', '/Spheres/{id}/guests', { data: { email: email }});
      default:
        return new Promise((resolve, reject) => {
          reject(new Error('Invalid Permission: "' + permission + '"'))
        });
    }
  },

  getPendingSphereInvites: function(background = true) {
    return CLOUD._setupRequest('GET', '/Spheres/{id}/pendingInvites', {background:background});
  },

  resendInvite: function(email, background = false) {
    return CLOUD._setupRequest('GET', '/Spheres/{id}/resendInvite', {data:{email: email}, background: background});
  },

  revokeInvite: function(email, background = false) {
    return CLOUD._setupRequest('GET', '/Spheres/{id}/removeInvite', {data:{email: email}, background: background});
  },



  /**
   *
   * @returns {*}
   */
  getSpheres: function (background = true) {
    return CLOUD._setupRequest('GET', '/users/{id}/spheres', { background: background });
  },

  getUsers: function (background = true) {
    return CLOUD._setupRequest('GET', '/Spheres/{id}/users', { background : background } );
  },

  getAdmins: function (background = true) {
    return CLOUD._setupRequest('GET', '/Spheres/{id}/admins', { background : background });
  },

  getMembers: function (background = true) {
    return CLOUD._setupRequest('GET', '/Spheres/{id}/members', { background : background });
  },

  getGuests: function (background = true) {
    return CLOUD._setupRequest('GET', '/Spheres/{id}/guests', { background : background });
  },

  getToons: function (background = true) {
    return CLOUD._setupRequest('GET', '/Spheres/{id}/Toons', { background : background });
  },

  getPresentPeople: function (ignoreDeviceId, background = true) {
    return CLOUD._setupRequest('GET', '/Spheres/{id}/presentPeople', {
      data: { ignoreDeviceId: ignoreDeviceId },
      background : background
    }, 'query');
  },


  /**
   * @param data
   * @param background
   */
  createSphere: function(data, background = true) {
    return CLOUD._setupRequest('POST', 'users/{id}/spheres', { data: data, background: background }, 'body');
  },

  getUserPicture(localSphereId, email, userId, background = true) {
    let cloudSphereId = MapProvider.local2cloudMap.spheres[localSphereId] || localSphereId; // the OR is in case a cloudId has been put into this method.
    let toPath = FileUtil.getPath(userId + '.jpg');
    return CLOUD.forSphere(cloudSphereId)._download({
      endPoint:'/Spheres/{id}/profilePic',
      data: {email: email},
      type: 'query',
      background:background,
    }, toPath);
  },

  changeSphereName: function(sphereName) {
    return CLOUD._setupRequest('PUT', '/Spheres/{id}', { data: { name: sphereName }}, 'body');
  },

  changeUserAccess: function(email, accessLevel, background = false) {
    return CLOUD._setupRequest('PUT', '/Spheres/{id}/role', {data: {email: email, role:accessLevel}, background:background}, 'query');
  },

  deleteUserFromSphere: function(userId) {
    // userId is the same in the cloud as it is locally
    return CLOUD._setupRequest('DELETE', '/Spheres/{id}/users/rel/' + userId);
  },

  deleteSphere: function(localSphereId) {
    let cloudSphereId = MapProvider.local2cloudMap.spheres[localSphereId] || localSphereId; // the OR is in case a cloudId has been put into this method.
    if (cloudSphereId) {
      return CLOUD._setupRequest(
        'DELETE',
        'Spheres/' + cloudSphereId
      );
    }
  },

  leaveSphere: function(localSphereId) {
    let cloudSphereId = MapProvider.local2cloudMap.spheres[localSphereId] || localSphereId; // the OR is in case a cloudId has been put into this method.
    if (cloudSphereId) {
      return CLOUD._setupRequest(
        'DELETE',
        'users/{id}/spheres/rel/' + cloudSphereId
      );
    }
  },

  acceptInvitation: function() {
    return CLOUD._setupRequest(
      'POST',
      '/Spheres/{id}/inviteAccept/',
      {background: false},
      'body'
      );
  },

  declineInvitation: function() {
    return CLOUD._setupRequest(
      'POST',
      '/Spheres/{id}/inviteDecline/',
      {background: false},
      'body'
      );
  },


  getEnergyUploadPermission: function (background = true) {
    return cloudApiBase._setupRequest(
      'GET',
      CloudAddresses.cloud_v2 + `spheres/{id}/energyUsageCollectionPermission`,
      {background: background},
      'body'
    );
  },

  setEnergyUploadPermission: function (permission: boolean, background = true) {
    return cloudApiBase._setupRequest(
      'POST',
      CloudAddresses.cloud_v2 + `spheres/{id}/energyUsageCollectionPermission?permission=${permission}`,
      {background: background},
      'body'
    );
  },

  getEnergyUsage: function (date: timeISOString, range: EnergyUsageRange, background = true) : Promise<EnergyReturnData[]> {
    return cloudApiBase._setupRequest(
      'GET',
      CloudAddresses.cloud_v2 + `spheres/{id}/energyUsage?date=${date}&range=${range}`,
      {background: background},
      'body'
    );
  }
};
