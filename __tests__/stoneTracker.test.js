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

jest.mock('../js/logic/BatchCommandHandler', () => {
  return {
    BatchCommandHandler: {
      load: (stone, stoneId, sphereId, command, attempts) => {
        this.__totalLoads++;
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
      loadPriority: (stone, stoneId, sphereId, command, attempts) => {
        this.__totalLoads++;
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
      execute: () => { this.__totalExecutes++ },
      executePriority: () => { this.__totalExecutes++ },
      __counter: 0,
      __totalLoads: 0,
      __totalExecutes: 0,
      __setTotalLoads: (amount) => {
        this.__totalLoads = amount;
      },
      __getTotalLoads: () => {
        return this.__totalLoads;
      },
      __setTotalExecutes: (amount) => {
        this.__totalExecutes = amount;
      },
      __getTotalExecutes: () => {
        return this.__totalExecutes;
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

jest.mock('PushNotificationIOS', () => ({ }));
jest.mock('Linking', () => {});
jest.mock('NetInfo', () => {});

import { StoneTracker } from '../js/native/advertisements/StoneTracker'
import { addDistanceToRssi } from '../js/util/Util'
import * as mockBatchCommandHandler from '../js/logic/BatchCommandHandler'

test('stoneTrackerTest', () => {
  // prep
  let tracker = new StoneTracker({
    getState: () => {
      return {
        app: {tapToToggleEnabled: false},
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
  mockBatchCommandHandler.BatchCommandHandler.__setTotalLoads(0);
  mockBatchCommandHandler.BatchCommandHandler.__setTotalExecutes(0);
  return new Promise((resolve, reject) => {
      // test Near Event
      mockBatchCommandHandler.BatchCommandHandler.__mockSetExpectation({times: 1, state: 1});
      tracker.iBeaconUpdate(1, 2, -63, 'test_sphereId');
      tracker.iBeaconUpdate(1, 2, -63, 'test_sphereId');
      tracker.iBeaconUpdate(1, 2, -63, 'test_sphereId');
      tracker.iBeaconUpdate(1, 2, -63, 'test_sphereId');
      tracker.iBeaconUpdate(1, 2, -63, 'test_sphereId');
      tracker.iBeaconUpdate(1, 2, -63, 'test_sphereId');
      tracker.iBeaconUpdate(1, 2, -63, 'test_sphereId');
      setTimeout(() => {resolve();},100);
    })
    .then(() => {
      return new Promise((resolve, reject) => {
        let inBetweenDistance = addDistanceToRssi(-65, 0.5); // == -67.15
        //in between
        setTimeout(() => {
          tracker.iBeaconUpdate(1,2, inBetweenDistance + 1,'test_sphereId');
          tracker.iBeaconUpdate(1,2, inBetweenDistance + 1,'test_sphereId');
          tracker.iBeaconUpdate(1,2, inBetweenDistance + 1,'test_sphereId');
          tracker.iBeaconUpdate(1,2, inBetweenDistance + 1,'test_sphereId');
          tracker.iBeaconUpdate(1,2, inBetweenDistance + 1,'test_sphereId');
          tracker.iBeaconUpdate(1,2, inBetweenDistance + 1,'test_sphereId');
          setTimeout(() => {resolve();},100);
        },2);
      })
    })
    .then(() => {
      return new Promise((resolve, reject) => {
        //away
        setTimeout(() => {
          mockBatchCommandHandler.BatchCommandHandler.__mockSetExpectation({times: 1, state: 0});
          tracker.iBeaconUpdate(1,2,-88,'test_sphereId');
          tracker.iBeaconUpdate(1,2,-88,'test_sphereId');
          tracker.iBeaconUpdate(1,2,-88,'test_sphereId');
          tracker.iBeaconUpdate(1,2,-88,'test_sphereId');
          tracker.iBeaconUpdate(1,2,-88,'test_sphereId');
          tracker.iBeaconUpdate(1,2,-88,'test_sphereId');
          setTimeout(() => {resolve();},100);
        },2);
      })
    })
    .then(() => {
      return new Promise((resolve, reject) => {
        //near
        setTimeout(() => {
          mockBatchCommandHandler.BatchCommandHandler.__mockSetExpectation({times: 1, state: 1});
          tracker.iBeaconUpdate(1,2,-63,'test_sphereId');
          tracker.iBeaconUpdate(1,2,-63,'test_sphereId');
          tracker.iBeaconUpdate(1,2,-63,'test_sphereId');
          tracker.iBeaconUpdate(1,2,-63,'test_sphereId');
          tracker.iBeaconUpdate(1,2,-63,'test_sphereId');
          tracker.iBeaconUpdate(1,2,-63,'test_sphereId');
          setTimeout(() => {resolve();},100);
        },2);
      })
    })
    .then(() => {
      expect(mockBatchCommandHandler.BatchCommandHandler.__getTotalLoads()).toBe(3);
      expect(mockBatchCommandHandler.BatchCommandHandler.__getTotalExecutes()).toBe(3);
      if (mockBatchCommandHandler.BatchCommandHandler.__getErrorState() === true) {
        throw "Error in mockBatchCommandHandler after test"
      }
    })
});

test('stoneTracker Alternating', () => {
  // prep
  let tracker = new StoneTracker({
    getState: () => {
      return {
        app: {tapToToggleEnabled: false},
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
  mockBatchCommandHandler.BatchCommandHandler.__setTotalLoads(0);
  mockBatchCommandHandler.BatchCommandHandler.__setTotalExecutes(0);
  return new Promise((resolve, reject) => {
    // test Near Event
    mockBatchCommandHandler.BatchCommandHandler.__mockSetExpectation({times: 1, state: 1});
    tracker.iBeaconUpdate(1, 2, -63, 'test_sphereId');
    setTimeout(() => {resolve();},100);
  })
    .then(() => {
      return new Promise((resolve, reject) => {
        let inBetweenDistance = addDistanceToRssi(-65, 0.5); // == -67.15
        //in between
        tracker.iBeaconUpdate(1,2, inBetweenDistance + 1,'test_sphereId');
        tracker.iBeaconUpdate(1,2, inBetweenDistance + 1,'test_sphereId');
        tracker.iBeaconUpdate(1,2, inBetweenDistance + 1,'test_sphereId');
        tracker.iBeaconUpdate(1,2, inBetweenDistance + 1,'test_sphereId');
        tracker.iBeaconUpdate(1,2, inBetweenDistance + 1,'test_sphereId');
        tracker.iBeaconUpdate(1,2, inBetweenDistance + 1,'test_sphereId');
        setTimeout(() => {resolve();},100);
      })
    })
    .then(() => {
      return new Promise((resolve, reject) => {
        //away
        mockBatchCommandHandler.BatchCommandHandler.__mockSetExpectation({times: 1, state: 0});
        tracker.iBeaconUpdate(1,2,-88,'test_sphereId');
        tracker.iBeaconUpdate(1,2,-88,'test_sphereId');
        tracker.iBeaconUpdate(1,2,-88,'test_sphereId');
        tracker.iBeaconUpdate(1,2,-88,'test_sphereId');
        tracker.iBeaconUpdate(1,2,-88,'test_sphereId');
        tracker.iBeaconUpdate(1,2,-88,'test_sphereId');
        setTimeout(() => {resolve();},100);
      })
    })
    .then(() => {
      return new Promise((resolve, reject) => {
        //near
        mockBatchCommandHandler.BatchCommandHandler.__mockSetExpectation({times: 1, state: 1});
        tracker.iBeaconUpdate(1,2,-63,'test_sphereId');
        tracker.iBeaconUpdate(1,2,-63,'test_sphereId');
        tracker.iBeaconUpdate(1,2,-63,'test_sphereId');
        tracker.iBeaconUpdate(1,2,-63,'test_sphereId');
        tracker.iBeaconUpdate(1,2,-63,'test_sphereId');
        tracker.iBeaconUpdate(1,2,-63,'test_sphereId');
        setTimeout(() => {resolve();},100);
      })
    })
    .then(() => {
      expect(mockBatchCommandHandler.BatchCommandHandler.__getTotalLoads()).toBe(3);
      expect(mockBatchCommandHandler.BatchCommandHandler.__getTotalExecutes()).toBe(3);
      if (mockBatchCommandHandler.BatchCommandHandler.__getErrorState() === true) {
        throw "Error in mockBatchCommandHandler after test"
      }
    })
});



