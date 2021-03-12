import { mBluenetPromise, resetMocks } from "../__testUtil/mocks/suite.mock";
import { TestUtil } from "../__testUtil/util/testUtil";
import { eventHelperSetActive, evt_disconnected, evt_ibeacon } from "../__testUtil/helpers/event.helper";
import { BleCommandManagerClass } from "../../app/ts/logic/constellation/BleCommandManager";
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
import { CommandAPI } from "../../app/ts/logic/constellation/Commander";




let BleCommandManager = null;
beforeEach(async () => {
  BleCommandManager = new BleCommandManagerClass();
  resetMocks()
})
beforeAll(async () => {})
afterEach(async () => { await TestUtil.nextTick(); })
afterAll( async () => {})

const meshId = "meshNetwork";

test("Check the CommanderAPI multiswitch queueing", async () => {
  let db = createMockDatabase(meshId);

  let stone1 = new CommandAPI(getCommandOptions(db.sphere.id, [db.stones[0].handle]));
  let stone2 = new CommandAPI(getCommandOptions(db.sphere.id, [db.stones[1].handle]));
  let stone3 = new CommandAPI(getCommandOptions(db.sphere.id, [db.stones[2].handle]));
  let stone4 = new CommandAPI(getCommandOptions(db.sphere.id, [db.stones[3].handle]));

  stone1.multiSwitch(1, true);
  stone2.multiSwitch(1, true);
  stone3.multiSwitch(1, true);
  stone4.multiSwitch(1, true);
});
