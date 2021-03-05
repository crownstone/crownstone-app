import { mBluenet, resetMocks } from "../__testUtil/mocks/suite.mock";
import { TestUtil } from "../__testUtil/util/testUtil";
import { eventHelperSetActive, evt_disconnected, evt_ibeacon } from "../__testUtil/helpers/event.helper";
import { BleCommandQueueClass } from "../../app/ts/logic/constellation/BleCommandQueue";
import { addSphere, addStone } from "../__testUtil/helpers/data.helper";
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

let BleCommandQueue = null;
beforeEach(async () => {
  BleCommandQueue = new BleCommandQueueClass();
  resetMocks()
})
beforeAll(async () => {})
afterEach(async () => { await TestUtil.nextTick(); })
afterAll( async () => {})

const meshId = "meshNetwork";

test("Check the CommanderAPI", async () => {

});
