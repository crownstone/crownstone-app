'use strict';
// __tests__/Intro-test.js
// Note: test renderer must be required after react-native.
let jest = require('jest');
jest.mock('react-native-fs', () => {return {};});
jest.mock('react-native-device-info');

jest.mock('../js/ExternalConfig', () => {
  return {
    RELEASE_MODE_USED: false,
    PROMISE_MANAGER_FALLBACK_TIMEOUT: 200,
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
    SCHEDULER_FALLBACK_TICK: 1,
  }
});

import { BlePromiseManager } from '../js/logic/BlePromiseManager'
import { Scheduler } from '../js/logic/Scheduler'

let counter = 0;

let successfulPromiseAction = (x) => {
  return new Promise((resolve, reject) => {
    counter++;
    setTimeout(() => {
      expect(x).toEqual(counter);
      resolve();
    }, 100)
  })
};

let successfulLongPromiseAction = (x) => {
  return new Promise((resolve, reject) => {
    counter++;
    setTimeout(() => {
      resolve();
    }, 300)
  })
};

test('PromiseManager load', () => {
  return new Promise((testResolve, testReject) => {

    let promises = [];
    promises.push(BlePromiseManager.register(() => { return successfulPromiseAction(1) }, 's1'));
    promises.push(BlePromiseManager.register(() => { return successfulPromiseAction(3) }, 's1'));
    promises.push(BlePromiseManager.register(() => { return successfulPromiseAction(4) }, 's1'));
    promises.push(BlePromiseManager.register(() => { return successfulPromiseAction(5) }, 's1'));
    promises.push(BlePromiseManager.registerPriority(() => { return successfulPromiseAction(2) }, 's1'));

    Promise.all(promises).then(testResolve).catch(testReject);
  });
});

test('PromiseManager timeout successfully handled', () => {
  Scheduler._loadStore({
      getState: () => {
        return {}
      },
      subscribe: () => { },
      dispatch: () => { }
    }
  );
  counter = 0;
  return new Promise((testResolve, testReject) => {

    let promises = [];
    let orderCounter = 1;
    promises.push(BlePromiseManager.register(() => { return successfulPromiseAction(orderCounter++) }, 's1'));
    promises.push(BlePromiseManager.register(() => { return successfulLongPromiseAction(orderCounter++) }, 's2').catch(() => {}));
    promises.push(BlePromiseManager.register(() => { return successfulPromiseAction(orderCounter++) }, 's3'));
    promises.push(BlePromiseManager.register(() => { return successfulPromiseAction(orderCounter++) }, 's4'));
    promises.push(BlePromiseManager.register(() => { return successfulPromiseAction(orderCounter++) }, 's5'));

    Promise.all(promises).then(testResolve).catch(testReject);
  })
    .then(() => {
      Scheduler.clearSchedule();
    })
    .catch((err) => {
      Scheduler.clearSchedule();
      throw err;
    })
});


