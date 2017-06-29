'use strict';
// __tests__/Intro-test.js
// Note: test renderer must be required after react-native.
let jest = require('jest');
jest.mock('react-native-fs', () => {return {};});
jest.mock('react-native-device-info');


jest.mock('../js/ExternalConfig', () => {
  return {
    DISABLE_NATIVE: false,
  }
});

jest.mock('../js/native/libInterface/Bluenet', () => {
  return {
    __value: 0,
    __setValue: (number) => { this.__value = number; },
    __getValue: () => { return this.__value; },
    Bluenet: {
      none: (callback) => {
        this.__value++;
        callback({error:false});
      },
      one: (one, callback) => {
        this.__value++;
        expect(one).toBe(1);
        callback({error:false});
      },
      two: (one, two, callback) => {
        this.__value++;
        expect(one).toBe(1);
        expect(two).toBe(2);
        callback({error:false});
      },
      three: (one, two, three, callback) => {
        this.__value++;
        expect(one).toBe(1);
        expect(two).toBe(2);
        expect(three).toBe(3);
        callback({error:false});
      },
    }
  }
});

import * as mockBluenet from '../js/native/libInterface/Bluenet'

import { BluenetPromise } from '../js/native/libInterface/BluenetPromise'

test('BluenetPromise', () => {
  mockBluenet.__setValue(0);

  return new Promise((testResolve, testReject) => {
    let promises = [];
    promises.push(BluenetPromise('none'));
    promises.push(BluenetPromise('one',1));
    promises.push(BluenetPromise('two',1,2));
    promises.push(BluenetPromise('three',1,2,3));

    Promise.all(promises)
      .then(() => {
        expect(mockBluenet.__getValue()).toBe(4);
        testResolve()
      })
      .catch((err) => { testReject(err) })
  });
});