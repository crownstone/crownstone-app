import { mBluenetPromise, mocks, mScheduler, resetMocks } from "../__testUtil/mocks/suite.mock";
import { TestUtil } from "../__testUtil/util/testUtil";
import { eventHelperSetActive, evt_disconnected, evt_ibeacon } from "../__testUtil/helpers/event.helper";
import { BleCommandManager } from "../../app/ts/logic/constellation/BleCommandManager";
import { addSphere, addStone, createMockDatabase } from "../__testUtil/helpers/data.helper";
import { xUtil } from "../../app/ts/util/StandAloneUtil";
import { MapProvider } from "../../app/ts/backgroundProcesses/MapProvider";
import { getCommandOptions } from "../__testUtil/helpers/constellation.helper";
import {
  Command_AllowDimming, Command_GetBootloaderVersion,
  Command_GetFirmwareVersion,
  Command_GetHardwareVersion,
  Command_TurnOn
} from "../../app/ts/logic/constellation/commandClasses";
import { Executor } from "../../app/ts/logic/constellation/Executor";
import { broadcast, claimBluetooth, connectTo, tell } from "../../app/ts/logic/constellation/Tellers";
import { SessionManager, SessionManagerClass } from "../../app/ts/logic/constellation/SessionManager";
import { CommandAPI } from "../../app/ts/logic/constellation/Commander";

beforeEach(async () => {
  BleCommandManager.reset()
  SessionManager.reset()
  resetMocks()
})
beforeAll(async () => {})
afterEach(async () => { await TestUtil.nextTick(); })
afterAll( async () => {})

const meshId       = "meshNetwork";
const secondMeshId = "secondMeshId";


test("Check the direct teller", async () => {
  let db = createMockDatabase(meshId, secondMeshId);
  let handle = db.stones[0].handle;
  let apiPromise = connectTo(handle);

  expect(mBluenetPromise.has(handle).called.connect()).toBeTruthy();
  await mBluenetPromise.for(handle).succeed.connect("operation")

  let api = await apiPromise;
  api.allowDimming(true);

  await TestUtil.nextTick();
  expect(mBluenetPromise.has(handle).called.allowDimming()).toBeTruthy();
  await mBluenetPromise.for(handle).succeed.allowDimming();
  await TestUtil.nextTick();
  expect(SessionManager._sessions[handle].state).toBe("WAITING_FOR_COMMANDS");
  await TestUtil.nextTick();

  api.end()

  expect(SessionManager._sessions[handle].state).toBe("DISCONNECTING");
});


test("Check the direct teller with slowly incoming commands.", async () => {
  let db = createMockDatabase(meshId, secondMeshId);
  let handle = db.stones[0].handle;
  let apiPromise = connectTo(handle);

  expect(mBluenetPromise.has(handle).called.connect()).toBeTruthy();
  await mBluenetPromise.for(handle).succeed.connect("operation")

  let api = await apiPromise;
  api.allowDimming(true);

  await TestUtil.nextTick();
  await mBluenetPromise.for(handle).succeed.allowDimming();
  await TestUtil.nextTick();
  expect(SessionManager._sessions[handle].state).toBe("WAITING_FOR_COMMANDS")
  await TestUtil.nextTick();
  let valueReturned = false
  api.getBootloaderVersion()
    .then((data) => {
      expect(data).toBe('2.3.1');
      valueReturned = true
    })

  await TestUtil.nextTick();
  await mBluenetPromise.for(handle).succeed.getBootloaderVersion('2.3.1');
  await TestUtil.nextTick();
  expect(SessionManager._sessions[handle].state).toBe("WAITING_FOR_COMMANDS")
  await TestUtil.nextTick();
  expect(valueReturned).toBeTruthy()
});


test("Check basic tell for cleanup of session", async () => {
  let db = createMockDatabase(meshId, secondMeshId);
  let handle = db.stones[0].handle;
  let result = tell(handle).getFirmwareVersion()

  let valueReturned = false
  result.then((fwVersion) => {
    valueReturned = true;
    expect(fwVersion).toBe("5.4.0");
  })

  evt_ibeacon(-70, handle);
  await mBluenetPromise.for(handle).succeed.connect("operation");
  await TestUtil.nextTick();
  await mBluenetPromise.for(handle).succeed.getFirmwareVersion("5.4.0");
  await TestUtil.nextTick();
  await mBluenetPromise.for(handle).succeed.disconnectCommand();
  await TestUtil.nextTick();
  await mBluenetPromise.for(handle).succeed.phoneDisconnect()
  await TestUtil.nextTick();
  evt_disconnected(handle);
  expect(valueReturned).toBeTruthy()
});


test("Check connectTo error propagation", async () => {
  let db = createMockDatabase(meshId, secondMeshId);
  let handle = db.stones[0].handle;

  let caught = false;
  connectTo(handle)
    .catch((err) => {
      caught = true;
      expect(err).toBe('SESSION_REQUEST_TIMEOUT');
    })

  await mBluenetPromise.for(handle).fail.connect("Failed");
  await TestUtil.nextTick();
  await mScheduler.trigger();
  expect(caught).toBeTruthy();
});

test("Check connectTo and the sessionbroker work together", async () => {
  let db = createMockDatabase(meshId, secondMeshId);
  let handle = db.stones[0].handle;

  let commander : CommandAPI = null;
  connectTo(handle).then((result) => { commander = result; })

  await mBluenetPromise.for(handle).succeed.connect("operation");
  expect(commander).not.toBe(null);

  commander.setupPulse();

  expect(commander.broker.pendingSessions[handle]).toBeUndefined();
  expect(commander.broker.connectedSessions[handle]).not.toBeUndefined();
  expect(mBluenetPromise.has(handle).called.setupPulse).toBeTruthy();
});


test("Check pivate connected session error handling.", async () => {
  let db = createMockDatabase(meshId, secondMeshId);
  let handle = db.stones[0].handle;

  let commander : CommandAPI = null;
  connectTo(handle).then((result) => { commander = result; })
  await mBluenetPromise.for(handle).succeed.connect("operation");

  evt_disconnected(handle);
  await TestUtil.nextTick();
  expect(SessionManager._sessions[handle]).toBeUndefined();
  expect(commander.broker.pendingSessions[handle]).toBeUndefined();
  expect(commander.broker.connectedSessions[handle]).toBeUndefined();

  // this does automatically reconnect
  commander.getBootloaderVersion()

  expect(SessionManager._sessions[handle]).not.toBeUndefined();
  expect(commander.broker.pendingSessions[handle]).not.toBeUndefined();
  expect(mBluenetPromise.has(handle).called.connect()).toBeTruthy();

  await mBluenetPromise.for(handle).succeed.connect("operation");
  expect(commander.broker.pendingSessions[handle]).toBeUndefined();
  expect(commander.broker.connectedSessions[handle]).not.toBeUndefined();

  await TestUtil.nextTick();
  expect(mBluenetPromise.has(handle).called.getBootloaderVersion()).toBeTruthy();
});


test("Session manager sets a block on sessions, and allows something to claim it.", async () => {
  let db = createMockDatabase(meshId, secondMeshId);
  let handle = db.stones[0].handle;
  eventHelperSetActive(handle, db.sphere.id, db.stones[0].stone.id);

  await SessionManager.intiateBlock();

  let claimed = false;
  claimBluetooth(handle).then(() => { claimed = true });

  await mBluenetPromise.for(handle).succeed.connect('operation');

  expect(claimed).toBeTruthy()
});




test("Timeout the request from the teller should also clean up the commands", async () => {
  let db = createMockDatabase(meshId, secondMeshId);
  let handle = db.stones[0].handle;
  eventHelperSetActive(handle, db.sphere.id, db.stones[0].stone.id);

  let caughtErrors = [];
  tell(handle).getFirmwareVersion().catch((err) => { caughtErrors.push(err); })
  tell(handle).getGPREGRET().catch((err) => { caughtErrors.push(err); })
  tell(handle).getBootloaderVersion().catch((err) => { caughtErrors.push(err); })
  tell(handle).getTime().catch((err) => { caughtErrors.push(err); })
  tell(handle).getAdcChannelSwaps().catch((err) => { caughtErrors.push(err); })

  console.log(mocks.mScheduler._callbacks)
  await mocks.mScheduler.trigger(5)
  await TestUtil.nextTick()

  expect(caughtErrors[0]).toStrictEqual(new Error("SESSION_REQUEST_TIMEOUT"))
  expect(caughtErrors[1]).toStrictEqual(new Error("SESSION_REQUEST_TIMEOUT"))
  expect(caughtErrors[2]).toStrictEqual(new Error("SESSION_REQUEST_TIMEOUT"))
  expect(caughtErrors[3]).toStrictEqual(new Error("SESSION_REQUEST_TIMEOUT"))
  expect(caughtErrors[4]).toStrictEqual(new Error("SESSION_REQUEST_TIMEOUT"))
});




test("Check if the broadcast method respects block", async () => {
  let db = createMockDatabase(meshId, secondMeshId);
  let handle = db.stones[0].handle;
  eventHelperSetActive(handle, db.sphere.id, db.stones[0].stone.id);

  let caughtErrors = [];
  let p1 = jest.fn()
  let p1Err = jest.fn();
  await SessionManager.intiateBlock()

  broadcast(db.sphere.id).setTimeViaBroadcast(1,1,1,true)
    .then(p1).catch(p1Err);

  await TestUtil.nextTick()

  expect(p1Err).toBeCalledWith(new Error('SESSION_MANAGER_IS_CLAIMED'))
});




test("Check if the broadcast method works", async () => {
  let db = createMockDatabase(meshId, secondMeshId);
  let handle = db.stones[0].handle;
  eventHelperSetActive(handle, db.sphere.id, db.stones[0].stone.id);

  let caughtErrors = [];
  let p1 = jest.fn()
  let p1Err = jest.fn();
  broadcast(db.sphere.id).setTimeViaBroadcast(1,1,1,true)
    .then(p1).catch(p1Err);

  await TestUtil.nextTick()
  await mBluenetPromise.succeed().setTimeViaBroadcast();
  // this trigger is required since broadcasts end in 120ms
  await mocks.mScheduler.trigger(1)

  expect(p1).toBeCalled()
});
