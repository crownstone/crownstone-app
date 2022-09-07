import {cleanupSuiteAfterTest, moveTimeBy, prepareSuiteForTest, resetMocks} from "../__testUtil/mocks/suite.mock";
import {addLocation, addSphere, addStone, loadDump} from "../__testUtil/helpers/data.helper";
import {KNN} from "../../app/ts/localization/classifiers/knn";
import {localizationStateDump} from "../__statedumps/localization_stateDump";
import {core} from "../../app/ts/Core";
import {LocalizationCore, LocalizationCoreClass} from "../../app/ts/localization/LocalizationCore";
import {Get} from "../../app/ts/util/GetUtil";
import {FingerprintUtil} from "../../app/ts/util/FingerprintUtil";

const fs = require('fs');
const path = require('path');


let ibeaconData = [
  {"id": "D8B094E7-569C-4BC6-8637-E11CE4221C18_Maj:26910_Min:44873", "major": 26910, "minor": 44873, "referenceId": "8ee98df8-9013-7fc9-1155-3cc7410ec478", "rssi": -58, "uuid": "D8B094E7-569C-4BC6-8637-E11CE4221C18"},
  {"id": "D8B094E7-569C-4BC6-8637-E11CE4221C18_Maj:36655_Min:39097", "major": 36655, "minor": 39097, "referenceId": "8ee98df8-9013-7fc9-1155-3cc7410ec478", "rssi": -60, "uuid": "D8B094E7-569C-4BC6-8637-E11CE4221C18"},
  {"id": "D8B094E7-569C-4BC6-8637-E11CE4221C18_Maj:53215_Min:42695", "major": 53215, "minor": 42695, "referenceId": "8ee98df8-9013-7fc9-1155-3cc7410ec478", "rssi": -62, "uuid": "D8B094E7-569C-4BC6-8637-E11CE4221C18"},
  {"id": "D8B094E7-569C-4BC6-8637-E11CE4221C18_Maj:51826_Min:3597",  "major": 51826, "minor": 3597,  "referenceId": "8ee98df8-9013-7fc9-1155-3cc7410ec478", "rssi": -75, "uuid": "D8B094E7-569C-4BC6-8637-E11CE4221C18"},
  {"id": "D8B094E7-569C-4BC6-8637-E11CE4221C18_Maj:12399_Min:26559", "major": 12399, "minor": 26559, "referenceId": "8ee98df8-9013-7fc9-1155-3cc7410ec478", "rssi": -71, "uuid": "D8B094E7-569C-4BC6-8637-E11CE4221C18"},
  {"id": "D8B094E7-569C-4BC6-8637-E11CE4221C18_Maj:18652_Min:50338", "major": 18652, "minor": 50338, "referenceId": "8ee98df8-9013-7fc9-1155-3cc7410ec478", "rssi": -70, "uuid": "D8B094E7-569C-4BC6-8637-E11CE4221C18"},
  {"id": "D8B094E7-569C-4BC6-8637-E11CE4221C18_Maj:3145_Min:34773",  "major": 3145,  "minor": 34773, "referenceId": "8ee98df8-9013-7fc9-1155-3cc7410ec478", "rssi": -73, "uuid": "D8B094E7-569C-4BC6-8637-E11CE4221C18"},
  {"id": "D8B094E7-569C-4BC6-8637-E11CE4221C18_Maj:20161_Min:10414", "major": 20161, "minor": 10414, "referenceId": "8ee98df8-9013-7fc9-1155-3cc7410ec478", "rssi": -71, "uuid": "D8B094E7-569C-4BC6-8637-E11CE4221C18"},
  {"id": "D8B094E7-569C-4BC6-8637-E11CE4221C18_Maj:56053_Min:25176", "major": 56053, "minor": 25176, "referenceId": "8ee98df8-9013-7fc9-1155-3cc7410ec478", "rssi": -77, "uuid": "D8B094E7-569C-4BC6-8637-E11CE4221C18"},
  {"id": "D8B094E7-569C-4BC6-8637-E11CE4221C18_Maj:20675_Min:31553", "major": 20675, "minor": 31553, "referenceId": "8ee98df8-9013-7fc9-1155-3cc7410ec478", "rssi": -74, "uuid": "D8B094E7-569C-4BC6-8637-E11CE4221C18"},
  {"id": "D8B094E7-569C-4BC6-8637-E11CE4221C18_Maj:23546_Min:6110",  "major": 23546, "minor": 6110,  "referenceId": "8ee98df8-9013-7fc9-1155-3cc7410ec478", "rssi": -77, "uuid": "D8B094E7-569C-4BC6-8637-E11CE4221C18"},
  {"id": "D8B094E7-569C-4BC6-8637-E11CE4221C18_Maj:8569_Min:45914",  "major": 8569,  "minor": 45914, "referenceId": "8ee98df8-9013-7fc9-1155-3cc7410ec478", "rssi": -78, "uuid": "D8B094E7-569C-4BC6-8637-E11CE4221C18"},
  {"id": "D8B094E7-569C-4BC6-8637-E11CE4221C18_Maj:34060_Min:7621",  "major": 34060, "minor": 7621,  "referenceId": "8ee98df8-9013-7fc9-1155-3cc7410ec478", "rssi": -80, "uuid": "D8B094E7-569C-4BC6-8637-E11CE4221C18"},
  {"id": "D8B094E7-569C-4BC6-8637-E11CE4221C18_Maj:15433_Min:6247",  "major": 15433, "minor": 6247,  "referenceId": "8ee98df8-9013-7fc9-1155-3cc7410ec478", "rssi": -77, "uuid": "D8B094E7-569C-4BC6-8637-E11CE4221C18"},
  {"id": "D8B094E7-569C-4BC6-8637-E11CE4221C18_Maj:47254_Min:57646", "major": 47254, "minor": 57646, "referenceId": "8ee98df8-9013-7fc9-1155-3cc7410ec478", "rssi": -85, "uuid": "D8B094E7-569C-4BC6-8637-E11CE4221C18"},
  {"id": "D8B094E7-569C-4BC6-8637-E11CE4221C18_Maj:64810_Min:33239", "major": 64810, "minor": 33239, "referenceId": "8ee98df8-9013-7fc9-1155-3cc7410ec478", "rssi": -87, "uuid": "D8B094E7-569C-4BC6-8637-E11CE4221C18"},
  {"id": "D8B094E7-569C-4BC6-8637-E11CE4221C18_Maj:17452_Min:54653", "major": 17452, "minor": 54653, "referenceId": "8ee98df8-9013-7fc9-1155-3cc7410ec478", "rssi": -86, "uuid": "D8B094E7-569C-4BC6-8637-E11CE4221C18"},
  {"id": "D8B094E7-569C-4BC6-8637-E11CE4221C18_Maj:9524_Min:56756",  "major": 9524,  "minor": 56756, "referenceId": "8ee98df8-9013-7fc9-1155-3cc7410ec478", "rssi": -85, "uuid": "D8B094E7-569C-4BC6-8637-E11CE4221C18"},
  {"id": "D8B094E7-569C-4BC6-8637-E11CE4221C18_Maj:50001_Min:43540", "major": 50001, "minor": 43540, "referenceId": "8ee98df8-9013-7fc9-1155-3cc7410ec478", "rssi": -83, "uuid": "D8B094E7-569C-4BC6-8637-E11CE4221C18"},
  {"id": "D8B094E7-569C-4BC6-8637-E11CE4221C18_Maj:38643_Min:9749",  "major": 38643, "minor": 9749,  "referenceId": "8ee98df8-9013-7fc9-1155-3cc7410ec478", "rssi": -90, "uuid": "D8B094E7-569C-4BC6-8637-E11CE4221C18"},
  {"id": "D8B094E7-569C-4BC6-8637-E11CE4221C18_Maj:19567_Min:61824", "major": 19567, "minor": 61824, "referenceId": "8ee98df8-9013-7fc9-1155-3cc7410ec478", "rssi": -91, "uuid": "D8B094E7-569C-4BC6-8637-E11CE4221C18"}
];



beforeEach(async () => {
  prepareSuiteForTest();
})
beforeAll(async () => {})
afterEach(async () => {
  await cleanupSuiteAfterTest();
})
afterAll(async () => {})



test("KNN - preprocessing test vector", async () => {
  loadDump(localizationStateDump);
  let sphereId = "8ee98df8-9013-7fc9-1155-3cc7410ec478";

  let knn = new KNN();
  knn.initialize();

  let preprocessed = knn.preprocessIBeacon(ibeaconData);
  expect(preprocessed[sphereId][0]).toBe(1)
  for (let measurement of preprocessed[sphereId]) {
    expect(measurement >= 0 && measurement <= 1).toBeTruthy()
  }
})



test("Fingerprints - processing fingerprint", async () => {
  loadDump(localizationStateDump);
  let sphereId = "8ee98df8-9013-7fc9-1155-3cc7410ec478";
  let sphere = Get.sphere(sphereId);

  for (let locationId in sphere.locations) {
    let location = sphere.locations[locationId];

    for (let fingerprint of Object.values(location.fingerprints.raw)) {
      let processedFingerprint = FingerprintUtil._processFingerprint(sphereId, locationId, fingerprint.id);
      expect(processedFingerprint).toMatchSnapshot();
    }
  }
})

test("LocalizationCore - classify", async () => {
  loadDump(localizationStateDump);
  let sphereId = "8ee98df8-9013-7fc9-1155-3cc7410ec478";
  let localizationCore = new LocalizationCoreClass();
  let awaitable = localizationCore.init();
  // profile this part
  await moveTimeBy(30);
  await awaitable;

  localizationCore.enableLocalization();

  let sphere = Get.sphere(sphereId);
  let locationUidMap = {};
  let locationMap = {};
  for (let locationId in sphere.locations) {
    locationUidMap[sphere.locations[locationId].config.uid] = locationId;
    locationMap[locationId] = sphere.locations[locationId].config.name;
  }

  let dataPath = "/Users/alex/Dropbox/Crownstone/Projects/localization-research/datasets/users/Alex_de_Mulder/homeV1"
  let items = fs.readdirSync(dataPath);

  let results = {}
  console.time("classify");
  for (let item of items) {
    if (String(item).includes(".json")) {
      let data = JSON.parse(fs.readFileSync(path.join(dataPath, item)));
      for (let datapoint of data.dataset) {
        let packet = [];
        for (let ibeaconId in datapoint.devices) {
          let ibeaconArr = ibeaconId.replace("Maj:","").replace("Min:","").split("_");
          packet.push({
            id: ibeaconId,
            uuid  : ibeaconArr[0],
            major : ibeaconArr[1],
            minor : ibeaconArr[2],
            rssi  : datapoint.devices[ibeaconId],
            referenceId : sphereId
          })
        }
        let classification = localizationCore.handleIBeaconAdvertisement(packet);
        let expectedId = locationUidMap[data.location.uid];
        if (!results[locationMap[expectedId]]) { results[locationMap[expectedId]] = {total:0, correct:0, miss:0}; }

        results[locationMap[expectedId]].total++;
        if (classification[sphereId] === expectedId) {
          results[locationMap[expectedId]].correct++;
        }
        else {
          results[locationMap[expectedId]].miss++;
        }
      }
    }
  }
  console.timeEnd("classify");

  let base = {
    'Living room': { total: 5351, correct: 4797, miss: 554, rate: 0.8964679499159036 },
    Studeerkamer: { total: 2027, correct: 2024, miss: 3, rate: 0.9985199802664035 },
    Badkamer: { total: 524, correct: 121, miss: 403, rate: 0.23091603053435114 },
    'Gang Boven': { total: 421, correct: 148, miss: 273, rate: 0.3515439429928741 },
    Gang: { total: 385, correct: 254, miss: 131, rate: 0.6597402597402597 },
    Keuken: { total: 913, correct: 713, miss: 200, rate: 0.7809419496166484 },
    Logeerkamer: { total: 761, correct: 368, miss: 393, rate: 0.4835742444152431 },
    Slaapkamer: { total: 805, correct: 700, miss: 105, rate: 0.8695652173913043 },
    Voordakkapel: { total: 615, correct: 0, miss: 615, rate: 0 },
    Washok: { total: 513, correct: 255, miss: 258, rate: 0.49707602339181284 },
    'Wc Beneden': { total: 420, correct: 305, miss: 115, rate: 0.7261904761904762 },
    'Wc Boven': { total: 392, correct: 350, miss: 42, rate: 0.8928571428571429 },
    Workshop: { total: 939, correct: 782, miss: 157, rate: 0.832800851970181 }
  }

  for (let result in base) {
    base[result].rate = base[result].correct/base[result].total;
  }
  let str = ''
  for (let result in results) {
    results[result].rate = results[result].correct/results[result].total;
    str += `improvement ${result} ${Math.round(100*results[result].rate)} ${Math.round(100*(results[result].rate - base[result].rate))}\n`
  }


});


test("Removal of Crownstone from fingerprints", async () => {

})