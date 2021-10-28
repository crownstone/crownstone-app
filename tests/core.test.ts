import { resetMocks } from "./__testUtil/mocks/suite.mock";
import { addSphere, addStone } from "./__testUtil/helpers/data.helper";
import { core } from "../app/ts/Core";
import { xUtil } from "../app/ts/util/StandAloneUtil";

beforeEach(async () => {
  resetMocks()
})
beforeAll(async () => {})
afterEach(async () => { })
afterAll(async () => {})

let handle = 'TestHandle';
test("Using core in tests", async () => {
  addSphere();
  addStone('handle1')
  addStone('handle2')
  addStone('handle3')
  let state = core.store.getState();
  expect(state).toMatchSnapshot()
})


test("isLower", async () => {
  expect(xUtil.versions.isLower('4.2.1-rc1','4.2.1')).toBeTruthy()
  expect(xUtil.versions.isLower('4.2.1','4.3.1')).toBeTruthy()
  expect(xUtil.versions.isLower('4.6.2.10','4.6.3.1', 4)).toBeTruthy()
})

test("abilities", async () => {
  addSphere();
  addStone('handle1')
  addStone('handle2')
  addStone('handle3')
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