var test = require('tape');
let deepFreeze = require('deep-freeze');

import locationsReducer from '../../router/store/reducers/locations'

test('locationsReducer ADD_LOCATION and REMOVE_LOCATION', function (t) {
  let initialState = {};

  let addLocationAction = {
    type: 'ADD_LOCATION',
    locationId:'locationId',
    data: {
      name:'living room',
      icon:'couch'
    }
  };

  let updateLocationAction = {
    type: 'UPDATE_LOCATION_CONFIG',
    locationId:'locationId',
    data: {
      name:'living room',
      icon:'tv'
    }
  };

  let removeLocationAction = {
    type: 'REMOVE_LOCATION',
    locationId:'locationId'
  };


  deepFreeze(initialState);
  deepFreeze(addLocationAction);
  deepFreeze(updateLocationAction);
  deepFreeze(removeLocationAction);

  let expectedReturn = {
    locationId: {
      config: {
        icon: 'couch',
        name: 'living room',
      },
      picture: {barURI: undefined, fullURI: undefined, squareURI: undefined},
      presentUsers: [],
      stones: []
    }
  };

  let stateWithLocation = locationsReducer({}, addLocationAction);
  deepFreeze(stateWithLocation);

  t.deepEqual(stateWithLocation, expectedReturn, 'add a location to a group');

  expectedReturn.locationId.config.icon = 'tv';
  t.deepEqual(locationsReducer(stateWithLocation, updateLocationAction), expectedReturn, 'update a location in a group');
  t.deepEqual(locationsReducer(stateWithLocation, removeLocationAction), {}, 'remove a location from a group');
  t.end();
});
