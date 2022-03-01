import { Languages } from "../Languages";

export const Stacks = {

  initial: function() : StackData {
    return {
      component: {
        name: "Initializer"
      },
    }
  },

  aiStart: function(props) : StackData {
    return {
      stack: {
        children: [
          { component: {name: "AiStart", passProps: props} },
        ],
      },
    }
  },

  tutorial: function() : StackData {
    return {
      stack: {
        children: [
          { component: {name: "Tutorial"} },
        ],
      },
    }
  },

  newUser: function() : StackData {
    return {
      stack: {
        children: [
          { component: {name: "LoginSplash"} },
        ],
        options: {
          topBar: { visible: false, height:0 }
        }
      },
    }
  },


  permissions: function(props = {}): StackData {
    return {
      component: { name: "PermissionIntroduction", passProps: props },
    }
  },

  loggedIn: function() : StackData {
    // return {
    //   bottomTabs: {
    //     id: 'bottomTabs',
    //     children: [
    //       {
    //         stack: {
    //           children: [
    //             // { component: {name: "SettingsApp"} },
    //             // { component: {name: "SetupHub"} },
    //             { component: {name: "HubOverview", passProps: {"sphereId": "1e35534b-73ef-3695-df55-db27218dcb98", "stoneId": "5fc654eae2b8ba0004e3f5b3",} }},
    //           ],
    //           options: {
    //             bottomTab: {
    //               text: Languages.get("Tabs","Overview")(),
    //               icon: require('../../assets/images/icons/house.png'),
    //             }
    //           }
    //         }
    //       },
    //       {
    //         stack: {
    //           children: [
    //             { component: {name: "SettingsOverview"} },
    //           ],
    //           options: {
    //             bottomTab: {
    //               text: Languages.get("Tabs","Settings")(),
    //               icon: require('../../assets/images/icons/cog.png'),
    //             }
    //           }
    //         }
    //       },
    //     ]
    //   }
    // }

    return {
      bottomTabs: {
        id: 'bottomTabs',
        children: [
          {
            stack: {
              children: [
                // { component: {name: "SettingsApp"} },
                { component: {name: "SphereOverview"} },
                // { component: {name: "DeviceOverview", passProps: {sphereId: "18232301-e0f1-eb16-1de3-73a837d0ceb7", stoneId: "2517a0f9-c1f-79d2-7462-5708dd1d2cf0"}} },
              ],
              options: {
                bottomTab: {
                  id: 'bottomTab_overview',
                  testID: 'bottomTab_overview',
                  text: Languages.get("Tabs","Overview")(),
                  icon: require('../../assets/images/icons/house.png'),
                }
              }
            }
          },
          {
            stack: {
              children: [
                { component: {name: "ScenesOverview"} },
              ],
              options: {
                bottomTab: {
                  id: 'bottomTab_scenes',
                  testID: 'bottomTab_scenes',
                  text: Languages.get("Tabs","Scenes")(),
                  icon: require('../../assets/images/icons/scenes.png'),
                }
              }
            }
          },
          {
            stack: {
              children: [
                { component: {name: "MessageInbox"} },
              ],
              options: {
                bottomTab: {
                  id: 'bottomTab_messages',
                  testID: 'bottomTab_messages',
                  text: Languages.get("Tabs","Messages")(),
                  icon: require('../../assets/images/icons/mail.png'),
                }
              }
            }
          },
          {
            stack: {
              children: [
                { component: {name: "SettingsOverview"} },
              ],
              options: {
                bottomTab: {
                  id: 'bottomTab_settings',
                  testID: 'bottomTab_settings',
                  text: Languages.get("Tabs","Settings")(),
                  icon: require('../../assets/images/icons/cog.png'),
                }
              }
            }
          },
        ]
      }
    }
  },

  logout: function() : StackData {
    return {
      component: {
        name: "Logout"
      }
    }
  },




  ///// DEV APP
  DEV_searchingForCrownstones: function() : StackData {
    return {
      bottomTabs: {
        id: 'bottomTabs',
        children: [
          {
            stack: {
              children: [
                { component: {name: "DEV_StoneSelector"} },
              ],
              options: {
                bottomTab: {
                  text: "Select",
                  icon: require('../../assets/images/icons/searching.png'),
                }
              }
            }
          },
          {
            stack: {
              children: [
                { component: {name: "DEV_PresenceMocking"} },
              ],
              options: {
                bottomTab: {
                  text: "Presence Mocking",
                  icon: require('../../assets/images/icons/monkey.png'),
                }
              }
            }
          },
          {
            stack: {
              children: [
                { component: {name: "DEV_UserData"} },
              ],
              options: {
                bottomTab: {
                  text: "User Settings",
                  icon: require('../../assets/images/icons/user.png'),
                }
              }
            }
          },
        ]
      }
    }
  },

  DEV_firmwareTesting: function(props) : StackData {
    return {
      bottomTabs: {
        id: 'bottomTabs',
        children: [
          {
            stack: {
              children: [
                { component: {name: "DEV_FirmwareTest", passProps: props} },
              ],
              options: {
                bottomTab: {
                  text: "Operations",
                  icon: require('../../assets/images/icons/switches.png'),
                }
              }
            }
          },
          {
            stack: {
              children: [
                { component: {name: "DEV_AdvancedConfig", passProps: props} },
              ],
              options: {
                bottomTab: {
                  text: "Advanced",
                  icon: require('../../assets/images/icons/cog.png'),
                }
              }
            }
          },
          {
            stack: {
              children: [
                { component: {name: "DEV_RawAdvertisements", passProps: props} },
              ],
              options: {
                bottomTab: {
                  text: "Advertisments",
                  icon: require('../../assets/images/icons/mail.png'),
                }
              }
            }
          },
          {
            stack: {
              children: [
                { component: {name: "DEV_DFU", passProps: props} },
              ],
              options: {
                bottomTab: {
                  text: "DFU",
                  icon: require('../../assets/images/icons/dfu.png'),
                }
              }
            }
          },
          {
            stack: {
              children: [
                { component: {name: "DEV_UserData"} },
              ],
              options: {
                bottomTab: {
                  text: "User Settings",
                  icon: require('../../assets/images/icons/user.png'),
                }
              }
            }
          },
        ]
      }
    }
  },
}