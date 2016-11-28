const test = require('tape');
let deepFreeze = require('deep-freeze');

import applianceReducer from '../../router/store/reducers/appliances'

// hack to remove the current time from the reducer so we can predictably match the results.
Date.prototype.valueOf = function () {
  return 1
};

test('applianceReducer ADD_LOCATION and REMOVE_LOCATION', function (t) {
  let addApplianceAction = {
    type: 'ADD_APPLIANCE',
    applianceId: 'appliance_id',
    data: {
      name: 'Ceiling Light',
    }
  };

  let updateApplianceAction = {
    type: 'UPDATE_APPLIANCE_CONFIG',
    applianceId: 'appliance_id',
    data: {
      name: 'Reading Light',
    }
  };

  let removeApplianceAction = {
    type: 'REMOVE_APPLIANCE',
    applianceId: 'appliance_id',
  };

  deepFreeze(addApplianceAction);
  deepFreeze(updateApplianceAction);
  deepFreeze(removeApplianceAction);

  let expectedReturn = {
    appliance_id: {
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
      config: {dimmable: false, icon: undefined, name: 'Ceiling Light', updatedAt: 1},
      linkedAppliances: {onOff: {}, onOn: {}, updatedAt: 1},
      schedule: {}
    }
  };


  let stateWithDevice = applianceReducer({}, addApplianceAction);
  deepFreeze(stateWithDevice);

  t.deepEqual(stateWithDevice, expectedReturn, 'add a appliance');

  expectedReturn.appliance_id.config.name = 'Reading Light';
  t.deepEqual(applianceReducer(stateWithDevice, updateApplianceAction), expectedReturn, 'update a appliance');
  t.deepEqual(applianceReducer(stateWithDevice, removeApplianceAction), {}, 'remove a appliance');

  t.end();
});


test('applianceReducer UPDATE_BEHAVIOUR and UPDATE_BEHAVIOUR_CONFIG', function (t) {
  let addApplianceAction = {
    type: 'ADD_appliance',
    applianceId: 'applianceId',
    data: {
      name: 'Ceiling Light',
    }
  };

  let updateBehaviourState1 = {
    type: 'UPDATE_APPLIANCE_BEHAVIOUR_FOR_onHomeEnter',
    applianceId: 'applianceId',
    data: {
      state: 1,
      delay: 120,
      fadeTime: 30
    }
  };
  let updateBehaviourState2 = {
    type: 'UPDATE_APPLIANCE_BEHAVIOUR_FOR_onHomeExit',
    applianceId: 'applianceId',
    data: {
      state: 0,
      delay: 300,
      fadeTime: 10
    }
  };
  let updateBehaviourState3 = {
    type: 'UPDATE_APPLIANCE_BEHAVIOUR_FOR_onRoomEnter',
    applianceId: 'applianceId',
    data: {
      state: 0.2,
      delay: 60,
      fadeTime: 20
    }
  };
  let updateBehaviourState4 = {
    type: 'UPDATE_APPLIANCE_BEHAVIOUR_FOR_onRoomExit',
    applianceId: 'applianceId',
    data: {
      state: 0,
      delay: 30,
      fadeTime: 2,
      active: true
    }
  };


  deepFreeze(addApplianceAction);
  deepFreeze(updateBehaviourState1);

  let expectedReturn = {
    applianceId: {
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
        onRoomExit: {active: true, delay: 30, fadeTime: 2, state: 0, updatedAt: 1}
      },
      config: {dimmable: false, icon: undefined, name: undefined, updatedAt: 1},
      linkedAppliances: {onOff: {}, onOn: {}, updatedAt: 1},
      schedule: {}
    }
  };


  let stateWithDevice = applianceReducer({}, addApplianceAction);
  deepFreeze(stateWithDevice);
  let state2 = applianceReducer(stateWithDevice, updateBehaviourState1);
  deepFreeze(state2);
  let state3 = applianceReducer(state2, updateBehaviourState2);
  deepFreeze(state3);
  let state4 = applianceReducer(state3, updateBehaviourState3);
  deepFreeze(state4);
  let state5 = applianceReducer(state4, updateBehaviourState4);
  t.deepEqual(state5, expectedReturn, 'update a appliance behaviour settings');

  t.end();
});