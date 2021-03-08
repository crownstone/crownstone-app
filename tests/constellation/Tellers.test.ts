import { mBluenet, resetMocks } from "../__testUtil/mocks/suite.mock";
import { TestUtil } from "../__testUtil/util/testUtil";
import { eventHelperSetActive, evt_disconnected, evt_ibeacon } from "../__testUtil/helpers/event.helper";
import { BleCommandQueueClass } from "../../app/ts/logic/constellation/BleCommandQueue";
import { addSphere, addStone, createMockDatabase } from "../__testUtil/helpers/data.helper";
import { xUtil } from "../../app/ts/util/StandAloneUtil";
import { MapProvider } from "../../app/ts/backgroundProcesses/MapProvider";
import { getCommandOptions } from "../__testUtil/helpers/constellation.helper";
import {
  Command_AllowDimming,
  Command_GetFirmwareVersion,
  Command_GetHardwareVersion,
  Command_TurnOn
} from "../../app/ts/logic/constellation/commandClasses";
import { Executor } from "../../app/ts/logic/constellation/Executor";
import { connectTo } from "../../app/ts/logic/constellation/Tellers";
import { SessionManager } from "../../app/ts/logic/constellation/SessionManager";

let BleCommandQueue = null;
beforeEach(async () => {
  BleCommandQueue = new BleCommandQueueClass();
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

  expect(mBluenet.has(handle).called.connect()).toBeTruthy();
  await mBluenet.for(handle).succeed.connect("operation")

  let api = await apiPromise;
  api.allowDimming(true);

  await TestUtil.nextTick();
  expect(mBluenet.has(handle).called.allowDimming()).toBeTruthy();
  await mBluenet.for(handle).succeed.allowDimming();
  await TestUtil.nextTick();
  expect(SessionManager._sessions[handle].state).toBe("WAITING_FOR_COMMANDS")
  await TestUtil.nextTick();

  api.end()

  expect(SessionManager._sessions[handle].state).toBe("DISCONNECTING")
});
