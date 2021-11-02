import { resetMocks } from "./__testUtil/mocks/suite.mock";
import { addHub, addSphere, addStone } from "./__testUtil/helpers/data.helper";
import { core } from "../app/ts/Core";
import { xUtil } from "../app/ts/util/StandAloneUtil";

beforeEach(async () => {
  resetMocks()
})
beforeAll(async () => {})
afterEach(async () => { })
afterAll(async () => {})

let handle = 'TestHandle';
test("Using core in tests", async () => {
  addSphere();
  addStone('handle1')
  addStone('handle2')
  addStone('handle3')
  let state = core.store.getState();
  expect(state).toMatchSnapshot()
})

test("Create location without add", async () => {
  let sphere = addSphere();
  let stone = addStone('handle1')
  let hub = addHub()
  core.store.batchDispatch([{
    "type": "BATCHING_REDUCER.BATCH",
    "payload": [
      {
        "type": "UPDATE_HUB_CONFIG",
        "sphereId": sphere.id,
        "hubId": hub.id,
        "data": {
          "linkedStoneId": stone.stone.id,
          "locationId": "4fe0ea34-9ee4-9c8d-c3c6-dbb7cc69c650",
          "name": "Crownstone Hub",
          "ipAddress": "10.0.1.152",
          "httpPort": 80,
          "httpsPort": 443,
          "cloudId": "616f1390f3b4d100048ef9f9",
          "lastSeenOnCloud": 1635438119666,
          "updatedAt": 1635438119666
        },
        "triggeredBySync": true
      },
      {
        "type": "ADD_SPHERE_KEY",
        "sphereId": sphere.id,
        "keyId": "SPHERE_AUTHORIZATION_TOKEN",
        "data": {
          "key": "272e49a6c5b5ce91aabf68f90d1e0a74c27b8de0321edd4da86dd9dc5e22bbc3",
          "keyType": "SPHERE_AUTHORIZATION_TOKEN",
          "createdAt": 0,
          "ttl": 0
        },
        "triggeredBySync": true
      },
      {
        "type": "ADD_SPHERE_KEY",
        "sphereId": "a07fc7-ef1b-89ca-5eb9-32a03ebbb7d5",
        "keyId": "SPHERE_AUTHORIZATION_TOKEN",
        "data": {
          "key": "47c2b22f55c05c1c97a25a28b9e75cf81969c2bc4dbb724f58f68ba54bade661",
          "keyType": "SPHERE_AUTHORIZATION_TOKEN",
          "createdAt": 0,
          "ttl": 0
        },
        "triggeredBySync": true
      },
      {
        "type": "UPDATE_LOCATION_FINGERPRINT",
        "sphereId": sphere.id,
        "locationId": "88604682-5da4-31be-ca7d-a51c6a303ada",
        "data": {
          "fingerprintRaw": "x",
          "fingerprintCloudId": "5eac310b7c436c0004260090",
          "fingerprintUpdatedAt": "2020-05-01T16:54:53.222Z"
        },
        "triggeredBySync": true
      },
      {
        "type": "UPDATE_LOCATION_FINGERPRINT",
        "sphereId": sphere.id,
        "locationId": "ae93273d-f6f0-eef7-ccda-19e4646acee",
        "data": {
          "fingerprintRaw": "x",
          "fingerprintCloudId": "5eac310b7c436c0004260094",
          "fingerprintUpdatedAt": "2020-05-01T16:54:53.870Z"
        },
        "triggeredBySync": true
      },
      {
        "type": "UPDATE_LOCATION_FINGERPRINT",
        "sphereId": sphere.id,
        "locationId": "4fe0ea34-9ee4-9c8d-c3c6-dbb7cc69c650",
        "data": {
          "fingerprintRaw": "x",
          "fingerprintCloudId": "5eac310b7c436c0004260095",
          "fingerprintUpdatedAt": "2020-05-01T16:54:54.226Z"
        },
        "triggeredBySync": true
      },
      {
        "type": "UPDATE_LOCATION_FINGERPRINT",
        "sphereId": sphere.id,
        "locationId": "84cf9efa-70ad-73ac-428a-3655b4d33f24",
        "data": {
          "fingerprintRaw": "x",
          "fingerprintCloudId": "5eac310b7c436c0004260096",
          "fingerprintUpdatedAt": "2020-06-18T19:22:00.653Z"
        },
        "triggeredBySync": true
      },
      {
        "type": "UPDATE_LOCATION_FINGERPRINT",
        "sphereId": sphere.id,
        "locationId": "f27e3fcc-e287-a44d-1a8b-fe34abca6833",
        "data": {
          "fingerprintRaw": "x",
          "fingerprintCloudId": "5eac310b7c436c0004260098",
          "fingerprintUpdatedAt": "2020-05-01T16:54:54.221Z"
        },
        "triggeredBySync": true
      }
    ]
  }])
})


test("isLower", async () => {
  expect(xUtil.versions.isLower('4.2.1-rc1','4.2.1')).toBeTruthy()
  expect(xUtil.versions.isLower('4.2.1','4.3.1')).toBeTruthy()
  expect(xUtil.versions.isLower('4.6.2.10','4.6.3.1', 4)).toBeTruthy()
})

test("abilities", async () => {
  addSphere();
  addStone('handle1')
  addStone('handle2')
  addStone('handle3')
  let actions = [];
  let state = core.store.getState();

  // console.log(JSON.stringify(state, null, 2))
  for (let [sphereId, sphere] of Object.entries(state.spheres)) {
    // @ts-ignore
    for (let [stoneId, stone] of Object.entries(sphere.stones)) {
      actions.push({type:"REMOVE_ALL_ABILITIES", sphereId, stoneId});
      // actions.push({type:"ADD_ABILITY", sphereId, stoneId, abilityId:'dimming',
      //   data: {type:'dimming', enabled: false, enabledTarget: false, syncedToCrownstone:true, updatedAt:100}
      // });
      // actions.push({type:"ADD_ABILITY_PROPERTY", sphereId, stoneId, abilityId:'dimming', propertyId: 'softOnSpeed',
      //   data: {type:'softOnSpeed', value: 5, valueTarget: 8, syncedToCrownstone: true, updatedAt:100}
      // });
      //
      // actions.push({type:"ADD_ABILITY", sphereId, stoneId, abilityId:'switchcraft',
      //   data: {type:'switchcraft', enabled: false, enabledTarget: false, syncedToCrownstone:true, updatedAt:100}
      // });
      //
      // actions.push({type:"ADD_ABILITY", sphereId, stoneId, abilityId:'tapToToggle',
      //   data: {type:'tapToToggle', enabled: false, enabledTarget: false, syncedToCrownstone:true, updatedAt:100}
      // });
      // actions.push({type:"ADD_ABILITY_PROPERTY", sphereId, stoneId, abilityId:'tapToToggle', propertyId: 'rssiOffset',
      //   data: {type:'rssiOffset', value: 0, valueTarget: 0, syncedToCrownstone: true, updatedAt:100}
      // });
    }
  }

  for (let [sphereId, sphere] of Object.entries(state.spheres)) {
    // @ts-ignore
    for (let [stoneId, stone] of Object.entries(sphere.stones)) {
      actions.push({type:"REMOVE_ALL_ABILITIES", sphereId, stoneId});
      actions.push({type:"ADD_ABILITY", sphereId, stoneId, abilityId:'dimming',
        data: {type:'dimming', enabled: false, enabledTarget: false, syncedToCrownstone:true, updatedAt:100}
      });
      actions.push({type:"ADD_ABILITY_PROPERTY", sphereId, stoneId, abilityId:'dimming', propertyId: 'softOnSpeed',
        data: {type:'softOnSpeed', value: 5, valueTarget: 8, syncedToCrownstone: true, updatedAt:100}
      });

      actions.push({type:"ADD_ABILITY", sphereId, stoneId, abilityId:'switchcraft',
        data: {type:'switchcraft', enabled: false, enabledTarget: false, syncedToCrownstone:true, updatedAt:100}
      });

      actions.push({type:"ADD_ABILITY", sphereId, stoneId, abilityId:'tapToToggle',
        data: {type:'tapToToggle', enabled: false, enabledTarget: false, syncedToCrownstone:true, updatedAt:100}
      });
      actions.push({type:"ADD_ABILITY_PROPERTY", sphereId, stoneId, abilityId:'tapToToggle', propertyId: 'rssiOffset',
        data: {type:'rssiOffset', value: 0, valueTarget: 0, syncedToCrownstone: true, updatedAt:100}
      });
    }
  }

  core.store.batchDispatch(actions);
  state = core.store.getState();
})