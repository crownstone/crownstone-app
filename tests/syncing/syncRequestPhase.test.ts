import { resetMocks } from "../__testUtil/mocks/suite.mock";
import {addLocation, addMessage, addSphere, addStone, createUser} from "../__testUtil/helpers/data.helper";
import { core } from "../../app/ts/Core";
import { SyncUtil } from "../../app/ts/util/SyncUtil";
import {
  AbilityPropertyTransferNext
} from "../../app/ts/cloud/sections/newSync/transferrers/AbilityPropertyTransferNext";
import {FingerprintCollector} from "../../app/ts/localization/fingerprints/FingerprintCollector";
import {evt_ibeacon, ibeaconPayload} from "../__testUtil/helpers/event.helper";
import {SyncNext} from "../../app/ts/cloud/sections/newSync/SyncNext";
import {getSyncIdMap} from "../../app/ts/cloud/sections/sync/modelSyncs/SyncingBase";
import {MapProvider} from "../../app/ts/backgroundProcesses/MapProvider";

beforeEach(async () => {
  resetMocks()
})
beforeAll(async () => {})
afterEach(async () => { })
afterAll(async () => {})


test("Using SyncUtil", async () => {
  let myReply = {}
  SyncUtil.constructReply(myReply,['item', 'id'],{ myData:'awesome' });
  expect(myReply).toStrictEqual({item:{id:{data:{myData:'awesome'}}}})
  let myReply2 = {}
  SyncUtil.constructReply(myReply2,['item'],{ myData:'awesome' });
  expect(myReply2).toStrictEqual({item:{data:{myData:'awesome'}}})
})


test("Check if abilityProperties sync correctly", async () => {
  let sphere = addSphere();
  let stone = addStone({handle:'handle1'}).stone

  let action = AbilityPropertyTransferNext.getUpdateLocalCloudIdAction(sphere.id, stone.id, 'dimming', 'softOnSpeed', '123')
  core.store.dispatch(action)
  expect(core.store.getState().spheres[sphere.id].stones[stone.id].abilities.dimming.properties.softOnSpeed.cloudId).toBe('123')

  action = AbilityPropertyTransferNext.getUpdateLocalCloudIdAction(sphere.id, stone.id, 'dimming', 'softOnSpeed', null)
  core.store.dispatch(action)
  expect(core.store.getState().spheres[sphere.id].stones[stone.id].abilities.dimming.properties.softOnSpeed.cloudId).toBe(null)
})



test("Check if fingerprints are syncing", async () => {
  createUser();
  let sphere = addSphere({cloudId: 'sphereCloudId'});
  let stone1 = addStone({handle:'handle1'}).stone
  let stone2 = addStone({handle:'handle2'}).stone
  let stone3 = addStone({handle:'handle3'}).stone
  let location = addLocation({cloudId:'locationCloud'})

  let collector = new FingerprintCollector(sphere.id, location.id, "IN_HAND");
  collector.collect([
    ibeaconPayload(sphere, stone1), ibeaconPayload(sphere, stone2), ibeaconPayload(sphere, stone3),
    ibeaconPayload(sphere, stone1), ibeaconPayload(sphere, stone2), ibeaconPayload(sphere, stone3),
    ibeaconPayload(sphere, stone1), ibeaconPayload(sphere, stone2), ibeaconPayload(sphere, stone3),
    ibeaconPayload(sphere, stone1), ibeaconPayload(sphere, stone2), ibeaconPayload(sphere, stone3),
  ]);

  collector.store();
  let state = core.store.getState();
  let scopeMap : SyncScopeMap = {
    bootloader:      true,                
    features:        true,              
    firmware:        true,              
    fingerprints:    true,                  
    hubs:            true,          
    keys:            true,          
    locations:       true,              
    messages:        true,              
    scenes:          true,            
    spheres:         true,            
    sphereUsers:     true,                
    stones:          true,            
    trackingNumbers: true,                    
    toons:           true,          
    user:            true,          
  };


  // checking if the the fingerprint is prepared
  let composedState = SyncNext.composeState(state, scopeMap);
  let fingerprintIds = Object.keys(composedState['sphereCloudId'].fingerprints)
  expect(composedState).toMatchSnapshot();
  expect(fingerprintIds.length).toBe(1);

  // check if a fingerprint is added to DB when one is available in the cloud.
  let sphereResponse   = {'sphereCloudId':{
    fingerprints: {
      'newCloudFingerprint': {
        data: {
          status: 'NEW_DATA_AVAILABLE' as SyncState,
          data: {
            id: 'newCloudFingerprint',
            type: 'IN_POCKET' as FingerprintType,
            createdOnDeviceType: 'test_test',
            createdByUser: 'otherUser',
            crownstonesAtCreation: ['10_10'],
            data: [{ dt: 123, data: {'10_10':-52} }],
            locationId: location.config.cloudId,
            sphereId: sphere.config.cloudId,
            updatedAt: new Date('2022').toISOString(),
            createdAt: new Date('2021').toISOString(),
          }
        }
      }
    }
    }};
  let actions          = [];
  let globalCloudIdMap = getSyncIdMap();
  let sphereIdMap      = {};

  await SyncNext.processSpheres(sphereResponse, actions, globalCloudIdMap, sphereIdMap);

  expect(actions.length).toBe(1);
  expect(actions[0]).toStrictEqual({
    type: 'ADD_FINGERPRINT_V2',
    sphereId: 'sphere_uuid2004-2005',
    locationId: 'location_uuid2032-2033',
    fingerprintId: 'uuid2037-2038',
    data: {
      cloudId: 'newCloudFingerprint',
      type: 'IN_POCKET',
      createdOnDeviceType: 'test_test',
      createdByUser: 'otherUser',
      crownstonesAtCreation: {'10_10':true},
      data: [{ dt: 123, data: {'10_10':-52} }],
      updatedAt: 1640995200000,
      createdAt: 1609459200000
    }
  })

  core.store.batchDispatch(actions);

  expect(core.store.getState()).toMatchSnapshot()
});

test("Check if messages are preparing their sync request payload", async () => {
  let user1 = createUser();
  let sphere = addSphere({cloudId: 'sphereCloudId'});

  let message = addMessage({},['memberId'])
  let message2 = addMessage({cloudId:'cloudMessage'},['memberId']);

  MapProvider.refreshAll();

  core.store.dispatch({type:"MARK_AS_READ",   sphereId:sphere.id, messageId:message.id, messageStateId:'read', data: {value: true}})
  core.store.dispatch({type:"MARK_AS_DELETED",sphereId:sphere.id, messageId:message.id, messageStateId:'deleted', data: {value: true}})

  let syncState = SyncNext.composeState(core.store.getState(), {'messages':true});
  expect(syncState).toMatchSnapshot();
});



test("Check if messages can handle the cloud's sync reply", async () => {
  let user1 = createUser();
  let sphere = addSphere({cloudId: 'sphereCloudId'});

  let response : any = {
    spheres:{
     [sphere.config.cloudId]: {
      messages:{
        newMessageId1:{
          data:{
            data:{
              content: 'hello',
                createdAt: '1970-01-01T00:00:00.000Z',
                everyoneInSphere: false,
                id: 'dbId:MessageV2Repository:1',
                includeSenderInEveryone: false,
                recipients: [
               {
                userId: 'dbId:UserRepository:3',
              },
            ],
              sphereId: [sphere.config.cloudId],
              triggerEvent: 'enter',
              updatedAt: '1970-01-01T00:00:00.000Z',
            },
            status: 'NEW_DATA_AVAILABLE',
          },
          deletedBy:{},
          readBy:{},
        },
      },
    },
  },
  }

  let action = [];
  let globalCloudIdMap = getSyncIdMap();
  let syncState = await SyncNext.processSyncResponse(response, action, globalCloudIdMap);


  expect(action).toMatchSnapshot("creationActions");
});


