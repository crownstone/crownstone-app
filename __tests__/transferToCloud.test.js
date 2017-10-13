'use strict';
// __tests__/Intro-test.js
// Note: test renderer must be required after react-native.
let jest = require('jest');
jest.mock('react-native-fs', () => {return {};});
jest.mock('react-native-device-info');

jest.mock('../js/ExternalConfig', () => {
  return {
  }
});


jest.mock('../js/cloud/cloudAPI', () => {
  return {
    forSphere:        () => { return {id:4}; },
    createAppliance:  () => { return {id:4}; },
    createLocation:   () => { return {id:4}; },
    createMessage:    () => { return {id:4}; },
    createSchedule:   () => { return {id:4}; },
    createSphere:     () => { return {id:4}; },
    createStone:      () => { return {id:4}; },
  };
});

jest.mock('PushNotificationIOS', () => ({}));
jest.mock('Linking', () => {});
jest.mock('NetInfo', () => {});

import { transferAppliances } from '../js/cloud/transferData/transferAppliances'
import { transferLocations  } from '../js/cloud/transferData/transferLocations'
import { transferMessages   } from '../js/cloud/transferData/transferMessages'
import { transferSchedules  } from '../js/cloud/transferData/transferSchedules'
import { transferSpheres    } from '../js/cloud/transferData/transferSpheres'
import { transferStones     } from '../js/cloud/transferData/transferStones'
import { transferUser       } from '../js/cloud/transferData/transferUser'

import { transferUtil } from '../js/cloud/transferData/shared/transferUtil'

test('cloudIdTest', () => {
  let appliancesMap = transferAppliances.fieldMap;
  let locationsMap  = transferLocations.fieldMap;
  let messagesMap   = transferMessages.fieldMap;
  let schedulesMap  = transferSchedules.fieldMap;
  let spheresMap    = transferSpheres.fieldMap;
  let stonesMap     = transferStones.fieldMap;
  let userMap       = transferUser.fieldMap;

  const findCloudId = (map) => {
    let foundIt = 0;
    map.forEach((item) => {

      if (item.local === 'cloudId') {
        foundIt++;
      }
    });
    expect(foundIt).toBe(1);
  };

  findCloudId(appliancesMap);
  findCloudId(locationsMap);
  findCloudId(messagesMap);
  findCloudId(schedulesMap);
  findCloudId(spheresMap);
  findCloudId(stonesMap);

  let promises = [];

  let actions = [];

  promises.push(transferUtil._handleLocal(actions,'appliancesMap',{},{cloudData:{id:5}},appliancesMap).catch() );
  promises.push(transferUtil._handleLocal(actions,'locationsMap', {},{cloudData:{id:5}},locationsMap ).catch() );
  promises.push(transferUtil._handleLocal(actions,'messagesMap',  {},{cloudData:{id:5}},messagesMap  ).catch() );
  promises.push(transferUtil._handleLocal(actions,'schedulesMap', {},{cloudData:{id:5}},schedulesMap ).catch() );
  promises.push(transferUtil._handleLocal(actions,'spheresMap',   {},{cloudData:{id:5}},spheresMap   ).catch() );
  promises.push(transferUtil._handleLocal(actions,'stonesMap',    {},{cloudData:{id:5}},stonesMap    ).catch() );
  promises.push(transferUtil._handleLocal(actions,'userMap',      {},{cloudData:{id:5}},userMap      ).catch() );

  return Promise.all(promises).then(() => {
    console.log(actions)
  })
});

test('createTest', () => {
  let actions = [];
  let promises = [];

  promises.push(transferAppliances.createOnCloud( actions, {localData: {}, localSphereId:'s1', localId:'l1'} ));
  promises.push( transferLocations.createOnCloud( actions, {localData: {}, localSphereId:'s1', localId:'l1'} ));
  promises.push(  transferMessages.createOnCloud( actions, {localData: {}, localSphereId:'s1', localId:'l1'} ));
  // promises.push( transferSchedules.createOnCloud( actions, {localData: {}, localSphereId:'s1', localId:'l1'} ));
  promises.push(   transferSpheres.createOnCloud( actions, {localData: {}, localSphereId:'s1', localId:'l1'} ));
  promises.push(    transferStones.createOnCloud( actions, {localData: {}, localSphereId:'s1', localId:'l1'} ));

  return Promise.all(promises).then(() => {
    // console.log(actions)
  });
});
