import { advanceBy, advanceTo, clear } from 'jest-date-mock';
advanceTo(1e6); // reset to timestamp = 1.000.000

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
  constellation:  false,
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

import { mockScheduler } from "./scheduler.mock";
export const mScheduler = mockScheduler();

import { mockExternalConfig } from "./externalConfig.mock";
mockExternalConfig();

import { resetDataHelper } from "../helpers/data.helper";
import { mockConstellationUtil } from "./constellationUtil.mock";
import { TestHookCatcherClass } from "../helpers/hooks.helper";

export const TestHookCatcher = new TestHookCatcherClass()

export const mConstellationState = mockConstellationUtil()

export const resetMocks = function() {
  libStateWrapper.reset();
  mScheduler.reset();
  core.reset();
  mockedBluenet.reset();
  mockRN.reset();
  resetMockRandom();
  resetDataHelper();
  mConstellationState.reset();
  advanceTo(1e6);
  TestHookCatcher.init()
}

export const mocks = {
  core,
  mConstellationState,
  mBluenet: mBluenetPromise,
  mScheduler,
  mRN: mockRN,
  mockedBluenet,
  reset: resetMocks,
}
