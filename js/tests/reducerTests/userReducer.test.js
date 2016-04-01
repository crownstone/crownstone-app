var test = require('tape');
let deepFreeze = require('deep-freeze');

import userReducer from '../../router/store/reducers/user'

test('userReducer USER_LOG_IN and USER_LOG_OUT', function (t) {
  t.deepEqual(userReducer(), {
    name: undefined,
    tokens: [],
    picture: undefined
  });
  let initialState = userReducer();
  let logInAction = {
    type: 'USER_LOG_IN',
    data: {
      name: 'alex',
      tokens: [{owner:'12345'}]
    }
  };

  let logOutAction = {
    type: 'USER_LOG_OUT'
  };

  deepFreeze(initialState);
  deepFreeze(logInAction);
  deepFreeze(logOutAction);

  let loggedInState = userReducer(initialState, logInAction);
  deepFreeze(loggedInState);

  t.deepEqual(userReducer(initialState, logInAction), {name: 'alex', tokens: [{owner:'12345'}], picture:undefined});
  t.deepEqual(userReducer(loggedInState, logOutAction), {});
  t.end();
});
