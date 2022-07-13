import {
  cleanupSuiteAfterTest,
  mBluenetPromise,
  mConstellationState,
  moveTimeBy, prepareSuiteForTest,
  TestHookCatcher
} from "../__testUtil/mocks/suite.mock";
import {TestUtil} from "../__testUtil/util/testUtil";
import {eventHelperSetActive, evt_disconnected, evt_ibeacon} from "../__testUtil/helpers/event.helper";
import {SessionManager} from "../../app/ts/logic/constellation/SessionManager";
import {addSphere, addStone} from "../__testUtil/helpers/data.helper";
import {getCommandOptions} from "../__testUtil/helpers/constellation.helper";

import {StoneAvailabilityTracker} from "../../app/ts/native/advertisements/StoneAvailabilityTracker";
import {BleCommandManager} from "../../app/ts/logic/constellation/BleCommandManager";
import {CommandAPI} from "../../app/ts/logic/constellation/Commander";
import {TimeKeeper} from "../../app/ts/backgroundProcesses/TimeKeeper";

beforeEach(async () => {
  StoneAvailabilityTracker.reset()
  BleCommandManager.reset();
  SessionManager.reset();
  TimeKeeper.reset();
  prepareSuiteForTest()
  mConstellationState.allowBroadcasting = false;
})
beforeAll(async () => { })
afterEach(async () => { await cleanupSuiteAfterTest() })
afterAll(async () => {})

const handle      = 'TestHandle';
const meshId      = 'MeshId';
const otherMeshId = 'otherMeshId';
const privateId   = 'PrivateIDX';
eventHelperSetActive(handle);

test("SessionBroker finish mesh command", async () => {
  StoneAvailabilityTracker.init();

  let sphere = addSphere();
  let { stone: stone1, handle:handle1 } = addStone({}, meshId);
  let { stone: stone2, handle:handle2 } = addStone({}, meshId);
  let { stone: stone3, handle:handle3 } = addStone({}, meshId);
  let { stone: stone4, handle:handle4 } = addStone({}, meshId);
  let { stone: stone5, handle:handle5 } = addStone({}, meshId);

  let turnOnCommander       = new CommandAPI(getCommandOptions(sphere.id, [handle1]));
  let allowDimmingCommander = new CommandAPI(getCommandOptions(sphere.id, [handle3]));

  // load the commands into the commanders.
  turnOnCommander.turnOn();
  allowDimmingCommander.allowDimming(true)


  // sessions for all items in the mesh should be requested
  expect(Object.keys(SessionManager._sessions).length).toBe(5)
  // trigger connects by faking iBeacons which are in range.
  evt_ibeacon(-70, handle2);
  evt_ibeacon(-70, handle3);
  evt_ibeacon(-70, handle4);

  await mBluenetPromise.for(handle2).succeed.connect("operation");
  await mBluenetPromise.for(handle3).succeed.connect("operation");
  await mBluenetPromise.for(handle4).succeed.connect("operation");


  await mBluenetPromise.for(handle2).succeed.turnOnMesh();
  await mBluenetPromise.for(handle3).succeed.allowDimming();


  expect(Object.keys(turnOnCommander.broker.pendingSessions).length).toBe(2);
  expect(Object.keys(turnOnCommander.broker.connectedSessions).length).toBe(3);


  await mBluenetPromise.for(handle4).succeed.turnOnMesh();

  await mBluenetPromise.for(handle3).succeed.turnOnMesh();


  // check if the mesh sessions have been cancelled.
  expect(Object.keys(turnOnCommander.broker.pendingSessions).length).toBe(1);
  expect(Object.keys(turnOnCommander.broker.connectedSessions).length).toBe(0);
  expect(SessionManager._sessions[handle1]).not.toBeUndefined();
});


test("SessionBroker direct command finishes mesh commands", async () => {
  StoneAvailabilityTracker.init();

  let sphere = addSphere();
  let { stone: stone1, handle:handle1 } = addStone({}, meshId);
  let { stone: stone2, handle:handle2 } = addStone({}, meshId);
  let { stone: stone3, handle:handle3 } = addStone({}, meshId);
  let { stone: stone4, handle:handle4 } = addStone({}, meshId);
  let { stone: stone5, handle:handle5 } = addStone({}, meshId);

  let api  = new CommandAPI(getCommandOptions(sphere.id, [handle1]));

  api.turnOn();

  evt_ibeacon(-70, handle1);

  await mBluenetPromise.for(handle1).succeed.connect("operation");

  await TestUtil.nextTick();

  expect(Object.keys(api.broker.pendingSessions).length).toBe(4);
  expect(Object.keys(api.broker.connectedSessions).length).toBe(1);

  await mBluenetPromise.for(handle1).succeed.turnOnMesh();

  await TestUtil.nextTick();
  await mBluenetPromise.for(handle1).succeed.setTime();
  await mBluenetPromise.for(handle1).succeed.disconnectCommand();
  evt_disconnected(handle1);

  await TestUtil.nextTick();
  expect(Object.keys(api.broker.pendingSessions).length).toBe(0);

  // check if the mesh sessions have been cancelled.
  expect(SessionManager._sessions).toStrictEqual({});
});


test("SessionBroker check if a private connection is not closed prematurely", async () => {
  StoneAvailabilityTracker.init();
  let sphere = addSphere();
  let { stone: stone1, handle:handle1 } = addStone({}, meshId);
  let api  = new CommandAPI(getCommandOptions(sphere.id, [handle1], true));
  api.allowDimming(true);
  await mBluenetPromise.for(handle1).succeed.connect("operation");
  await TestUtil.nextTick();
  await mBluenetPromise.for(handle1).succeed.allowDimming();
  await TestUtil.nextTick();
  expect(SessionManager._sessions[handle1].state).toBe("WAITING_FOR_COMMANDS");
});


test("SessionBroker check the cleanup of closed private session", async () => {
  StoneAvailabilityTracker.init();
  let sphere = addSphere();
  let { stone: stone1, handle: handle1 } = addStone({}, meshId);
  let api  = new CommandAPI(getCommandOptions(sphere.id, [handle1], true));

  api.allowDimming(true);

  expect(Object.keys(api.broker.pendingSessions).length).toBe(1);
  expect(api.broker.connectedSessions).toStrictEqual({});

  await mBluenetPromise.for(handle1).succeed.connect("operation");

  expect(Object.keys(api.broker.connectedSessions).length).toBe(1);
  expect(Object.keys(api.broker.pendingSessions).length).toBe(0);

  await TestUtil.nextTick();
  await mBluenetPromise.for(handle1).succeed.allowDimming();
  await TestUtil.nextTick();

  expect(SessionManager._sessions[handle1].state).toBe("WAITING_FOR_COMMANDS");

  api.end();

  await TestUtil.nextTick();
  expect(SessionManager._sessions[handle1].state).toBe("DISCONNECTING");
  await mBluenetPromise.for(handle1).succeed.disconnectCommand();

  evt_disconnected(handle1);
  await TestUtil.nextTick();
  expect(SessionManager._sessions[handle1]).toBeUndefined();

  expect(api.broker.connectedSessions).toStrictEqual({});
});



test("SessionBroker check the cleanup of closed public session", async () => {
  StoneAvailabilityTracker.init();
  let sphere = addSphere();
  let { stone: stone1, handle: handle1 } = addStone({}, meshId);
  let api  = new CommandAPI(getCommandOptions(sphere.id, [handle1], false));

  api.allowDimming(true);

  expect(Object.keys(api.broker.pendingSessions).length).toBe(1);
  expect(api.broker.connectedSessions).toStrictEqual({});

  evt_ibeacon(-70, handle1);

  await mBluenetPromise.for(handle1).succeed.connect("operation");

  expect(Object.keys(api.broker.connectedSessions).length).toBe(1);
  expect(Object.keys(api.broker.pendingSessions).length).toBe(0);

  await TestUtil.nextTick();
  await mBluenetPromise.for(handle1).succeed.allowDimming();
  await TestUtil.nextTick();

  expect(SessionManager._sessions[handle1].state).toBe("DISCONNECTING");
  await mBluenetPromise.for(handle1).succeed.setTime();
  await mBluenetPromise.for(handle1).succeed.disconnectCommand();

  evt_disconnected(handle1);
  await TestUtil.nextTick();
  expect(SessionManager._sessions[handle1]).toBeUndefined();

  expect(api.broker.connectedSessions).toStrictEqual({});
});

test("SessionBroker do not re-request sessions on failure or finish of a single command", async () => {
  StoneAvailabilityTracker.init();
  let sphere = addSphere();
  let { stone: stone1, handle: handle1 } = addStone({}, meshId);
  let api  = new CommandAPI(getCommandOptions(sphere.id, [handle1], false));

  let fwErr = null
  let hwErr = null
  api.getFirmwareVersion().catch((err) => { fwErr = err; })
  api.getHardwareVersion().catch((err) => { hwErr = err; })

  moveTimeBy(16000)
  await TestUtil.nextTick()

  expect(fwErr).toStrictEqual(new Error('SESSION_REQUEST_TIMEOUT'));
  expect(hwErr).toStrictEqual(new Error('SESSION_REQUEST_TIMEOUT'));

  expect(TestHookCatcher.wasHookFired('ALREADY_REQUESTED_TIMEOUT')).toBeFalsy();
});
