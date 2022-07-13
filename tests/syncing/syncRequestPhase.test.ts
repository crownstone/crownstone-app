import { resetMocks } from "../__testUtil/mocks/suite.mock";
import { addSphere, addStone } from "../__testUtil/helpers/data.helper";
import { core } from "../../app/ts/Core";
import { SyncUtil } from "../../app/ts/util/SyncUtil";
import {
  AbilityPropertyTransferNext
} from "../../app/ts/cloud/sections/newSync/transferrers/AbilityPropertyTransferNext";

beforeEach(async () => {
  resetMocks()
})
beforeAll(async () => {})
afterEach(async () => { })
afterAll(async () => {})

test("Using SyncUtil", async () => {
  let myReply = {}
  SyncUtil.constructReply(myReply,['item', 'id'],{ myData:'awesome' });
  expect(myReply).toStrictEqual({item:{id:{data:{myData:'awesome'}}}})
  let myReply2 = {}
  SyncUtil.constructReply(myReply2,['item'],{ myData:'awesome' });
  expect(myReply2).toStrictEqual({item:{data:{myData:'awesome'}}})
})

// let handle = 'TestHandle';
// test("Using core in tests", async () => {
//   let cloudIdMap = getSyncIdMap();
//   let actions = []
//   await SyncNext.processSyncResponse(reply1, actions, cloudIdMap)
//   expect(actions.length > 0).toBeTruthy()
//
//   core.store.batchDispatch(actions);
//
//   let state = core.store.getState();
//   for (let sphereId in state.spheres) {
//     let sphere = state.spheres[sphereId];
//     expect(Object.keys(sphere.users).length > 0).toBeTruthy()
//     for (let stoneId in sphere.stones) {
//       let stone = sphere.stones[stoneId];
//       for (let abilityType in stone.abilities) {
//         expect(stone.abilities[abilityType].syncedToCrownstone).toBeTruthy()
//       }
//     }
//   }
// })
//
// test("check mock", async () => {
//   CLOUD.forLocation(123).downloadLocationPicture(5).then((x) => { console.log(x) })
// })

// test ("Handle Sync Reply", async () => {
//   let actions = [];
//   let syncIdMap = getSyncIdMap()
//   await SyncNext.processSyncResponse(reply2 as any, actions, syncIdMap)
//   console.log("syncIdMap", syncIdMap)
//   console.log("actions", actions)
// })

test("Check if abilityProperties sync correctly", async () => {
  let sphere = addSphere();
  let stone = addStone({handle:'handle1'}).stone

  let action = AbilityPropertyTransferNext.getUpdateLocalCloudIdAction(sphere.id, stone.id, 'dimming', 'softOnSpeed', '123')
  core.store.dispatch(action)
  expect(core.store.getState().spheres[sphere.id].stones[stone.id].abilities.dimming.properties.softOnSpeed.cloudId).toBe('123')

  action = AbilityPropertyTransferNext.getUpdateLocalCloudIdAction(sphere.id, stone.id, 'dimming', 'softOnSpeed', null)
  core.store.dispatch(action)
  expect(core.store.getState().spheres[sphere.id].stones[stone.id].abilities.dimming.properties.softOnSpeed.cloudId).toBe(null)
})