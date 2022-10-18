import { cleanupSuiteAfterTest, moveTimeBy, prepareSuiteForTest, resetMocks } from "../__testUtil/mocks/suite.mock";
import { loadDump }              from "../__testUtil/helpers/data.helper";
import { KNN }                   from "../../app/ts/localization/classifiers/knn";
import { localizationStateDump } from "../__statedumps/localization_stateDump";
import { Get }                   from "../../app/ts/util/GetUtil";
import { FingerprintUtil }       from "../../app/ts/util/FingerprintUtil";
import { ENERGY_DATA_01 }        from "./energyData";
import { getEnergyRange, processPerLocation } from "../../app/ts/views/energyUsage/EnergyProcessingUtil";


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
