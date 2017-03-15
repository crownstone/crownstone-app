// __tests__/Intro-test.js
// Note: test renderer must be required after react-native.
let jest = require("jest");
jest.mock('react-native-fs', () => {return {};});
jest.mock('react-native-device-info');

jest.mock('../js/ExternalConfig', () => {
  return {
    CLOUD_ADDRESS: 'https://crownstone-cloud-dev.herokuapp.com/api/',
    DEBUG: true,
    LOG_SCHEDULER: false,
    LOG_BLE: false,
    LOG_EVENTS: true,
    LOG_STORE: false,
    LOG_MESH: true,
    LOG_CLOUD: true,
    LOG_DEBUG: true,
    LOGGING: true,
    LOG_ERRORS: true,
    LOG_WARNINGS: true,
    LOG_VERBOSE: true,
    LOG_TO_FILE: false,
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
    KEEPALIVE_REPEAT_ATTEMPTS: 1,
    RESET_TIMER_FOR_NEAR_AWAY_EVENTS: 20000,
    RELEASE_MODE: false,
    TESTING_IN_PROCESS: true,
    LOCAL_TESTING: false
  }
});

import { eventBus } from "../js/util/EventBus"

jest.mock('../js/native/Bluenet', () => {
  return {
    eventBus: null,
    success: true,
    Bluenet: {
      connect: (handle, callback) => {
        this.eventBus.emit('test', 'connect', arguments);
        console.log("connecting to ", handle);
        setTimeout(() => {
          callback({error: !this.success});
        },250)
      },
      multiSwitch: (arr, callback) => {
        this.eventBus.emit('test', 'multiSwitch', arguments);
        console.log("multiSwitch to ", arr);
        callback({error: !this.success});
      },
      disconnect: (callback) => {
        this.eventBus.emit('test', 'disconnect', arguments);
        console.log("disconnect");
        callback({error: !this.success});
      },
      phoneDisconnect: (callback) => {
        this.eventBus.emit('test', 'phoneDisconnect', arguments);
        console.log("disconnect");
        callback({error: !this.success});
      },
    },
    loadEventBus: (bus) => {
      this.eventBus = bus;
      bus.on("setState", (success) => { this.success = success; })
    }
  }
});

import * as mockBluenet from "../js/native/Bluenet"
import { EventBusClass } from "../js/util/EventBus"
import { BatchCommandHandler } from "../js/logic/BatchCommandHandler"


test('object assignment', () => {
  // prep
  let testBus = new EventBusClass();
  mockBluenet.loadEventBus(testBus);

  testBus.on('test', (functionName, params) => {console.log("receivedTestEvent", functionName, params);})
  return new Promise((resolve, reject) => {
    let mockStone = {config: {crownstoneId:'iAmFrank', meshNetworkId : 123, handle:'yet to find me'}};
    let keepAlive =      { commandName:'keepAlive'};
    let keepAliveState = { commandName:'keepAliveState', state: 1, timeout: 150, changeState: true };
    let setSwitchState = { commandName:'setSwitchState', state: 1};
    let multiSwitch =    { commandName:'multiSwitch',    state: 1, timeout: 0, intent: 4};

    let meshEmit = {
      handle: 'this is my handle',
      stoneId: 'la stone id',
      meshNetworkId: 123,
      rssi: -60,
    };
    let directEmit = {
      handle: 'this is my handle',
      stoneId: 'la stone id',
      rssi: -60,
    };

    BatchCommandHandler.load(mockStone, 'stoneId', 'sphereId', multiSwitch).catch((x) => {console.log('load',x)});
    BatchCommandHandler.execute().catch((x) => {console.log('execute',x)});
    let { directCommands, meshNetworks } = BatchCommandHandler._extractTodo();

    console.log(BatchCommandHandler._extractTodo().meshNetworks.sphereId['123']);

    eventBus.emit("updateMeshNetwork_sphereId_123", meshEmit);

    expect({one: 1, two: 2}).toEqual({one: 1, two: 2});


    setTimeout(() => {resolve()}, 500)
  })
});