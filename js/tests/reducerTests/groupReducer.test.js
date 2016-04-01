var test = require('tape');
let deepFreeze = require('deep-freeze');


import groupsReducer from '../../router/store/reducers/groups'

test('groupsReducer ADD_GROUP, UPDATE_GROUP and REMOVE_GROUP', function (t) {
  let initialState = {};
  let createAction = {
    type: 'ADD_GROUP',
    data: {name: 'home'},
    groupId: 'groupId'
  };

  let emptyAction = {};


  let updateAction = {
    type: 'UPDATE_GROUP',
    data: {name: 'school'},
    groupId: 'groupId'
  };

  let updateVoidAction = {
    type: 'UPDATE_GROUP',
    groupId: 'groupId'
  };

  let removeAction = {
    type: 'REMOVE_GROUP',
    groupId: 'groupId'
  };

  deepFreeze(initialState);
  deepFreeze(createAction);
  deepFreeze(updateAction);
  deepFreeze(updateVoidAction);
  deepFreeze(removeAction);

  let groupState = groupsReducer(initialState, createAction);
  deepFreeze(groupState);

  let expectedReturn = {
    groupId: {
      config: {
        name: 'home',
        latitude: undefined,
        longitude: undefined
      },
      locations: {},
      presets: []}
  };
  t.deepEqual(groupState, expectedReturn, 'adding a group' );
  t.deepEqual(groupsReducer(groupState, updateVoidAction), expectedReturn, 'update a group with a void action');
  t.deepEqual(groupsReducer(groupState, emptyAction), expectedReturn, 'update a group with a completely empty action');

  expectedReturn.groupId.config.name = 'school';
  t.deepEqual(groupsReducer(groupState, updateAction), expectedReturn, 'update a group');
  t.deepEqual(groupsReducer(groupState, removeAction), {}, 'remove a group');
  t.end();
});
