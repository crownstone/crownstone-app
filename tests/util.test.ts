import { resetMocks } from "./__testUtil/mocks/suite.mock";
import { addSphere, addStone } from "./__testUtil/helpers/data.helper";
import { core } from "../app/ts/core";
import { xUtil } from "../app/ts/util/StandAloneUtil";

beforeEach(async () => {
  resetMocks()
})
beforeAll(async () => {})
afterEach(async () => { })
afterAll(async () => {})

let handle = 'TestHandle';
test("Using core in tests", async () => {
  let a = {a:32,b:null,c:'test',d:{nest:1, nest3:{q:5}}}
  let a_same = {a:32,b:null,c:'test',d:{nest:1, nest3:{q:5}}}
  let b = {a:32,b:2,c:'test',d:{nest:1, nest3:{q:5}}}

  let behaviour1 = {"id":"c85baf6-55da-f7fa-28f-b2b4aa8e22b2","type":"BEHAVIOUR","data":{"action":{"type":"BE_ON","data":100},"time":{"type":"RANGE","from":{"type":"CLOCK","data":{"hours":15,"minutes":0}},"to":{"type":"SUNSET","offsetMinutes":0}},"presence":{"type":"IGNORE"},"endCondition":{"type":"PRESENCE_AFTER","presence":{"type":"SOMEBODY","data":{"type":"LOCATION","locationIds":[13]},"delay":300}}},"activeDays":{"Mon":true,"Tue":true,"Wed":true,"Thu":true,"Fri":true,"Sat":true,"Sun":true},"idOnCrownstone":null,"cloudId":null,"profileIndex":0,"deleted":false,"syncedToCrownstone":false,"updatedAt":1627319069610}
  let behaviour2 = {"id":"50acdf69-241e-45cc-77ce-895c5ebfa70","type":"BEHAVIOUR","data":{"action":{"type":"BE_ON","data":100},"time":{"type":"RANGE","from":{"type":"SUNSET","offsetMinutes":0},"to":{"type":"SUNRISE","offsetMinutes":0}},"presence":{"type":"SOMEBODY","data":{"type":"SPHERE"},"delay":300}},"activeDays":{"Mon":true,"Tue":true,"Wed":true,"Thu":true,"Fri":true,"Sat":true,"Sun":true},"idOnCrownstone":null,"cloudId":null,"profileIndex":0,"deleted":false,"syncedToCrownstone":false,"updatedAt":1627319063422}

  expect(xUtil.deepCompare(a, a_same)).toBeTruthy()
  expect(xUtil.deepCompare(a, b)).toBeFalsy()
  expect(xUtil.deepCompare(behaviour1, behaviour2)).toBeFalsy()
})