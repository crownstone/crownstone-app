
// these actions will be loaded into the store before the app is running to set the initial state.
export default [
  {
    type: 'ADD_GROUP',
    data: {name: 'Home'},
    groupId: 'Home'
  },
  {
    type: 'ADD_LOCATION',
    groupId: 'Home',
    locationId: 'locationId',
    data: {
      name: 'Living Room',
      icon: 'bluetooth'
    }
  },
  {
    type: 'ADD_STONE',
    groupId: 'Home',
    locationId: 'locationId',
    stoneId: 'stoneId',
    data: {
      name:'Ceiling Light',
      icon:'bluetooth'
    }
  },
  {
    type: 'ADD_STONE',
    groupId: 'Home',
    locationId: 'locationId',
    stoneId: 'stoneId2',
    data: {
      name:'TV',
      icon:'bluetooth'
    }
  },
  {
    type: 'ADD_STONE',
    groupId: 'Home',
    locationId: 'locationId',
    stoneId: 'stoneId3',
    data: {
      name:'Reading Light',
      icon:'bluetooth'
    }
  },
  {
    type: 'ADD_STONE',
    groupId: 'Home',
    locationId: 'locationId',
    stoneId: 'stoneId4',
    data: {
      name:'Playstation',
      icon:'bluetooth'
    }
  },
  {
    type: 'UPDATE_STONE_STATE',
    groupId: 'Home',
    locationId: 'locationId',
    stoneId: 'stoneId4',
    data: {
      state:0
    }
  },

];