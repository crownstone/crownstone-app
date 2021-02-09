import { mockLogger, silenceCommon } from "./mocks/logger.mock";
mockLogger({v:0, d:1, i:1, w:1, e:1}, silenceCommon());

import { mockNativeBus } from "./mocks/nativeBus.mock";
mockNativeBus()

import { mockCore } from "./mocks/core/core.mock";
const core = mockCore()

import { addSphere, addStone } from "./helpers/data.helper";
import { MapProvider } from "../js/backgroundProcesses/MapProvider";

// import { addSphere, addStone } from "./helpers/data.helper";

beforeEach(async () => {
  core.resetMocks()
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
  // console.log(state)
  MapProvider.refreshAll()
  console.log(MapProvider.stoneSummaryMap)
})