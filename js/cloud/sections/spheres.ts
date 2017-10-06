import {Util} from "../../util/Util";

const RNFS = require('react-native-fs');
import { LOG} from '../../logging/Log'

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
    let sphereId;
    let creationActions = [];

    // only write gps coordinates if we have them.
    let payload = { name: sphereName };
    if (latitude && longitude) {
      payload['gpsLocation'] = {lat:latitude, lng: longitude}
    }

    return this.forUser(state.user.userId).createSphere(payload, false)
      .then((response) => {
        sphereId = response.id;

        // add the sphere to the database once it had been added in the cloud.
        creationActions.push({type:'ADD_SPHERE', sphereId: sphereId, data: {name: response.name, iBeaconUUID: response.uuid, meshAccessAddress: response.meshAccessAddress, exitDelay: response.exitDelay || 600, latitude: response.gpsLocation && response.gpsLocation.lat, longitude: response.gpsLocation && response.gpsLocation.lng}});
        creationActions.push({type:'USER_UPDATE', data: { new: false }});

        // add yourself to the sphere members as admin
        creationActions.push({type: 'ADD_SPHERE_USER', sphereId: sphereId, userId: state.user.userId, data:{picture: state.user.picture, firstName: state.user.firstName, lastName: state.user.lastName, email:state.user.email, accessLevel: 'admin'}});

        // get all encryption keys the user has access to and store them in the appropriate spheres.
        return this.getKeys()
      })
      .then((keyResult) => {
        if (Array.isArray(keyResult)) {
          keyResult.forEach((keySet) => {
            creationActions.push({type:'SET_SPHERE_KEYS', sphereId: sphereId, data:{
              adminKey:  keySet.keys.admin  || null,
              memberKey: keySet.keys.member || null,
              guestKey:  keySet.keys.guest  || null
            }})
          });

          eventBus.emit('sphereCreated');
          store.batchDispatch(creationActions);
          return sphereId
        }
        else {
          throw new Error("Key data is not an array.")
        }
      })
  },


  updateSphere: function(sphereId, data, background = true) {
    return this._setupRequest(
      'PUT',
      '/Spheres/' + sphereId,
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
    return this._setupRequest('GET', '/users/{id}/spheres', { background: background });
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


  /**
   * @param data
   * @param background
   */
  createSphere: function(data, background = true) {
    return this._setupRequest('POST', 'users/{id}/spheres', { data: data, background: background }, 'body');
  },

  getUserPicture(cloudSphereId, email, userId, background = true) {
    let toPath = Util.getPath(userId + '.jpg');
    return this.forSphere(cloudSphereId)._download({
      endPoint:'/Spheres/{id}/profilePic',
      data: {email: email},
      type: 'query',
      background:background,
    }, toPath);
  },

  getUserFromType: function(userGetter, type, userData, sphereId, selfId, options) {
    return userGetter(options)
      .then((users) => {
        let profilePicturePromises = [];
        users.forEach((user) => {
          userData[user.id] = user;
          userData[user.id].accessLevel = type;
          if (user.id !== selfId) {
            profilePicturePromises.push(
              this.getUserPicture(sphereId, user.email, user.id, options)
                .then((filename) => {
                  userData[user.id].picture = filename;
                })
                .catch((err) => {LOG.error("failed getting user picture", sphereId, user.email, user.id, options, err)})
            );
          }
        });
        return Promise.all(profilePicturePromises);
      })
  },

  changeSphereName: function(sphereName) {
    return this._setupRequest('PUT', '/Spheres/{id}', { data: { name: sphereName }}, 'body');
  },

  changeUserAccess: function(email, accessLevel, background = false) {
    return this._setupRequest('PUT', '/Spheres/{id}/role', {data: {email: email, role:accessLevel}, background:background}, 'query');
  },

  deleteUserFromSphere: function(userId) {
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

  _deleteSphere: function(sphereId) {
    if (sphereId) {
      return this._setupRequest(
        'DELETE',
        'Spheres/' + sphereId
      );
    }
  },

};