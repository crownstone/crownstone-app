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
        onHomeEnter: {state: 1, fadeTime: 0, delay: 0, active: false},
        onHomeExit: {state: 1,  fadeTime: 0, delay: 0, active: false},
        onRoomEnter: {state: 1, fadeTime: 0, delay: 0, active: false},
        onRoomExit: {state: 1,  fadeTime: 0, delay: 0, active: false}
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
    type: 'UPDATE_BEHAVIOUR_FOR_onHomeEnter',
    stoneId: 'stoneId',
    data: {
      state:1,
      delay:120,
      fadeTime:30
    }
  };
  let updateBehaviourState2 = {
    type: 'UPDATE_BEHAVIOUR_FOR_onHomeExit',
    stoneId: 'stoneId',
    data: {
      state:0,
      delay:300,
      fadeTime:10
    }
  };
  let updateBehaviourState3 = {
    type: 'UPDATE_BEHAVIOUR_FOR_onRoomEnter',
    stoneId: 'stoneId',
    data: {
      state:0.2,
      delay:60,
      fadeTime:20
    }
  };
  let updateBehaviourState4 = {
    type: 'UPDATE_BEHAVIOUR_FOR_onRoomExit',
    stoneId: 'stoneId',
    data: {
      state:0,
      delay:30,
      fadeTime:2,
      active: true
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
        onHomeEnter:  {state: 1,    fadeTime: 30, active: false, delay: 120},
        onHomeExit:   {state: 0,    fadeTime: 10, active: false, delay: 300},
        onRoomEnter:  {state: 0.2,  fadeTime: 20, active: false, delay: 60},
        onRoomExit:   {state: 0,    fadeTime: 2,  active: true, delay: 30}
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