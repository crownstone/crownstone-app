import { mockLogger, silenceCommon } from "./mocks/logger.mock";
mockLogger({v:0, d:1, i:1, w:1, e:1}, silenceCommon());

import { mockBluenetPromiseWrapper } from "./mocks/bluenetPromiseWrapper.mock";

let lib = mockBluenetPromiseWrapper();

import { Session } from "../js/logic/constellation/Session";
import { mocked } from 'ts-jest/utils'


beforeEach(async () => {
  nativeBus.clearAllEvents();
  lib.reset();
})
beforeAll(async () => {})
afterEach(async () => { await lib.wait() })
afterAll(async () => {})

let handle = 'TestHandle';
test("Session private connection fail. Should not cleanup.", async () => {
  let interactionModule = getInteractionModule()
  let session = new Session(handle,'test', interactionModule);
  expect(interactionModule.canActivate).toBeCalled();

  session.connect();

  await lib.for(handle).fail.connect("Error");

  expect(interactionModule.connectionFailed).toBeCalled();
  expect(interactionModule.cleanup).toBeCalledTimes(0);
  expect(session.state === "CONNECTION_FAILED");
})

test("Session public connection fail. Should cleanup.", async () => {
  let interactionModule = getInteractionModule()
  let session = new Session(handle,null, interactionModule);
  session.connect();
  await lib.for(handle).fail.connect("Error");
  expect(interactionModule.cleanup).toBeCalledTimes(1);
})

test("Session public connection success.", async () => {
  let interactionModule = getInteractionModule()
  let session = new Session(handle,null, interactionModule);
  session.connect();
  expect(session.state).toBe("CONNECTING");
  await lib.for(handle).succeed.connect("operation");
  expect(interactionModule.canActivate).toBeCalled();
  expect(interactionModule.isConnected).toBeCalled();
  expect(session.state).toBe("CONNECTED");
})


function getInteractionModule() {
  return {
    canActivate:      jest.fn(),
    willActivate:     jest.fn(),
    isConnected:      jest.fn(),
    connectionFailed: jest.fn(),
    cleanup:          jest.fn()
  };
}