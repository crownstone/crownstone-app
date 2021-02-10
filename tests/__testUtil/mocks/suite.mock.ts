import { advanceBy, advanceTo, clear } from 'jest-date-mock';
advanceTo(0); // reset to timestamp = 0

import { mockReactNative } from "./react-native/Platform.mock";
mockReactNative();

import { mockLogger } from "./logger.mock";
mockLogger();

import { mockRandom, resetMockRandom } from "./deterministicRandom.mock";
mockRandom();

import { mockCore } from "./core/core.mock";
import { mockBluenetPromiseWrapper } from "./bluenetPromiseWrapper.mock";

const libStateWrapper = mockBluenetPromiseWrapper();
const core = mockCore() // core also mocks native bus
export const mBluenet = libStateWrapper;
export const mCore = core;
export const resetMocks = function() {
  libStateWrapper.reset()
  core.resetMocks()
  resetMockRandom();
}