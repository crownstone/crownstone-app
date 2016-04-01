var test = require('tape');
let deepFreeze = require('deep-freeze');

import stoneReducer from '../../router/store/reducers/stones'

test('stoneReducer ADD_LOCATION and REMOVE_LOCATION', function (t) {
  let addStoneAction = {
    type: 'ADD_STONE',
    stoneId: 'stoneId',
    data: {
      name:'Ceiling Light',
      icon:'light'
    }
  };

  let updateStoneAction = {
    type: 'UPDATE_STONE_CONFIG',
    stoneId: 'stoneId',
    data: {
      name:'Reading Light',
      icon:'light2'
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
        config: {onlyOffWhenEmpty: false, onlyOnAfterDusk: false},
        onHomeEnter: {state: undefined, fadeTime: 0, timeout: 0},
        onHomeExit: {state: undefined,  fadeTime: 0, timeout: 0},
        onRoomEnter: {state: undefined, fadeTime: 0, timeout: 0},
        onRoomExit: {state: undefined,  fadeTime: 0, timeout: 0}
      },
      config: {dimmable: false, icon: 'light', name: 'Ceiling Light'},
      linkedDevices: {onOff: {}, onOn: {}},
      schedule: [],
      state: {currentUsage: 0, state: 1},
      statistics: []
    }
  };


  let stateWithDevice = stoneReducer({}, addStoneAction);
  deepFreeze(stateWithDevice);

  t.deepEqual(stateWithDevice, expectedReturn, 'add a stone');

  expectedReturn.stoneId.config.name = 'Reading Light';
  expectedReturn.stoneId.config.icon = 'light2';
  t.deepEqual(stoneReducer(stateWithDevice, updateStoneAction), expectedReturn, 'update a stone');
  t.deepEqual(stoneReducer(stateWithDevice, removeStoneAction), {}, 'remove a stone');

  t.end();
});


test('stoneReducer UPDATE_BEHAVIOUR and UPDATE_BEHAVIOUR_CONFIG', function (t) {
  let addStoneAction = {
    type: 'ADD_STONE',
    stoneId: 'stoneId',
    data: {
      name:'Ceiling Light',
      icon:'light'
    }
  };

  let updateBehaviourState1 = {
    type: 'UPDATE_BEHAVIOUR_ON_HOME_ENTER',
    stoneId: 'stoneId',
    data: {
      state:1,
      timeout:120,
      fadeTime:30
    }
  };
  let updateBehaviourState2 = {
    type: 'UPDATE_BEHAVIOUR_ON_HOME_EXIT',
    stoneId: 'stoneId',
    data: {
      state:0,
      timeout:300,
      fadeTime:10
    }
  };
  let updateBehaviourState3 = {
    type: 'UPDATE_BEHAVIOUR_ON_ROOM_ENTER',
    stoneId: 'stoneId',
    data: {
      state:0.2,
      timeout:60,
      fadeTime:20
    }
  };
  let updateBehaviourState4 = {
    type: 'UPDATE_BEHAVIOUR_ON_ROOM_EXIT',
    stoneId: 'stoneId',
    data: {
      state:0,
      timeout:30,
      fadeTime:2
    }
  };

  let updateBehaviourConfigState = {
    type: 'UPDATE_BEHAVIOUR_CONFIG',
    stoneId: 'stoneId',
    data: {
      onlyOnAfterDusk:true
    }
  };


  deepFreeze(addStoneAction);
  deepFreeze(updateBehaviourState1);
  deepFreeze(updateBehaviourConfigState);

  let expectedReturn = {
    stoneId: {
      behaviour: {
        config: {onlyOffWhenEmpty: false, onlyOnAfterDusk: true},
        onHomeEnter: {state: 1, fadeTime: 30, timeout: 120},
        onHomeExit: {state: 0,  fadeTime: 10, timeout: 300},
        onRoomEnter: {state: 0.2, fadeTime: 20, timeout: 60},
        onRoomExit: {state: 0,  fadeTime: 2, timeout: 30}
      },
      config: {dimmable: false, icon: 'light', name: 'Ceiling Light'},
      linkedDevices: {onOff: {}, onOn: {}},
      schedule: [],
      state: {currentUsage: 0, state: 1},
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
  deepFreeze(state5);
  t.deepEqual(stoneReducer(state5, updateBehaviourConfigState), expectedReturn, 'update a stone behaviour settings');

  t.end();
});