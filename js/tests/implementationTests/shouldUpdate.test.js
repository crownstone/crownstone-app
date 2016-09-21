var test = require('tape');
let deepFreeze = require('deep-freeze');

import sphereReducer from '../../router/store/reducers/spheres'

test('Should Update', function (t) {

  let state = sphereReducer({}, {type:'ADD_SPHERE', sphereId:'hello'});
  let state2 = sphereReducer(state, {});

  t.deepEqual(state == state2, true, 'state == state2' );

  let state3 = sphereReducer(state, {type:"ADD_MEMBER", sphereId:'hello', memberId:'bob', data:{firstName:'bob'}});

  t.deepEqual(state == state3, false, 'not equal to changed version' );
  t.deepEqual(state.hello.config == state3.hello.config, true, 'unchanged config remains the same' );
  t.end();
});


