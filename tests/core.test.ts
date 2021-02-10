import { resetMocks } from "./mocks/suite.mock";

import { addSphere, addStone } from "./helpers/data.helper";
import { MapProvider } from "../ts/backgroundProcesses/MapProvider";
import { core } from "../ts/core";

// import { addSphere, addStone } from "./helpers/data.helper";

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
  MapProvider.refreshAll()
  expect(state).toMatchSnapshot()
})