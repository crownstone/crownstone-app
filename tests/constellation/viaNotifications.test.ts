import { mBluenetPromise, mConstellationState, mScheduler, resetMocks } from "../__testUtil/mocks/suite.mock";
import { TestUtil } from "../__testUtil/util/testUtil";
import { eventHelperSetActive, evt_disconnected, evt_ibeacon } from "../__testUtil/helpers/event.helper";
import { SessionManagerClass } from "../../app/ts/logic/constellation/SessionManager";
import { addLocation, addSphere, addStone } from "../__testUtil/helpers/data.helper";
import { getCommandOptions } from "../__testUtil/helpers/constellation.helper";

import { Collector } from "../../app/ts/logic/constellation/Collector";
import { StoneAvailabilityTracker } from "../../app/ts/native/advertisements/StoneAvailabilityTracker";
import { advanceTo } from "jest-date-mock";
import { NotificationParser } from "../../app/ts/notifications/NotificationParser";
import { BleCommandManager } from "../../app/ts/logic/constellation/BleCommandManager";


beforeEach(async () => {
  StoneAvailabilityTracker.sphereLog = {};
  StoneAvailabilityTracker.log = {};
  resetMocks()
  mConstellationState.allowBroadcasting = false;
})
beforeAll(async () => { })
afterEach(async () => { await TestUtil.nextTick(); })
afterAll(async () => {})


test("Test if incoming notifications are handled correctly by Constellation.", async () => {
  let sphere = addSphere({cloudId:'58de6bda62a2241400f10c67'});
  let { stone: stone1, handle:handle1 } = addStone({cloudId:'5d51c07e6d6a610004db1ac6', handle: 'handle_1'});
  let { stone: stone2, handle:handle2 } = addStone({cloudId:'5d4e7f3857dbd40004cbca43', handle: 'handle_2'});
  let { stone: stone3, handle:handle3 } = addStone({cloudId:'5da749a7b01f270004de0ac0', handle: 'handle_3'});
  let { stone: stone4, handle:handle4 } = addStone({cloudId:'5eff1259e2104d00042044b8', handle: 'handle_4'});
  let { stone: stone5, handle:handle5 } = addStone({cloudId:'5f0ee4c82d49160004d968ad', handle: 'handle_5'});
  let { stone: stone6, handle:handle6 } = addStone({cloudId:'5e63a47a7c70b40004077751', handle: 'handle_6'});
  let { stone: stone7, handle:handle7 } = addStone({cloudId:'5e5a9b7e8e6ffc00043bbd2a', handle: 'handle_7'});

  let inputData = [
    {
      actualTime: 1630479513279,
      notification: {"notificationId":"F741CCF1-67DF-4A2D-8BCB-99907F2F8101","event":{"type":"command","switchData":[{"id":"5d51c07e6d6a610004db1ac6","type":"TURN_ON","uid":34,"name":"Aanrecht Verlichting","macAddress":"FA:52:F9:57:40:10"}],"subType":"multiSwitch","sphere":{"id":"58de6bda62a2241400f10c67","name":"Noordweg 16","uid":246},"sequenceTime":{"counter":1,"timestamp":1630479511447}},"sphereId":"58de6bda62a2241400f10c67","remote":true,"stoneId":"5d51c07e6d6a610004db1ac6","switchState":1,"command":"setSwitchStateRemotely","sequenceTime":{"timestamp":1630479511447,"counter":1}}
    },
    {
      actualTime: 1630479513333,
      notification: {"notificationId":"46D122BC-EDCA-4E72-8FC9-77BEDE7EA17E","event":{"type":"command","switchData":[{"id":"5d4e7f3857dbd40004cbca43","type":"TURN_ON","uid":31,"name":"Spotjes","macAddress":"DB:71:59:0D:58:82"}],"subType":"multiSwitch","sphere":{"id":"58de6bda62a2241400f10c67","name":"Noordweg 16","uid":246},"sequenceTime":{"counter":2,"timestamp":1630479511468}},"stoneId":"5d4e7f3857dbd40004cbca43","sphereId":"58de6bda62a2241400f10c67","remote":true,"switchState":1,"command":"setSwitchStateRemotely","sequenceTime":{"timestamp":1630479511468,"counter":2}},
    },
    {
      actualTime: 1630479513344,
      notification: {"notificationId":"FE15C068-A43B-4A0E-BCD8-33130CF06EE7","event":{"type":"command","switchData":[{"id":"5da749a7b01f270004de0ac0","type":"TURN_ON","uid":36,"name":"Spotjes","macAddress":"C6:D8:B0:01:2F:6A"}],"subType":"multiSwitch","sphere":{"id":"58de6bda62a2241400f10c67","name":"Noordweg 16","uid":246},"sequenceTime":{"counter":3,"timestamp":1630479511485}},"switchState":1,"stoneId":"5da749a7b01f270004de0ac0","sphereId":"58de6bda62a2241400f10c67","remote":true,"command":"setSwitchStateRemotely","sequenceTime":{"timestamp":1630479511485,"counter":3}}
    },
    {
      actualTime: 1630479513672,
      notification: {"remote":true,"sphereId":"58de6bda62a2241400f10c67","stoneId":"5eff1259e2104d00042044b8","event":{"type":"command","switchData":[{"id":"5eff1259e2104d00042044b8","type":"TURN_ON","uid":57,"name":"Ganglamp 1","macAddress":"FF:89:32:5F:40:A9"}],"subType":"multiSwitch","sphere":{"id":"58de6bda62a2241400f10c67","name":"Noordweg 16","uid":246},"sequenceTime":{"counter":4,"timestamp":1630479511589}},"notificationId":"747CFCFA-D0AF-43D2-A669-5B2D23A5072D","switchState":1,"command":"setSwitchStateRemotely","sequenceTime":{"timestamp":1630479511589,"counter":4}}
    },
    {
      actualTime: 1630479513802,
      notification: {"stoneId":"5f0ee4c82d49160004d968ad","notificationId":"CF8E212A-0762-4110-A952-B96661195F16","event":{"type":"command","switchData":[{"id":"5f0ee4c82d49160004d968ad","type":"TURN_ON","uid":64,"name":"Hanglamp","macAddress":"ED:E9:5C:45:95:56"}],"subType":"multiSwitch","sphere":{"id":"58de6bda62a2241400f10c67","name":"Noordweg 16","uid":246},"sequenceTime":{"counter":5,"timestamp":1630479511686}},"sphereId":"58de6bda62a2241400f10c67","remote":true,"switchState":1,"command":"setSwitchStateRemotely","sequenceTime":{"timestamp":1630479511686,"counter":5}}
    },
    {
      actualTime: 1630479513825,
      notification: {"stoneId":"5e63a47a7c70b40004077751","notificationId":"9CD4B321-D4F7-4402-BBF4-0373700EB372","event":{"type":"command","switchData":[{"id":"5e63a47a7c70b40004077751","type":"TURN_ON","uid":48,"name":"Eettafel Lamp","macAddress":"EA:9E:67:64:33:86"}],"subType":"multiSwitch","sphere":{"id":"58de6bda62a2241400f10c67","name":"Noordweg 16","uid":246},"sequenceTime":{"counter":6,"timestamp":1630479511846}},"sphereId":"58de6bda62a2241400f10c67","remote":true,"switchState":1,"command":"setSwitchStateRemotely","sequenceTime":{"timestamp":1630479511846,"counter":6}}
    },
    {
      actualTime: 1630479513841,
      notification: {"remote":true,"sphereId":"58de6bda62a2241400f10c67","stoneId":"5e5a9b7e8e6ffc00043bbd2a","event":{"type":"command","switchData":[{"id":"5e5a9b7e8e6ffc00043bbd2a","type":"TURN_ON","uid":47,"name":"Barlamp","macAddress":"E4:47:E8:4F:A9:CB"}],"subType":"multiSwitch","sphere":{"id":"58de6bda62a2241400f10c67","name":"Noordweg 16","uid":246},"sequenceTime":{"counter":7,"timestamp":1630479511989}},"notificationId":"12CAE299-0865-4655-A2B2-F4E0BA177283","switchState":1,"command":"setSwitchStateRemotely","sequenceTime":{"timestamp":1630479511989,"counter":7}}
    },
    {
      actualTime: 1630479514242,
      notification: {"notificationId":"E993E44C-51EC-4BD3-B32D-360641B4C6E5","event":{"type":"command","switchData":[{"id":"5eff1267e2104d00042044bc","type":"TURN_ON","uid":58,"name":"Ganglamp 2","macAddress":"FE:1D:85:8A:33:2C"}],"subType":"multiSwitch","sphere":{"id":"58de6bda62a2241400f10c67","name":"Noordweg 16","uid":246},"sequenceTime":{"counter":8,"timestamp":1630479512082}},"switchState":1,"stoneId":"5eff1267e2104d00042044bc","sphereId":"58de6bda62a2241400f10c67","remote":true,"command":"setSwitchStateRemotely","sequenceTime":{"timestamp":1630479512082,"counter":8}}
    },
  ]

  for (let input of inputData) {
    advanceTo(input.actualTime)
    NotificationParser.handle(input.notification)
  }

  TestUtil.nextTick()

  expect(Object.keys(BleCommandManager.queue.direct).length).toBe(7);
  expect(Object.keys(BleCommandManager.queue.mesh[sphere.id]).length).toBe(7);
})