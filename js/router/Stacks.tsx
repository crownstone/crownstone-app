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
    //       { component: {name: "DeviceSmartBehaviour", passProps: { sphereId: "70498f0b-efa0-c11b-1dec-1f34d1c9e64f", stoneId: "a1421d1e-937d-6fe-1f2-e5f72122311c"}} },
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
                { component: {name: "SphereOverview"} },
                // { component: {name: "DeviceOverview", passProps: {sphereId: "70498f0b-efa0-c11b-1dec-1f34d1c9e64f", stoneId: "a1421d1e-937d-6fe-1f2-e5f72122311c"}} },
              ],
              options: {
                bottomTab: {
                  text: Languages.get("Tabs","Overview")(),
                  icon: require('../images/icons/overview.png'),
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
}