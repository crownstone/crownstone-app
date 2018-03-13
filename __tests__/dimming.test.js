'use strict';
// __tests__/Intro-test.js
// Note: test renderer must be required after react-native.
let jest = require('jest');


test('Dimming Transform to Stone', () => {
  let toStone = ((switchState) => {
    // linearize:
    let linearState = (Math.acos(-2*switchState+1) / Math.PI);

    // only PWM, not Relay
    linearState *= 0.99;

    linearState = Math.round(linearState*100)/100;

    return linearState;
  })

  let toUI = ((switchState) => {
    let UIState = ((Math.cos(switchState*Math.PI / 0.99) - 1) / -2);

    UIState = Math.round(UIState*100)/100;

    return UIState;
  })

  let state = 0.2;

  let stateToStone = toStone(0.2)

  expect(state).toBe(toUI(stateToStone))

});


//
// 101020100000000000000000000QFAAB0\n\u0013t\u0001
// 101020100000000000000000000QFAAB0\u0001