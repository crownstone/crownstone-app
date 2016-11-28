const test = require('tape');
let deepFreeze = require('deep-freeze');

import locationsReducer from '../../router/store/reducers/locations'

// hack to remove the current time from the reducer so we can predictably match the results.
Date.prototype.valueOf = function () {return 1};

test('locationsReducer ADD_LOCATION and REMOVE_LOCATION', function (t) {
  let initialState = {};

  let addLocationAction = {
    type: 'ADD_LOCATION',
    locationId: 'locationId',
    data: {
      name: 'living room',
      icon: 'couch'
    }
  };

  let updateLocationAction = {
    type: 'UPDATE_LOCATION_CONFIG',
    locationId: 'locationId',
    data: {
      name: 'living room',
      icon: 'tv'
    }
  };

  let removeLocationAction = {
    type: 'REMOVE_LOCATION',
    locationId: 'locationId'
  };


  deepFreeze(initialState);
  deepFreeze(addLocationAction);
  deepFreeze(updateLocationAction);
  deepFreeze(removeLocationAction);
  
  let expectedReturn = {locationId: {config: { fingerprintParsed: '', fingerprintRaw: '', icon: 'couch', name: 'living room', updatedAt: 1}, presentUsers: []}};

  let stateWithLocation = locationsReducer({}, addLocationAction);
  deepFreeze(stateWithLocation);

  t.deepEqual(stateWithLocation, expectedReturn, 'add a location to a sphere');

  expectedReturn.locationId.config.icon = 'tv';
  t.deepEqual(locationsReducer(stateWithLocation, updateLocationAction), expectedReturn, 'update a location in a sphere');
  t.deepEqual(locationsReducer(stateWithLocation, removeLocationAction), {}, 'remove a location from a sphere');
  t.end();
});
