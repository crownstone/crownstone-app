import { resetMocks } from "./__testUtil/mocks/suite.mock";
import { addSphere, addStone } from "./__testUtil/helpers/data.helper";
import { core } from "../app/ts/core";

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