import { advanceBy, advanceTo, clear } from 'jest-date-mock';
advanceTo(0); // reset to timestamp = 0

import { mockReactNative } from "./react-native/Platform.mock";
mockReactNative();

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
}
let enabledMap = { v: false, d: false, i: false, w: false, e: false };
mockLogger(enabledMap, silenceMap);

import { mockRandom, resetMockRandom } from "./deterministicRandom.mock";
mockRandom();

import { mockCore } from "./core/core.mock";
import { mockBluenetPromiseWrapper } from "./bluenetPromiseWrapper.mock";

const libStateWrapper = mockBluenetPromiseWrapper();
const core = mockCore(); // core also mocks native bus
export const mBluenet = libStateWrapper;
export const mCore = core;

import { mockScheduler } from "./scheduler.mock";
export const mScheduler = mockScheduler();

import { mockExternalConfig } from "./externalConfig.mock";
mockExternalConfig();

import { resetDataHelper } from "../helpers/data.helper";
export const resetMocks = function() {
  libStateWrapper.reset();
  mScheduler.reset();
  core.reset();
  resetMockRandom();
  resetDataHelper();
}