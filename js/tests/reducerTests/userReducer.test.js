const test = require('tape');
let deepFreeze = require('deep-freeze');


// hack to remove the current time from the reducer so we can predictably match the results.
Date.prototype.valueOf = function () {
  return 1
};

import reducer from '../../router/store/reducer'


test('userReducer USER_LOG_IN and USER_LOG_OUT', function (t) {
  t.deepEqual(reducer().user, {
      accessToken: undefined,
      email: undefined,
      firstName: undefined,
      lastName: undefined,
      picture: null,
      updatedAt: 1,
      userId: undefined
    }
  );
  let initialState = reducer();
  let logInAction = {
    type: 'USER_LOG_IN',
    data: {
      firstName: 'alex'
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
    accessToken: undefined,
    email: undefined,
    firstName: 'alex',
    lastName: undefined,
    picture: null,
    updatedAt: 1,
    userId: undefined
  });
  t.deepEqual(reducer(loggedInState, logOutAction).user, reducer().user);
  t.end();
});
