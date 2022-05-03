import { Languages } from "../Languages";
import { colors } from "./styles";

export const Stacks = {

  initial: function() : StackData {
    return {
      component: {
        name: "Initializer"
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
    return {
      bottomTabs: {
        id: 'bottomTabs',
        children: [
          {
            stack: {
              children: [
                {
                  component: {
                    id: 'SphereOverview',
                    name: "SphereOverview"
                  }
                },
              ],
              options: {
                topBar: { visible: false, drawBehind: true },
                bottomTab: {
                  id: 'bottomTab_overview',
                  testID: 'bottomTab_overview',
                  text: Languages.get("Tabs", "Overview")(),
                  icon: require('../../assets/images/icons/house.png'),
                },
                sideMenu: {
                  left: {
                    enabled: false,
                    visible: false,
                  },
                },
              }
            }
          },
          {
            stack: {
              children: [
                { component: {id: 'ScenesOverview', name: "ScenesOverview"} },
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
                { component: {id: 'MessageInbox',name: "MessageInbox"} },
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
                { component: {id: 'SettingsOverview',name: "SettingsOverview"} },
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
