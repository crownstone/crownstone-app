var test = require('tape');
let deepFreeze = require('deep-freeze');

import spheresReducer from '../../router/store/reducers/spheres'

// hack to remove the current time from the reducer so we can predictably match the results.
Date.prototype.valueOf = function () {return 1};

test('spheresReducer ADD_SPHERE, UPDATE_SPHERE_CONFIG and REMOVE_SPHERE', function (t) {
  let initialState = {};
  let createAction = {
    type: 'ADD_SPHERE',
    data: {name: 'home'},
    sphereId: 'sphereId'
  };

  let emptyAction = {};


  let updateAction = {
    type: 'UPDATE_SPHERE_CONFIG',
    data: {name: 'school'},
    sphereId: 'sphereId'
  };

  let updateVoidAction = {
    type: 'UPDATE_SPHERE_CONFIG',
    sphereId: 'sphereId'
  };

  let removeAction = {
    type: 'REMOVE_SPHERE',
    sphereId: 'sphereId'
  };

  deepFreeze(initialState);
  deepFreeze(createAction);
  deepFreeze(updateAction);
  deepFreeze(updateVoidAction);
  deepFreeze(removeAction);

  let sphereState = spheresReducer(initialState, createAction);
  deepFreeze(sphereState);

  let expectedReturn = {
    sphereId: {
      appliances: {},
      config: {
        adminKey: null,
        guestKey: null,
        memberKey: null,
        meshAccessAddress: null,
        name: 'home',
        updatedAt: 1,
        iBeaconUUID: undefined
      },
      locations: {},
      users: {},
      presets: [],
      stones: {}
    }
  };
  t.deepEqual(sphereState, expectedReturn, 'adding a sphere');
  t.deepEqual(spheresReducer(sphereState, updateVoidAction), expectedReturn, 'update a sphere with a void action');
  t.deepEqual(spheresReducer(sphereState, emptyAction), expectedReturn, 'update a sphere with a completely empty action');

  expectedReturn.sphereId.config.name = 'school';
  t.deepEqual(spheresReducer(sphereState, updateAction), expectedReturn, 'update a sphere');
  t.deepEqual(spheresReducer(sphereState, removeAction), {}, 'remove a sphere');
  t.end();
});
