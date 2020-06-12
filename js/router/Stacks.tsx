import { Languages } from "../Languages";
import { AicoreBehaviour } from "../views/deviceViews/smartBehaviour/supportCode/AicoreBehaviour";

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

  loggedIn: function() : StackData {
    // return {
    //   stack: {
    //     children: [
    //       { component: {
    //           name: "Ability_DimmerSettings", passProps:
    //             {
    //               stoneId: "eccd7d40-ba7a-e3aa-6c36-e221baee8519", sphereId: "f13f7c32-7a81-6822-f711-d872afe6624b"
    //             },
    //         }}
    //     ],
    //   },
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
                  text: Languages.get("Tabs","Overview")(),
                  icon: require('../images/icons/house.png'),
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
                  text: Languages.get("Tabs","Scenes")(),
                  icon: require('../images/icons/scenes.png'),
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
                  text: Languages.get("Tabs","Messages")(),
                  icon: require('../images/icons/mail.png'),
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
                  text: Languages.get("Tabs","Settings")(),
                  icon: require('../images/icons/cog.png'),
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
                  icon: require('../images/icons/searching.png'),
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
                  icon: require('../images/icons/monkey.png'),
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
                  icon: require('../images/icons/user.png'),
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
                  icon: require('../images/icons/switches.png'),
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
                  icon: require('../images/icons/cog.png'),
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
                  icon: require('../images/icons/mail.png'),
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
                  icon: require('../images/icons/dfu.png'),
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
                  icon: require('../images/icons/user.png'),
                }
              }
            }
          },
        ]
      }
    }
  },
}