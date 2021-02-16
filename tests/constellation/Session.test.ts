import { mBluenet, resetMocks } from "../__testUtil/mocks/suite.mock";
import { TestUtil } from "../__testUtil/util/testUtil";
import { Session } from "../../app/ts/logic/constellation/Session";
import { eventHelperSetActive, evt_disconnected, evt_ibeacon } from "../__testUtil/helpers/event.helper";


beforeEach(async () => {
  resetMocks()
})
beforeAll(async () => {})
afterEach(async () => { await TestUtil.nextTick(); })
afterAll(async () => {})

const handle    = 'TestHandle';
const privateId = 'PrivateIDX';
eventHelperSetActive(handle);
test("Session private connection fail. Should not sessionHasEnded.", async () => {
  let interactionModule = getInteractionModule()
  let session = new Session(handle,'test', interactionModule);
  expect(interactionModule.canActivate).toBeCalled();

  session.connect();

  await mBluenet.for(handle).fail.connect("Error");
  expect(interactionModule.isDeactivated).toBeCalled();
  expect(interactionModule.sessionHasEnded).not.toBeCalled()
  expect(session.state).toBe("INITIALIZING");
});

test("Session public connection fail. Should retry.", async () => {
  let interactionModule = getInteractionModule()
  let session = new Session(handle,null, interactionModule);
  session.connect();
  await mBluenet.for(handle).fail.connect("Error");
  expect(interactionModule.isDeactivated).toBeCalled();
  expect(session.state).toBe("INITIALIZING");
});

test("Session public connection success. Check disconnection process when disconnect command fails.", async () => {
  let interactionModule = getInteractionModule()
  let session = new Session(handle,null, interactionModule);
  session.connect();
  await mBluenet.for(handle).succeed.connect("operation");
  expect(interactionModule.isConnected).toBeCalled();

  await TestUtil.nextTick();
  // it now checks for commands and there arent any. It thus disconnects and cleans up.

  expect(mBluenet.has(handle).called.disconnectCommand()).toBe(true)
  await mBluenet.for(handle).fail.disconnectCommand();
  expect(mBluenet.has(handle).called.phoneDisconnect()).toBe(true)
  evt_disconnected();
  await mBluenet.for(handle).succeed.phoneDisconnect();
  expect(interactionModule.sessionHasEnded).toBeCalled();
});

test("Session public connection success. Check disconnection process when disconnect command succeeds.", async () => {
  let interactionModule = getInteractionModule()
  let session = new Session(handle,null, interactionModule);
  session.connect();
  await mBluenet.for(handle).succeed.connect("operation");
  await TestUtil.nextTick();
  await mBluenet.for(handle).succeed.disconnectCommand();
  evt_disconnected();
  await mBluenet.for(handle).succeed.phoneDisconnect();
  expect(interactionModule.sessionHasEnded).toBeCalled();
});

test("Session public scanning start successful.", async () => {
  let interactionModule = getInteractionModule()
  let session = new Session(handle,null, interactionModule);
  expect(session.state).toBe("INITIALIZING");
  // this should not be close enough
  evt_ibeacon(-95);
  expect(interactionModule.canActivate).not.toBeCalled()

  // this should be close enough;
  evt_ibeacon(-80)
  expect(interactionModule.canActivate).toBeCalled();

  await mBluenet.for(handle).succeed.connect("operation");
  expect(interactionModule.isConnected).toBeCalled();
  expect(session.state).toBe("CONNECTED");
});

test("Session public deactivating.", async () => {
  let interactionModule = getInteractionModule()
  let session = new Session(handle,null, interactionModule);
  evt_ibeacon(-80)
  expect(interactionModule.canActivate).toBeCalled();
  expect(interactionModule.willActivate).toBeCalled();
  session.deactivate();
  await mBluenet.for(handle).fail.connect("CONNECTION_CANCELLED");
  await mBluenet.for(handle).succeed.cancelConnectionRequest();

  expect(interactionModule.isDeactivated).toBeCalled();
  expect(interactionModule.isConnected).not.toBeCalled()

  expect(session.state).toBe("INITIALIZING");
});

test("Session public kill while initializing.", async () => {
  let interactionModule = getInteractionModule()
  let session = new Session(handle,null, interactionModule);
  expect(session.state).toBe("INITIALIZING");
  session.kill();
  expect(interactionModule.sessionHasEnded).toHaveBeenCalledTimes(1);
});

test("Session public kill while connecting.", async () => {
  let interactionModule = getInteractionModule()
  let session = new Session(handle,null, interactionModule);
  evt_ibeacon(-80);
  expect(interactionModule.willActivate).toBeCalled();
  expect(session.state).toBe("CONNECTING");
  session.kill();
  await mBluenet.for(handle).succeed.cancelConnectionRequest("operation");
  await mBluenet.for(handle).fail.connect("CONNECTION_CANCELLED");

  expect(interactionModule.sessionHasEnded).toHaveBeenCalledTimes(1);
});

test("Session public kill while connected.", async () => {
  let interactionModule = getInteractionModule()
  let session = new Session(handle,null, interactionModule);
  evt_ibeacon(-80);
  expect(interactionModule.willActivate).toBeCalled();
  await mBluenet.for(handle).succeed.connect("operation");
  expect(session.state).toBe("CONNECTED");
  session.kill();
  await mBluenet.for(handle).succeed.disconnectCommand();
  evt_disconnected();
  await mBluenet.for(handle).succeed.phoneDisconnect();
  expect(interactionModule.sessionHasEnded).toHaveBeenCalledTimes(1);
});

// TODO: add commands.
// test("Session public kill while performing command.", async () => {
//   let interactionModule = getInteractionModule()
//   let session = new Session(handle,null, interactionModule);
//   evt_ibeacon(-80)
//   expect(interactionModule.willActivate).toBeCalled();
//   mBluenet.for(handle).succeed.connect("operation");
//   session.kill();
//   expect(interactionModule.connectionFailed).toBeCalled();
//   expect(interactionModule.sessionHasEnded).toBeCalled();
// });

test("Session private kill while initializing.", async () => {
  let interactionModule = getInteractionModule(1)
  let session = new Session(handle, privateId, interactionModule);
  expect(session.state).toBe("INITIALIZING");
  session.kill();
  expect(interactionModule.sessionHasEnded).toHaveBeenCalledTimes(1);
});

test("Session private kill while connecting.", async () => {
  let interactionModule = getInteractionModule()
  let session = new Session(handle, privateId, interactionModule);
  expect(interactionModule.canActivate).toBeCalled();
  expect(interactionModule.willActivate).toBeCalled();
  expect(session.state).toBe("CONNECTING");
  session.kill();
  await mBluenet.for(handle).succeed.cancelConnectionRequest("operation");
  await mBluenet.for(handle).fail.connect("CONNECTION_CANCELLED");

  expect(interactionModule.sessionHasEnded).toHaveBeenCalledTimes(1);
});

test("Session private kill while connected.", async () => {
  let interactionModule = getInteractionModule()
  let session = new Session(handle, privateId, interactionModule);
  expect(interactionModule.willActivate).toBeCalled();
  await mBluenet.for(handle).succeed.connect("operation");
  expect(session.state).toBe("CONNECTED");
  session.kill();
  await mBluenet.for(handle).succeed.disconnectCommand();
  evt_disconnected();
  await mBluenet.for(handle).succeed.phoneDisconnect();
  expect(interactionModule.sessionHasEnded).toHaveBeenCalledTimes(1);
});

// TODO: add commands.
// test("Session private kill while performing command.", async () => {
//   let interactionModule = getInteractionModule()
//   let session = new Session(handle, privateId, interactionModule);
//   evt_ibeacon(-80);
//   expect(interactionModule.willActivate).toBeCalled();
//   await mBluenet.for(handle).succeed.connect("operation");
//   expect(session.state).toBe("CONNECTED");
//   session.kill();
//   await mBluenet.for(handle).succeed.disconnectCommand();
//   evt_disconnected();
//   await mBluenet.for(handle).succeed.phoneDisconnect();
//   expect(interactionModule.sessionHasEnded).toBeCalled();
// });

test("Session private kill while waiting for commands.", async () => {
  let interactionModule = getInteractionModule()
  let session = new Session(handle, privateId, interactionModule);
  expect(interactionModule.willActivate).toBeCalled();
  await mBluenet.for(handle).succeed.connect("operation");

  await TestUtil.nextTick();

  expect(session.state).toBe("WAITING_FOR_COMMANDS");
  session.kill();

  await mBluenet.for(handle).succeed.disconnectCommand();
  evt_disconnected();
  await mBluenet.for(handle).succeed.phoneDisconnect();
  expect(interactionModule.sessionHasEnded).toHaveBeenCalledTimes(1);
});



function getInteractionModule(canActivateFailCount: number = 0) {
  let counter = 0;
  return {
    canActivate:      jest.fn(() => { counter++; return canActivateFailCount < counter }),
    willActivate:     jest.fn(),
    isDeactivated:    jest.fn(),
    isConnected:      jest.fn(),
    sessionHasEnded:  jest.fn()
  };
}