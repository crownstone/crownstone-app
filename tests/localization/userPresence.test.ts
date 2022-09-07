import {resetMocks} from "../__testUtil/mocks/suite.mock";
import {addLocation, addSphere, addSphereUser, addStone} from "../__testUtil/helpers/data.helper";
import {core} from "../../app/ts/Core";
import {xUtil} from "../../app/ts/util/StandAloneUtil";

beforeEach(async () => {
  resetMocks()
})
beforeAll(async () => {})
afterEach(async () => { })
afterAll(async () => {})

let handle = 'TestHandle';
test("Using core in tests", async () => {
  let sphere = addSphere();
  addStone({handle:'handle3'});
  let room1 = addLocation({name:"livingRoom"});
  let sphereUser = addSphereUser({name:'girly'})

  core.store.dispatch({type: "USER_ENTER_LOCATION", sphereId: sphere.id, locationId: room1.id, data: {userId: sphereUser.id}});

  expect(core.store.getState().spheres[sphere.id].locations[room1.id].presentUsers).toHaveLength(1);

  core.store.dispatch({type: "REMOVE_USER_FROM_ALL_LOCATIONS", sphereId: sphere.id, userId: sphereUser.id});

  expect(core.store.getState().spheres[sphere.id].locations[room1.id].presentUsers).toHaveLength(0);
})
