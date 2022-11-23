import {expect, jest, test} from '@jest/globals';
import {resetMocks} from "./__testUtil/mocks/suite.mock";
import {addSphere, addStone} from "./__testUtil/helpers/data.helper";
import {core} from "../app/ts/Core";
import {xUtil} from "../app/ts/util/StandAloneUtil";
import {ABILITY_PROPERTY_TYPE_ID, ABILITY_TYPE_ID} from "../app/ts/database/reducers/stoneSubReducers/abilities";

beforeEach(async () => {
  resetMocks()
})
beforeAll(async () => {})
afterEach(async () => { })
afterAll(async () => {})

let handle = 'TestHandle';
test("Using core in tests", async () => {
  addSphere();
  addStone({handle:'handle1'});
  addStone({handle:'handle2'});
  addStone({handle:'handle3'});
  let state = core.store.getState();
  expect(state).toMatchSnapshot()
})


test("versionUtil", async () => {
  expect(xUtil.versions.isLower('4.2.1-rc1','4.2.1')).toBeTruthy()
  expect(xUtil.versions.isLower('4.2.1','4.3.1')).toBeTruthy()
  expect(xUtil.versions.isLower('4.6.2.10','4.6.3.1', 4)).toBeTruthy()

  expect(xUtil.versions.isValidSemver('undefined')).toBeFalsy()
  expect(xUtil.versions.isValidSemver('d8139754ec667797')).toBeFalsy()
  expect(xUtil.versions.isValidSemver('4.2.1-rc1')).toBeTruthy()
  expect(xUtil.versions.isValidSemver('4.2.1')).toBeTruthy()
  expect(xUtil.versions.isValidSemver('1.0.0')).toBeTruthy()
  expect(xUtil.versions.isValidSemver('4.6.2.10', 4)).toBeTruthy()
  // expect(xUtil.versions.isLower('3fca3fva3dfv4rdf2qf3','4.6.3.1')).toBeFalsy()
})

test("Check if double tap switchcraft database flow works", async () => {
  addSphere();
  addStone({handle:'handle1'});
  let state = core.store.getState();

  let sphereId = Object.keys(state.spheres)[0];
  let stoneId = Object.keys(state.spheres[sphereId].stones)[0];
  expect(state.spheres[sphereId].stones[stoneId].abilities[ABILITY_TYPE_ID.switchcraft].properties[ABILITY_PROPERTY_TYPE_ID.doubleTapSwitchcraft].valueTarget).toBeFalsy()
  expect(state.spheres[sphereId].stones[stoneId].abilities[ABILITY_TYPE_ID.switchcraft].properties[ABILITY_PROPERTY_TYPE_ID.doubleTapSwitchcraft].syncedToCrownstone).toBeTruthy()

  core.store.dispatch({
    type:      "UPDATE_ABILITY_PROPERTY",
    sphereId:   sphereId,
    stoneId:    stoneId,
    abilityId:  ABILITY_TYPE_ID.switchcraft,
    propertyId: ABILITY_PROPERTY_TYPE_ID.doubleTapSwitchcraft,
    data: {
      valueTarget: true,
      syncedToCrownstone: false,
    }});

  state = core.store.getState();
  expect(state.spheres[sphereId].stones[stoneId].abilities[ABILITY_TYPE_ID.switchcraft].properties[ABILITY_PROPERTY_TYPE_ID.doubleTapSwitchcraft].valueTarget).toBeTruthy()
  expect(state.spheres[sphereId].stones[stoneId].abilities[ABILITY_TYPE_ID.switchcraft].properties[ABILITY_PROPERTY_TYPE_ID.doubleTapSwitchcraft].syncedToCrownstone).toBeFalsy()
})
