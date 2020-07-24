'use strict';
// __tests__/Intro-test.js
// Note: test renderer must be required after react-native.

import { Languages } from "../js/Languages";
Languages.activeLocale = "nl_nl"
Languages.persistedLocale = "nl_nl"
Languages.setLocale("nl_nl")
Languages.updateLocale = jest.fn()

import { AicoreBehaviour } from "../js/views/deviceViews/smartBehaviour/supportCode/AicoreBehaviour";


import { Util } from '../js/util/Util'
import { AicoreUtil } from '../js/views/deviceViews/smartBehaviour/supportCode/AicoreUtil'
import { BEHAVIOUR_TYPES } from "../js/router/store/reducers/stoneSubReducers/rules";
import { AicoreTwilight } from "../js/views/deviceViews/smartBehaviour/supportCode/AicoreTwilight";
import { DataUtil } from "../js/util/DataUtil";

AicoreUtil.getLocationNameFromUid = jest.fn(function(sphereId, locationUID) { return "keuken"})

test('behaviour_test_translations', () => {
  console.log(
    // new AicoreTwilight().setActionState(80).getSentence(null) + "\n",
    // new AicoreTwilight().setActionState(60).getSentence(null) + "\n",
    // new AicoreTwilight().setActionState(35).getSentence(null) + "\n",
    // new AicoreTwilight().setTimeWhenDark().getSentence(null) + "\n",
    // new AicoreTwilight().setTimeWhenSunUp().getSentence(null) + "\n",
    // new AicoreTwilight().setTimeAllday().getSentence(null) + "\n",
    // new AicoreTwilight().setTimeFrom(9,30).setTimeTo(15,0).getSentence(null) + "\n",
    // new AicoreTwilight().setTimeFromSunset(-30).setTimeTo(23,0).getSentence(null) + "\n",
    //
    // new AicoreBehaviour().setActionState(100).getSentence(null) + "\n",
    // new AicoreBehaviour().setActionState(50).getSentence(null) + "\n",
    // new AicoreBehaviour().setActionState(50).setPresenceSomebody().getSentence(null) + "\n",
    // new AicoreBehaviour().setPresenceSomebody().getSentence(null) + "\n",
    // new AicoreBehaviour().setPresenceNobody().getSentence(null) + "\n",
    // new AicoreBehaviour().ignorePresence().getSentence(null) + "\n",
    new AicoreBehaviour().setPresenceSomebodyInSphere().setTimeWhenDark().getSentence(null) + "\n",
    new AicoreBehaviour().setPresenceSomebodyInLocations([1]).setTimeWhenDark().getSentence(null) + "\n",
    new AicoreBehaviour().setPresenceSomebodyInLocations([1,2]).setTimeWhenDark().getSentence(null) + "\n",
    // new AicoreBehaviour().setTimeWhenDark().getSentence(null) + "\n",
    // new AicoreBehaviour().setTimeWhenSunUp().getSentence(null) + "\n",
    // new AicoreBehaviour().setTimeAllday().getSentence(null) + "\n",
    // new AicoreBehaviour().setTimeFrom(9,30).setTimeTo(15,0).getSentence(null) + "\n",
    // new AicoreBehaviour().setTimeFromSunset(-30).setTimeTo(23,0).getSentence(null) + "\n",
    // new AicoreBehaviour().setEndConditionWhilePeopleInSphere().getSentence(null) + "\n",
    // new AicoreBehaviour().setEndConditionWhilePeopleInLocation(1).getSentence(null) + "\n",
    // new AicoreBehaviour().setNoEndCondition().getSentence(null) + "\n"
  )
})
