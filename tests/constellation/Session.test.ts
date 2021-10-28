import { mBluenetPromise, resetMocks } from "../__testUtil/mocks/suite.mock";
import { TestUtil } from "../__testUtil/util/testUtil";
import { Session } from "../../app/ts/logic/constellation/Session";
import { eventHelperSetActive, evt_disconnected, evt_ibeacon } from "../__testUtil/helpers/event.helper";
import { core } from "../../app/ts/Core";
import { NativeBusMockClass } from "../__testUtil/mocks/nativeBus.mock";


beforeEach(async () => {
  resetMocks()
})
beforeAll(async () => {})
afterEach(async () => { await TestUtil.nextTick(); })
afterAll(async () => {})

const handle    = 'TestHandle';
const privateId = 'PrivateIDX';
eventHelperSetActive(handle);
test("Session private connection fail. Should not sessionHasEnded. Should retry.", async () => {
  let interactionModule = getInteractionModule()
  let session = new Session(handle,'test', interactionModule);
  expect(interactionModule.canActivate).toBeCalled();

  expect(mBluenetPromise.has(handle).called.connect()).toBeTruthy()
  await mBluenetPromise.for(handle).fail.connect("Error");
  expect(interactionModule.isDeactivated).toBeCalled();
  expect(interactionModule.sessionHasEnded).not.toBeCalled()
  expect(session.state).toBe("INITIALIZING");

  evt_ibeacon(-70, handle);
  expect(interactionModule.canActivate).toBeCalled();
  expect(mBluenetPromise.has(handle).called.connect()).toBeTruthy()
});

test("Session public connection fail. Should retry.", async () => {
  let interactionModule = getInteractionModule()
  let session = new Session(handle,null, interactionModule);

  session.connect();

  await mBluenetPromise.for(handle).fail.connect("Error");
  expect(interactionModule.isDeactivated).toBeCalled();
  expect(session.state).toBe("INITIALIZING");
});

test("Session public connection success. Check disconnection process when disconnect command fails.", async () => {
  let interactionModule = getInteractionModule()
  let session = new Session(handle,null, interactionModule);
  session.connect();
  await mBluenetPromise.for(handle).succeed.connect("operation");
  expect(interactionModule.isConnected).toBeCalled();

  await TestUtil.nextTick();
  // it now checks for commands and there arent any. It thus disconnects and cleans up.

  expect(mBluenetPromise.has(handle).called.disconnectCommand()).toBe(true)
  await mBluenetPromise.for(handle).fail.disconnectCommand();
  evt_disconnected();
  await TestUtil.nextTick();
  expect(interactionModule.sessionHasEnded).toBeCalled();
});

test("Session public connection success. Check disconnection process when disconnect command succeeds.", async () => {
  let interactionModule = getInteractionModule()
  let session = new Session(handle,null, interactionModule);
  session.connect();
  await mBluenetPromise.for(handle).succeed.connect("operation");
  await TestUtil.nextTick();
  await mBluenetPromise.for(handle).succeed.disconnectCommand();
  evt_disconnected();
  await TestUtil.nextTick();
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
  evt_ibeacon(-70)
  expect(interactionModule.canActivate).toBeCalled();

  await mBluenetPromise.for(handle).succeed.connect("operation");
  expect(interactionModule.isConnected).toBeCalled();
  expect(session.state).toBe("CONNECTED");
});

test("Session public deactivating.", async () => {
  let interactionModule = getInteractionModule()
  let session = new Session(handle,null, interactionModule);
  evt_ibeacon(-70)
  expect(interactionModule.canActivate).toBeCalled();
  expect(interactionModule.willActivate).toBeCalled();
  session.deactivate();
  await mBluenetPromise.cancelConnectionRequest(handle);

  expect(interactionModule.isDeactivated).toBeCalled();
  expect(interactionModule.isConnected).not.toBeCalled()

  expect(session.state).toBe("INITIALIZING");
});

test("Session public kill while initializing.", async () => {
  let interactionModule = getInteractionModule()
  let session = new Session(handle,null, interactionModule);
  expect(session.state).toBe("INITIALIZING");
  session.kill();
  await TestUtil.nextTick();
  expect(interactionModule.sessionHasEnded).toHaveBeenCalledTimes(1);
});

test("Session public kill while connecting.", async () => {
  let interactionModule = getInteractionModule()
  let session = new Session(handle,null, interactionModule);
  evt_ibeacon(-70);
  expect(interactionModule.willActivate).toBeCalled();
  expect(session.state).toBe("CONNECTING");
  session.kill();
  await mBluenetPromise.cancelConnectionRequest(handle);

  await TestUtil.nextTick(2);
  expect(interactionModule.sessionHasEnded).toHaveBeenCalledTimes(1);
});

test("Session public kill while connected.", async () => {
  let interactionModule = getInteractionModule()
  let session = new Session(handle,null, interactionModule);
  evt_ibeacon(-70);
  expect(interactionModule.willActivate).toBeCalled();
  await mBluenetPromise.for(handle).succeed.connect("operation");
  expect(session.state).toBe("CONNECTED");
  session.kill();

  await TestUtil.nextTick();
  await mBluenetPromise.for(handle).succeed.disconnectCommand();
  evt_disconnected();

  await TestUtil.nextTick();
  expect(interactionModule.sessionHasEnded).toHaveBeenCalledTimes(1);
});


test("Session private kill while initializing.", async () => {
  let interactionModule = getInteractionModule(1)
  let session = new Session(handle, privateId, interactionModule);
  expect(session.state).toBe("INITIALIZING");
  session.kill();
  await TestUtil.nextTick();
  expect(interactionModule.sessionHasEnded).toHaveBeenCalledTimes(1);
});


test("Session private kill while connecting.", async () => {
  let interactionModule = getInteractionModule()
  let session = new Session(handle, privateId, interactionModule);
  expect(interactionModule.canActivate).toBeCalled();
  expect(interactionModule.willActivate).toBeCalled();
  expect(session.state).toBe("CONNECTING");
  session.kill();
  await mBluenetPromise.cancelConnectionRequest(handle);

  await TestUtil.nextTick(2);
  expect(interactionModule.sessionHasEnded).toHaveBeenCalledTimes(1);
});


test("Session private kill while connected.", async () => {
  let interactionModule = getInteractionModule()
  let session = new Session(handle, privateId, interactionModule);
  expect(interactionModule.willActivate).toBeCalled();
  await mBluenetPromise.for(handle).succeed.connect("operation");
  expect(session.state).toBe("CONNECTED");
  session.kill();
  await TestUtil.nextTick();
  await mBluenetPromise.for(handle).succeed.disconnectCommand();
  evt_disconnected();
  await TestUtil.nextTick();
  expect(interactionModule.sessionHasEnded).toHaveBeenCalledTimes(1);
});


test("Session private kill while waiting for commands.", async () => {
  let interactionModule = getInteractionModule()
  let session = new Session(handle, privateId, interactionModule);
  expect(interactionModule.willActivate).toBeCalled();
  await mBluenetPromise.for(handle).succeed.connect("operation");

  await TestUtil.nextTick();

  expect(session.state).toBe("WAITING_FOR_COMMANDS");
  session.kill();
  await TestUtil.nextTick();
  await mBluenetPromise.for(handle).succeed.disconnectCommand();
  evt_disconnected();

  await TestUtil.nextTick();
  expect(interactionModule.sessionHasEnded).toHaveBeenCalledTimes(1);
});


test("Session should cleanup its listeners", async () => {
  let interactionModule = getInteractionModule()

  // initializing
  let session = new Session(handle,null, interactionModule);
  session.kill();
  expect((core.nativeBus as NativeBusMockClass)._topics).toStrictEqual({})
  expect((core.nativeBus as NativeBusMockClass)._topicIds).toStrictEqual({})
  expect(core.eventBus._topicIds).toStrictEqual({})

  // connecting...
  session = new Session(handle,null, interactionModule);
  session.connect();
  session.kill();
  await mBluenetPromise.cancelConnectionRequest(handle)
  await TestUtil.nextTick(2);
  expect((core.nativeBus as NativeBusMockClass)._topics).toStrictEqual({})
  expect((core.nativeBus as NativeBusMockClass)._topicIds).toStrictEqual({})
  expect(core.eventBus._topicIds).toStrictEqual({})

  // connected...
  session = new Session(handle,null, interactionModule);
  session.connect();
  await mBluenetPromise.for(handle).succeed.connect('operation');
  session.kill();
  await TestUtil.nextTick();
  await mBluenetPromise.for(handle).succeed.disconnectCommand();
  evt_disconnected(handle);
  await TestUtil.nextTick(2);

  expect((core.nativeBus as NativeBusMockClass)._topics).toStrictEqual({})
  expect((core.nativeBus as NativeBusMockClass)._topicIds).toStrictEqual({})
  expect(core.eventBus._topicIds).toStrictEqual({})

  // self cleanup with no commands
  session = new Session(handle,null, interactionModule);
  session.connect();
  await mBluenetPromise.for(handle).succeed.connect('operation');

  await TestUtil.nextTick();
  await mBluenetPromise.for(handle).succeed.disconnectCommand();
  evt_disconnected(handle);
  await TestUtil.nextTick(2);
  expect((core.nativeBus as NativeBusMockClass)._topics).toStrictEqual({})
  expect((core.nativeBus as NativeBusMockClass)._topicIds).toStrictEqual({})
  expect(core.eventBus._topicIds).toStrictEqual({})
});



test("Session disconnects before it is connected. This is a racecondition due to the multiple stages in the connect process.", async() => {
  let interactionModule = getInteractionModule()
  let session = new Session(handle,null, interactionModule);
  evt_ibeacon(-70);
  // connecting.....
  expect(interactionModule.willActivate).toBeCalled();

  evt_disconnected(handle);

  await mBluenetPromise.for(handle).succeed.connect("operation");

  expect(interactionModule.isConnected).not.toBeCalled();
  expect(session.state).toBe('DISCONNECTED');
  expect(session._isSessionActive()).toBeFalsy();
})

test("Claimed Session disconnects before it is connected. This is a racecondition due to the multiple stages in the connect process. Should recover.", async() => {
  let interactionModule = getInteractionModule(1)
  let session = new Session(handle,'test', interactionModule);
  session.recoverFromDisconnect = true;
  evt_ibeacon(-70);
  // connecting.....
  expect(interactionModule.willActivate).toBeCalled();

  evt_disconnected(handle);

  await mBluenetPromise.for(handle).succeed.connect("operation");

  expect(interactionModule.isConnected).not.toBeCalled();
  expect(session.state).toBe('CONNECTING');
  expect(session._isSessionActive()).toBeTruthy();
  expect(interactionModule.willActivate).toBeCalled();
  expect(mBluenetPromise.has(handle).called.connect()).toBeTruthy()
})



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