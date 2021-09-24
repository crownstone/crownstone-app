import { resetMocks } from "../__testUtil/mocks/suite.mock";
import { addSphere, addStone } from "../__testUtil/helpers/data.helper";
import { core } from "../../app/ts/core";
import { SyncNext } from "../../app/ts/cloud/sections/newSync/SyncNext";
import { getGlobalIdMap } from "../../app/ts/cloud/sections/sync/modelSyncs/SyncingBase";
import { reply1 } from "./replyMocks/reply1";
import { CLOUD } from "../../app/ts/cloud/cloudAPI";

beforeEach(async () => {
  resetMocks()
})
beforeAll(async () => {})
afterEach(async () => { })
afterAll(async () => {})

let handle = 'TestHandle';
test("Using core in tests", async () => {
  let cloudIdMap = getGlobalIdMap();
  let actions = []
  await SyncNext.processSyncResult(reply1, actions, cloudIdMap)

  for (let action of actions) {
    console.log(action)
  }

  expect(actions.length > 0).toBeTruthy()
})

test("check mock", async () => {
  console.log(CLOUD);
  CLOUD.forLocation(123).downloadLocationPicture(5).then((x) => { console.log(x) })
})