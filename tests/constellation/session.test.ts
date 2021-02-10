import { mBluenet, resetMocks } from "../__testUtil/mocks/suite.mock";
import { TestUtil } from "../__testUtil/util/testUtil";
import { Session } from "../../ts/logic/constellation/Session";
import { ibeacon } from "../__testUtil/helpers/event.helper";


beforeEach(async () => {
  resetMocks()
})
beforeAll(async () => {})
afterEach(async () => { await TestUtil.nextTick(); })
afterAll(async () => {})

let handle = 'TestHandle';
test("Session private connection fail. Should not cleanup.", async () => {
  let interactionModule = getInteractionModule()
  let session = new Session(handle,'test', interactionModule);
  expect(interactionModule.canActivate).toBeCalled();

  session.connect();

  await mBluenet.for(handle).fail.connect("Error");
  expect(interactionModule.connectionFailed).toBeCalled();
  expect(interactionModule.cleanup).toBeCalledTimes(0);
  expect(session.state === "CONNECTION_FAILED");
})

test("Session public connection fail. Should cleanup.", async () => {
  let interactionModule = getInteractionModule()
  let session = new Session(handle,null, interactionModule);
  session.connect();
  await mBluenet.for(handle).fail.connect("Error");
  expect(interactionModule.cleanup).toBeCalled();
})

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
  await mBluenet.for(handle).succeed.phoneDisconnect();

  expect(interactionModule.cleanup).toBeCalled();
})

test("Session public connection success. Check disconnection process when disconnect command succeeds.", async () => {
  let interactionModule = getInteractionModule()
  let session = new Session(handle,null, interactionModule);
  session.connect();
  await mBluenet.for(handle).succeed.connect("operation");
  await TestUtil.nextTick();
  await mBluenet.for(handle).succeed.disconnectCommand();
  await mBluenet.for(handle).succeed.phoneDisconnect();
  expect(interactionModule.cleanup).toBeCalled();
})

test("Session public scanning start successful.", async () => {
  let interactionModule = getInteractionModule()
  let session = new Session(handle,null, interactionModule);
  expect(session.state).toBe("INITIALIZING");
  // this should not be close enough
  ibeacon(-95, handle);
  expect(interactionModule.canActivate).toBeCalledTimes(0);

  // this should be close enough;
  ibeacon(-80, handle)
  expect(interactionModule.canActivate).toBeCalled();

  await mBluenet.for(handle).succeed.connect("operation");
  expect(interactionModule.isConnected).toBeCalled();
  expect(session.state).toBe("CONNECTED");
})



function getInteractionModule() {
  return {
    canActivate:      jest.fn(() => true),
    willActivate:     jest.fn(),
    willDeactivate:   jest.fn(),
    isConnected:      jest.fn(),
    connectionFailed: jest.fn(),
    cleanup:          jest.fn()
  };
}