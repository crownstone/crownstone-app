import RNFS from 'react-native-fs'
import { LOG, LOGError, LOGCloud } from '../../logging/Log'

export const spheres = {


  /**
   * self contained method to create a sphere and set the keys and users correctly.
   * @param store
   * @param sphereName
   * @param eventBus
   * @returns {Promise.<T>}
   */
  createNewSphere(store, sphereName, eventBus) {
    let state = store.getState();
    let sphereId;
    let creationActions = [];
    return this.forUser(state.user.userId).createSphere(sphereName)
      .then((response) => {
        sphereId = response.id;

        // add the sphere to the database once it had been added in the cloud.
        creationActions.push({type:'ADD_SPHERE', sphereId: sphereId, data: {name: response.name, iBeaconUUID: response.uuid, meshAccessAddress: response.meshAccessAddress}});
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
        break;
      case 'member':
        return this._setupRequest('PUT', '/Spheres/{id}/members', { data: { email: email }});
        break;
      case 'guest':
        return this._setupRequest('PUT', '/Spheres/{id}/guests', { data: { email: email }});
        break;
      default:
        return new Promise((resolve, reject) => {
          reject(new Error('Invalid Permission: "' + permission + '"'))
        });
        break;
    }
  },

  getPendingInvites: function(options = {}) {
    return this._setupRequest('GET', '/Spheres/{id}/pendingInvites', options);
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
  getSpheres: function (options = {}) {
    return this._setupRequest('GET', '/users/{id}/spheres', options);
  },

  getUsers: function (options = {}) {
    return this._setupRequest('GET', '/Spheres/{id}/users', options);
  },

  getAdmins: function (options = {}) {
    return this._setupRequest('GET', '/Spheres/{id}/admins', options);
  },

  getMembers: function (options = {}) {
    return this._setupRequest('GET', '/Spheres/{id}/members', options);
  },

  getGuests: function (options = {}) {
    return this._setupRequest('GET', '/Spheres/{id}/guests', options);
  },


  /**
   *
   * @param sphereName
   */
  createSphere: function(sphereName) {
    return this._setupRequest('POST', 'users/{id}/spheres', {data:{name:sphereName}}, 'body');
  },

  getUserPicture(sphereId, email, userId, options = {}) {
    let toPath = RNFS.DocumentDirectoryPath + '/' + userId + '.jpg';
    return this.forSphere(sphereId)._download({
      endPoint:'/Spheres/{id}/profilePic',
      data: {email: email},
      type: 'query',
      ...options
    }, toPath);
  },


  getSphereData: function(selfId, options = {}) {
    let sphereId = this._sphereId;

    let promises       = [];

    let applianceData  = [];
    let stoneData      = [];
    let locationData   = [];
    let adminData      = [];
    let memberData     = [];
    let guestData      = [];
    let pendingInvites = [];

    // for every sphere we get the crownstones
    promises.push(
      this.getStonesInSphere(options)
        .then((stones) => {
          stoneData = stones;
        }).catch()
    );

    // for every sphere we get the appliances
    promises.push(
      this.getAppliancesInSphere(options)
        .then((appliances) => {
          applianceData = appliances;
        }).catch()
    );

    // for every sphere, we get the locations
    promises.push(
      this.getLocations(options)
        .then((locations) => {
          locationData = locations;
        }).catch()
    );

    promises.push(
      this.getUserFromType(this.getAdmins.bind(this),  'admin',  adminData,  sphereId, selfId, options)
    );

    promises.push(
      this.getUserFromType(this.getMembers.bind(this), 'member', memberData, sphereId, selfId, options)
    );

    promises.push(
      this.getUserFromType(this.getGuests.bind(this),  'guest',  guestData,  sphereId, selfId, options)
    );

    promises.push(
      this.forSphere(sphereId).getPendingInvites(options)
        .then((invites) => {
          pendingInvites = invites;
        })
    );

    return Promise.all(promises).then(() => {
      return {
        appliances:     applianceData,
        stones:         stoneData,
        locations:      locationData,
        admins:         adminData,
        members:        memberData,
        guests:         guestData,
        pendingInvites: pendingInvites,
      }
    }).catch()
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
              this.getUserPicture(sphereId, user.email, user.id, options).then((filename) => {
                userData[user.id].picture = filename;
              }).catch((err) => {LOGError("failed getting user picture",sphereId, user.email, user.id, options, err)})
            );
          }
          return Promise.all(profilePicturePromises);
        })
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
        }).catch()
    );

    // for every sphere we get the appliances
    promises.push(
      this.getAppliancesInSphere()
        .then((appliances) => {
          applianceData = appliances;
        }).catch()
    );

    // for every sphere, we get the locations
    promises.push(
      this.getLocations()
        .then((locations) => {
          locationData = locations;
        }).catch()
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