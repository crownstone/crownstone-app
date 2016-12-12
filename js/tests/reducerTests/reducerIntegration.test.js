const test = require('tape');
let deepFreeze = require('deep-freeze');

import CrownstoneReducer from '../../router/store/reducer'
import spheresReducer from '../../router/store/reducers/spheres'
import locationsReducer from '../../router/store/reducers/locations'

// hack to remove the current time from the reducer so we can predictably match the results.
Date.prototype.valueOf = function () {
  return 1
};


test('locationsReducer PropegationTest', function (t) {
  let initialState = {};
  let createSphereAction = {
    type: 'ADD_SPHERE',
    data: {name: 'home'},
    sphereId: 'sphereId'
  };
  let addLocationAction = {
    type: 'ADD_LOCATION',
    sphereId: 'sphereId',
    locationId: 'locationId',
    data: {
      name: 'living room',
      icon: 'couch'
    }
  };
  let removeLocationAction = {
    type: 'REMOVE_LOCATION',
    sphereId: 'sphereId',
    locationId: 'locationId'
  };


  deepFreeze(initialState);
  deepFreeze(addLocationAction);
  deepFreeze(createSphereAction);
  deepFreeze(removeLocationAction);

  let expectedReturn = {
    sphereId: {
      appliances: {},
      config: {adminKey: null, guestKey: null, memberKey: null, meshAccessAddress: null, name: 'home', updatedAt: 1, iBeaconUUID: undefined},
      locations: {locationId: {config: {fingerprintParsed: null, fingerprintRaw: null, icon: 'couch', name: 'living room', updatedAt: 1}, presentUsers: []}},
      users: {},
      presets: [],
      stones: {}
    }
  };

  let sphereState = spheresReducer({}, createSphereAction);
  deepFreeze(sphereState);

  t.deepEqual(spheresReducer(sphereState, addLocationAction), expectedReturn, 'add a location in to sphere');
  let locationState = spheresReducer(sphereState, addLocationAction);

  expectedReturn.sphereId.locations = {};
  t.deepEqual(spheresReducer(locationState, removeLocationAction), expectedReturn, 'remove a location in a sphere');

  t.end();
});


test('Initial App state', function (t) {
  let initialState = {
    app: {activeSphere: undefined, localizationSetupDone: true, enableLocalization:true, updatedAt: 1},
    spheres: {},
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
    app: {activeSphere: undefined, localizationSetupDone: true, enableLocalization:true, updatedAt: 1},
    spheres: {
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

  let createSphereAction = {
    type: 'ADD_SPHERE',
    data: {name: 'Home'},
    sphereId: 'Home'
  };

  let addLocationAction = {
    type: 'ADD_LOCATION',
    sphereId: 'Home',
    locationId: 'locationId',
    data: {
      name: 'living room',
      icon: 'couch'
    }
  };

  let addedSphereState = CrownstoneReducer({}, createSphereAction);
  let addedLocationState = CrownstoneReducer(addedSphereState, addLocationAction);
  t.deepEqual(CrownstoneReducer(), initialState, 'verify the initial state');
  t.deepEqual(addedLocationState, locationState, 'verify the location state');
  t.end();
});

