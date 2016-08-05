var test = require('tape');
let deepFreeze = require('deep-freeze');

import CrownstoneReducer from '../../router/store/reducer'
import groupsReducer from '../../router/store/reducers/groups'
import locationsReducer from '../../router/store/reducers/locations'

// hack to remove the current time from the reducer so we can predictably match the results.
Date.prototype.valueOf = function () {
  return 1
}


test('locationsReducer PropegationTest', function (t) {
  let initialState = {};
  let createGroupAction = {
    type: 'ADD_GROUP',
    data: {name: 'home'},
    groupId: 'groupId'
  };
  let addLocationAction = {
    type: 'ADD_LOCATION',
    groupId: 'groupId',
    locationId: 'locationId',
    data: {
      name: 'living room',
      icon: 'couch'
    }
  };
  let removeLocationAction = {
    type: 'REMOVE_LOCATION',
    groupId: 'groupId',
    locationId: 'locationId'
  };


  deepFreeze(initialState);
  deepFreeze(addLocationAction);
  deepFreeze(createGroupAction);
  deepFreeze(removeLocationAction);

  let expectedReturn = {
    groupId: {
      appliances: {},
      config: {adminKey: null, guestKey: null, memberKey: null, meshAccessAddress: null, name: 'home', updatedAt: 1, iBeaconUUID: undefined},
      locations: {locationId: {config: {fingerprintParsed: '', fingerprintRaw: '', icon: 'couch', name: 'living room', updatedAt: 1}, presentUsers: []}},
      users: {},
      presets: [],
      stones: {}
    }
  };

  let groupState = groupsReducer({}, createGroupAction);
  deepFreeze(groupState);

  t.deepEqual(groupsReducer(groupState, addLocationAction), expectedReturn, 'add a location in to group');
  let locationState = groupsReducer(groupState, addLocationAction);

  expectedReturn.groupId.locations = {};
  t.deepEqual(groupsReducer(locationState, removeLocationAction), expectedReturn, 'remove a location in a group');

  t.end();
});


test('Initial App state', function (t) {
  let initialState = {
    app: {activeGroup: undefined, doFirstTimeSetup: true, enableLocalization:true, updatedAt: 1},
    groups: {},
    settings: {
      linkedDevices: true,
      onHomeEnterExit: true,
      presenceWithoutDevices: false,
      presets: false,
      statistics: false,
      updatedAt: 1
    },
    user: {
      accessToken: undefined,
      email: undefined,
      firstName: undefined,
      lastName: undefined,
      picture: null,
      updatedAt: 1,
      userId: undefined
    }
  };

  let locationState = {
    app: {activeGroup: undefined, doFirstTimeSetup: true, enableLocalization:true, updatedAt: 1},
    groups: {
      Home: {
        appliances: {},
        config: {adminKey: null, guestKey: null, memberKey: null, meshAccessAddress: null, name: 'Home', updatedAt: 1, iBeaconUUID: undefined},
        locations: {locationId: {config: {fingerprintParsed: '', fingerprintRaw: '', icon: 'couch', name: 'living room', updatedAt: 1}, presentUsers: []}},
        users: {},
        presets: [],
        stones: {}
      }
    },
    settings: {
      linkedDevices: true,
      onHomeEnterExit: true,
      presenceWithoutDevices: false,
      presets: false,
      statistics: false,
      updatedAt: 1
    },
    user: {
      accessToken: undefined,
      email: undefined,
      firstName: undefined,
      lastName: undefined,
      picture: null,
      updatedAt: 1,
      userId: undefined
    }
  };

  let createGroupAction = {
    type: 'ADD_GROUP',
    data: {name: 'Home'},
    groupId: 'Home'
  };

  let addLocationAction = {
    type: 'ADD_LOCATION',
    groupId: 'Home',
    locationId: 'locationId',
    data: {
      name: 'living room',
      icon: 'couch'
    }
  };

  let addedGroupState = CrownstoneReducer({}, createGroupAction);
  let addedLocationState = CrownstoneReducer(addedGroupState, addLocationAction);
  t.deepEqual(CrownstoneReducer(), initialState, 'verify the initial state')
  t.deepEqual(addedLocationState, locationState, 'verify the location state')
  t.end();
});

