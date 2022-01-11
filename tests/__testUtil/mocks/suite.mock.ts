import {advanceTo} from 'jest-date-mock';
import {mockAppUtil} from "./appUtil.mock";
import {mockNotificationHandler} from "./notificationHandler.mock";
import {mockReactNative} from "./react-native/react-native.mock";
import {mockBluenet} from "./bluenet.mock";
import {mockNavigationUtil} from "./navigationUtil.mock";
import {mockLanguages} from "./languages.mock";
import {mockCloud} from "./cloud.mock";
import {mockLocalNotifications} from "./localNotifications.mock";
import {mockInviteCenter} from "./uiModules/InviteCenter.mock";
import {mockFileUtil} from "./fileUtil.mock";
import {mockLogger} from "./logger.mock";
import {mockRandom, resetMockRandom} from "./deterministicRandom.mock";
import {mockCore} from "./core/core.mock";
import {mockBluenetPromiseWrapper} from "./bluenetPromiseWrapper.mock";
import {mockScheduler} from "./scheduler.mock";
import {mockExternalConfig} from "./externalConfig.mock";
import {resetDataHelper} from "../helpers/data.helper";
import {mockConstellationUtil} from "./constellationUtil.mock";
import {TestHookCatcherClass} from "../helpers/hooks.helper";

advanceTo(1e6); // reset to timestamp = 1.000.000
mockAppUtil();

mockNotificationHandler();

let mockRN = mockReactNative();

let mockedBluenet = mockBluenet();

mockNavigationUtil();

mockLanguages()

mockCloud()

mockLocalNotifications()

mockInviteCenter()

mockFileUtil()

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

mockRandom();

const libStateWrapper = mockBluenetPromiseWrapper();
const core = mockCore(); // core also mocks native bus
export const mBluenetPromise = libStateWrapper;
export const mBluenet = mockedBluenet;
export const mCore = core;

export const mScheduler = mockScheduler();

mockExternalConfig();

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
