import { mBluenetPromise, mConstellationState, resetMocks } from "../__testUtil/mocks/suite.mock";
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
import { connectTo } from "../../app/ts/logic/constellation/Tellers";

let BleCommandManager = null;
beforeEach(async () => {
  BleCommandManager = new BleCommandManagerClass();
  resetMocks()
  mConstellationState.allowBroadcasting = false;
})
beforeAll(async () => {})
afterEach(async () => { await TestUtil.nextTick(); })
afterAll(async () => {})

const meshId = "meshNetwork";
const otherMeshId = "otherMeshNetwork";

test("BleCommandManager shared, direct, generating commands and removing duplicate", async () => {
  let sphere = addSphere();
  let { stone: stone1, handle:handle1 } = addStone();
  let { stone: stone2, handle:handle2 } = addStone();

  let promise = { resolve: jest.fn(), reject: jest.fn() };
  let options = getCommandOptions(sphere.id, [stone1.config.handle, stone2.config.handle]);

  BleCommandManager.generateAndLoad(options, new Command_TurnOn(), false, promise);

  expect(BleCommandManager.queue.direct[stone1.config.handle].length).toBe(1);
  expect(BleCommandManager.queue.direct[stone2.config.handle].length).toBe(1);
  expect(Object.keys(BleCommandManager.queue.direct).length).toBe(2);
  expect(Object.keys(BleCommandManager.queue.mesh).length).toBe(0);

  let id1 = BleCommandManager.queue.direct[stone1.config.handle][0].id;
  let id2 = BleCommandManager.queue.direct[stone2.config.handle][0].id;

  // check if duplicates are removed:
  BleCommandManager.generateAndLoad(options, new Command_TurnOn(), false, promise);

  expect(BleCommandManager.queue.direct[stone1.config.handle].length).toBe(1);
  expect(BleCommandManager.queue.direct[stone2.config.handle].length).toBe(1);
  expect(Object.keys(BleCommandManager.queue.direct).length).toBe(2);
  expect(Object.keys(BleCommandManager.queue.mesh).length).toBe(0);

  expect(BleCommandManager.queue.direct[stone1.config.handle][0].id).not.toBe(id1);
  expect(BleCommandManager.queue.direct[stone2.config.handle][0].id).not.toBe(id2);
});

test("BleCommandManager shared, direct, meshRelay, one stone", async () => {
  let sphere = addSphere();
  let { stone: stone1, handle:handle1 } = addStone({meshId: meshId});

  let promise = { resolve: jest.fn(), reject: jest.fn() };
  let options = getCommandOptions(sphere.id, [stone1.config.handle]);

  BleCommandManager.generateAndLoad(options, new Command_TurnOn(), true, promise);

  expect(BleCommandManager.queue.direct[stone1.config.handle].length).toBe(1);
  expect(BleCommandManager.queue.mesh[meshId]).toBeUndefined();
});

test("BleCommandManager shared, direct, meshRelay, 5 stones", async () => {
  let sphere = addSphere();
  let { stone: stone1, handle:handle1 } = addStone({meshNetworkId:meshId});
  let { stone: stone2, handle:handle2 } = addStone({meshNetworkId:meshId});
  let { stone: stone3, handle:handle3 } = addStone({meshNetworkId:meshId});
  let { stone: stone4, handle:handle4 } = addStone({meshNetworkId:meshId});
  let { stone: stone5, handle:handle5 } = addStone({meshNetworkId:otherMeshId});

  let promise = { resolve: jest.fn(), reject: jest.fn() };
  let options = getCommandOptions(sphere.id, [stone1.config.handle]);

  BleCommandManager.generateAndLoad(options, new Command_TurnOn(), true, promise);
  expect(BleCommandManager.queue.direct[stone1.config.handle].length).toBe(1);
  expect(BleCommandManager.queue.mesh[sphere.id].length).toBe(1);
  expect(BleCommandManager.queue.mesh[sphere.id][0].minConnections).toBe(3);
});

test("BleCommandManager shared, direct, meshRelay, 3 stones in mesh, see if the minimum connection count works", async () => {
  let sphere = addSphere();
  let { stone: stone1, handle:handle1 } = addStone({meshNetworkId:meshId});
  let { stone: stone2, handle:handle2 } = addStone({meshNetworkId:meshId});
  let { stone: stone3, handle:handle3 } = addStone({meshNetworkId:meshId});
  let { stone: stone4, handle:handle4 } = addStone({meshNetworkId:otherMeshId});


  let promise = { resolve: jest.fn(), reject: jest.fn() };
  let options = getCommandOptions(sphere.id, [stone1.config.handle]);

  BleCommandManager.generateAndLoad(options, new Command_TurnOn(), true, promise);
  expect(BleCommandManager.queue.direct[stone1.config.handle].length).toBe(1);
  expect(BleCommandManager.queue.mesh[sphere.id].length).toBe(1);
  expect(BleCommandManager.queue.mesh[sphere.id][0].minConnections).toBe(3);
});


test("BleCommandManager shared, direct, check if there are commands available", async () => {
  let sphere = addSphere();
  let { stone: stone1, handle:handle1 } = addStone({meshNetworkId:meshId});
  let { stone: stone2, handle:handle2 } = addStone({meshNetworkId:meshId});
  let { stone: stone3, handle:handle3 } = addStone({meshNetworkId:meshId});
  let { stone: stone4, handle:handle4 } = addStone({meshNetworkId:otherMeshId});

  let promise = { resolve: jest.fn(), reject: jest.fn() };
  let options = getCommandOptions(sphere.id, [stone1.config.handle]);
  BleCommandManager.generateAndLoad(options, new Command_TurnOn(), true, promise);

  expect(BleCommandManager.areThereCommandsFor(stone1.config.handle)).toBeTruthy();
  expect(BleCommandManager.areThereCommandsFor(stone2.config.handle)).toBeTruthy();
  expect(BleCommandManager.areThereCommandsFor(stone3.config.handle)).toBeTruthy();
  expect(BleCommandManager.areThereCommandsFor(stone4.config.handle)).toBeTruthy(); // the assumption is that the mesh is covering the entire sphere
});


test("BleCommandManager shared, direct, check a command can be performed", async () => {
  let sphere = addSphere();
  let { stone: stone1, handle:handle1 } = addStone({meshNetworkId:meshId});
  let { stone: stone2, handle:handle2 } = addStone({meshNetworkId:meshId});

  let promise = { resolve: jest.fn(), reject: jest.fn() };
  let options = getCommandOptions(sphere.id, [stone1.config.handle]);
  BleCommandManager.generateAndLoad(options, new Command_TurnOn(), true, promise);

  expect(BleCommandManager.queue.direct[stone1.config.handle].length).toBe(1);
  expect(BleCommandManager.queue.mesh[sphere.id].length).toBe(1);

  expect(BleCommandManager.areThereCommandsFor(stone1.config.handle)).toBeTruthy();
  BleCommandManager.performCommand(stone1.config.handle);

  expect(mBluenetPromise.has(stone1.config.handle).called.turnOnMesh()).toBeTruthy();
  expect(mBluenetPromise.for(stone1.config.handle).getArgsFor.turnOnMesh()[1]).toEqual([1]);
  await mBluenetPromise.for(stone1.config.handle).succeed.turnOnMesh();

  expect(BleCommandManager.queue.direct[stone1.config.handle]).toBeUndefined();
  expect(BleCommandManager.queue.mesh[sphere.id]).toBeUndefined();
});


test("BleCommandManager shared, perform and fail mesh command. An error in the performing should fail the command. We don't expect errors.", async () => {
  let sphere = addSphere();
  let { stone: stone1, handle:handle1 } = addStone({meshNetworkId:meshId});
  let { stone: stone2, handle:handle2 } = addStone({meshNetworkId:meshId});
  let { stone: stone3, handle:handle3 } = addStone({meshNetworkId:meshId});
  let { stone: stone4, handle:handle4 } = addStone({meshNetworkId:meshId});

  let promise = { resolve: jest.fn(), reject: jest.fn() };
  let options = getCommandOptions(sphere.id, [stone1.config.handle]);
  BleCommandManager.generateAndLoad(options, new Command_TurnOn(), true, promise);

  BleCommandManager.performCommand(stone2.config.handle);
  expect(mBluenetPromise.has(stone2.config.handle).called.turnOnMesh()).toBeTruthy();
  await mBluenetPromise.for(stone2.config.handle).succeed.turnOnMesh();
  expect(BleCommandManager.queue.mesh[sphere.id].length).toBe(1);

  BleCommandManager.performCommand(stone3.config.handle);
  expect(mBluenetPromise.has(stone3.config.handle).called.turnOnMesh()).toBeTruthy();
  await mBluenetPromise.for(stone3.config.handle).succeed.turnOnMesh();
  expect(BleCommandManager.queue.mesh[sphere.id].length).toBe(1);

  BleCommandManager.performCommand(stone4.config.handle);
  expect(mBluenetPromise.has(stone4.config.handle).called.turnOnMesh()).toBeTruthy();
  await mBluenetPromise.for(stone4.config.handle).fail.turnOnMesh();
  expect(BleCommandManager.queue.mesh[sphere.id]).toBeUndefined();

  await TestUtil.nextTick();
  expect(promise.reject).toBeCalledWith(new Error("GenericError"))
});



test("BleCommandManager private, direct and finish command in mesh", async () => {
  let sphere = addSphere();
  let { stone: stone1, handle:handle1 } = addStone({meshNetworkId:meshId});

  let promise = { resolve: jest.fn(), reject: jest.fn() };
  let promise2 = { resolve: jest.fn(), reject: jest.fn() };
  let options = getCommandOptions(sphere.id, [stone1.config.handle], true);
  let id = options.commanderId;
  BleCommandManager.generateAndLoad(options, new Command_GetFirmwareVersion(), false, promise);

  expect(BleCommandManager.areThereCommandsFor(stone1.config.handle)).toBeFalsy()
  expect(BleCommandManager.areThereCommandsFor(stone1.config.handle, id)).toBeTruthy()
  BleCommandManager.performCommand(stone1.config.handle);
  expect(mBluenetPromise.has(stone1.config.handle).called.getFirmwareVersion()).toBeFalsy();
  // BleCommandManager.performCommand(stone1.config.handle, id);
  // expect(mBluenetPromise.has(stone1.config.handle).called.getFirmwareVersion()).toBeTruthy()
  //
  // await mBluenetPromise.for(stone1.config.handle).succeed.getFirmwareVersion();
  // expect(BleCommandManager.areThereCommandsFor(stone1.config.handle, id)).toBeFalsy();
  // expect(promise.resolve).toBeCalled();
  //
  // BleCommandManager.generateAndLoad(options, new Command_GetHardwareVersion(), false, promise2);
  // BleCommandManager.performCommand(stone1.config.handle, id);
  // await mBluenetPromise.for(stone1.config.handle).fail.getHardwareVersion();
  // expect(promise2.reject).toBeCalled();
});


test("BleCommandManager Multiple commands", async () => {
  let sphere = addSphere();
  let { stone: stone1, handle:handle1 } = addStone({meshNetworkId:meshId});
  let { stone: stone2, handle:handle2 } = addStone({meshNetworkId:meshId});
  let { stone: stone3, handle:handle3 } = addStone({meshNetworkId:meshId});
  let { stone: stone4, handle:handle4 } = addStone({meshNetworkId:meshId});
  let { stone: stone5, handle:handle5 } = addStone({meshNetworkId:meshId});
  let { stone: stone6, handle:handle6 } = addStone({meshNetworkId:otherMeshId});

  let promise = { resolve: jest.fn(), reject: jest.fn() };
  let options = getCommandOptions(sphere.id, [stone1.config.handle]);
  let options2 = getCommandOptions(sphere.id, [stone2.config.handle]);

  BleCommandManager.generateAndLoad(options, new Command_TurnOn(), true, promise);
  BleCommandManager.generateAndLoad(options2, new Command_AllowDimming(true), false, promise);

  expect(BleCommandManager.queue.direct[stone1.config.handle].length).toBe(1);
  expect(BleCommandManager.queue.direct[stone2.config.handle].length).toBe(1);
  expect(BleCommandManager.queue.mesh[sphere.id].length).toBe(1);
  expect(BleCommandManager.queue.mesh[sphere.id][0].minConnections).toBe(3);
});

test("BleCommandManager clear commands from single commander", async () => {
  let sphere = addSphere();
  let { stone: stone1, handle:handle1 } = addStone({meshNetworkId:meshId});
  let { stone: stone2, handle:handle2 } = addStone({meshNetworkId:meshId});
  let { stone: stone3, handle:handle3 } = addStone({meshNetworkId:meshId});
  let { stone: stone4, handle:handle4 } = addStone({meshNetworkId:meshId});
  let { stone: stone5, handle:handle5 } = addStone({meshNetworkId:meshId});
  let { stone: stone6, handle:handle6 } = addStone({meshNetworkId:otherMeshId});

  let promise  = { resolve: jest.fn(), reject: jest.fn() };
  let promise2 = { resolve: jest.fn(), reject: jest.fn() };
  let options  = getCommandOptions(sphere.id, [stone1.config.handle]);
  let options2 = getCommandOptions(sphere.id, [stone2.config.handle]);

  BleCommandManager.generateAndLoad(options,  new Command_TurnOn(), true, promise);
  BleCommandManager.generateAndLoad(options2, new Command_AllowDimming(true), false, promise2);

  BleCommandManager.cancelCommanderCommands(options.commanderId);

  expect(BleCommandManager.queue.direct[stone1.config.handle]).toBeUndefined()
  expect(BleCommandManager.queue.mesh).toStrictEqual({})
});


test("BleCommandManager check returning the commands", async () => {
  let db = createMockDatabase(meshId, 'm2');
  let handle = db.stones[0].handle;

  let promise  = { resolve: jest.fn(), reject: jest.fn() };
  let promise2 = { resolve: jest.fn(), reject: jest.fn() };
  let options  = getCommandOptions(db.sphere.id, [db.stones[0].handle]);
  let options2 = getCommandOptions(db.sphere.id, [db.stones[1].handle]);

  let commands1 = BleCommandManager.generateAndLoad(options,  new Command_TurnOn(), true, promise);
  let commands2 = BleCommandManager.generateAndLoad(options2, new Command_AllowDimming(true), false, promise2);

  expect(commands1).not.toBeUndefined()
  expect(commands2).not.toBeUndefined()

  mConstellationState.allowBroadcasting = true;

  let commands3 = BleCommandManager.generateAndLoad(options,  new Command_TurnOn(), true, promise);
  expect(commands3).toBeUndefined();
});