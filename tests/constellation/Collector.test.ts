import { mBluenet, mScheduler, resetMocks } from "../__testUtil/mocks/suite.mock";
import { TestUtil } from "../__testUtil/util/testUtil";
import { eventHelperSetActive, evt_disconnected, evt_ibeacon } from "../__testUtil/helpers/event.helper";
import { SessionManagerClass } from "../../app/ts/logic/constellation/SessionManager";
import { addLocation, addSphere, addStone } from "../__testUtil/helpers/data.helper";
import { getCommandOptions } from "../__testUtil/helpers/constellation.helper";

import { Collector } from "../../app/ts/logic/constellation/Collector";
import { StoneAvailabilityTracker } from "../../app/ts/native/advertisements/StoneAvailabilityTracker";


beforeEach(async () => {
  StoneAvailabilityTracker.sphereLog = {};
  StoneAvailabilityTracker.log = {};
  resetMocks()
})
beforeAll(async () => { })
afterEach(async () => { await TestUtil.nextTick(); })
afterAll(async () => {})

const handle      = 'TestHandle';
const meshId      = 'MeshId';
const otherMeshId = 'otherMeshId';
const privateId   = 'PrivateIDX';
eventHelperSetActive(handle);

test("Collect handles", async () => {
  StoneAvailabilityTracker.init();

  let sphere1 = addSphere();
  let sphere2 = addSphere();
  let location1 = addLocation();
  let location2 = addLocation();
  let stone1 = addStone({locationId: location1.id,  meshNetworkId: meshId});
  let stone2 = addStone({locationId: location1.id,  meshNetworkId: meshId});
  let stone3 = addStone({locationId: location2.id, meshNetworkId: meshId});
  let stone4 = addStone({locationId: location2.id, meshNetworkId: otherMeshId});
  let stone5 = addStone({locationId: location1.id,  meshNetworkId: otherMeshId});

  evt_ibeacon(-75, stone1.config.handle, sphere2.id, stone1.id);
  evt_ibeacon(-80, stone2.config.handle, sphere2.id, stone2.id);
  evt_ibeacon(-50, stone3.config.handle, sphere2.id, stone3.id);

  let mesh1Handles = Collector.collectMesh(meshId);
  expect(mesh1Handles.length).toBe(3);
  expect(mesh1Handles[0]).toBe(stone3.config.handle);
  expect(mesh1Handles[1]).toBe(stone1.config.handle);
  expect(mesh1Handles[2]).toBe(stone2.config.handle);

  let sphere1Handles = Collector.collectSphere(sphere1.id);
  expect(sphere1Handles.length).toBe(0);

  let sphere2Handles = Collector.collectSphere(sphere2.id);
  expect(sphere2Handles.length).toBe(5);
  expect(sphere2Handles[0]).toBe(stone3.config.handle);

  let nearbyHandles = Collector.collectNearby(sphere2.id);
  expect(nearbyHandles.length).toBe(5);
  expect(nearbyHandles).toStrictEqual(sphere2Handles);

  let locationHandles = Collector.collectLocation(location2.id);
  expect(locationHandles.length).toBe(2);
  expect(locationHandles[0]).toBe(stone3.config.handle);
  expect(locationHandles[1]).toBe(stone4.config.handle);
})