import { mBluenet, mScheduler, resetMocks } from "../__testUtil/mocks/suite.mock";
import { TestUtil } from "../__testUtil/util/testUtil";
import { eventHelperSetActive, evt_disconnected, evt_ibeacon } from "../__testUtil/helpers/event.helper";
import { SessionManagerClass } from "../../app/ts/logic/constellation/SessionManager";
import { addSphere, addStone } from "../__testUtil/helpers/data.helper";
import { getCommandOptions } from "../__testUtil/helpers/constellation.helper";


beforeEach(async () => {
  resetMocks()
})
beforeAll(async () => {})
afterEach(async () => { await TestUtil.nextTick(); })
afterAll(async () => {})

const handle    = 'TestHandle';
const meshId    = 'MeshId';
const privateId = 'PrivateIDX';
eventHelperSetActive(handle);

test("Session manager registration and queue for shared connections.", async () => {
  let sphere = addSphere();
  let stone1 = addStone({meshNetworkId: meshId});
  let handle = stone1.config.handle;
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
  expect(p3Err).toBeCalledWith("ALREADY_REQUESTED");

  evt_ibeacon(-80);

  expect(mBluenet.has(handle).called.connect()).toBeTruthy()
  await mBluenet.for(handle).succeed.connect('operation');

  expect(p1).toBeCalled();
  expect(p2).toBeCalled();
  sessionManager.request(handle, 'commanderId4', false).then(() => { p4(); }).catch((err) => { p4Err(err); })
  await TestUtil.nextTick();
  expect(p4).toBeCalled();

  expect(mBluenet.has(handle).called.disconnectCommand()).toBeTruthy();
  await mBluenet.for(handle).succeed.disconnectCommand();
  await mBluenet.for(handle).succeed.phoneDisconnect();
  evt_disconnected();

  expect(sessionManager._sessions[handle]).toBeUndefined();
  expect(sessionManager._activeSessions[handle]).toBeUndefined();
});


test("Session manager registration and queue for private connections.", async () => {
  let sphere = addSphere();
  let stone1 = addStone({meshNetworkId: meshId});
  let handle = stone1.config.handle;
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
  expect(p3Err).toBeCalledWith("PRIVATE_SESSION_SHOULD_BE_REQUESTED_ONCE_PER_COMMANDER");

  // private connections are queued one by one.
  expect(mBluenet.has(handle).called.connect()).toBeTruthy();
  await mBluenet.for(handle).succeed.connect('operation');

  expect(p1).toBeCalled();

  sessionManager.closeSession(handle, 'commanderId1');

  expect(mBluenet.has(handle).called.disconnectCommand()).toBeTruthy();
  await mBluenet.for(handle).succeed.disconnectCommand();
  await mBluenet.for(handle).succeed.phoneDisconnect();
  evt_disconnected();


  expect(mBluenet.has(handle).called.connect()).toBeTruthy();
  await mBluenet.for(handle).succeed.connect('operation');
  expect(p2).toBeCalled();
});



test("Session manager failing shared connection.", async () => {
  let sphere = addSphere();
  let stone1 = addStone({meshNetworkId: meshId});
  let handle = stone1.config.handle;
  eventHelperSetActive(handle, sphere.id, stone1.id);

  let sessionManager = new SessionManagerClass();

  let p1    = jest.fn();
  let p1Err = jest.fn();
  let p2Err = jest.fn();

  sessionManager.request(handle, 'commanderId1', false).then(() => { p1(); }).catch((err) => { p1Err(err); })
  await TestUtil.nextTick();
  evt_ibeacon(-80);


  expect(mBluenet.has(handle).called.connect()).toBeTruthy();
  await mBluenet.for(handle).fail.connect();

  expect(p1Err).not.toBeCalled();
  expect(mBluenet.has(handle).called.connect()).toBeFalsy();

  evt_ibeacon(-80);

  expect(mBluenet.has(handle).called.connect()).toBeTruthy();

  await mScheduler.trigger()

  expect(p1).not.toBeCalled()
  expect(p1Err).toBeCalledWith("SESSION_REQUEST_TIMEOUT");
});

test("Session manager failing private connection.", async () => {
  let sphere = addSphere();
  let stone1 = addStone({meshNetworkId: meshId});
  let handle = stone1.config.handle;
  eventHelperSetActive(handle, sphere.id, stone1.id);

  let sessionManager = new SessionManagerClass();

  let p1    = jest.fn();
  let p1Err = jest.fn();
  let p2Err = jest.fn();

  sessionManager.request(handle, 'commanderId1', true).then(() => { p1(); }).catch((err) => { p1Err(err); })
  await TestUtil.nextTick();
  evt_ibeacon(-80);


  expect(mBluenet.has(handle).called.connect()).toBeTruthy();
  await mBluenet.for(handle).fail.connect();

  expect(p1Err).not.toBeCalled();
  expect(mBluenet.has(handle).called.connect()).toBeFalsy();

  evt_ibeacon(-80);

  expect(mBluenet.has(handle).called.connect()).toBeTruthy();

  await mScheduler.trigger()

  expect(p1).not.toBeCalled()
  expect(p1Err).toBeCalledWith("SESSION_REQUEST_TIMEOUT");
});

// TODO: handle the _pendingSessionRequests, it *should* be handled by the areThereCommandsFor method..
