var test = require('tape');
let deepFreeze = require('deep-freeze');

import groupReducer from '../../router/store/reducers/groups'

test('Should Update', function (t) {

  let state = groupReducer({}, {type:'ADD_GROUP', groupId:'hello'})
  let state2 = groupReducer(state, {});

  t.deepEqual(state == state2, true, 'state == state2' );

  let state3 = groupReducer(state, {type:"ADD_MEMBER", groupId:'hello', memberId:'bob', data:{firstName:'bob'}});

  t.deepEqual(state == state3, true, 'not equal to changed version' );
  t.deepEqual(state.hello.config == state3.hello.config, true, 'unchanged config remains the same' );
  t.end();
});


