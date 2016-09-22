import RNFS from 'react-native-fs'
import { LOG } from '../../logging/Log'

export const spheres = {

  /**
   *
   * @returns {*}
   */
  getSpheres: function (options = {}) {
    return this._setupRequest('GET', '/users/{id}/groups', options);
  },

  getUsers: function (options = {}) {
    return this._setupRequest('GET', '/Groups/{id}/users', options);
  },

  getAdmins: function (options = {}) {
    return this._setupRequest('GET', '/Groups/{id}/owner', options).then((result) => {return [result]});
  },

  getMembers: function (options = {}) {
    return this._setupRequest('GET', '/Groups/{id}/members', options);
  },

  getGuests: function (options = {}) {
    return this._setupRequest('GET', '/Groups/{id}/guests', options);
  },


  /**
   *
   * @param sphereName
   */
  createSphere: function(sphereName) {
    return this._setupRequest('POST', 'users/{id}/groups', {data:{name:sphereName}}, 'body');
  },

  getUserPicture(sphereId, email, userId, options = {}) {
    let toPath = RNFS.DocumentDirectoryPath + '/' + userId + '.jpg';
    return this.forSphere(sphereId)._download({
      endPoint:'/Groups/{id}/profilePic',
      data: {email: email},
      type: 'query',
      ...options
    }, toPath);
  },


  getSphereData: function(selfId, options = {}) {
    let sphereId = this._sphereId;

    let promises      = [];

    let applianceData = [];
    let stoneData     = [];
    let locationData  = [];
    let adminData     = [];
    let memberData    = [];
    let guestData     = [];

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

    return Promise.all(promises).then(() => {
      LOG("returning all");
      return {
        appliances: applianceData,
        stones:     stoneData,
        locations:  locationData,
        admins:     adminData,
        members:    memberData,
        guests:     guestData,
      }
    })
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
              })
            );
          }
          return Promise.all(profilePicturePromises);
        })
      })
  },

  changeSphereName: function(sphereName) {
    return this._setupRequest('PUT', '/Groups/{id}', {name:sphereName}, 'body');
  },

  changeUserAccess: function(userId, accessLevel) {
    // TODO: fix when correct endpoint has been added
    // return this._setupRequest('PUT', '/Groups/{id}/users/rel/' + userId, {role:accessLevel}, 'body');

    return new Promise((resolve, reject) => {
      resolve();
    })
  },

  deleteSphere: function() {
    let sphereId = this._sphereId;

    let promises     = [];

    let applianceData= [];
    let stoneData    = [];
    let locationData = [];

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
          deletePromises.push(this.deleteAppliance(appliance.id));
        });

        stoneData.forEach((stone) => {
          deletePromises.push(this.deleteStone(stone.id));
        });

        locationData.forEach((location) => {
          deletePromises.push(this.deleteLocation(location.id));
        });

        return Promise.all(deletePromises);
      })
      .then(() => {
        return this._deleteSphere(sphereId);
      })
  },

  _deleteSphere: function(sphereId) {
    return this._setupRequest(
      'DELETE',
      'Groups/' + sphereId
    );
  },

};