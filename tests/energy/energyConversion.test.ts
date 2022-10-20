import { cleanupSuiteAfterTest, moveTimeBy, prepareSuiteForTest, resetMocks } from "../__testUtil/mocks/suite.mock";
import { loadDump }              from "../__testUtil/helpers/data.helper";
import { localizationStateDump } from "../__statedumps/localization_stateDump";
import {ENERGY_DATA_01, ENERGY_DATA_02, ENERGY_DATA_03} from "./energyData";
import { getEnergyRange, processPerLocation } from "../../app/ts/views/energyUsage/EnergyProcessingUtil";
import {Get} from "../../app/ts/util/GetUtil";


beforeEach(async () => {
  prepareSuiteForTest();
})
beforeAll(async () => {})
afterEach(async () => {
  await cleanupSuiteAfterTest();
})
afterAll(async () => {})


test("Converting cloud to location dataset", async () => {
  loadDump(localizationStateDump);

  let sphereId   = '8ee98df8-9013-7fc9-1155-3cc7410ec478';
  let date       = new Date('2022-10-17T09:00:00.000Z');

  let range      = getEnergyRange(date, 'DAY');
  let energyData = processPerLocation(sphereId, range, ENERGY_DATA_01, 'DAY');
});

test("Converting cloud to location dataset 2", async () => {
  loadDump(localizationStateDump);

  let sphereId   = '8ee98df8-9013-7fc9-1155-3cc7410ec478';
  let date       = new Date('2022-10-12T09:00:00.000Z');

  let range      = getEnergyRange(date, 'DAY');
  // let energyData = processPerLocation(sphereId, range, ENERGY_DATA_02, 'DAY');

  console.log(Get.stone(sphereId, 'd85e6539-95cc-e279-c61a-88022bbe186'))
});


test("Converting cloud to location dataset 3", async () => {
  loadDump(localizationStateDump);

  let sphereId   = '8ee98df8-9013-7fc9-1155-3cc7410ec478';
  let date       = new Date('2022-10-12T09:00:00.000Z');

  let range      = getEnergyRange(date, 'DAY');
  let energyData = processPerLocation(sphereId, range, ENERGY_DATA_03, 'DAY');

  // console.log(Get.stone(sphereId, 'd85e6539-95cc-e279-c61a-88022bbe186'))
});
