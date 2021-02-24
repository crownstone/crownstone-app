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

test("Check the executor aggregation", async () => {
  let sphere = addSphere();
  let { stone: stone1, handle:handle1 } = addStone({meshNetworkId: meshId});
  let { stone: stone2, handle:handle2 } = addStone({meshNetworkId: meshId});
  let { stone: stone3, handle:handle3 } = addStone({meshNetworkId: meshId});
  let { stone: stone4, handle:handle4 } = addStone({meshNetworkId: meshId});
  let { stone: stone5, handle:handle5 } = addStone({meshNetworkId: meshId});

  let promise = { resolve: jest.fn(), reject: jest.fn() };
  let options = getCommandOptions(sphere.id, [handle1]);
  let options2 = getCommandOptions(sphere.id, [handle2]);

  BleCommandQueue.generateAndLoad(options,  new Command_TurnOn(), false, promise);
  BleCommandQueue.generateAndLoad(options2, new Command_TurnOn(), true, promise);

  expect(Executor.aggregateTurnOnCommands(handle1,BleCommandQueue.queue.direct[handle1][0],BleCommandQueue.queue).length).toBe(2);
  expect(Executor.aggregateTurnOnCommands(handle2,BleCommandQueue.queue.direct[handle2][0],BleCommandQueue.queue).length).toBe(1);
});
