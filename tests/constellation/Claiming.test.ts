import {
  cleanupSuiteAfterTest,
  mBluenetPromise,
  moveTimeBy,
  prepareSuiteForTest,
  resetMocks
} from "../__testUtil/mocks/suite.mock";
import {TestUtil} from "../__testUtil/util/testUtil";
import {evt_disconnected, evt_ibeacon} from "../__testUtil/helpers/event.helper";
import {BleCommandManager} from "../../app/ts/logic/constellation/BleCommandManager";
import {createMockDatabase} from "../__testUtil/helpers/data.helper";
import {claimBluetooth, tell} from "../../app/ts/logic/constellation/Tellers";
import {SessionManager} from "../../app/ts/logic/constellation/SessionManager";
import {TimeKeeper} from "../../app/ts/backgroundProcesses/TimeKeeper";

beforeEach(async () => {
  BleCommandManager.reset();
  SessionManager.reset();
  TimeKeeper.reset();
  prepareSuiteForTest()
})
beforeAll(async () => {})
afterEach(async () => { await cleanupSuiteAfterTest() })
afterAll( async () => {})

const meshId       = "meshNetwork";
const secondMeshId = "secondMeshId";


test("Check claiming Bluetooth to handle session with connect / disconnect", async () => {
  let db = createMockDatabase(meshId, secondMeshId);
  let handle = db.stones[0].handle;

  await SessionManager.intiateBlock()
  let claimedCommanderPromise = claimBluetooth(handle,30)

  expect(mBluenetPromise.has(handle).called.connect()).toBeTruthy();
  await mBluenetPromise.for(handle).succeed.connect("operation")

  let commander = await claimedCommanderPromise;

  commander.putInDFU()

  await TestUtil.nextTick()

  expect(mBluenetPromise.has(handle).called.putInDFU()).toBeTruthy();
  evt_disconnected(handle)
  await mBluenetPromise.for(handle).succeed.putInDFU();

  expect(SessionManager._sessions[handle].state).toBe("DISCONNECTED");

  let p1Err = jest.fn();
  commander.getBootloaderVersion().catch(p1Err)
  expect(SessionManager._sessions[handle].state).toBe("CONNECTING");

  expect(mBluenetPromise.has(handle).called.getBootloaderVersion()).toBeFalsy();
  evt_ibeacon(-70)
  expect(mBluenetPromise.has(handle).called.connect()).toBeTruthy();
  await mBluenetPromise.for(handle).succeed.connect("dfu")

  await TestUtil.nextTick()
  expect(mBluenetPromise.has(handle).called.getBootloaderVersion()).toBeTruthy();

  commander.end();
  await mBluenetPromise.for(handle).succeed.getBootloaderVersion("1.0.2");
  await TestUtil.nextTick();
  evt_disconnected(handle);
  await TestUtil.nextTick();

  expect(SessionManager._sessions[handle]).toBeUndefined();
  expect(SessionManager._activeSessions[handle]).toBeUndefined();
});



test("Check claiming Bluetooth to handle session with open commands", async () => {
  let db = createMockDatabase(meshId, secondMeshId);
  let handle = db.stones[0].handle;

  tell(handle).allowDimming(true);
  expect(Object.keys(SessionManager._pendingSessionRequests).length).toBe(1)
  evt_ibeacon(-70, handle);
  expect(Object.keys(SessionManager._pendingSessionRequests).length).toBe(1)
  expect(Object.keys(SessionManager._activeSessions).length).toBe(1)

  let block = SessionManager.intiateBlock()

  expect(mBluenetPromise.has(handle).called.cancelConnectionRequest()).toBeTruthy();
  await mBluenetPromise.for(handle).fail.connect("CONNECTION_CANCELLED");
  await mBluenetPromise.for(handle).succeed.cancelConnectionRequest();

  expect(Object.keys(SessionManager._pendingSessionRequests).length).toBe(1)
  expect(Object.keys(SessionManager._activeSessions).length).toBe(0)

  await TestUtil.nextTick();
  await block;

  expect(Object.keys(SessionManager._sessions).length).toBe(0)
  expect(Object.keys(SessionManager._pendingSessionRequests).length).toBe(1)

  let claimedCommanderPromise = claimBluetooth(handle,30)

  expect(mBluenetPromise.has(handle).called.connect()).toBeTruthy();
  await mBluenetPromise.for(handle).succeed.connect("dfu")

  let commander = await claimedCommanderPromise;

  commander.end()

  await TestUtil.nextTick()
  expect(mBluenetPromise.has(handle).called.phoneDisconnect()).toBeTruthy();
  await mBluenetPromise.for(handle).succeed.phoneDisconnect();
  evt_disconnected(handle);

  await TestUtil.nextTick()
  expect(Object.keys(SessionManager._sessions).length).toBe(0)

  // releasing block, the previous pending commands will resume.
  SessionManager.releaseBlock();

  expect(Object.keys(SessionManager._sessions).length).toBe(1)
});




test("Check claiming Bluetooth to handle session with open commands which timeout during the claim", async () => {
  let db = createMockDatabase(meshId, secondMeshId);
  let handle = db.stones[0].handle;

  let expectedError

  tell(handle).allowDimming(true).catch((err) => { expectedError = err; })
  evt_ibeacon(-70, handle);

  let block = SessionManager.intiateBlock()

  await mBluenetPromise.for(handle).fail.connect("CONNECTION_CANCELLED");
  await mBluenetPromise.for(handle).succeed.cancelConnectionRequest();

  await TestUtil.nextTick();
  await block;

  let claimedCommanderPromise = claimBluetooth(handle,30);
  await mBluenetPromise.for(handle).succeed.connect("dfu");

  let commander = await claimedCommanderPromise;

  await moveTimeBy(11000);

  // fire the timeout
  expect(expectedError?.message).toBe("SESSION_REQUEST_TIMEOUT");
  expect(Object.keys(SessionManager._pendingSessionRequests).length).toBe(0);

  commander.end();

  await TestUtil.nextTick()
  expect(mBluenetPromise.has(handle).called.phoneDisconnect()).toBeTruthy();
  await mBluenetPromise.for(handle).succeed.phoneDisconnect();
  evt_disconnected(handle);

  await TestUtil.nextTick()
  expect(Object.keys(SessionManager._sessions).length).toBe(0);

  // releasing block, the previous pending commands will resume.
  SessionManager.releaseBlock();

});


