import {
  cleanupSuiteAfterTest,
  mBluenet,
  mBluenetPromise,
  moveTimeBy,
  prepareSuiteForTest,
  resetMocks
} from "../__testUtil/mocks/suite.mock";
import { TestUtil } from "../__testUtil/util/testUtil";
import { BleCommandManagerClass } from "../../app/ts/logic/constellation/BleCommandManager";
import { createMockDatabase } from "../__testUtil/helpers/data.helper";
import { getCommandOptions } from "../__testUtil/helpers/constellation.helper";
import {
  Command_MultiSwitch,
  Command_TurnOn
} from "../../app/ts/logic/constellation/commandClasses";
import {
  BroadcastCommandManager,
} from "../../app/ts/logic/constellation/BroadcastCommandManager";



let BleCommandManager = null;
beforeEach(async () => {
  BleCommandManager = new BleCommandManagerClass();
  BroadcastCommandManager.reset();
  prepareSuiteForTest();
})
afterEach(async () => { await cleanupSuiteAfterTest() });
beforeAll(async () => {});
afterAll( async () => {});

const meshId = "meshNetwork";
const otherMeshId = "otherMeshNetwork";

test("Broadcast command, check if it works for turnon", async () => {
  let db = createMockDatabase();

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
  let db = createMockDatabase();

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
  let db = createMockDatabase();
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
  let db = createMockDatabase();
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

  moveTimeBy(1000) // advance the time so that the queued item will be executed on the next pending check.
  expect(mBluenetPromise.has().stacked.turnOnBroadcast()).toBe(2);
});