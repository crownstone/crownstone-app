import {resetMocks} from "../__testUtil/mocks/suite.mock";
import {addLocation, addSphere, addStone} from "../__testUtil/helpers/data.helper";

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
  resetMocks()
})
beforeAll(async () => {})
afterEach(async () => { })
afterAll(async () => {})



test("LocalizationProcessing - ", async () => {
  let sphere = addSphere({id:'8ee98df8-9013-7fc9-1155-3cc7410ec478'});
  let location1 = addLocation();
  let location2 = addLocation();
  let location3 = addLocation();
  let location4 = addLocation();
  let stones = [];
  stones.push(addStone({locationId: location2.id, }));
  stones.push(addStone({locationId: location2.id, }));
  stones.push(addStone({locationId: location3.id, }));
  stones.push(addStone({locationId: location4.id, }));
  stones.push(addStone({locationId: location1.id, }));
  stones.push(addStone({locationId: location1.id, }));

})