import { mBluenet, resetMocks } from "../__testUtil/mocks/suite.mock";
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

test("Session private connection fail. Should not cleanup.", async () => {
  let sphere = addSphere();
  let stone1 = addStone({meshNetworkId: meshId});
  let stone2 = addStone({meshNetworkId: meshId});

  let interactionModule = getInteractionModule();
  let sessionManager = new SessionManagerClass();

  let options = getCommandOptions(sphere.id, [stone1.config.handle]);

  sessionManager.request(stone1.config.handle, options.commanderId, false);
  await TestUtil.nextTick();
  sessionManager.request(stone1.config.handle, options.commanderId, false);
  await TestUtil.nextTick();
  sessionManager.request(stone1.config.handle, options.commanderId, false);
  await TestUtil.nextTick();

  expect(sessionManager._registeredSessions[stone1.config.handle].counter).toBe(3);
});

// TODO: handle the _pendingSessionRequests, it *should* be handled by the areThereCommandsFor method..


function getInteractionModule(canActivateFailCount: number = 0) {
  let counter = 0;
  return {
    canActivate:      jest.fn(() => { counter++; return canActivateFailCount < counter }),
    willActivate:     jest.fn(),
    isDeactivated:    jest.fn(),
    isConnected:      jest.fn(),
    connectionFailed: jest.fn(),
    cleanup:          jest.fn()
  };
}