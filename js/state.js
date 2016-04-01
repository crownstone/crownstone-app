export let state = {
  user: {
    name: 'alex@dobots.nl',
    token: undefined,
    picture: false // or URL
  },
  groups: {
    groupId: {
      config: {
        name: 'Home',
        latitude: 'coord',
        longitude: 'coord',
      },
      presets:[{
          name: 'romantic',
          icon:'icon',
          states: {stoneId: {state:0.4}}
      }],
      locations: {
        'locationID':{
          config: {
            name: 'Living Room',
            icon: 'easel',
          },
          presentUsers:[],
          picture: {
            fullURI: 'images/mediaRoom.png',
            barURI: './images/mediaRoom.png',
            squareURI: './images/mediaRoom.png',
          },
          stones: {
            'stoneID': {
              config: {
                name: 'Ceiling Light',
                icon: 'lightbulb',
                dimming: true
              },
              state: {
                state: 1.0,
                currentUsage: 80,
              },
              behaviour: {
                onHomeEnter: {},
                onHomeExit: {},
                onRoomEnter: {},
                onRoomExit: {},
                config: {
                  onlyOnAtDusk: true,
                  onlyOffWhenEmpty: true
                }
              },
              linkedDevices: {onOn: {}, onOff: {}},
              schedule: {},
              statistics: {},  // statistics per device
            }
          }
        }
      }
    }
  },
  settings:{
    complexity:{
      presets: false, statistics: false, onHomeEnterExit: true, linkedDevices: true
    },
  },
  app:{
    activeGroup: 'groupId'
  }

};
