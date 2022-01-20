import {mBluenetPromise, mScheduler, resetMocks} from "../__testUtil/mocks/suite.mock";
import {TestUtil} from "../__testUtil/util/testUtil";
import {eventHelperSetActive, evt_disconnected, evt_ibeacon} from "../__testUtil/helpers/event.helper";
import {SessionManagerClass} from "../../app/ts/logic/constellation/SessionManager";
import {addSphere, addStone, createMockDatabase} from "../__testUtil/helpers/data.helper";
import {getCommandOptions} from "../__testUtil/helpers/constellation.helper";
import {BleCommandManager} from "../../app/ts/logic/constellation/BleCommandManager";
import {Command_AllowDimming} from "../../app/ts/logic/constellation/commandClasses";
import {CommandAPI} from "../../app/ts/logic/constellation/Commander";


beforeEach(async () => {
  resetMocks()
})
beforeAll(async () => {})
afterEach(async () => { await TestUtil.nextTick(); })
afterAll( async () => {})

const handle       = 'TestHandle';
const meshId       = 'MeshId';
const secondMeshId = 'otherMesh';
const privateId    = 'PrivateIDX';

eventHelperSetActive(handle);

test("Session manager registration and queue for shared connections.", async () => {
  let sphere = addSphere();
  let { stone: stone1, handle } = addStone({meshNetworkId: meshId});
  eventHelperSetActive(handle, sphere.id, stone1.id);

  let sessionManager = new SessionManagerClass();

  let p1    = jest.fn();
  let p2    = jest.fn();
  let p3    = jest.fn();
  let p4    = jest.fn();
  let p1Err = jest.fn();
  let p2Err = jest.fn();
  let p3Err = jest.fn();
  let p4Err = jest.fn();

  sessionManager.request(handle, 'commanderId1', false).then(() => { p1(); }).catch((err) => { p1Err(err); })
  await TestUtil.nextTick();
  sessionManager.request(handle, 'commanderId2', false).then(() => { p2(); }).catch((err) => { p2Err(err); })
  await TestUtil.nextTick();
  sessionManager.request(handle, 'commanderId1', false).then(() => { p3(); }).catch((err) => { p3Err(err); })
  await TestUtil.nextTick();

  expect(p1).not.toBeCalled();
  expect(p2).not.toBeCalled();
  expect(p3).not.toBeCalled();
  expect(p1Err).not.toBeCalled();
  expect(p2Err).not.toBeCalled();
  expect(p3Err).toBeCalledWith(new Error("ALREADY_REQUESTED"));

  evt_ibeacon(-70);

  expect(mBluenetPromise.has(handle).called.connect()).toBeTruthy()
  await mBluenetPromise.for(handle).succeed.connect('operation');

  expect(p1).toBeCalled();
  expect(p2).toBeCalled();
  sessionManager.request(handle, 'commanderId4', false).then(() => { p4(); }).catch((err) => { p4Err(err); })
  await TestUtil.nextTick();
  expect(p4).toBeCalled();

  expect(mBluenetPromise.has(handle).called.disconnectCommand()).toBeTruthy();
  await mBluenetPromise.for(handle).succeed.disconnectCommand();
  evt_disconnected();
  await TestUtil.nextTick();

  expect(sessionManager._sessions[handle]).toBeUndefined();
  expect(sessionManager._activeSessions[handle]).toBeUndefined();
});


test("Session manager registration and queue for private connections.", async () => {
  let sphere = addSphere();
  let { stone: stone1, handle } = addStone({meshNetworkId: meshId});
  eventHelperSetActive(handle, sphere.id, stone1.id);

  let sessionManager = new SessionManagerClass();

  let p1    = jest.fn();
  let p2    = jest.fn();
  let p3    = jest.fn();
  let p1Err = jest.fn();
  let p2Err = jest.fn();
  let p3Err = jest.fn();

  sessionManager.request(handle, 'commanderId1', true).then(() => { p1(); }).catch((err) => { p1Err(err); })
  await TestUtil.nextTick();
  sessionManager.request(handle, 'commanderId2', true).then(() => { p2(); }).catch((err) => { p2Err(err); })
  await TestUtil.nextTick();
  sessionManager.request(handle, 'commanderId1', true).then(() => { p3(); }).catch((err) => { p3Err(err); })
  await TestUtil.nextTick();

  expect(p1).not.toBeCalled();
  expect(p2).not.toBeCalled();
  expect(p3).not.toBeCalled();
  expect(p1Err).not.toBeCalled();
  expect(p2Err).not.toBeCalled();
  expect(p3Err).toBeCalledWith(new Error("PRIVATE_SESSION_SHOULD_BE_REQUESTED_ONCE_PER_COMMANDER"));

  // private connections are queued one by one.
  expect(mBluenetPromise.has(handle).called.connect()).toBeTruthy();
  await mBluenetPromise.for(handle).succeed.connect('operation');

  expect(p1).toBeCalled();

  sessionManager.closeSession(handle);

  await TestUtil.nextTick()
  expect(mBluenetPromise.has(handle).called.disconnectCommand()).toBeTruthy();
  await mBluenetPromise.for(handle).succeed.disconnectCommand();
  evt_disconnected();

  await TestUtil.nextTick();
  evt_ibeacon(-70);

  expect(mBluenetPromise.has(handle).called.connect()).toBeTruthy();
  await mBluenetPromise.for(handle).succeed.connect('operation');
  expect(p2).toBeCalled();
});



test("Session manager failing shared connection.", async () => {
  let sphere = addSphere();
  let { stone: stone1, handle } = addStone({meshNetworkId: meshId});
  eventHelperSetActive(handle, sphere.id, stone1.id);

  let sessionManager = new SessionManagerClass();

  let p1    = jest.fn();
  let p1Err = jest.fn();
  let p2Err = jest.fn();

  sessionManager.request(handle, 'commanderId1', false).then(() => { p1(); }).catch((err) => { p1Err(err); })
  await TestUtil.nextTick();
  evt_ibeacon(-70);


  expect(mBluenetPromise.has(handle).called.connect()).toBeTruthy();
  await mBluenetPromise.for(handle).fail.connect();

  expect(p1Err).not.toBeCalled();
  expect(mBluenetPromise.has(handle).called.connect()).toBeFalsy();

  evt_ibeacon(-70);

  expect(mBluenetPromise.has(handle).called.connect()).toBeTruthy();

  await mScheduler.trigger()

  expect(p1).not.toBeCalled()
  expect(p1Err).toBeCalledWith(new Error("SESSION_REQUEST_TIMEOUT"));
});

test("Session manager failing private connection.", async () => {
  let sphere = addSphere();
  let { stone: stone1, handle } = addStone({meshNetworkId: meshId});
  eventHelperSetActive(handle, sphere.id, stone1.id);

  let sessionManager = new SessionManagerClass();

  let p1    = jest.fn();
  let p1Err = jest.fn();
  let p2Err = jest.fn();

  sessionManager.request(handle, 'commanderId1', true).then(() => { p1(); }).catch((err) => { p1Err(err); })
  await TestUtil.nextTick();
  evt_ibeacon(-70);


  expect(mBluenetPromise.has(handle).called.connect()).toBeTruthy();
  await mBluenetPromise.for(handle).fail.connect();

  expect(p1Err).not.toBeCalled();
  expect(mBluenetPromise.has(handle).called.connect()).toBeFalsy();

  evt_ibeacon(-70);

  expect(mBluenetPromise.has(handle).called.connect()).toBeTruthy();

  await mScheduler.trigger()

  expect(p1).not.toBeCalled()
  expect(p1Err).toBeCalledWith(new Error("SESSION_REQUEST_TIMEOUT"));

  // this mimics how the kill is done in the lib.
  await mBluenetPromise.cancelConnectionRequest(handle);

  // wait a few ticks for the cleanup to be done.
  // the second tick is for the tick in the sessionHasEnded
  await TestUtil.nextTick(2);

  expect(sessionManager._sessions[handle]).toBeUndefined();
  expect(sessionManager._activeSessions[handle]).toBeUndefined();
  expect(sessionManager._pendingPrivateSessionRequests[handle]).toBeUndefined();
  expect(sessionManager._pendingSessionRequests[handle]).toBeUndefined();
});


test("Session manager request and revoke shared requests in different states.", async () => {
  let sphere = addSphere();
  let { stone: stone1, handle } = addStone({meshNetworkId: meshId});
  eventHelperSetActive(handle, sphere.id, stone1.id);

  let sessionManager = new SessionManagerClass();

  let id1 = 'commanderId_1';
  let id2 = 'commanderId_2';
  let id3 = 'commanderId_3';

  // revoke while initializing...
  sessionManager.request(handle, id1, false);
  expect(sessionManager._pendingSessionRequests[handle].length).toBe(1);
  sessionManager.revokeRequest(handle, id1)
  await TestUtil.nextTick();
  expect(sessionManager._pendingSessionRequests[handle]).toBeUndefined();
  expect(sessionManager._sessions[handle]).toBeUndefined();


  // revoke while connecting...
  sessionManager.request(handle, id2, false);
  evt_ibeacon(-70);
  expect(sessionManager._pendingSessionRequests[handle].length).toBe(1);
  sessionManager.revokeRequest(handle, id2)

  await mBluenetPromise.cancelConnectionRequest(handle);
  await TestUtil.nextTick(2);

  expect(sessionManager._pendingSessionRequests[handle]).toBeUndefined();
  expect(sessionManager._sessions[handle]).toBeUndefined();

  // revoke while connected...
  sessionManager.request(handle, id3, false);
  evt_ibeacon(-70);
  expect(sessionManager._pendingSessionRequests[handle].length).toBe(1);
  await mBluenetPromise.for(handle).succeed.connect("operation");
  await TestUtil.nextTick(2);

  expect(sessionManager._pendingSessionRequests[handle]).toBeUndefined();
  expect(sessionManager._sessions[handle]).not.toBeUndefined();

  sessionManager.revokeRequest(handle, id3)
  await TestUtil.nextTick();
  await mBluenetPromise.for(handle).succeed.disconnectCommand();
  // this event triggers the cleanup.
  evt_disconnected();
  await TestUtil.nextTick();

  expect(sessionManager._pendingSessionRequests[handle]).toBeUndefined();
  expect(sessionManager._sessions[handle]).toBeUndefined();

});



test("Session manager request and revoke private requests in different states.", async () => {
  let sphere = addSphere();
  let { stone: stone1, handle } = addStone({meshNetworkId: meshId});
  eventHelperSetActive(handle, sphere.id, stone1.id);

  let sessionManager = new SessionManagerClass();

  let id1 = 'commanderId_1';
  let id2 = 'commanderId_2';

  // revoke while connecting...
  sessionManager.request(handle, id1, true);
  expect(sessionManager._pendingPrivateSessionRequests[handle].length).toBe(1);
  sessionManager.revokeRequest(handle, id1)
  await mBluenetPromise.cancelConnectionRequest(handle);
  await TestUtil.nextTick(2);
  expect(sessionManager._pendingPrivateSessionRequests[handle]).toBeUndefined();
  expect(sessionManager._sessions[handle]).toBeUndefined();


  // revoke while waiting for commands...
  sessionManager.request(handle, id2, true);
  expect(sessionManager._pendingPrivateSessionRequests[handle].length).toBe(1);
  await mBluenetPromise.for(handle).succeed.connect("operation");
  expect(sessionManager._pendingPrivateSessionRequests[handle]).toBeUndefined();
  expect(sessionManager._sessions[handle]).not.toBeUndefined();

  sessionManager.revokeRequest(handle, id2)
  await TestUtil.nextTick();
  await mBluenetPromise.for(handle).succeed.disconnectCommand();
  // this event triggers the cleanup.
  evt_disconnected();
  await TestUtil.nextTick();
  expect(sessionManager._pendingPrivateSessionRequests[handle]).toBeUndefined();
  expect(sessionManager._sessions[handle]).toBeUndefined();
});


test("Session manager private connections cannot request the same session twice.", async () => {
  let sphere = addSphere();
  let { stone: stone1, handle } = addStone({meshNetworkId: meshId});
  eventHelperSetActive(handle, sphere.id, stone1.id);
  let sessionManager = new SessionManagerClass();
  let id1 = 'commanderId_1';

  sessionManager.request(handle, id1, true);
  await mBluenetPromise.for(handle).succeed.connect("operation");

  let thrown = false;
  await sessionManager.request(handle, id1, true)
    .catch((err) => {
      thrown = true;
      expect(err).toStrictEqual(new Error('PRIVATE_SESSION_SHOULD_BE_REQUESTED_ONCE_PER_COMMANDER'))
    })

  expect(thrown).toBeTruthy();
});


test("Session manager being paused with no active sessions. It should block new ones.", async () => {
  let db = createMockDatabase(meshId, secondMeshId);
  let handle = db.stones[0].handle;
  eventHelperSetActive(handle, db.sphere.id, db.stones[0].stone.id);

  let sessionManager = new SessionManagerClass();
  await sessionManager.intiateBlock()

  sessionManager.request(handle, "commander", true);

  await TestUtil.nextTick();

  expect(sessionManager._sessions[handle]).toBeUndefined();
  expect(sessionManager._pendingPrivateSessionRequests[handle].length).toBe(1);
});


test("Session manager being paused with private connections. These should be awaited.", async () => {
  let db = createMockDatabase(meshId, secondMeshId);
  let handle = db.stones[0].handle;
  eventHelperSetActive(handle, db.sphere.id, db.stones[0].stone.id);

  let sessionManager = new SessionManagerClass();
  sessionManager.request(handle, "commander", true);
  expect(mBluenetPromise.has(handle).called.connect()).toBeTruthy();
  await mBluenetPromise.for(handle).succeed.connect("operation");

  let pauseFinished = false;
  sessionManager.intiateBlock().then(() => { pauseFinished = true; })

  await mScheduler.triggerDelay()
  expect(pauseFinished).toBeFalsy();

  evt_disconnected(handle);
  await TestUtil.nextTick();

  expect(Object.keys(sessionManager._activeSessions).length).toBe(0)
  expect(pauseFinished).toBeFalsy();
  await mScheduler.triggerDelay()
  await TestUtil.nextTick();
  expect(pauseFinished).toBeTruthy()
});


test("Session manager being paused with public connections. These should be closed.", async () => {
  let db = createMockDatabase(meshId, secondMeshId);
  let handle = db.stones[0].handle;
  eventHelperSetActive(handle, db.sphere.id, db.stones[0].stone.id);

  let sessionManager = new SessionManagerClass();
  sessionManager.request(handle, "commander", false);
  evt_ibeacon(-70)

  let promise = { promise: new Promise(() => {}), resolve: jest.fn(), reject: jest.fn() };
  let options2 = getCommandOptions(db.sphere.id, [handle]);
  BleCommandManager.generateAndLoad(options2, new Command_AllowDimming(true), false, promise);

  expect(mBluenetPromise.has(handle).called.connect()).toBeTruthy();
  await mBluenetPromise.for(handle).succeed.connect("operation");

  let pauseFinished = false;
  expect(sessionManager._sessions[handle].state).toBe("CONNECTED");
  expect(mBluenetPromise.has(handle).called.disconnectCommand()).toBeFalsy();
  sessionManager.intiateBlock().then(() => { pauseFinished = true; })

  expect(pauseFinished).toBeFalsy();
  await TestUtil.nextTick();
  await mBluenetPromise.for(handle).succeed.disconnectCommand();

  evt_disconnected(handle);

  await TestUtil.nextTick();
  expect(Object.keys(sessionManager._activeSessions).length).toBe(0)
  expect(pauseFinished).toBeFalsy();
  await mScheduler.triggerDelay();
  await TestUtil.nextTick();
  expect(pauseFinished).toBeTruthy();
});




test("Check usage of re-requesting by sessionManager", async () => {
  let db = createMockDatabase(meshId);
  let handle = db.stones[0].handle;
  let commander1 = new CommandAPI(getCommandOptions(db.sphere.id, [handle], true));

  let p1Err = jest.fn();
  let c2Success = jest.fn();
  commander1.getBootloaderVersion().catch(p1Err);

  // expect the session to attempt a connect
  expect(mBluenetPromise.has(handle).called.connect()).toBeTruthy();

  let commander2 = new CommandAPI(getCommandOptions(db.sphere.id, [handle]));
  commander2.getFirmwareVersion().then(c2Success);

  // trigger the timeout of the first session requested by the 1st commander
  await mScheduler.trigger();
  await TestUtil.nextTick();
  expect(p1Err).toBeCalledWith(new Error("SESSION_REQUEST_TIMEOUT"));

  await mBluenetPromise.for(handle).fail.connect("CONNECTION_CANCELLED");
  await mBluenetPromise.for(handle).succeed.cancelConnectionRequest();

  await TestUtil.nextTick();

  evt_ibeacon(-70, handle);
  expect(mBluenetPromise.has(handle).called.connect()).toBeTruthy();

  await mBluenetPromise.for(handle).succeed.connect("operation");
  await TestUtil.nextTick()

  let commander3 = new CommandAPI(getCommandOptions(db.sphere.id, [handle]));
  commander3.getHardwareVersion().then(c2Success)

  expect(mBluenetPromise.has(handle).called.getFirmwareVersion()).toBeTruthy();
  await mBluenetPromise.for(handle).succeed.getFirmwareVersion('1.2.3')

  await TestUtil.nextTick()
  expect(mBluenetPromise.has(handle).called.getHardwareVersion()).toBeTruthy();
  await mBluenetPromise.for(handle).succeed.getHardwareVersion('ACRO')

  await TestUtil.nextTick()
  expect(mBluenetPromise.has(handle).called.disconnectCommand()).toBeTruthy();
  evt_disconnected(handle);
  await mBluenetPromise.for(handle).succeed.disconnectCommand();
});







