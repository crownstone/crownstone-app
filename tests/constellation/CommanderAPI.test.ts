import {mBluenet, mBluenetPromise, mScheduler, resetMocks} from "../__testUtil/mocks/suite.mock";
import {TestUtil} from "../__testUtil/util/testUtil";
import {evt_disconnected, evt_ibeacon} from "../__testUtil/helpers/event.helper";
import {BleCommandManagerClass} from "../../app/ts/logic/constellation/BleCommandManager";
import {createMockDatabase} from "../__testUtil/helpers/data.helper";
import {getCommandOptions} from "../__testUtil/helpers/constellation.helper";
import {CommandAPI} from "../../app/ts/logic/constellation/Commander";
import {SessionManager} from "../../app/ts/logic/constellation/SessionManager";
import {advanceBy} from "jest-date-mock";


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


test("Check the CommanderAPI handling multiple session timeouts", async () => {
  let db = createMockDatabase(meshId);

  let commander = new CommandAPI(getCommandOptions(db.sphere.id, [db.stones[0].handle]));

  let p1Err = jest.fn();
  commander.getBootloaderVersion().catch(p1Err);

  await mScheduler.trigger()
  await TestUtil.nextTick()
  expect(p1Err).toBeCalledWith(new Error("SESSION_REQUEST_TIMEOUT"))

  let p2Err = jest.fn();
  commander.getBootloaderVersion().catch(p2Err);

  await mScheduler.trigger()
  await TestUtil.nextTick()
  expect(p1Err).toBeCalledWith(new Error("SESSION_REQUEST_TIMEOUT"))
});


test("Check multiple commanders requiring the same session", async () => {
  let db = createMockDatabase(meshId);
  let handle = db.stones[0].handle
  let commander1 = new CommandAPI(getCommandOptions(db.sphere.id, [handle]));

  let p1Err = jest.fn();
  let c2Success = jest.fn();
  commander1.getBootloaderVersion().catch(p1Err);

  // fire ibeacon event to trigger the connect request
  evt_ibeacon(-70, handle);

  // expect the session to attempt a connect
  expect(mBluenetPromise.has(handle).called.connect()).toBeTruthy();

  let commander2 = new CommandAPI(getCommandOptions(db.sphere.id, [handle]));
  commander2.getFirmwareVersion().then(c2Success)

  await commander1.end();

  await mBluenetPromise.for(handle).succeed.connect("operation");

  await TestUtil.nextTick()
  expect(mBluenetPromise.has(handle).called.getFirmwareVersion()).toBeTruthy();

  await mBluenetPromise.for(handle).succeed.getFirmwareVersion("1.2.3");
  expect(c2Success).toBeCalledWith("1.2.3");

  expect(mBluenetPromise.has(handle).called.disconnectCommand()).toBeTruthy();
  evt_disconnected(handle);
  await mBluenetPromise.for(handle).succeed.disconnectCommand();
});


test("Ensure sessions do not perform commands after they are killed.", async () => {
  let db = createMockDatabase(meshId);
  let handle = db.stones[0].handle
  let commander1 = new CommandAPI(getCommandOptions(db.sphere.id, [handle]));
  let commander2 = new CommandAPI(getCommandOptions(db.sphere.id, [handle]));

  let p1Err = jest.fn();
  let p2Err = jest.fn();
  commander1.trackedDeviceHeartbeat(1,() => 2,3,4,{
      profileId:1,
      rssiOffset:2,
      ignoreForPresence:false,
      tapToToggleEnabled:false,
      ttlMinutes:12
    }
  ).catch(p1Err);

  // fire ibeacon event to trigger the connect request
  evt_ibeacon(-70, handle);

  // expect the session to attempt a connect
  expect(mBluenetPromise.has(handle).called.connect()).toBeTruthy();
  advanceBy(11000)

  commander2.trackedDeviceHeartbeat(1,() => 2,3,4,{
      profileId:1,
      rssiOffset:2,
      ignoreForPresence:false,
      tapToToggleEnabled:false,
      ttlMinutes:12
    }
  ).catch(p2Err);

  await TestUtil.nextTick()

  expect(p1Err).toHaveBeenCalled()
  expect(mBluenetPromise.has(handle).called.cancelConnectionRequest()).toBeTruthy();

  await mBluenetPromise.for(handle).succeed.connect("operation");
  await TestUtil.nextTick()

  evt_disconnected(handle)
  await mBluenetPromise.for(handle).succeed.cancelConnectionRequest()

  expect(mBluenetPromise.has(handle).called.trackedDeviceHeartbeat()).toBeFalsy();
});