'use strict';
// __tests__/Intro-test.js
// Note: test renderer must be required after react-native.
let jest = require('jest');
jest.mock('react-native-fs', () => {return {};});
jest.mock('react-native-device-info');

test('returning Promise with catch.', () => {
  let getSuccessfulPromise = () => {
    return new Promise((resolve, reject) => {
        setTimeout(() => { resolve() }, 20);
      }).then(() => {}).catch(() => {})
  };

  let getFailingPromise = () => {
    return new Promise((resolve, reject) => {
      setTimeout(() => { reject() }, 20);
    }).then(() => {}).catch(() => {})
  };

  getSuccessfulPromise().then(() => { expect(true).toBe(true) }).catch(() => { expect(true).toBe(false)});
  getFailingPromise().then(() => { expect(true).toBe(true) }).catch(() => { expect(true).toBe(false)});
});

