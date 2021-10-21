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

