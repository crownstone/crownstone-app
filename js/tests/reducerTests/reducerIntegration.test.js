var test = require('tape');
let deepFreeze = require('deep-freeze');

import CrownstoneReducer from '../../router/store/reducer'
import groupsReducer from '../../router/store/reducers/groups'
import locationsReducer from '../../router/store/reducers/locations'



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
    locationId:'locationId',
    data: {
      name:'living room',
      icon:'couch'
    }
  };
  let removeLocationAction = {
    type: 'REMOVE_LOCATION',
    groupId: 'groupId',
    locationId:'locationId'
  };


  deepFreeze(initialState);
  deepFreeze(addLocationAction);
  deepFreeze(createGroupAction);
  deepFreeze(removeLocationAction);

  let expectedReturn = {
    groupId: {
      config: {
        name: 'home',
        latitude: undefined,
        longitude: undefined
      },
      locations: {
        locationId: {
          config: {
            icon: 'couch',
            name: 'living room',
          },
          picture: {barURI: undefined, fullURI: undefined, squareURI: undefined},
          presentUsers: [],
          stones: []
        }
      },
      presets: []}
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
    app: {
      activeGroup: 'Home'
    },
    groups: {},
    settings: {
      linkedDevices: true,
      onHomeEnterExit: true,
      presenceWithoutDevices: false,
      presets: false,
      statistics: false
    },
    user: {name: undefined, picture: undefined, tokens: []}
  };

  let locationState = {
    app: {
      activeGroup: 'Home'
    },
    groups: {
      Home: {
        config: {
          latitude: undefined,
          longitude: undefined,
          name: 'Home'
        },
        locations: {
          locationId: {
            config: {
              icon: 'couch',
              name: 'living room'
            },
            picture: {
              barURI: undefined,
              fullURI: undefined,
              squareURI: undefined
            },
            presentUsers: [],
            stones: {}
          }
        },
        presets: []
      }
    },
    settings: {
      linkedDevices: true,
      onHomeEnterExit: true,
      presenceWithoutDevices: false,
      presets: false,
      statistics: false
    },
    user: {name: undefined, picture: undefined, tokens: []}
  };


  let createGroupAction = {
    type: 'ADD_GROUP',
    data: {name: 'Home'},
    groupId: 'Home'
  };

  let addLocationAction = {
    type: 'ADD_LOCATION',
    groupId: 'Home',
    locationId:'locationId',
    data: {
      name:'living room',
      icon:'couch'
    }
  };

  let addedGroupState = CrownstoneReducer({}, createGroupAction);
  let addedLocationState = CrownstoneReducer(addedGroupState, addLocationAction);
  t.deepEqual(CrownstoneReducer(), initialState, 'verify the initial state')
  t.deepEqual(addedLocationState, locationState, 'verify the location state')
  t.end();
});

