'use strict';
// __tests__/Intro-test.js
// Note: test renderer must be required after react-native.
import { AicoreBehaviour } from "../js/views/deviceViews/smartBehaviour/supportCode/AicoreBehaviour";

let jest = require('jest');

import { Util } from '../js/util/Util'
import { AicoreUtil } from '../js/views/deviceViews/smartBehaviour/supportCode/AicoreUtil'
import { BEHAVIOUR_TYPES } from "../js/router/store/reducers/stoneSubReducers/rules";

test('behaviourtest', () => {

  let behaviour1 = new AicoreBehaviour().setPresenceInSphere().setTimeWhenDark().stringify()
  let behaviour2 = new AicoreBehaviour().setPresenceInSphere().setTimeWhenDark().stringify()

  let d1 = {type: BEHAVIOUR_TYPES.behaviour, data: behaviour1, activeDays:{
    Mon: false,
    Tue: false,
    Wed: false,
    Thu: false,
    Fri: false,
    Sat: false,
    Sun: false
  }}
  let d2 = {type: BEHAVIOUR_TYPES.behaviour, data: behaviour2, activeDays:{
    Mon: false,
    Tue: false,
    Wed: false,
    Thu: false,
    Fri: false,
    Sat: false,
    Sun: false
  }}



  console.log(AicoreUtil.getOverlapData(d1,d2,'Mon', null))
})
