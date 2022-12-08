import {expect, test} from '@jest/globals';
import {resetMocks} from "./__testUtil/mocks/suite.mock";
import {TransformCollection} from "../app/ts/localization/TransformManager";
import { FingerprintUtil } from "../app/ts/util/FingerprintUtil";
import { TransformUtil } from "../app/ts/util/TransformUtil";



beforeEach(async () => {
  resetMocks()
})
beforeAll(async () => {})
afterEach(async () => { })
afterAll(async () => {})

test("Using core in tests", async () => {

  let collection = new TransformCollection('sphereId', 'transformId', 'collectionId');
  collection.collection = {
    "test": [1,23,4,5,6]
  }
  expect(TransformUtil.processData(collection.collection)).toStrictEqual({'test':5})
})
