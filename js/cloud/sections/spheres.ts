import {Util} from "../../util/Util";

const RNFS = require('react-native-fs');
import {transferSpheres} from "../transferData/transferSpheres";
import {MapProvider} from "../../backgroundProcesses/MapProvider";

export const spheres = {

  /**
   * self contained method to create a sphere and set the keys and users correctly.
   * @param store
   * @param sphereName
   * @param eventBus
   * @param latitude
   * @param longitude
   * @returns {Promise.<T>}
   */
  createNewSphere(store, sphereName, eventBus, latitude, longitude) {
    let state = store.getState();
    let creationActions = [];

    // only write gps coordinates if we have them.
    let payload = { name: sphereName };
    if (latitude && longitude) {
      payload['gpsLocation'] = {lat:latitude, lng: longitude}
    }

    let localId = Util.getUUID();
    return this.forUser(state.user.userId).createSphere(payload, false)
      .then((response) => {
        // add the sphere to the database once it had been added in the cloud.
        return transferSpheres.createLocal(creationActions, {localId: localId, cloudData: response})
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
        return this.getKeys()
      })
      .then((keyResult) => {
        if (Array.isArray(keyResult)) {
          keyResult.forEach((keySet) => {
            creationActions.push({type:'SET_SPHERE_KEYS', sphereId: localId, data:{
              adminKey:  keySet.keys.admin  || null,
              memberKey: keySet.keys.member || null,
              guestKey:  keySet.keys.guest  || null
            }})
          });

          eventBus.emit('sphereCreated');
          store.batchDispatch(creationActions);
          return localId;
        }
        else {
          throw new Error("Key data is not an array.")
        }
      })
  },


  updateSphere: function(localSphereId, data, background = true) {
    let cloudSphereId = MapProvider.local2cloudMap.spheres[localSphereId] || localSphereId; // the OR is in case a cloudId has been put into this method.
    return this._setupRequest(
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
        return this._setupRequest('PUT', '/Spheres/{id}/admins', { data: { email: email }});
      case 'member':
        return this._setupRequest('PUT', '/Spheres/{id}/members', { data: { email: email }});
      case 'guest':
        return this._setupRequest('PUT', '/Spheres/{id}/guests', { data: { email: email }});
      default:
        return new Promise((resolve, reject) => {
          reject(new Error('Invalid Permission: "' + permission + '"'))
        });
    }
  },

  getPendingInvites: function(background = true) {
    return this._setupRequest('GET', '/Spheres/{id}/pendingInvites', {background:background});
  },

  resendInvite: function(email, background = false) {
    return this._setupRequest('GET', '/Spheres/{id}/resendInvite', {data:{email: email}, background: background});
  },

  revokeInvite: function(email, background = false) {
    return this._setupRequest('GET', '/Spheres/{id}/removeInvite', {data:{email: email}, background: background});
  },



  /**
   *
   * @returns {*}
   */
  getSpheres: function (background = true) {
    return this._setupRequest('GET', '/users/{id}/spheres', { data: {filter: {include:"floatingLocationPosition"}}, background: background });
  },

  getUsers: function (background = true) {
    return this._setupRequest('GET', '/Spheres/{id}/users', { background : background } );
  },

  getAdmins: function (background = true) {
    return this._setupRequest('GET', '/Spheres/{id}/admins', { background : background });
  },

  getMembers: function (background = true) {
    return this._setupRequest('GET', '/Spheres/{id}/members', { background : background });
  },

  getGuests: function (background = true) {
    return this._setupRequest('GET', '/Spheres/{id}/guests', { background : background });
  },

  getToons: function (background = true) {
    return this._setupRequest('GET', '/Spheres/{id}/Toons', { background : background });
  },


  /**
   * @param data
   * @param background
   */
  createSphere: function(data, background = true) {
    return this._setupRequest('POST', 'users/{id}/spheres', { data: data, background: background }, 'body');
  },

  getUserPicture(localSphereId, email, userId, background = true) {
    let cloudSphereId = MapProvider.local2cloudMap.spheres[localSphereId] || localSphereId; // the OR is in case a cloudId has been put into this method.
    let toPath = Util.getPath(userId + '.jpg');
    return this.forSphere(cloudSphereId)._download({
      endPoint:'/Spheres/{id}/profilePic',
      data: {email: email},
      type: 'query',
      background:background,
    }, toPath);
  },

  changeSphereName: function(sphereName) {
    return this._setupRequest('PUT', '/Spheres/{id}', { data: { name: sphereName }}, 'body');
  },

  changeUserAccess: function(email, accessLevel, background = false) {
    return this._setupRequest('PUT', '/Spheres/{id}/role', {data: {email: email, role:accessLevel}, background:background}, 'query');
  },

  updateFloatingLocationPosition: function (data, background = true) {
    return this._setupRequest(
      'POST',
      '/Spheres/{id}/floatingLocationPosition/',
      {background: background, data: data},
      'body'
    );
  },

  deleteUserFromSphere: function(userId) {
    // userId is the same in the cloud as it is locally
    return this._setupRequest('DELETE', '/Spheres/{id}/users/rel/' + userId);
  },

  deleteSphere: function() {
    let sphereId = this._sphereId;

    let promises      = [];
    let applianceData = [];
    let stoneData     = [];
    let locationData  = [];

    promises.push(
      this.getStonesInSphere()
        .then((stones) => {
          stoneData = stones;
        }).catch((err) => {})
    );

    // for every sphere we get the appliances
    promises.push(
      this.getAppliancesInSphere()
        .then((appliances) => {
          applianceData = appliances;
        }).catch((err) => {})
    );

    // for every sphere, we get the locations
    promises.push(
      this.getLocations()
        .then((locations) => {
          locationData = locations;
        }).catch((err) => {})
    );

    return Promise.all(promises)
      .then(() => {
        let deletePromises = [];
        applianceData.forEach((appliance) => {
          deletePromises.push(this.forSphere(this._sphereId).deleteAppliance(appliance.id));
        });

        stoneData.forEach((stone) => {
          deletePromises.push(this.forSphere(this._sphereId).deleteStone(stone.id));
        });

        locationData.forEach((location) => {
          deletePromises.push(this.forSphere(this._sphereId).deleteLocation(location.id));
        });

        return Promise.all(deletePromises);
      })
      .then(() => {
        return this._deleteSphere(sphereId);
      })
  },

  _deleteSphere: function(localSphereId) {
    let cloudSphereId = MapProvider.local2cloudMap.spheres[localSphereId] || localSphereId; // the OR is in case a cloudId has been put into this method.
    if (cloudSphereId) {
      return this._setupRequest(
        'DELETE',
        'Spheres/' + cloudSphereId
      );
    }
  },

  leaveSphere: function(localSphereId) {
    let cloudSphereId = MapProvider.local2cloudMap.spheres[localSphereId] || localSphereId; // the OR is in case a cloudId has been put into this method.
    if (cloudSphereId) {
      return this._setupRequest(
        'DELETE',
        'users/{id}/spheres/rel/' + cloudSphereId
      );
    }
  }

};
