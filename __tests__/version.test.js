'use strict';
// __tests__/Intro-test.js
// Note: test renderer must be required after react-native.
let jest = require('jest');

import { Util } from '../js/util/Util'

test('versionTest', () => {
  expect(Util.versions.canIUse('2.0.0', '2.0.0')).toBe(true);
  expect(Util.versions.canIUse('2.0.0', '1.0.0')).toBe(true);
  expect(Util.versions.canIUse('2.0.0', '2.1.0')).toBe(false);
  expect(Util.versions.canIUse('2.1.0', '2.0.0')).toBe(true);
  expect(Util.versions.canIUse('2.1.0', '2.1.0')).toBe(true);
  expect(Util.versions.canIUse('2.1.1', '2.1.0')).toBe(true);
  expect(Util.versions.canIUse('2.1.0', '2.1.1')).toBe(false);
  expect(Util.versions.canIUse('2.0.0', '3.0.0')).toBe(false);

  // can i use strips rc
  expect(Util.versions.canIUse('2.0.0-rc1', '2.0.0')).toBe(true);
  expect(Util.versions.canIUse('2.0.0-rc1', '1.0.0')).toBe(true);
  expect(Util.versions.canIUse('2.0.0-rc1', '2.0.0-rc2')).toBe(true);
  expect(Util.versions.canIUse('2.0.0-rc1', '2.0.0-rc0')).toBe(true);

  expect(Util.versions.isHigher('2.0.0-rc1', '2.0.0')).toBe(false);
  expect(Util.versions.isHigher('2.0.0-rc1', '1.0.0')).toBe(true);
  expect(Util.versions.isHigher('2.0.0-rc1', '2.0.0-rc2')).toBe(false);
  expect(Util.versions.isHigher('2.0.0-rc1', '2.0.0-rc0')).toBe(true);

  expect(Util.versions.isHigherOrEqual('2.0.0-rc1', '2.0.0-rc1')).toBe(true);
  expect(Util.versions.isHigherOrEqual('2.0.0-rc1', '2.0.0')).toBe(false);
  expect(Util.versions.isHigherOrEqual('2.0.0-rc1', '1.0.0')).toBe(true);
  expect(Util.versions.isHigherOrEqual('2.0.0-rc1', '2.0.0-rc2')).toBe(false);
  expect(Util.versions.isHigherOrEqual('2.0.0-rc1', '2.0.0-rc0')).toBe(true);

  expect(Util.versions.isHigher('1.2.2','1.2.2')).toBe(false);
});
