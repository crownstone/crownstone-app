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


jest.mock('../js/logic/BatchCommandHandler', () => {
  return {
    BatchCommandHandler: {
      load: (stone, stoneId, sphereId, command, attempts) => {
        return new Promise((resolve, reject) => {
          expect(command.state).toBe(this.__expectation.state);
          expect(this.__counter <= this.__expectation.times).toBe(true);
          this.__counter++;
          resolve();
        })
          .catch((err) => {
            this.__errorState = true;
            throw err;
          })
      },
      execute: () => { },
      __counter: 0,
      __totalLoads: 0,
      __setTotalLoads: (amount) => {
        this.__totalLoads = amount;
      },
      __getTotalLoads: () => {
        return this.__totalLoads;
      },
      __errorState: false,
      __expectation: {},
      __mockSetExpectation: (expectation) => {
        this.__counter = 0;
        this.__expectation = expectation
      },
      __getErrorState: () => {
        return this.__errorState;
      }
    }
  }
});


jest.mock('../js/native/advertisements/StoneStateHandler', () => {
  return {
    StoneStateHandler: {
      receivedIBeaconUpdate: () => { },
    }
  }
});


import { StoneTracker } from '../js/native/advertisements/StoneTracker'
import { addDistanceToRssi } from '../js/util/Util'
import * as mockBatchCommandHandler from '../js/logic/BatchCommandHandler'

beforeEach(() => {});
afterEach(() => {});

test('stoneTrackerTest', () => {
  let tracker = new StoneTracker({
    getState: () => {
      return {
        spheres: {
          test_sphereId: {
            stones: {
              test_stoneId: {
                config: {
                  iBeaconMajor: 1,
                  iBeaconMinor: 2,
                  nearThreshold: -65,
                  handle: 'test_handle',
                  state: {
                    state: 0.0,
                    currentUsage: 0,
                    updatedAt: 1
                  },
                  schedule: {
                    updatedAt: 1
                  },
                },
                behaviour: {
                  onNear: {
                    state: 1,
                    delay: 0,
                    active: true
                  },
                  onAway: {
                    state: 0,
                    delay: 2,
                    active: true
                  },
                }
              }
            }
          }
        }
      }
    },
    subscribe: () => {
    },
    dispatch: () => { }
  });

  // near
  let totalLoads = 3;
  mockBatchCommandHandler.BatchCommandHandler.__setTotalLoads(totalLoads);
  mockBatchCommandHandler.BatchCommandHandler.__mockSetExpectation({times: 1, state: 1});
  tracker.iBeaconUpdate(1,2,-63,'test_sphereId');
  tracker.iBeaconUpdate(1,2,-63,'test_sphereId');
  tracker.iBeaconUpdate(1,2,-63,'test_sphereId');
  tracker.iBeaconUpdate(1,2,-63,'test_sphereId');
  tracker.iBeaconUpdate(1,2,-63,'test_sphereId');
  tracker.iBeaconUpdate(1,2,-63,'test_sphereId');
  tracker.iBeaconUpdate(1,2,-63,'test_sphereId');
  tracker.iBeaconUpdate(1,2,-63,'test_sphereId');
  tracker.iBeaconUpdate(1,2,-63,'test_sphereId');

  let inBetweenDistance = addDistanceToRssi(-65, 0.5); // == -67.15

  //in between
  tracker.iBeaconUpdate(1,2,inBetweenDistance+1,'test_sphereId');
  tracker.iBeaconUpdate(1,2,inBetweenDistance+1,'test_sphereId');
  tracker.iBeaconUpdate(1,2,inBetweenDistance+1,'test_sphereId');
  tracker.iBeaconUpdate(1,2,inBetweenDistance+1,'test_sphereId');
  tracker.iBeaconUpdate(1,2,inBetweenDistance+1,'test_sphereId');
  tracker.iBeaconUpdate(1,2,inBetweenDistance+1,'test_sphereId');

  //away
  mockBatchCommandHandler.BatchCommandHandler.__mockSetExpectation({times: 1, state: 0});
  tracker.iBeaconUpdate(1,2,-88,'test_sphereId');
  tracker.iBeaconUpdate(1,2,-88,'test_sphereId');
  tracker.iBeaconUpdate(1,2,-88,'test_sphereId');
  tracker.iBeaconUpdate(1,2,-88,'test_sphereId');
  tracker.iBeaconUpdate(1,2,-88,'test_sphereId');
  tracker.iBeaconUpdate(1,2,-88,'test_sphereId');

  mockBatchCommandHandler.BatchCommandHandler.__mockSetExpectation({times: 1, state: 1});
  tracker.iBeaconUpdate(1,2,-63,'test_sphereId');
  tracker.iBeaconUpdate(1,2,-63,'test_sphereId');
  tracker.iBeaconUpdate(1,2,-63,'test_sphereId');
  tracker.iBeaconUpdate(1,2,-63,'test_sphereId');
  tracker.iBeaconUpdate(1,2,-63,'test_sphereId');
  tracker.iBeaconUpdate(1,2,-63,'test_sphereId');
  tracker.iBeaconUpdate(1,2,-63,'test_sphereId');
  tracker.iBeaconUpdate(1,2,-63,'test_sphereId');
  tracker.iBeaconUpdate(1,2,-63,'test_sphereId');

  // check if they all fired.
  expect(mockBatchCommandHandler.BatchCommandHandler.__getTotalLoads()).toBe(totalLoads);

  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (mockBatchCommandHandler.BatchCommandHandler.__getErrorState()) {
        return reject()
      }
      resolve()
    }, 500)
  })


});


