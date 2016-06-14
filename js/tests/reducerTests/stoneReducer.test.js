var test = require('tape');
let deepFreeze = require('deep-freeze');

import stoneReducer from '../../router/store/reducers/stones'

// hack to remove the current time from the reducer so we can predictably match the results.
Date.prototype.valueOf = function () {
  return 1
}

test('stoneReducer ADD_LOCATION and REMOVE_LOCATION', function (t) {
  let addStoneAction = {
    type: 'ADD_STONE',
    stoneId: 'stoneId',
    data: {
      name: 'Ceiling Light',
    }
  };

  let updateStoneAction = {
    type: 'UPDATE_STONE_CONFIG',
    stoneId: 'stoneId',
    data: {
      name: 'Reading Light',
    }
  };

  let removeStoneAction = {
    type: 'REMOVE_STONE',
    stoneId: 'stoneId',
  };

  deepFreeze(addStoneAction);
  deepFreeze(updateStoneAction);
  deepFreeze(removeStoneAction);

  let expectedReturn = {
    stoneId: {
      behaviour: {
        onHomeEnter: {
          active: false,
          delay: 0,
          fadeTime: 0,
          state: 1,
          updatedAt: 1
        },
        onHomeExit: {active: false, delay: 0, fadeTime: 0, state: 1, updatedAt: 1},
        onRoomEnter: {active: false, delay: 0, fadeTime: 0, state: 1, updatedAt: 1},
        onRoomExit: {active: false, delay: 0, fadeTime: 0, state: 1, updatedAt: 1}
      },
      config: {
        applianceId: undefined,
        iBeaconMajor: undefined,
        iBeaconMinor: undefined,
        icon: 'ios-outlet',
        initializedSuccessfully: false,
        locationId: undefined,
        macAddress: undefined,
        name: 'Ceiling Light',
        updatedAt: 1
      },
      schedule: {},
      state: {currentUsage: 0, state: 1, updatedAt: 1},
      statistics: []
    }
  };


  let stateWithDevice = stoneReducer({}, addStoneAction);
  deepFreeze(stateWithDevice);

  t.deepEqual(stateWithDevice, expectedReturn, 'add a stone');

  expectedReturn.stoneId.config.name = 'Reading Light';
  t.deepEqual(stoneReducer(stateWithDevice, updateStoneAction), expectedReturn, 'update a stone');
  t.deepEqual(stoneReducer(stateWithDevice, removeStoneAction), {}, 'remove a stone');

  t.end();
});


test('stoneReducer UPDATE_BEHAVIOUR and UPDATE_BEHAVIOUR_CONFIG', function (t) {
  let addStoneAction = {
    type: 'ADD_STONE',
    stoneId: 'stoneId',
    data: {
      name: 'Ceiling Light',
    }
  };

  let updateBehaviourState1 = {
    type: 'UPDATE_STONE_BEHAVIOUR_FOR_onHomeEnter',
    stoneId: 'stoneId',
    data: {
      state: 1,
      delay: 120,
      fadeTime: 30
    }
  };
  let updateBehaviourState2 = {
    type: 'UPDATE_STONE_BEHAVIOUR_FOR_onHomeExit',
    stoneId: 'stoneId',
    data: {
      state: 0,
      delay: 300,
      fadeTime: 10
    }
  };
  let updateBehaviourState3 = {
    type: 'UPDATE_STONE_BEHAVIOUR_FOR_onRoomEnter',
    stoneId: 'stoneId',
    data: {
      state: 0.2,
      delay: 60,
      fadeTime: 20
    }
  };
  let updateBehaviourState4 = {
    type: 'UPDATE_STONE_BEHAVIOUR_FOR_onRoomExit',
    stoneId: 'stoneId',
    data: {
      state: 0,
      delay: 30,
      fadeTime: 2,
      active: true
    }
  };



  deepFreeze(addStoneAction);
  deepFreeze(updateBehaviourState1);

  let expectedReturn = {
    stoneId: {
      behaviour: {
        onHomeEnter: {
          active: false,
          delay: 120,
          fadeTime: 30,
          state: 1,
          updatedAt: 1
        },
        onHomeExit: {active: false, delay: 300, fadeTime: 10, state: 0, updatedAt: 1},
        onRoomEnter: {active: false, delay: 60, fadeTime: 20, state: 0.2, updatedAt: 1},
        onRoomExit: {active: true, delay: 30, fadeTime: 2, state: 0 ,updatedAt: 1}
      },
      config: {
        applianceId: undefined,
        iBeaconMajor: undefined,
        iBeaconMinor: undefined,
        icon: 'ios-outlet',
        initializedSuccessfully: false,
        locationId: undefined,
        macAddress: undefined,
        name: 'Ceiling Light',
        updatedAt: 1
      },
      schedule: {},
      state: {currentUsage: 0, state: 1, updatedAt: 1},
      statistics: []
    }
  };


  let stateWithDevice = stoneReducer({}, addStoneAction);
  deepFreeze(stateWithDevice);
  let state2 = stoneReducer(stateWithDevice, updateBehaviourState1);
  deepFreeze(state2);
  let state3 = stoneReducer(state2, updateBehaviourState2);
  deepFreeze(state3);
  let state4 = stoneReducer(state3, updateBehaviourState3);
  deepFreeze(state4);
  let state5 = stoneReducer(state4, updateBehaviourState4);
  t.deepEqual(state5, expectedReturn, 'update a stone behaviour settings');

  t.end();
});

console.log(process.env)