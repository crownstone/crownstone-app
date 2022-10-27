import {TestUtil} from "../util/testUtil";

const INITIAL_TIME = new Date("2022-01-01 12:00:00Z").valueOf()

import { advanceBy, advanceTo, clear } from 'jest-date-mock';
advanceTo(INITIAL_TIME); // reset to timestamp = 1.000.000

import { mockAppUtil } from "./appUtil.mock";
mockAppUtil();

import { mockNotificationHandler } from "./notificationHandler.mock";
mockNotificationHandler();

import { mockReactNative } from "./react-native/react-native.mock";
let mockRN = mockReactNative();

import { mockBluenet } from "./bluenet.mock";
let mockedBluenet = mockBluenet();

import { mockNavigationUtil } from "./navigationUtil.mock";
mockNavigationUtil();

import { mockLanguages } from "./languages.mock";
mockLanguages()

import { mockCloud } from "./cloud.mock";
mockCloud()

import { mockLocalNotifications } from "./localNotifications.mock";
mockLocalNotifications()

import { mockInviteCenter } from "./uiModules/InviteCenter.mock";
mockInviteCenter()

import { mockFileUtil } from "./fileUtil.mock";
mockFileUtil()

import { mockLogger } from "./logger.mock";
let silenceMap = {
  info:           true,
  promiseManager: true,
  broadcast:      true,
  constellation:  true,
  notifications:  true,
  event:          true,
  cloud:          true,
  advertisements: true,
  bch:            true,
  ble:            true,
  store:          true,
  dfu:            true,
  behaviour:      true,
  scheduler:      true,
  mesh:           true,
  messages:       true,
  native:         true,
  nav:            true,
};
let enabledMap = { v: false, d: true, i: true, w: true, e: true };
mockLogger(enabledMap, silenceMap);

import { mockRandom, resetMockRandom } from "./deterministicRandom.mock";
mockRandom();

import { mockCore } from "./core/core.mock";
import { mockBluenetPromiseWrapper } from "./bluenetPromiseWrapper.mock";

const libStateWrapper = mockBluenetPromiseWrapper();
const core = mockCore(); // core also mocks native bus
export const mBluenetPromise = libStateWrapper;
export const mBluenet = mockedBluenet;
export const mCore = core;

// import { mockScheduler } from "./scheduler.mock";
// export const mScheduler = mockScheduler();

import { mockExternalConfig } from "./externalConfig.mock";
mockExternalConfig();

import { resetDataHelper } from "../helpers/data.helper";
import { mockConstellationUtil } from "./constellationUtil.mock";
import { TestHookCatcherClass } from "../helpers/hooks.helper";

export const TestHookCatcher = new TestHookCatcherClass()

export const mConstellationState = mockConstellationUtil()

import {Scheduler} from "../../../app/ts/logic/Scheduler";

export const moveTimeBy = async function(ms) {
  advanceBy(ms);
  Scheduler.tick();
  await TestUtil.nextTick();
}

export const resetMocks = function() {
  core.reset();
  mockedBluenet.reset();
  mBluenetPromise.reset();
  mockRN.reset();
  resetMockRandom();
  resetDataHelper();
  mConstellationState.reset();
  advanceTo(INITIAL_TIME);
  TestHookCatcher.init()
}
export const cleanupMocks = function() {
  // mScheduler.reset();
}

export const mocks = {
  core,
  mConstellationState,
  mBluenet: mBluenetPromise,
  // mScheduler,
  mRN: mockRN,
  mockedBluenet,
  reset: resetMocks,
}


export const prepareSuiteForTest = async function() {
  Scheduler.reset();
  resetMocks();
}
export const cleanupSuiteAfterTest = async function() {
  Scheduler.reset();
  cleanupMocks();
  await TestUtil.nextTick()
}
