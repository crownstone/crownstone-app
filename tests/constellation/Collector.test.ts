import { mBluenet, mScheduler, resetMocks } from "../__testUtil/mocks/suite.mock";
import { TestUtil } from "../__testUtil/util/testUtil";
import { eventHelperSetActive, evt_disconnected, evt_ibeacon } from "../__testUtil/helpers/event.helper";
import { SessionManagerClass } from "../../app/ts/logic/constellation/SessionManager";
import { addSphere, addStone } from "../__testUtil/helpers/data.helper";
import { getCommandOptions } from "../__testUtil/helpers/constellation.helper";


beforeEach(async () => {
  resetMocks()
})
beforeAll(async () => {})
afterEach(async () => { await TestUtil.nextTick(); })
afterAll(async () => {})

const handle    = 'TestHandle';
const meshId    = 'MeshId';
const privateId = 'PrivateIDX';
eventHelperSetActive(handle);

test("Collector .", async () => {

})