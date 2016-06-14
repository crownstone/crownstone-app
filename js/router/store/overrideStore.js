export const fakeStore = {
  user: {
    firstName: 'Anne',
    lastName: 'van Rossum',
    email: 'anne@crownstone.rocks',
    accessToken: 12345,
    userId: 'memberId',
    picture: null,
    updatedAt: 1465835364017
  },
  groups: {
    groupId: {
      config: {
        name: undefined,
        uuid: undefined, // ibeacon uuid
        adminKey: 1234,
        memberKey: 1234,
        guestKey: 1234,
        updatedAt: 1465835364017
      },
      members: {
        memberId: {
          firstName: 'Anne',
          lastName: 'van Rossum',
          picture: null,
          accessLevel: 'admin',
          updatedAt: 1465835364017
        }
      },
      presets: [],
      locations: {
        locationId_A: {
          config: {
            name:'Kitchen',
            icon:'ios-restaurant',
            updatedAt: 1465835364017
          },
          presentUsers:[]
        },
        locationId_B: {
          config: {
            name:'Garage',
            icon:'ios-construct',
            updatedAt: 1465835364017
          },
          presentUsers:[]
        },
        locationId_C: {
          config: {
            name:'Bathroom',
            icon:'ios-nuclear',
            updatedAt: 1465835364017
          },
          presentUsers:[]
        },
        locationId_D: {
          config: {
            name:'Living Room',
            icon:'ios-body',
            updatedAt: 1465835364017
          },
          presentUsers:['memberId']
        }
      },
      stones:    {
        stoneId_A: {
          config: {
            name: 'Smart Socket #1',
            applianceId: 'applianceId_A',
            locationId: 'locationId_A',
            macAddress: 'test',
            iBeaconMajor: 12,
            iBeaconMinor: 12,
            initializedSuccessfully: true,
            updatedAt: 1465835364017
          },
          state: {
            state: 1.0,
            currentUsage: 2000,
            updatedAt: 1465835364017
          },
          schedule: { // this schedule will be overruled by the appliance if applianceId is not undefined.
            updatedAt: 1465835364017
          },
          behaviour: { // this behaviour will be overruled by the appliance if applianceId is not undefined.
            onHomeEnter: {
              state:    1,  // [0 .. 1] for state, undefined for ignore
              delay:    0,  // delay in seconds
              fadeTime: 0,  // delay in seconds
              active: true,  // if not active the crownstone will not react to the event.
              updatedAt: 1465835364017
            },
            onHomeExit:  {
              state:    0,  // [0 .. 1] for state, undefined for ignore
              delay:    10,  // delay in seconds
              fadeTime: 0,  // delay in seconds
              active: true,  // if not active the crownstone will not react to the event.
              updatedAt: 1465835364017
            },
            onRoomEnter: {
              state:    1,  // [0 .. 1] for state, undefined for ignore
              delay:    0,  // delay in seconds
              fadeTime: 0,  // delay in seconds
              active: true,  // if not active the crownstone will not react to the event.
              updatedAt: 1465835364017
            },
            onRoomExit:  {
              state:    0,  // [0 .. 1] for state, undefined for ignore
              delay:    2,  // delay in seconds
              fadeTime: 0,  // delay in seconds
              active: true,  // if not active the crownstone will not react to the event.
              updatedAt: 1465835364017
            }
          }
        },
        stoneId_B: {
          config: {
            name: 'Smart Socket #2',
            applianceId: 'applianceId_B',
            locationId: 'locationId_B',
            macAddress: 'test',
            iBeaconMajor: 12,
            iBeaconMinor: 12,
            initializedSuccessfully: true,
            updatedAt: 1465835364017
          },
          state: {
            state: 1.0,
            currentUsage: 294,
            updatedAt: 1465835364017
          },
          schedule: { // this schedule will be overruled by the appliance if applianceId is not undefined.
            updatedAt: 1465835364017
          },
          behaviour: { // this behaviour will be overruled by the appliance if applianceId is not undefined.
            onHomeEnter: {
              state:    1,  // [0 .. 1] for state, undefined for ignore
              delay:    0,  // delay in seconds
              fadeTime: 0,  // delay in seconds
              active: true,  // if not active the crownstone will not react to the event.
              updatedAt: 1465835364017
            },
            onHomeExit:  {
              state:    0,  // [0 .. 1] for state, undefined for ignore
              delay:    10,  // delay in seconds
              fadeTime: 0,  // delay in seconds
              active: true,  // if not active the crownstone will not react to the event.
              updatedAt: 1465835364017
            },
            onRoomEnter: {
              state:    1,  // [0 .. 1] for state, undefined for ignore
              delay:    0,  // delay in seconds
              fadeTime: 0,  // delay in seconds
              active: true,  // if not active the crownstone will not react to the event.
              updatedAt: 1465835364017
            },
            onRoomExit:  {
              state:    0,  // [0 .. 1] for state, undefined for ignore
              delay:    2,  // delay in seconds
              fadeTime: 0,  // delay in seconds
              active: true,  // if not active the crownstone will not react to the event.
              updatedAt: 1465835364017
            }
          }
        },
        stoneId_C: {
          config: {
            name: 'Smart Socket #3',
            applianceId: 'applianceId_C',
            locationId: 'locationId_C',
            macAddress: 'test',
            iBeaconMajor: 12,
            iBeaconMinor: 12,
            initializedSuccessfully: true,
            updatedAt: 1465835364017
          },
          state: {
            state: 1.0,
            currentUsage: 45,
            updatedAt: 1465835364017
          },
          schedule: { // this schedule will be overruled by the appliance if applianceId is not undefined.
            updatedAt: 1465835364017
          },
          behaviour: { // this behaviour will be overruled by the appliance if applianceId is not undefined.
            onHomeEnter: {
              state:    1,  // [0 .. 1] for state, undefined for ignore
              delay:    0,  // delay in seconds
              fadeTime: 0,  // delay in seconds
              active: true,  // if not active the crownstone will not react to the event.
              updatedAt: 1465835364017
            },
            onHomeExit:  {
              state:    0,  // [0 .. 1] for state, undefined for ignore
              delay:    10,  // delay in seconds
              fadeTime: 0,  // delay in seconds
              active: true,  // if not active the crownstone will not react to the event.
              updatedAt: 1465835364017
            },
            onRoomEnter: {
              state:    1,  // [0 .. 1] for state, undefined for ignore
              delay:    0,  // delay in seconds
              fadeTime: 0,  // delay in seconds
              active: true,  // if not active the crownstone will not react to the event.
              updatedAt: 1465835364017
            },
            onRoomExit:  {
              state:    0,  // [0 .. 1] for state, undefined for ignore
              delay:    2,  // delay in seconds
              fadeTime: 0,  // delay in seconds
              active: true,  // if not active the crownstone will not react to the event.
              updatedAt: 1465835364017
            }
          }
        },
        stoneId_D: {
          config: {
            name: 'Smart Socket #4',
            applianceId: 'applianceId_D',
            locationId: 'locationId_D',
            macAddress: 'test',
            iBeaconMajor: 12,
            iBeaconMinor: 12,
            initializedSuccessfully: true,
            updatedAt: 1465835364017
          },
          state: {
            state: 1.0,
            currentUsage: 27,
            updatedAt: 1465835364017
          },
          schedule: { // this schedule will be overruled by the appliance if applianceId is not undefined.
            updatedAt: 1465835364017
          },
          behaviour: { // this behaviour will be overruled by the appliance if applianceId is not undefined.
            onHomeEnter: {
              state:    1,  // [0 .. 1] for state, undefined for ignore
              delay:    0,  // delay in seconds
              fadeTime: 0,  // delay in seconds
              active: true,  // if not active the crownstone will not react to the event.
              updatedAt: 1465835364017
            },
            onHomeExit:  {
              state:    0,  // [0 .. 1] for state, undefined for ignore
              delay:    10,  // delay in seconds
              fadeTime: 0,  // delay in seconds
              active: true,  // if not active the crownstone will not react to the event.
              updatedAt: 1465835364017
            },
            onRoomEnter: {
              state:    1,  // [0 .. 1] for state, undefined for ignore
              delay:    0,  // delay in seconds
              fadeTime: 0,  // delay in seconds
              active: true,  // if not active the crownstone will not react to the event.
              updatedAt: 1465835364017
            },
            onRoomExit:  {
              state:    0,  // [0 .. 1] for state, undefined for ignore
              delay:    2,  // delay in seconds
              fadeTime: 0,  // delay in seconds
              active: true,  // if not active the crownstone will not react to the event.
              updatedAt: 1465835364017
            }
          }
        },
      },
      appliances: {
        applianceId_A: {
          config: {
            name: 'Senseo',
            icon: 'ios-cafe',
            dimmable: false,
            updatedAt: 1465835364017
          },
          linkedAppliances: {
            onOn:  {},
            onOff: {},
            updatedAt: 1465835364017
          },
          schedule: { // this schedule will be overruled by the appliance if applianceId is not undefined.
            updatedAt: 1465835364017
          },
          behaviour: { // this behaviour will be overruled by the appliance if applianceId is not undefined.
            onHomeEnter: {
              state:    1,  // [0 .. 1] for state, undefined for ignore
              delay:    0,  // delay in seconds
              fadeTime: 0,  // delay in seconds
              active: true,  // if not active the crownstone will not react to the event.
              updatedAt: 1465835364017
            },
            onHomeExit:  {
              state:    0,  // [0 .. 1] for state, undefined for ignore
              delay:    10,  // delay in seconds
              fadeTime: 0,  // delay in seconds
              active: true,  // if not active the crownstone will not react to the event.
              updatedAt: 1465835364017
            },
            onRoomEnter: {
              state:    1,  // [0 .. 1] for state, undefined for ignore
              delay:    0,  // delay in seconds
              fadeTime: 0,  // delay in seconds
              active: true,  // if not active the crownstone will not react to the event.
              updatedAt: 1465835364017
            },
            onRoomExit:  {
              state:    0,  // [0 .. 1] for state, undefined for ignore
              delay:    2,  // delay in seconds
              fadeTime: 0,  // delay in seconds
              active: true,  // if not active the crownstone will not react to the event.
              updatedAt: 1465835364017
            }
          },
        },
        applianceId_B: {
          config: {
            name: 'Power Drill',
            icon: 'ios-hammer',
            dimmable: false,
            updatedAt: 1465835364017
          },
          linkedAppliances: {
            onOn:  {},
            onOff: {},
            updatedAt: 1465835364017
          },
          schedule: { // this schedule will be overruled by the appliance if applianceId is not undefined.
            updatedAt: 1465835364017
          },
          behaviour: { // this behaviour will be overruled by the appliance if applianceId is not undefined.
            onHomeEnter: {
              state:    1,  // [0 .. 1] for state, undefined for ignore
              delay:    0,  // delay in seconds
              fadeTime: 0,  // delay in seconds
              active: true,  // if not active the crownstone will not react to the event.
              updatedAt: 1465835364017
            },
            onHomeExit:  {
              state:    0,  // [0 .. 1] for state, undefined for ignore
              delay:    10,  // delay in seconds
              fadeTime: 0,  // delay in seconds
              active: true,  // if not active the crownstone will not react to the event.
              updatedAt: 1465835364017
            },
            onRoomEnter: {
              state:    1,  // [0 .. 1] for state, undefined for ignore
              delay:    0,  // delay in seconds
              fadeTime: 0,  // delay in seconds
              active: true,  // if not active the crownstone will not react to the event.
              updatedAt: 1465835364017
            },
            onRoomExit:  {
              state:    0,  // [0 .. 1] for state, undefined for ignore
              delay:    2,  // delay in seconds
              fadeTime: 0,  // delay in seconds
              active: true,  // if not active the crownstone will not react to the event.
              updatedAt: 1465835364017
            }
          },
        },
        applianceId_C: {
          config: {
            name: 'Curling Iron',
            icon: 'ios-bowtie',
            dimmable: false,
            updatedAt: 1465835364017
          },
          linkedAppliances: {
            onOn:  {},
            onOff: {},
            updatedAt: 1465835364017
          },
          schedule: { // this schedule will be overruled by the appliance if applianceId is not undefined.
            updatedAt: 1465835364017
          },
          behaviour: { // this behaviour will be overruled by the appliance if applianceId is not undefined.
            onHomeEnter: {
              state:    1,  // [0 .. 1] for state, undefined for ignore
              delay:    0,  // delay in seconds
              fadeTime: 0,  // delay in seconds
              active: true,  // if not active the crownstone will not react to the event.
              updatedAt: 1465835364017
            },
            onHomeExit:  {
              state:    0,  // [0 .. 1] for state, undefined for ignore
              delay:    10,  // delay in seconds
              fadeTime: 0,  // delay in seconds
              active: true,  // if not active the crownstone will not react to the event.
              updatedAt: 1465835364017
            },
            onRoomEnter: {
              state:    1,  // [0 .. 1] for state, undefined for ignore
              delay:    0,  // delay in seconds
              fadeTime: 0,  // delay in seconds
              active: true,  // if not active the crownstone will not react to the event.
              updatedAt: 1465835364017
            },
            onRoomExit:  {
              state:    0,  // [0 .. 1] for state, undefined for ignore
              delay:    2,  // delay in seconds
              fadeTime: 0,  // delay in seconds
              active: true,  // if not active the crownstone will not react to the event.
              updatedAt: 1465835364017
            }
          },
        },
        applianceId_D: {
          config: {
            name: 'Reading Light',
            icon: 'ios-bulb',
            dimmable: false,
            updatedAt: 1465835364017
          },
          linkedAppliances: {
            onOn:  {},
            onOff: {},
            updatedAt: 1465835364017
          },
          schedule: { // this schedule will be overruled by the appliance if applianceId is not undefined.
            updatedAt: 1465835364017
          },
          behaviour: { // this behaviour will be overruled by the appliance if applianceId is not undefined.
            onHomeEnter: {
              state:    1,  // [0 .. 1] for state, undefined for ignore
              delay:    0,  // delay in seconds
              fadeTime: 0,  // delay in seconds
              active: true,  // if not active the crownstone will not react to the event.
              updatedAt: 1465835364017
            },
            onHomeExit:  {
              state:    0,  // [0 .. 1] for state, undefined for ignore
              delay:    10,  // delay in seconds
              fadeTime: 0,  // delay in seconds
              active: true,  // if not active the crownstone will not react to the event.
              updatedAt: 1465835364017
            },
            onRoomEnter: {
              state:    1,  // [0 .. 1] for state, undefined for ignore
              delay:    0,  // delay in seconds
              fadeTime: 0,  // delay in seconds
              active: true,  // if not active the crownstone will not react to the event.
              updatedAt: 1465835364017
            },
            onRoomExit:  {
              state:    0,  // [0 .. 1] for state, undefined for ignore
              delay:    2,  // delay in seconds
              fadeTime: 0,  // delay in seconds
              active: true,  // if not active the crownstone will not react to the event.
              updatedAt: 1465835364017
            }
          },
        }
      }
    }
  },
  settings: {
    presets: false,
    statistics: false,
    onHomeEnterExit: true,
    presenceWithoutDevices: false,
    linkedDevices: true,
    updatedAt: 1465835364025
  },
  app: {
    activeGroup: 'groupId',
    doFirstTimeSetup: true,
    updatedAt: 1465835364025
  }
};