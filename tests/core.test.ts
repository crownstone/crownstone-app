import {resetMocks} from "./__testUtil/mocks/suite.mock";
import {addSphere, addStone} from "./__testUtil/helpers/data.helper";
import {core} from "../app/ts/Core";
import {xUtil} from "../app/ts/util/StandAloneUtil";

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

test("abilities", async () => {
  addSphere();
  addStone({handle:'handle1'});
  addStone({handle:'handle2'});
  addStone({handle:'handle3'});
  let actions = [];
  let state = core.store.getState();

  // console.log(JSON.stringify(state, null, 2))
  for (let [sphereId, sphere] of Object.entries(state.spheres)) {
    // @ts-ignore
    for (let [stoneId, stone] of Object.entries(sphere.stones)) {
      actions.push({type:"REMOVE_ALL_ABILITIES", sphereId, stoneId});
      // actions.push({type:"ADD_ABILITY", sphereId, stoneId, abilityId:'dimming',
      //   data: {type:'dimming', enabled: false, enabledTarget: false, syncedToCrownstone:true, updatedAt:100}
      // });
      // actions.push({type:"ADD_ABILITY_PROPERTY", sphereId, stoneId, abilityId:'dimming', propertyId: 'softOnSpeed',
      //   data: {type:'softOnSpeed', value: 5, valueTarget: 8, syncedToCrownstone: true, updatedAt:100}
      // });
      //
      // actions.push({type:"ADD_ABILITY", sphereId, stoneId, abilityId:'switchcraft',
      //   data: {type:'switchcraft', enabled: false, enabledTarget: false, syncedToCrownstone:true, updatedAt:100}
      // });
      //
      // actions.push({type:"ADD_ABILITY", sphereId, stoneId, abilityId:'tapToToggle',
      //   data: {type:'tapToToggle', enabled: false, enabledTarget: false, syncedToCrownstone:true, updatedAt:100}
      // });
      // actions.push({type:"ADD_ABILITY_PROPERTY", sphereId, stoneId, abilityId:'tapToToggle', propertyId: 'rssiOffset',
      //   data: {type:'rssiOffset', value: 0, valueTarget: 0, syncedToCrownstone: true, updatedAt:100}
      // });
    }
  }

  for (let [sphereId, sphere] of Object.entries(state.spheres)) {
    // @ts-ignore
    for (let [stoneId, stone] of Object.entries(sphere.stones)) {
      actions.push({type:"REMOVE_ALL_ABILITIES", sphereId, stoneId});
      actions.push({type:"ADD_ABILITY", sphereId, stoneId, abilityId:'dimming',
        data: {type:'dimming', enabled: false, enabledTarget: false, syncedToCrownstone:true, updatedAt:100}
      });
      actions.push({type:"ADD_ABILITY_PROPERTY", sphereId, stoneId, abilityId:'dimming', propertyId: 'softOnSpeed',
        data: {type:'softOnSpeed', value: 5, valueTarget: 8, syncedToCrownstone: true, updatedAt:100}
      });

      actions.push({type:"ADD_ABILITY", sphereId, stoneId, abilityId:'switchcraft',
        data: {type:'switchcraft', enabled: false, enabledTarget: false, syncedToCrownstone:true, updatedAt:100}
      });

      actions.push({type:"ADD_ABILITY", sphereId, stoneId, abilityId:'tapToToggle',
        data: {type:'tapToToggle', enabled: false, enabledTarget: false, syncedToCrownstone:true, updatedAt:100}
      });
      actions.push({type:"ADD_ABILITY_PROPERTY", sphereId, stoneId, abilityId:'tapToToggle', propertyId: 'rssiOffset',
        data: {type:'rssiOffset', value: 0, valueTarget: 0, syncedToCrownstone: true, updatedAt:100}
      });
    }
  }

  core.store.batchDispatch(actions);
  state = core.store.getState();
})