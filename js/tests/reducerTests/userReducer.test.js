var test = require('tape');
let deepFreeze = require('deep-freeze');

import reducer from '../../router/store/reducer'

test('userReducer USER_LOG_IN and USER_LOG_OUT', function (t) {
  t.deepEqual(reducer().user, {
      _accessToken: undefined,
      email: undefined,
      encryptionTokens: [],
      firstName: undefined,
      lastName: undefined,
      picture: null,
      _userId: []
    }
  );
  let initialState = reducer();
  let logInAction = {
    type: 'USER_LOG_IN',
    data: {
      firstName: 'alex',
      encryptionTokens: [{owner:'12345'}]
    }
  };

  let logOutAction = {
    type: 'USER_LOG_OUT'
  };

  deepFreeze(initialState);
  deepFreeze(logInAction);
  deepFreeze(logOutAction);

  let loggedInState = reducer(initialState, logInAction);
  deepFreeze(loggedInState);

  t.deepEqual(reducer(initialState, logInAction).user, {
    _accessToken: undefined,
    email: undefined,
    encryptionTokens: [{owner:'12345'}],
    firstName: 'alex',
    lastName: undefined,
    picture: null,
    _userId: []
  });
  t.deepEqual(reducer(loggedInState, logOutAction).user, reducer().user);
  t.end();
});
