import { mBluenet, mScheduler, resetMocks } from "../__testUtil/mocks/suite.mock";
import { TestUtil } from "../__testUtil/util/testUtil";
import { eventHelperSetActive, evt_disconnected, evt_ibeacon } from "../__testUtil/helpers/event.helper";
import { SessionManager, SessionManagerClass } from "../../app/ts/logic/constellation/SessionManager";
import { addLocation, addSphere, addStone } from "../__testUtil/helpers/data.helper";
import { getCommandOptions } from "../__testUtil/helpers/constellation.helper";

import { Collector } from "../../app/ts/logic/constellation/Collector";
import { StoneAvailabilityTracker } from "../../app/ts/native/advertisements/StoneAvailabilityTracker";
import {
  Command_GetFirmwareVersion,
  Command_GetHardwareVersion
} from "../../app/ts/logic/constellation/commandClasses";
import { BleCommandQueue } from "../../app/ts/logic/constellation/BleCommandQueue";
import { CommandAPI } from "../../app/ts/logic/constellation/Commander";

beforeEach(async () => {
  StoneAvailabilityTracker.sphereLog = {};
  StoneAvailabilityTracker.log = {};
  BleCommandQueue.reset();
  SessionManager.reset();
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

test("SessionBroker finish mesh command", async () => {
  StoneAvailabilityTracker.init();

  let sphere = addSphere();
  let { stone: stone1, handle:handle1 } = addStone({meshNetworkId: meshId});
  let { stone: stone2, handle:handle2 } = addStone({meshNetworkId: meshId});
  let { stone: stone3, handle:handle3 } = addStone({meshNetworkId: meshId});
  let { stone: stone4, handle:handle4 } = addStone({meshNetworkId: meshId});
  let { stone: stone5, handle:handle5 } = addStone({meshNetworkId: meshId});

  let api  = new CommandAPI(getCommandOptions(sphere.id, [handle1]));
  let api2 = new CommandAPI(getCommandOptions(sphere.id, [handle3]));

  api.turnOn();

  api2.allowDimming(true)

  evt_ibeacon(-80, handle2);
  evt_ibeacon(-80, handle3);
  evt_ibeacon(-80, handle4);

  await mBluenet.for(handle2).succeed.connect("operation");
  await mBluenet.for(handle3).succeed.connect("operation");
  await mBluenet.for(handle4).succeed.connect("operation");

  await TestUtil.nextTick();

  await mBluenet.for(handle2).succeed.turnOnMesh();
  await mBluenet.for(handle3).succeed.allowDimming();

  await TestUtil.nextTick();

  expect(Object.keys(api.broker.pendingSessions).length).toBe(5);

  await mBluenet.for(handle4).succeed.turnOnMesh();
  await TestUtil.nextTick();

  await mBluenet.for(handle3).succeed.turnOnMesh();

  await TestUtil.nextTick();

  // check if the mesh sessions have been cancelled.
  expect(Object.keys(api.broker.pendingSessions).length).toBe(1);
  expect(SessionManager._sessions[handle1]).not.toBeUndefined();
});


test("SessionBroker direct command finishes mesh commands", async () => {
  StoneAvailabilityTracker.init();

  let sphere = addSphere();
  let { stone: stone1, handle:handle1 } = addStone({meshNetworkId: meshId});
  let { stone: stone2, handle:handle2 } = addStone({meshNetworkId: meshId});
  let { stone: stone3, handle:handle3 } = addStone({meshNetworkId: meshId});
  let { stone: stone4, handle:handle4 } = addStone({meshNetworkId: meshId});
  let { stone: stone5, handle:handle5 } = addStone({meshNetworkId: meshId});

  let api  = new CommandAPI(getCommandOptions(sphere.id, [handle1]));

  api.turnOn();

  evt_ibeacon(-80, handle1);

  await mBluenet.for(handle1).succeed.connect("operation");

  await TestUtil.nextTick();

  expect(Object.keys(api.broker.pendingSessions).length).toBe(5);

  await mBluenet.for(handle1).succeed.turnOnMesh();

  await TestUtil.nextTick();
  await mBluenet.for(handle1).succeed.disconnectCommand();
  await mBluenet.for(handle1).succeed.phoneDisconnect();
  evt_disconnected(handle1);

  expect(Object.keys(api.broker.pendingSessions).length).toBe(0);

  // check if the mesh sessions have been cancelled.
  expect(SessionManager._sessions).toStrictEqual({});
});


test("SessionBroker check if a private connection is not closed prematurely", async () => {
  StoneAvailabilityTracker.init();
  let sphere = addSphere();
  let { stone: stone1, handle:handle1 } = addStone({meshNetworkId: meshId});
  let api  = new CommandAPI(getCommandOptions(sphere.id, [handle1], true));
  api.allowDimming(true)

  await mBluenet.for(handle1).succeed.connect("operation");

  await TestUtil.nextTick();

  await mBluenet.for(handle1).succeed.allowDimming();

  await TestUtil.nextTick();

  expect(SessionManager._sessions[handle1].state).toBe("WAITING_FOR_COMMANDS");

  api.end();

  expect(SessionManager._sessions[handle1].state).toBe("DISCONNECTING");
});
