'use strict';
// __tests__/Intro-test.js
// Note: test renderer must be required after react-native.
let jest = require('jest');
jest.mock('react-native-fs', () => {return {};});
jest.mock('react-native-device-info');


jest.mock('../js/logging/LogProcessor', () => {
  return {LogProcessor:{
    log_info:      100,
    log_warnings:  100,
    log_errors:    100,
    log_mesh:      100,
    log_scheduler: 100,
    log_verbose:   100,
    log_ble:       100,
    log_events:    100,
    log_store:     100,
    log_cloud:     100,
    log_debug:     100,
  }}
});

jest.mock('../js/ExternalConfig', () => {
  return {
    CLOUD_ADDRESS: 'https://crownstone-cloud-dev.herokuapp.com/api/',
    DEBUG:          true,
    LOG_SCHEDULER:  300,
    LOG_BLE:        300,
    LOG_EVENTS:     300,
    LOG_STORE:      300,
    LOG_MESH:       300,
    LOG_CLOUD:      300,
    LOG_DEBUG:      300,
    LOG_INFO:       300,
    LOG_ERRORS:     300,
    LOG_WARNINGS:   300,
    LOG_VERBOSE:    300,
    LOG_TO_FILE: false,
    MESH_ENABLED: true,
    DISABLE_NATIVE: false,
    SILENCE_CLOUD: true,
    OVERRIDE_DATABASE: false,
    NO_LOCATION_NAME: 'None',
    ENCRYPTION_ENABLED: true,
    AMOUNT_OF_CROWNSTONES_FOR_INDOOR_LOCALIZATION: 4,
    NETWORK_REQUEST_TIMEOUT: 15000,
    HIGH_FREQUENCY_SCAN_MAX_DURATION: 15000,
    DISABLE_TIMEOUT: 30000,
    KEEPALIVE_INTERVAL: 60,
    PROMISE_MANAGER_FALLBACK_TIMEOUT: 60000,
    KEEPALIVE_REPEAT_ATTEMPTS: 1,
    RESET_TIMER_FOR_NEAR_AWAY_EVENTS: 20000,
    RELEASE_MODE_USED: false,
    TESTING_APP: true,
    TESTING_IN_PROCESS: true,
    LOCAL_TESTING: false
  }
});

let mockStone1 =      {config: {crownstoneId:'CSID1', meshNetworkId : 1, handle:'handle-CSID-1'}};
let mockStone2 =      {config: {crownstoneId:'CSID2', meshNetworkId : 1, handle:'handle-CSID-2'}};
let mockStone3 =      {config: {crownstoneId:'CSID3', meshNetworkId : 1, handle:'handle-CSID-3'}};
let mockStone4 =      {config: {crownstoneId:'CSID4', meshNetworkId : 2, handle:'handle-CSID-4'}};
let mockStone5 =      {config: {crownstoneId:'CSID5', meshNetworkId : 3, handle:'handle-CSID-5'}};
let mockStone6 =      {config: {crownstoneId:'CSID6', meshNetworkId : null, handle:'handle-CSID-6'}};
let keepAlive =      { commandName:'keepAlive'};
let getHardwareVersion = { commandName:'getHardwareVersion'};
let keepAliveState = { commandName:'keepAliveState', state: 1, timeout: 150, changeState: true };
let setSwitchState = { commandName:'setSwitchState', state: 1};
let multiSwitch =    { commandName:'multiSwitch',    state: 1, timeout: 0, intent: 4};

let meshEmit1 = {
  handle: 'handle-CSID-1',
  stoneId: 'stoneId1',
  meshNetworkId: 1,
  rssi: -60,
};
let meshEmit2 = {
  handle: 'handle-CSID-4',
  stoneId: 'stoneId4',
  meshNetworkId: 2,
  rssi: -60,
};

import { eventBus } from '../js/util/EventBus'

jest.mock('../js/native/libInterface/Bluenet', () => {
  return {
    eventBus: null,
    success: true,
    Bluenet: {
      connect: (handle, callback) => {
        this.eventBus.emit('test', {command:'connect', args:[handle]});
        setTimeout(() => { callback({error: !this.success}); }, 100);
      },
      multiSwitch: (arr, callback) => {
        this.eventBus.emit('test', {command:'multiSwitch', args:[arr]});
        setTimeout(() => { callback({error: !this.success}); }, 100);
      },
      keepAlive: (callback) => {
        this.eventBus.emit('test', {command:'keepAlive', args:[]});
        setTimeout(() => { callback({error: !this.success}); }, 100);
      },
      keepAliveState: (changeState, state, timeout, callback) => {
        this.eventBus.emit('test', {command:'keepAliveState', args:[changeState, state, timeout]});
        setTimeout(() => { callback({error: !this.success}); }, 100);
      },
      meshKeepAliveState: (maxTimeout, stoneKeepAlivePackets, callback) => {
        this.eventBus.emit('test', {command:'meshKeepAliveState', args:[maxTimeout, stoneKeepAlivePackets]});
        setTimeout(() => { callback({error: !this.success}); }, 100);
      },
      meshKeepAlive: (callback) => {
        this.eventBus.emit('test', {command:'meshKeepAlive', args:[]});
        setTimeout(() => { callback({error: !this.success}); }, 100);
      },
      disconnectCommand: (callback) => {
        this.eventBus.emit('test', {command:'disconnectCommand', args:[]});
        setTimeout(() => { callback({error: !this.success}); }, 100);
      },
      phoneDisconnect: (callback) => {
        this.eventBus.emit('test', {command:'phoneDisconnect', args:[]});
        setTimeout(() => { callback({error: !this.success}); }, 100);
      },
      getHardwareVersion: (callback) => {
        this.eventBus.emit('test', {command:'getHardwareVersion', args:[]});
        setTimeout(() => { callback({error: !this.success}); }, 100);
      },
    },
    loadEventBus: (bus) => {
      this.eventBus = bus;
    },
    doSuccess: () => {
      this.success = true;
    },
    doFail: () => {
      this.success = false;
    }
  }
});

let timeStart = new Date().valueOf();
function time(string) {
  console.log(string,' @time since start:', new Date().valueOf() - timeStart);
}
let counter = 0;
let expectedArray = [];

let checker = (data, reject) => {
  if (expectedArray.length - 1 < counter) {
    reject('Got test event while not expecting one: ' + JSON.stringify(data, undefined, 2));
    return;
  }

  let expected = expectedArray[counter];
  if (data.promise !== undefined) {
    try{
      expect(data.command).toEqual(expected.command);
      expect(data.id).toEqual(expected.id);
      expect(data.promise).toEqual(expected.promise);
    }
    catch(err) {
      console.log('FAILED ON :',data, 'EXPECTED', expectedArray[counter]);
      reject(err);
      return;
    }
  }
  else {
    try {
      expect(data.command).toEqual(expected.command);
      expect(data.args).toEqual(expected.args);
    }
    catch (err) {
      reject(err);
      return;
    }
  }
  counter += 1;
};

import * as mockBluenet from '../js/native/libInterface/Bluenet'
import { EventBusClass } from '../js/util/EventBus'
import { BatchCommandHandler } from '../js/logic/BatchCommandHandler'

test('BatchCommandHandler Mesh', () => {
  // prep
  let testBus = new EventBusClass();
  mockBluenet.loadEventBus(testBus);
  mockBluenet.doSuccess();

  timeStart = new Date().valueOf();
  counter = 0;
  expectedArray = [
    {command: 'connect', args: ['handle-CSID-1']},
    {command: 'multiSwitch', args: [[{'crownstoneId': 'CSID1', 'intent': 4, 'state': 1, 'timeout': 0}, {'crownstoneId': 'CSID2', 'intent': 4, 'state': 1, 'timeout': 0}, {'crownstoneId': 'CSID3', 'intent': 4, 'state': 1, 'timeout': 0}]]},
    {promise: 'resolved', command: 'multiSwitch', id: 'load_stoneId1'},
    {promise: 'resolved', command: 'multiSwitch', id: 'load_stoneId2'},
    {promise: 'resolved', command: 'multiSwitch', id: 'load_stoneId3'},
    {command: 'meshKeepAliveState', args: [150, [{'action': true, 'crownstoneId': 'CSID2', 'state': 1}, {'action': true, 'crownstoneId': 'CSID3', 'state': 1}]]},
    {promise: 'resolved', command: 'keepAliveState', id: 'load_stoneId2'},
    {promise: 'resolved', command: 'keepAliveState', id: 'load_stoneId3'},
    {command: 'meshKeepAliveState', args: [150, [{'action': true, 'crownstoneId': 'CSID1', 'state': 1}, {'action': true, 'crownstoneId': 'CSID3', 'state': 1}]]},
    {promise: 'resolved', command: 'keepAliveState', id: 'load_stoneId1'},
    {promise: 'resolved', command: 'keepAliveState', id: 'load_stoneId3'},
    {command: 'disconnectCommand', args: []},
    {command: 'connect', args: ['handle-CSID-4']},
    {command: 'multiSwitch',  args: [[{'crownstoneId': 'CSID4', 'intent': 4, 'state': 1, 'timeout': 0}]]},
    {promise: 'resolved', command: 'multiSwitch', id: 'load_stoneId4'},
    {command: 'disconnectCommand', args: []},
  ];


  return new Promise((testResolve, testReject) => {
    // attach test listener
    testBus.on('test', (data) => { checker(data, testReject) });

    BatchCommandHandler.load(mockStone1, 'stoneId1', 'sphereId', multiSwitch).then(() => { testBus.emit('test', {command:'multiSwitch', promise:'resolved', id:'load_stoneId1'}) });
    BatchCommandHandler.load(mockStone2, 'stoneId2', 'sphereId', multiSwitch).then(() => { testBus.emit('test', {command:'multiSwitch', promise:'resolved', id:'load_stoneId2'}) });
    BatchCommandHandler.load(mockStone3, 'stoneId3', 'sphereId', multiSwitch).then(() => { testBus.emit('test', {command:'multiSwitch', promise:'resolved', id:'load_stoneId3'}) });
    BatchCommandHandler.load(mockStone4, 'stoneId4', 'sphereId', multiSwitch).then(() => { testBus.emit('test', {command:'multiSwitch', promise:'resolved', id:'load_stoneId4'}) });
    BatchCommandHandler.execute();

    let { directCommands, meshNetworks } = BatchCommandHandler._extractTodo();
    expect(directCommands).toMatchSnapshot(); // snapshot 1
    expect(meshNetworks).toMatchSnapshot();   // snapshot 2


    eventBus.emit('updateMeshNetwork_sphereId_1', meshEmit1);

    setTimeout(() => {
      BatchCommandHandler.load(mockStone2, 'stoneId2', 'sphereId', keepAliveState).then(() => { testBus.emit('test', {command:'keepAliveState', promise:'resolved', id:'load_stoneId2'}) });
      BatchCommandHandler.load(mockStone3, 'stoneId3', 'sphereId', keepAliveState)
        .then(() => {  testBus.emit('test', {command:'keepAliveState', promise:'resolved', id:'load_stoneId3'}) })
        .catch(() => { testBus.emit('test', {command:'keepAliveState', promise:'rejected', id:'load_stoneId3'}) });

      let { directCommands, meshNetworks } = BatchCommandHandler._extractTodo();
      expect(directCommands).toMatchSnapshot(); // snapshot 3
      expect(meshNetworks).toMatchSnapshot();   // snapshot 4
    },150);

    setTimeout(() => {
      BatchCommandHandler.load(mockStone1, 'stoneId1', 'sphereId', keepAliveState).then(() => { testBus.emit('test', {command:'keepAliveState', promise:'resolved', id:'load_stoneId1'}) });
      BatchCommandHandler.load(mockStone3, 'stoneId3', 'sphereId', keepAliveState).then(() => { testBus.emit('test', {command:'keepAliveState', promise:'resolved', id:'load_stoneId3'}) });

      let { directCommands, meshNetworks } = BatchCommandHandler._extractTodo();
      expect(directCommands).toMatchSnapshot(); // snapshot 5
      expect(meshNetworks).toMatchSnapshot();   // snapshot 6
    },250);

    setTimeout(() => {
      eventBus.emit('updateMeshNetwork_sphereId_1', meshEmit1);
      eventBus.emit('updateMeshNetwork_sphereId_2', meshEmit2);
    }, 600);

    setTimeout(() => {testResolve()}, 2000)
  })
    .then(() => {
      return new Promise((testResolve, testReject) => {
        if (counter < expectedArray.length) {
          testReject('Did not get all expected events');
          return;
        }
        testResolve();
      });
    })
});





let stone8 = {config: {crownstoneId:'CSID8', meshNetworkId : null, handle:'handle-CSID-8'}};
let stone9 = {config: {crownstoneId:'CSID9', meshNetworkId : null, handle:'handle-CSID-9'}};
let stone10 = {config: {crownstoneId:'CSID10', meshNetworkId : null, handle:'handle-CSID-10'}};
let stone11 = {config: {crownstoneId:'CSID11', meshNetworkId : null, handle:'handle-CSID-11'}};

test('BatchCommandHandler Direct', () => {
  // prep
  let testBus = new EventBusClass();
  mockBluenet.loadEventBus(testBus);
  mockBluenet.doSuccess();

  // prep globals
  timeStart = new Date().valueOf();
  counter = 0;
  expectedArray = [
    {command: 'connect', args: ['handle8']},
    {command: 'keepAliveState', args:  [true, 1, 150]},
    {promise: 'resolved', command: 'keepAliveStatePromise', id: 'load_stoneId8'},
    {command: 'disconnectCommand', args: []},
    {command: 'connect', args: ['handle9']},
    {command: 'keepAliveState', args:  [true, 1, 150]},
    {promise: 'resolved', command: 'keepAliveStatePromise', id: 'load_stoneId9'},
    {command: 'disconnectCommand', args: []},
    {command: 'connect', args: ['handle10']},
    {command: 'keepAliveState', args:  [true, 1, 150]},
    {promise: 'resolved', command: 'keepAliveStatePromise', id: 'load_stoneId10'},
    {command: 'disconnectCommand', args: []},
    {command: 'connect', args: ['handle11']},
    {command: 'keepAliveState', args:  [true, 1, 150]},
    {promise: 'resolved', command: 'keepAliveStatePromise', id: 'load_stoneId11'},
    {command: 'disconnectCommand', args: []},
  ];


  return new Promise((testResolve, testReject) => {
    // attach test listener
    testBus.on('test', (data) => { checker(data, testReject) });

    let sphereId = 'sphereId';

    BatchCommandHandler.load(stone8, 'stoneId8', sphereId, keepAliveState).then(() => { testBus.emit('test', {command:'keepAliveStatePromise', promise:'resolved', id:'load_stoneId8'}) });
    BatchCommandHandler.load(stone9, 'stoneId9', sphereId, keepAliveState).then(() => { testBus.emit('test', {command:'keepAliveStatePromise', promise:'resolved', id:'load_stoneId9'}) });
    BatchCommandHandler.load(stone10, 'stoneId10', sphereId, keepAliveState).then(() => { testBus.emit('test', {command:'keepAliveStatePromise', promise:'resolved', id:'load_stoneId10'}) });
    BatchCommandHandler.load(stone11, 'stoneId11', sphereId, keepAliveState).then(() => { testBus.emit('test', {command:'keepAliveStatePromise', promise:'resolved', id:'load_stoneId11'}) });

    BatchCommandHandler.execute()


    eventBus.emit('update_' + sphereId + '_stoneId8', { handle: 'handle8', stoneId: 'stoneId8', rssi: -60 });
    setTimeout(() => { eventBus.emit('update_' + sphereId + '_stoneId9', { handle: 'handle9', stoneId: 'stoneId9', rssi: -60 }); }, 400);
    setTimeout(() => { eventBus.emit('update_' + sphereId + '_stoneId10', { handle: 'handle10', stoneId: 'stoneId10', rssi: -60 }); }, 800);
    setTimeout(() => { eventBus.emit('update_' + sphereId + '_stoneId11', { handle: 'handle11', stoneId: 'stoneId11', rssi: -60 }); }, 1200);

    setTimeout(() => {testResolve()}, 2000)
  })
    .then(() => {
      return new Promise((testResolve, testReject) => {
        if (counter < expectedArray.length) {
          testReject('Did not get all expected events');
          return;
        }
        testResolve();
      });
    })
});

test('BatchCommandHandler getHardwareVersion', () => {
  // prep
  let testBus = new EventBusClass();
  mockBluenet.loadEventBus(testBus);
  mockBluenet.doSuccess();

  // prep globals
  timeStart = new Date().valueOf();
  counter = 0;
  expectedArray = [
    {command: 'connect', args: ['handle8']},
    {command: 'getHardwareVersion', args:  []},
    {promise: 'resolved', command: 'getHardwareVersion', id: 'load_stoneId8'},
    {command: 'disconnectCommand', args: []},
  ];

  return new Promise((testResolve, testReject) => {
    // attach test listener
    testBus.on('test', (data) => { checker(data, testReject) });

    let sphereId = 'sphereId';

    BatchCommandHandler.load(stone8, 'stoneId8', sphereId, getHardwareVersion).then(() => { testBus.emit('test', {command:'getHardwareVersion', promise:'resolved', id:'load_stoneId8'}) });
    BatchCommandHandler.execute();


    eventBus.emit('update_' + sphereId + '_stoneId8', { handle: 'handle8', stoneId: 'stoneId8', rssi: -60 });

    setTimeout(() => {testResolve()}, 2000)
  })
    .then(() => {
      return new Promise((testResolve, testReject) => {
        if (counter < expectedArray.length) {
          testReject('Did not get all expected events');
          return;
        }
        testResolve();
      });
    })
});


//
// 101020100000000000000000000QFAAB0\n\u0013t\u0001
// 101020100000000000000000000QFAAB0\u0001