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
        name: "RockstartDemo",
        uuid: "ddb79713-87ca-4044-84f0-e87072db8106", // ibeacon uuid
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
            fingerprintRaw: undefined,
            fingerprintParsed: undefined,
            updatedAt: 1465835364017
          },
          presentUsers:[]
        },
        locationId_B: {
          config: {
            name:'Garage',
            icon:'ios-construct',
            fingerprintRaw: undefined,
            fingerprintParsed: undefined,
            updatedAt: 1465835364017
          },
          presentUsers:[]
        },
        locationId_C: {
          config: {
            name:'Bathroom',
            icon:'ios-nuclear',
            fingerprintRaw: undefined,
            fingerprintParsed: undefined,
            updatedAt: 1465835364017
          },
          presentUsers:[]
        },
        locationId_D: {
          config: {
            name:'Living Room',
            icon:'ios-body',
            fingerprintRaw: undefined,
            fingerprintParsed: undefined,
            updatedAt: 1465835364017
          },
          presentUsers:[]
        }
      },
      stones:    {
        5: {
          config: {
            name: 'Smart Socket #1',
            applianceId: 'applianceId_A',
            locationId: 'locationId_A',
            macAddress: 'E3:F5:C5:FF:23:40',
            iBeaconMajor: 5,
            iBeaconMinor: 5,
            uuid: "62DDC9A0-3E33-AC3C-4D5B-46EB4B2EE6CB",
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
              active: false,  // if not active the crownstone will not react to the event.
              updatedAt: 1465835364017
            },
            onHomeExit:  {
              state:    0,  // [0 .. 1] for state, undefined for ignore
              delay:    10,  // delay in seconds
              fadeTime: 0,  // delay in seconds
              active: false,  // if not active the crownstone will not react to the event.
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
        3: {
          config: {
            name: 'Smart Socket #2',
            applianceId: 'applianceId_B',
            locationId: 'locationId_B',
            macAddress: 'E5:20:4D:1D:CD:6C',
            iBeaconMajor: 3,
            iBeaconMinor: 3,
            uuid: "2E32A7E2-91B9-ACDC-A893-F26A7D1AAEF8",
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
              active: false,  // if not active the crownstone will not react to the event.
              updatedAt: 1465835364017
            },
            onHomeExit:  {
              state:    0,  // [0 .. 1] for state, undefined for ignore
              delay:    10,  // delay in seconds
              fadeTime: 0,  // delay in seconds
              active: false,  // if not active the crownstone will not react to the event.
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
        1: {
          config: {
            name: 'Smart Socket #3',
            applianceId: 'applianceId_C',
            locationId: 'locationId_C',
            macAddress: 'C67606B1-9FCD-DAC8-FE7C-DE010A1C5F16',
            iBeaconMajor: 4,
            iBeaconMinor: 3,
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
              active: false,  // if not active the crownstone will not react to the event.
              updatedAt: 1465835364017
            },
            onHomeExit:  {
              state:    0,  // [0 .. 1] for state, undefined for ignore
              delay:    10,  // delay in seconds
              fadeTime: 0,  // delay in seconds
              active: false,  // if not active the crownstone will not react to the event.
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
        2: {
          config: {
            name: 'Smart Socket #4',
            applianceId: 'applianceId_D',
            locationId: 'locationId_D',
            macAddress: 'FB:8D:71:D5:6B:C1',
            iBeaconMajor: 2,
            iBeaconMinor: 2,
            uuid: "B1E5B8DF-6DA9-49A8-CD64-1D61413C4F95",
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
              active: false,  // if not active the crownstone will not react to the event.
              updatedAt: 1465835364017
            },
            onHomeExit:  {
              state:    0,  // [0 .. 1] for state, undefined for ignore
              delay:    10,  // delay in seconds
              fadeTime: 0,  // delay in seconds
              active: false,  // if not active the crownstone will not react to the event.
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
            name: 'Grill',
            icon: 'ios-pizza',
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
              active: false,  // if not active the crownstone will not react to the event.
              updatedAt: 1465835364017
            },
            onHomeExit:  {
              state:    0,  // [0 .. 1] for state, undefined for ignore
              delay:    10,  // delay in seconds
              fadeTime: 0,  // delay in seconds
              active: false,  // if not active the crownstone will not react to the event.
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
              active: false,  // if not active the crownstone will not react to the event.
              updatedAt: 1465835364017
            },
            onHomeExit:  {
              state:    0,  // [0 .. 1] for state, undefined for ignore
              delay:    10,  // delay in seconds
              fadeTime: 0,  // delay in seconds
              active: false,  // if not active the crownstone will not react to the event.
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
              active: false,  // if not active the crownstone will not react to the event.
              updatedAt: 1465835364017
            },
            onHomeExit:  {
              state:    0,  // [0 .. 1] for state, undefined for ignore
              delay:    10,  // delay in seconds
              fadeTime: 0,  // delay in seconds
              active: false,  // if not active the crownstone will not react to the event.
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
              active: false,  // if not active the crownstone will not react to the event.
              updatedAt: 1465835364017
            },
            onHomeExit:  {
              state:    0,  // [0 .. 1] for state, undefined for ignore
              delay:    10,  // delay in seconds
              fadeTime: 0,  // delay in seconds
              active: false,  // if not active the crownstone will not react to the event.
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