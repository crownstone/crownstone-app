import { mBluenet, resetMocks } from "../__testUtil/mocks/suite.mock";
import { TestUtil } from "../__testUtil/util/testUtil";
import { eventHelperSetActive, evt_disconnected, evt_ibeacon } from "../__testUtil/helpers/event.helper";
import { BleCommandQueueClass } from "../../app/ts/logic/constellation/BleCommandQueue";
import { addSphere, addStone } from "../__testUtil/helpers/data.helper";
import { xUtil } from "../../app/ts/util/StandAloneUtil";
import { MapProvider } from "../../app/ts/backgroundProcesses/MapProvider";
import { getCommandOptions } from "../__testUtil/helpers/constellation.helper";

let BleCommandQueue = null;
beforeEach(async () => {
  BleCommandQueue = new BleCommandQueueClass();
  resetMocks()
})
beforeAll(async () => {})
afterEach(async () => { await TestUtil.nextTick(); })
afterAll(async () => {})

const meshId = "meshNetwork";

test("BleCommandQueue shared, direct, generating commands and removing duplicate", async () => {
  let sphere = addSphere();
  let stone1 = addStone();
  let stone2 = addStone();

  let promise = { resolve: jest.fn(), reject: jest.fn() };
  let options = getCommandOptions(sphere.id, [stone1.config.handle, stone2.config.handle]);

  BleCommandQueue.generateAndLoad(options, {type:"turnOn"}, false, promise);

  expect(BleCommandQueue.queue.direct[stone1.config.handle].length).toBe(1);
  expect(BleCommandQueue.queue.direct[stone2.config.handle].length).toBe(1);
  expect(Object.keys(BleCommandQueue.queue.direct).length).toBe(2);
  expect(Object.keys(BleCommandQueue.queue.mesh).length).toBe(0);

  let id1 = BleCommandQueue.queue.direct[stone1.config.handle][0].id;
  let id2 = BleCommandQueue.queue.direct[stone2.config.handle][0].id;

  // check if duplicates are removed:
  BleCommandQueue.generateAndLoad(options, {type:"turnOn"}, false, promise);

  expect(BleCommandQueue.queue.direct[stone1.config.handle].length).toBe(1);
  expect(BleCommandQueue.queue.direct[stone2.config.handle].length).toBe(1);
  expect(Object.keys(BleCommandQueue.queue.direct).length).toBe(2);
  expect(Object.keys(BleCommandQueue.queue.mesh).length).toBe(0);

  expect(BleCommandQueue.queue.direct[stone1.config.handle][0].id).not.toBe(id1);
  expect(BleCommandQueue.queue.direct[stone2.config.handle][0].id).not.toBe(id2);
});

test("BleCommandQueue shared, direct, meshRelay, one stone", async () => {
  let sphere = addSphere();
  let stone1 = addStone({meshId: meshId});

  let promise = { resolve: jest.fn(), reject: jest.fn() };
  let options = getCommandOptions(sphere.id, [stone1.config.handle]);

  BleCommandQueue.generateAndLoad(options, {type:"turnOn"}, true, promise);

  expect(BleCommandQueue.queue.direct[stone1.config.handle].length).toBe(1);
  expect(BleCommandQueue.queue.mesh[meshId]).toBeUndefined();
});

test("BleCommandQueue shared, direct, meshRelay, 5 stones", async () => {
  let sphere = addSphere();
  let stone1 = addStone({meshNetworkId: meshId});
  let stone2 = addStone({meshNetworkId: meshId});
  let stone3 = addStone({meshNetworkId: meshId});
  let stone4 = addStone({meshNetworkId: meshId});
  let stone5 = addStone({meshNetworkId: meshId});
  let stone6 = addStone({meshNetworkId: "mesh2"});


  let promise = { resolve: jest.fn(), reject: jest.fn() };
  let options = getCommandOptions(sphere.id, [stone1.config.handle]);

  BleCommandQueue.generateAndLoad(options, {type:"turnOn"}, true, promise);
  expect(BleCommandQueue.queue.direct[stone1.config.handle].length).toBe(1);
  expect(BleCommandQueue.queue.mesh[meshId].length).toBe(1);
  expect(BleCommandQueue.queue.mesh[meshId][0].minConnections).toBe(3);
});

test("BleCommandQueue shared, direct, meshRelay, 3 stones in mesh, see if the minimum connection count works", async () => {
  let sphere = addSphere();
  let stone1 = addStone({meshNetworkId: meshId});
  let stone2 = addStone({meshNetworkId: meshId});
  let stone3 = addStone({meshNetworkId: meshId});
  let stone4 = addStone({meshNetworkId: "mesh-2"});


  let promise = { resolve: jest.fn(), reject: jest.fn() };
  let options = getCommandOptions(sphere.id, [stone1.config.handle]);

  BleCommandQueue.generateAndLoad(options, {type:"turnOn"}, true, promise);
  expect(BleCommandQueue.queue.direct[stone1.config.handle].length).toBe(1);
  expect(BleCommandQueue.queue.mesh[meshId].length).toBe(1);
  expect(BleCommandQueue.queue.mesh[meshId][0].minConnections).toBe(2);
});


test("BleCommandQueue shared, direct, check if there are commands available", async () => {
  let sphere = addSphere();
  let stone1 = addStone({meshNetworkId: meshId});
  let stone2 = addStone({meshNetworkId: meshId});
  let stone3 = addStone({meshNetworkId: meshId});
  let stone4 = addStone({meshNetworkId: "mesh-2"});

  let promise = { resolve: jest.fn(), reject: jest.fn() };
  let options = getCommandOptions(sphere.id, [stone1.config.handle]);
  BleCommandQueue.generateAndLoad(options, {type:"turnOn"}, true, promise);

  expect(BleCommandQueue.areThereCommandsFor(stone1.config.handle)).toBeTruthy();
  expect(BleCommandQueue.areThereCommandsFor(stone2.config.handle)).toBeTruthy();
  expect(BleCommandQueue.areThereCommandsFor(stone3.config.handle)).toBeTruthy();
  expect(BleCommandQueue.areThereCommandsFor(stone4.config.handle)).toBeFalsy();
});


test("BleCommandQueue shared, direct, check a command can be performed", async () => {
  let sphere = addSphere();
  let stone1 = addStone({meshNetworkId: meshId});
  let stone2 = addStone({meshNetworkId: meshId});

  let promise = { resolve: jest.fn(), reject: jest.fn() };
  let options = getCommandOptions(sphere.id, [stone1.config.handle]);
  BleCommandQueue.generateAndLoad(options, {type:"turnOn"}, true, promise);

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
  let stone1 = addStone({meshNetworkId: meshId});
  let stone2 = addStone({meshNetworkId: meshId});
  let stone3 = addStone({meshNetworkId: meshId});
  let stone4 = addStone({meshNetworkId: meshId});

  let promise = { resolve: jest.fn(), reject: jest.fn() };
  let options = getCommandOptions(sphere.id, [stone1.config.handle]);
  BleCommandQueue.generateAndLoad(options, {type:"turnOn"}, true, promise);

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
  let stone1 = addStone({meshNetworkId: meshId});

  let promise = { resolve: jest.fn(), reject: jest.fn() };
  let promise2 = { resolve: jest.fn(), reject: jest.fn() };
  let options = getCommandOptions(sphere.id, [stone1.config.handle], true);
  let id = options.commanderId;
  BleCommandQueue.generateAndLoad(options, {type:"getFirmwareVersion"}, false, promise);

  expect(BleCommandQueue.areThereCommandsFor(stone1.config.handle)).toBeFalsy()
  expect(BleCommandQueue.areThereCommandsFor(stone1.config.handle, id)).toBeTruthy()
  BleCommandQueue.performCommand(stone1.config.handle);
  expect(mBluenet.has(stone1.config.handle).called.getFirmwareVersion()).toBeFalsy();
  BleCommandQueue.performCommand(stone1.config.handle, id);
  expect(mBluenet.has(stone1.config.handle).called.getFirmwareVersion()).toBeTruthy()
  await mBluenet.for(stone1.config.handle).succeed.getFirmwareVersion();
  expect(BleCommandQueue.areThereCommandsFor(stone1.config.handle, id)).toBeFalsy();
  expect(promise.resolve).toBeCalled();

  BleCommandQueue.generateAndLoad(options, {type:"getHardwareVersion"}, false, promise2);
  BleCommandQueue.performCommand(stone1.config.handle, id);
  await mBluenet.for(stone1.config.handle).fail.getHardwareVersion();
  expect(promise2.reject).toBeCalled();
});


