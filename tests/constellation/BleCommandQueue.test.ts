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

let BleCommandQueue = null;
beforeEach(async () => {
  BleCommandQueue = new BleCommandQueueClass();
  resetMocks()
})
beforeAll(async () => {})
afterEach(async () => { await TestUtil.nextTick(); })
afterAll(async () => {})

const meshId = "meshNetwork";
const otherMeshId = "otherMeshNetwork";

test("BleCommandQueue shared, direct, generating commands and removing duplicate", async () => {
  let sphere = addSphere();
  let { stone: stone1, handle:handle1 } = addStone();
  let { stone: stone2, handle:handle2 } = addStone();

  let promise = { resolve: jest.fn(), reject: jest.fn() };
  let options = getCommandOptions(sphere.id, [stone1.config.handle, stone2.config.handle]);

  BleCommandQueue.generateAndLoad(options, new Command_TurnOn(), false, promise);

  expect(BleCommandQueue.queue.direct[stone1.config.handle].length).toBe(1);
  expect(BleCommandQueue.queue.direct[stone2.config.handle].length).toBe(1);
  expect(Object.keys(BleCommandQueue.queue.direct).length).toBe(2);
  expect(Object.keys(BleCommandQueue.queue.mesh).length).toBe(0);

  let id1 = BleCommandQueue.queue.direct[stone1.config.handle][0].id;
  let id2 = BleCommandQueue.queue.direct[stone2.config.handle][0].id;

  // check if duplicates are removed:
  BleCommandQueue.generateAndLoad(options, new Command_TurnOn(), false, promise);

  expect(BleCommandQueue.queue.direct[stone1.config.handle].length).toBe(1);
  expect(BleCommandQueue.queue.direct[stone2.config.handle].length).toBe(1);
  expect(Object.keys(BleCommandQueue.queue.direct).length).toBe(2);
  expect(Object.keys(BleCommandQueue.queue.mesh).length).toBe(0);

  expect(BleCommandQueue.queue.direct[stone1.config.handle][0].id).not.toBe(id1);
  expect(BleCommandQueue.queue.direct[stone2.config.handle][0].id).not.toBe(id2);
});

test("BleCommandQueue shared, direct, meshRelay, one stone", async () => {
  let sphere = addSphere();
  let { stone: stone1, handle:handle1 } = addStone({meshId: meshId});

  let promise = { resolve: jest.fn(), reject: jest.fn() };
  let options = getCommandOptions(sphere.id, [stone1.config.handle]);

  BleCommandQueue.generateAndLoad(options, new Command_TurnOn(), true, promise);

  expect(BleCommandQueue.queue.direct[stone1.config.handle].length).toBe(1);
  expect(BleCommandQueue.queue.mesh[meshId]).toBeUndefined();
});

test("BleCommandQueue shared, direct, meshRelay, 5 stones", async () => {
  let sphere = addSphere();
  let { stone: stone1, handle:handle1 } = addStone({meshNetworkId:meshId});
  let { stone: stone2, handle:handle2 } = addStone({meshNetworkId:meshId});
  let { stone: stone3, handle:handle3 } = addStone({meshNetworkId:meshId});
  let { stone: stone4, handle:handle4 } = addStone({meshNetworkId:meshId});
  let { stone: stone5, handle:handle5 } = addStone({meshNetworkId:otherMeshId});

  let promise = { resolve: jest.fn(), reject: jest.fn() };
  let options = getCommandOptions(sphere.id, [stone1.config.handle]);

  BleCommandQueue.generateAndLoad(options, new Command_TurnOn(), true, promise);
  expect(BleCommandQueue.queue.direct[stone1.config.handle].length).toBe(1);
  expect(BleCommandQueue.queue.mesh[meshId].length).toBe(1);
  expect(BleCommandQueue.queue.mesh[meshId][0].minConnections).toBe(3);
});

test("BleCommandQueue shared, direct, meshRelay, 3 stones in mesh, see if the minimum connection count works", async () => {
  let sphere = addSphere();
  let { stone: stone1, handle:handle1 } = addStone({meshNetworkId:meshId});
  let { stone: stone2, handle:handle2 } = addStone({meshNetworkId:meshId});
  let { stone: stone3, handle:handle3 } = addStone({meshNetworkId:meshId});
  let { stone: stone4, handle:handle4 } = addStone({meshNetworkId:otherMeshId});


  let promise = { resolve: jest.fn(), reject: jest.fn() };
  let options = getCommandOptions(sphere.id, [stone1.config.handle]);

  BleCommandQueue.generateAndLoad(options, new Command_TurnOn(), true, promise);
  expect(BleCommandQueue.queue.direct[stone1.config.handle].length).toBe(1);
  expect(BleCommandQueue.queue.mesh[meshId].length).toBe(1);
  expect(BleCommandQueue.queue.mesh[meshId][0].minConnections).toBe(2);
});


test("BleCommandQueue shared, direct, check if there are commands available", async () => {
  let sphere = addSphere();
  let { stone: stone1, handle:handle1 } = addStone({meshNetworkId:meshId});
  let { stone: stone2, handle:handle2 } = addStone({meshNetworkId:meshId});
  let { stone: stone3, handle:handle3 } = addStone({meshNetworkId:meshId});
  let { stone: stone4, handle:handle4 } = addStone({meshNetworkId:otherMeshId});

  let promise = { resolve: jest.fn(), reject: jest.fn() };
  let options = getCommandOptions(sphere.id, [stone1.config.handle]);
  BleCommandQueue.generateAndLoad(options, new Command_TurnOn(), true, promise);

  expect(BleCommandQueue.areThereCommandsFor(stone1.config.handle)).toBeTruthy();
  expect(BleCommandQueue.areThereCommandsFor(stone2.config.handle)).toBeTruthy();
  expect(BleCommandQueue.areThereCommandsFor(stone3.config.handle)).toBeTruthy();
  expect(BleCommandQueue.areThereCommandsFor(stone4.config.handle)).toBeFalsy();
});


test("BleCommandQueue shared, direct, check a command can be performed", async () => {
  let sphere = addSphere();
  let { stone: stone1, handle:handle1 } = addStone({meshNetworkId:meshId});
  let { stone: stone2, handle:handle2 } = addStone({meshNetworkId:meshId});

  let promise = { resolve: jest.fn(), reject: jest.fn() };
  let options = getCommandOptions(sphere.id, [stone1.config.handle]);
  BleCommandQueue.generateAndLoad(options, new Command_TurnOn(), true, promise);

  expect(BleCommandQueue.queue.direct[stone1.config.handle].length).toBe(1);
  expect(BleCommandQueue.queue.mesh[meshId].length).toBe(1);

  expect(BleCommandQueue.areThereCommandsFor(stone1.config.handle)).toBeTruthy();
  BleCommandQueue.performCommand(stone1.config.handle);

  expect(mBluenet.has(stone1.config.handle).called.turnOnMesh()).toBeTruthy();
  expect(mBluenet.for(stone1.config.handle).getArgsFor.turnOnMesh()[1]).toEqual([{crownstoneId: 1, state:100}]);
  await mBluenet.for(stone1.config.handle).succeed.turnOnMesh();

  expect(BleCommandQueue.queue.direct[stone1.config.handle]).toBeUndefined();
  expect(BleCommandQueue.queue.mesh[meshId]).toBeUndefined();
});


test("BleCommandQueue shared, perform and finish command in mesh", async () => {
  let sphere = addSphere();
  let { stone: stone1, handle:handle1 } = addStone({meshNetworkId:meshId});
  let { stone: stone2, handle:handle2 } = addStone({meshNetworkId:meshId});
  let { stone: stone3, handle:handle3 } = addStone({meshNetworkId:meshId});
  let { stone: stone4, handle:handle4 } = addStone({meshNetworkId:meshId});

  let promise = { resolve: jest.fn(), reject: jest.fn() };
  let options = getCommandOptions(sphere.id, [stone1.config.handle]);
  BleCommandQueue.generateAndLoad(options, new Command_TurnOn(), true, promise);

  BleCommandQueue.performCommand(stone2.config.handle);
  expect(mBluenet.has(stone2.config.handle).called.turnOnMesh()).toBeTruthy();
  await mBluenet.for(stone2.config.handle).succeed.turnOnMesh();
  expect(BleCommandQueue.queue.mesh[meshId].length).toBe(1);

  BleCommandQueue.performCommand(stone3.config.handle);
  expect(mBluenet.has(stone3.config.handle).called.turnOnMesh()).toBeTruthy();
  await mBluenet.for(stone3.config.handle).succeed.turnOnMesh();
  expect(BleCommandQueue.queue.mesh[meshId].length).toBe(1);

  BleCommandQueue.performCommand(stone4.config.handle);
  expect(mBluenet.has(stone4.config.handle).called.turnOnMesh()).toBeTruthy();
  await mBluenet.for(stone4.config.handle).fail.turnOnMesh();
  expect(BleCommandQueue.queue.mesh[meshId].length).toBe(1);

  BleCommandQueue.performCommand(stone4.config.handle);
  expect(mBluenet.has(stone4.config.handle).called.turnOnMesh()).toBeTruthy();
  await mBluenet.for(stone4.config.handle).succeed.turnOnMesh();
  expect(BleCommandQueue.queue.mesh[meshId]).toBeUndefined();
});



test("BleCommandQueue private, direct and finish command in mesh", async () => {
  let sphere = addSphere();
  let { stone: stone1, handle:handle1 } = addStone({meshNetworkId:meshId});

  let promise = { resolve: jest.fn(), reject: jest.fn() };
  let promise2 = { resolve: jest.fn(), reject: jest.fn() };
  let options = getCommandOptions(sphere.id, [stone1.config.handle], true);
  let id = options.commanderId;
  BleCommandQueue.generateAndLoad(options, new Command_GetFirmwareVersion(), false, promise);

  expect(BleCommandQueue.areThereCommandsFor(stone1.config.handle)).toBeFalsy()
  expect(BleCommandQueue.areThereCommandsFor(stone1.config.handle, id)).toBeTruthy()
  BleCommandQueue.performCommand(stone1.config.handle);
  expect(mBluenet.has(stone1.config.handle).called.getFirmwareVersion()).toBeFalsy();
  // BleCommandQueue.performCommand(stone1.config.handle, id);
  // expect(mBluenet.has(stone1.config.handle).called.getFirmwareVersion()).toBeTruthy()
  //
  // await mBluenet.for(stone1.config.handle).succeed.getFirmwareVersion();
  // expect(BleCommandQueue.areThereCommandsFor(stone1.config.handle, id)).toBeFalsy();
  // expect(promise.resolve).toBeCalled();
  //
  // BleCommandQueue.generateAndLoad(options, new Command_GetHardwareVersion(), false, promise2);
  // BleCommandQueue.performCommand(stone1.config.handle, id);
  // await mBluenet.for(stone1.config.handle).fail.getHardwareVersion();
  // expect(promise2.reject).toBeCalled();
});


test("BleCommandQueue Multiple commands", async () => {
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

  BleCommandQueue.generateAndLoad(options, new Command_TurnOn(), true, promise);
  BleCommandQueue.generateAndLoad(options2, new Command_AllowDimming(true), false, promise);

  expect(BleCommandQueue.queue.direct[stone1.config.handle].length).toBe(1);
  expect(BleCommandQueue.queue.direct[stone2.config.handle].length).toBe(1);
  expect(BleCommandQueue.queue.mesh[meshId].length).toBe(1);
  expect(BleCommandQueue.queue.mesh[meshId][0].minConnections).toBe(3);
});

test("BleCommandQueue clear commands from single commander", async () => {
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

  BleCommandQueue.generateAndLoad(options,  new Command_TurnOn(), true, promise);
  BleCommandQueue.generateAndLoad(options2, new Command_AllowDimming(true), false, promise2);

  BleCommandQueue.cancelCommanderCommands(options.commanderId);

  expect(BleCommandQueue.queue.direct[stone1.config.handle]).toBeUndefined()
  expect(BleCommandQueue.queue.mesh).toStrictEqual({})
});