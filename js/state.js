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
              schedule: [{
                enabled: true,
                range: true,
                startTime: 0,
                onStart: {
                  state:1,
                  fade:10
                },
                endTime: 0,
                onEnd: {
                  state:1,
                  fade:0
                },
                onDays:{Monday:0, Tuesday:0, Wednesday:0, Thursday:0, Friday:0, Saturday:0, Sunday:0},
                overruleBehaviour: true
              }],
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
