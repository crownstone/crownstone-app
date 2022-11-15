import {expect, jest, test} from '@jest/globals';
import {resetMocks} from "./__testUtil/mocks/suite.mock";
import {addSphere, addStone} from "./__testUtil/helpers/data.helper";
import {core} from "../app/ts/Core";
import {xUtil} from "../app/ts/util/StandAloneUtil";
import { YEAR_DATA } from "./energy/energyData";

beforeEach(async () => {
  resetMocks()
})
beforeAll(async () => {})
afterEach(async () => { })
afterAll(async () => {})

let handle = 'TestHandle';
test("Using core in tests", async () => {

  // get YEAR_DATA
  let yearData = YEAR_DATA;


})
