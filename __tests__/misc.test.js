'use strict';
// __tests__/Intro-test.js
// Note: test renderer must be required after react-native.
let jest = require('jest');
jest.mock('react-native-fs', () => {return {};});
jest.mock('react-native-device-info');
jest.mock('../js/ExternalConfig', () => {
  return {
    RELEASE_MODE_USED: false,
    PROMISE_MANAGER_FALLBACK_TIMEOUT: 60000,
    LOG_INFO       : false,
    LOG_WARNINGS   : false,
    LOG_ERRORS     : false,
    LOG_VERBOSE    : false,
    LOG_SCHEDULER  : false,
    LOG_BLE        : false,
    LOG_EVENTS     : false,
    LOG_STORE      : false,
    LOG_MESH       : false,
    LOG_CLOUD      : false,
    LOG_DEBUG      : false,
    MESH_ENABLED   : true,
    SCHEDULER_FALLBACK_TICK: 1,
    TRIGGER_TIME_BETWEEN_SWITCHING_NEAR_AWAY: 1,
  }
});

test('returning Promise with catch.', () => {
  let getSuccessfulPromise = () => {
    return new Promise((resolve, reject) => {
        setTimeout(() => { resolve() }, 20);
      }).then(() => {}).catch(() => {})
  };

  let getFailingPromise = () => {
    return new Promise((resolve, reject) => {
      setTimeout(() => { reject() }, 20);
    }).then(() => {}).catch(() => {})
  };

  getSuccessfulPromise().then(() => { expect(true).toBe(true) }).catch(() => { expect(true).toBe(false)});
  getFailingPromise().then(() => { expect(true).toBe(true) }).catch(() => { expect(true).toBe(false)});
});

import { BehaviourUtil } from '../js/util/BehaviourUtil'
test('check morning/evening times', () => {
  console.log(BehaviourUtil.getEveningTimes())
});
