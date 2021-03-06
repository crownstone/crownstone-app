import { mBluenet, mBluenetPromise, mScheduler, resetMocks } from "../__testUtil/mocks/suite.mock";
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
  Command_GetHardwareVersion, Command_MultiSwitch,
  Command_TurnOn
} from "../../app/ts/logic/constellation/commandClasses";
import { advanceBy } from "jest-date-mock";
import {
  BroadcastCommandManager,
  BroadcastCommandManagerClass
} from "../../app/ts/logic/constellation/BroadcastCommandManager";



let BleCommandManager = null;
beforeEach(async () => {
  BleCommandManager = new BleCommandManagerClass();
  BroadcastCommandManager.reset();
  resetMocks();
})
beforeAll(async () => {});
afterEach(async () => { await TestUtil.nextTick(); });
afterAll( async () => {});

const meshId = "meshNetwork";
const otherMeshId = "otherMeshNetwork";

test("Broadcast command, check if it works for turnon", async () => {
  let db = createMockDatabase(meshId, otherMeshId);

  let handle = db.stones[0].handle;
  let options = getCommandOptions(db.sphere.id, [handle]);
  let promise  = { resolve: jest.fn(), reject: jest.fn() };
  BleCommandManager.generateAndLoad(options,  new Command_TurnOn(), true, promise);

  await TestUtil.nextTick();

  expect(mBluenetPromise.has().called.turnOnBroadcast()).toBeTruthy();
  mBluenetPromise.succeed().turnOnBroadcast();

  expect(mBluenet.broadcastExecute).toHaveBeenCalled();
});

test("Broadcast command, check if it works for multiswitch.", async () => {
  let db = createMockDatabase(meshId, otherMeshId);

  let handle = db.stones[0].handle;
  let options = getCommandOptions(db.sphere.id, [handle]);
  let promise  = { resolve: jest.fn(), reject: jest.fn() };
  BleCommandManager.generateAndLoad(options,  new Command_MultiSwitch(100), true, promise);

  await TestUtil.nextTick();

  expect(mBluenetPromise.has().called.broadcastSwitch()).toBeTruthy();
  mBluenetPromise.succeed().broadcastSwitch();

  expect(mBluenet.broadcastExecute).toHaveBeenCalled();
});


test("Broadcast command, check if it stacks", async () => {
  let db = createMockDatabase(meshId, otherMeshId);
  function loadTurnOn(stone) {
    let handle = stone.handle;
    let options = getCommandOptions(db.sphere.id, [handle]);
    let promise  = { resolve: jest.fn(), reject: jest.fn() };
    BleCommandManager.generateAndLoad(options,  new Command_TurnOn(), true, promise);
    return promise;
  }

  loadTurnOn(db.stones[0]);
  loadTurnOn(db.stones[1]);
  loadTurnOn(db.stones[2]);
  loadTurnOn(db.stones[3]);

  expect(mBluenetPromise.has().stacked.turnOnBroadcast()).toBe(4)
  expect(mBluenet.broadcastExecute).not.toHaveBeenCalled()
  await TestUtil.nextTick();
  expect(mBluenet.broadcastExecute).toHaveBeenCalled();

  expect(mBluenetPromise.has().called.turnOnBroadcast()).toBeTruthy();
  mBluenetPromise.succeed().turnOnBroadcast();
  mBluenetPromise.succeed().turnOnBroadcast();
  mBluenetPromise.succeed().turnOnBroadcast();
  mBluenetPromise.succeed().turnOnBroadcast();
});

test("Broadcast command, check if it throttles", async () => {
  let db = createMockDatabase(meshId, otherMeshId);
  function loadTurnOn(stone) {
    let handle  = stone.handle;
    let options = getCommandOptions(db.sphere.id, [handle]);
    let promise = { resolve: jest.fn(), reject: jest.fn() };
    BleCommandManager.generateAndLoad(options,  new Command_TurnOn(), true, promise);
    return promise;
  }

  let initial = loadTurnOn(db.stones[0]);
  await TestUtil.nextTick();
  expect(mBluenet.broadcastExecute).toHaveBeenCalled();
  expect(mBluenetPromise.has().stacked.turnOnBroadcast()).toBe(1);

  // this will be queued
  let second  = loadTurnOn(db.stones[0]);
  expect(mBluenetPromise.has().stacked.turnOnBroadcast()).toBe(1);

  advanceBy(1000) // advance the time so that the queued item will be executed on the next pending check.
  mScheduler.trigger(); // this will resolve the initial turn on command promise.
  mScheduler.trigger(); // this will trigger te the pending check.
  expect(mBluenetPromise.has().stacked.turnOnBroadcast()).toBe(2);
});