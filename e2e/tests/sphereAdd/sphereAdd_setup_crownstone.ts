import {
  $, delay, goToSettingsTab, goToSphereOverviewTab, replaceText, screenshot, scrollDownUntilVisible, shouldBeOn, tap,
  tapAlertCancelButton,
  tapAlertOKButton, tapReturnKey,
  tapSingularAlertButton, visitLink, waitToNavigate, waitToShow, waitToStart
} from "../../util/TestUtil";
import {Assistant, CONFIG} from "../../testSuite.e2e";

let UICR_DATA = {
  board          : 10,
  productType    : 10,
  region         : 10,
  productFamily  : 10,
  reserved1      : 10,

  hardwarePatch  : 10,
  hardwareMinor  : 10,
  hardwareMajor  : 10,
  reserved2      : 10,

  productHousing : 10,
  productionWeek : 10,
  productionYear : 10,
  reserved3      : 10,
}

export const SphereAdd_setup_crownstone = () => {
  let handle1 = 'crownstoneHandle1';
  let handle2 = 'crownstoneHandle2';
  let handle3 = 'crownstoneHandle3';


  test('should be on the SphereAdd view', async () => {
    await waitToNavigate("SphereAdd");
  });


  test('should be able to go to the AddCrownstone view', async () => {
    await tap("AddCrownstone_button");
    await waitToNavigate("AddCrownstone");
  });


  test('should be able to go to the scanningForSetupCrownstones', async () => {
    await shouldBeOn('AddCrownstone');
    await tap("Plug");
    await waitToNavigate("installingPlug");
    await tap("installingPlugNext");
    await waitToNavigate("ScanningForSetupCrownstones");
    await Assistant.update();
  })


  test('should be able to see a setupCrownstone, pulse it and select it', async () => {
    let localId = await Assistant.getActiveSphereLocalId();
    await Assistant.ble.sendSetupAdvertisment(handle1);
    await waitToShow(`SetupDeviceEntry${handle1}`)
    await tap(`setupPulse${handle1}`);
    await delay(50);
    await Assistant.ble.sendGenericAdvertisement(handle1, -70);

    await Assistant.ble.for(handle1).succeed.connect('setup');
    await Assistant.ble.for(handle1).succeed.setupPulse();
    await Assistant.ble.for(handle1).disconnectEvent();

    await Assistant.ble.sendSetupAdvertisment(handle1);

    await waitToShow(`selectSetupEntry${handle1}`);
    await tap(`selectSetupEntry${handle1}`);
    await waitToNavigate('SetupCrownstone');
  })

  test('should be able to use the default Crownstone name', async () => {
    await shouldBeOn('SetupCrownstone');
    await shouldBeOn('addCrownstone_namePhase');
    await screenshot();
    await tap("name_next");
    await waitToNavigate("addCrownstone_iconPhase")
    await screenshot();
  })

  test('should be able to select an icon for the new Crownstone', async () => {
    await shouldBeOn('addCrownstone_iconPhase');
    await tap("crownstoneIcon");
    await waitToNavigate("DeviceIconSelection")
    await screenshot();
    await tap("ceilingLights");
    await delay(300);
    await screenshot();
    await tap('fiCS1-dining-table');
    await waitToNavigate('addCrownstone_iconPhase');
    await screenshot();
    await tap("icon_next");
    await waitToNavigate('addCrownstone_roomPhase');
  })

  test('should be able to select an existing room', async () => {
    await shouldBeOn('addCrownstone_roomPhase');
    await screenshot();
    let locationId = await Assistant.getRoomId(0)
    await scrollDownUntilVisible(`crownstoneInLocation${locationId}`, "addCrownstone_roomPhase_scroll");
    await tap(`crownstoneInLocation${locationId}`);
    await waitToNavigate("addCrownstone_waitToFinish")
    await screenshot();
  })

  test('should be able to show progress', async () => {
    await shouldBeOn('addCrownstone_waitToFinish');
    await Assistant.ble.for(handle1).succeed.connect('setup');
    await delay(100);
    await screenshot();
    await Assistant.ble.for(handle1).succeed.getMACAddress('AB:CD:CA:FE:BA:BE');
    await delay(100);
    await screenshot();
    await Assistant.ble.for(handle1).succeed.getFirmwareVersion('5.6.4');
    await delay(100);
    await screenshot();
    await Assistant.ble.for(handle1).succeed.getHardwareVersion('10106');
    await delay(100);
    await screenshot();
    await Assistant.ble.for(handle1).succeed.getUICR(UICR_DATA);
    await delay(100);
    await screenshot();
    for (let i = 1; i < 14; i++) {
      await Assistant.ble.sendSetupProgress(i);
      await delay(50);
      await screenshot();
    }
    await Assistant.ble.for(handle1).succeed.setupCrownstone()
    await delay(100);
    await screenshot();
    await Assistant.ble.for(handle1).disconnectEvent()
    await waitToNavigate('addCrownstone_setupMore')
  })

  test('should be able to add more Crownstones', async () => {
    await shouldBeOn('addCrownstone_setupMore');
    await screenshot();
    await tap("addCrownstone_addMore");
    await waitToNavigate("ScanningForSetupCrownstones");
  })


  test("should be able to see a second crownstone and start the setup", async () => {
    let localId = await Assistant.getActiveSphereLocalId();
    await Assistant.ble.sendSetupAdvertisment(handle2);
    await waitToShow(`selectSetupEntry${handle2}`);
    await tap(`selectSetupEntry${handle2}`);
    await waitToNavigate('SetupCrownstone');
  })


  test("should be able to set a custom name", async () => {
    await shouldBeOn("SetupCrownstone");
    await replaceText("crownstoneName", "TestCrownstone");
    await tapReturnKey("crownstoneName");
    await tap("name_next");
    await waitToNavigate("addCrownstone_iconPhase")
    await screenshot();
  })


  test("should be able to create new room via the stone setup", async () => {
    await shouldBeOn("addCrownstone_iconPhase");
    await tap("icon_next");
    await waitToNavigate('addCrownstone_roomPhase');
    await scrollDownUntilVisible("createRoom", "addCrownstone_roomPhase_scroll");
    await tap('createRoom');
    await waitToNavigate('RoomAdd');
    await replaceText('RoomAdd_roomName', "Garage");
    await tapReturnKey('RoomAdd_roomName');
    await tap('RoomAdd_roomName_next')
    await waitToNavigate('RoomAdd_icon');
    await tap('RoomAdd_CreateRoom');
    await waitToNavigate('addCrownstone_roomPhase')
  })


  test("should be able to place the second Crownstone in a room", async () => {
    await shouldBeOn("addCrownstone_roomPhase");
    let locationId = await Assistant.getRoomId(0)
    await tap(`crownstoneInLocation${locationId}`);
    await waitToNavigate("addCrownstone_waitToFinish")
  })


  test("should be able to setup the second Crownstone", async () => {
    await shouldBeOn('addCrownstone_waitToFinish');
    await Assistant.ble.for(handle2).succeed.connect('setup');
    await Assistant.ble.for(handle2).succeed.getMACAddress('CD:AB:CA:FE:BA:BE');
    await Assistant.ble.for(handle2).succeed.getFirmwareVersion('5.6.4');
    await Assistant.ble.for(handle2).succeed.getHardwareVersion('10106');
    await Assistant.ble.for(handle2).succeed.getUICR(UICR_DATA);
    await Assistant.ble.for(handle2).succeed.setupCrownstone();
    await Assistant.ble.for(handle2).disconnectEvent();
    await waitToNavigate('addCrownstone_setupMore');
  })

  test("should show an error screen if setup fails", async () => {
    await tap("addCrownstone_addMore");
    await waitToNavigate("ScanningForSetupCrownstones");
    let localId = await Assistant.getActiveSphereLocalId();
    await Assistant.ble.sendSetupAdvertisment(handle3);
    await waitToShow(`selectSetupEntry${handle3}`);
    await tap(`selectSetupEntry${handle3}`);
    await waitToNavigate('SetupCrownstone');
    await tap("name_next");
    await waitToNavigate("addCrownstone_iconPhase");
    await tap("icon_next");
    await waitToNavigate('addCrownstone_roomPhase');
    let locationId = await Assistant.getRoomId(0);
    await scrollDownUntilVisible(`crownstoneInLocation${locationId}`, "addCrownstone_roomPhase_scroll");
    await tap(`crownstoneInLocation${locationId}`);
    await Assistant.ble.for(handle3).succeed.connect('setup');
    await Assistant.ble.for(handle3).disconnectEvent();
    await Assistant.ble.for(handle3).fail.getMACAddress();
    await waitToNavigate('addCrownstone_problemBle');
    await screenshot();
    await tap("addCrownstone_tryLater");
    await waitToNavigate("SphereAdd");
  })
};

