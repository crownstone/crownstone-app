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

  loggedIn: function() : StackData {
    // return {
    //   stack: {
    //     children: [
    //       { component: {name: "Ability_TapToToggleSettings", passProps: {sphereId: "61db334c-5aad-3cb1-d21e-8cec6c702cba", stoneId: "ebf9216b-9723-aa10-162f-8b6b836d1545"}} },
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
                // { component: {name: "SphereOverview"} },
                { component: {name: "DeviceOverview", passProps: {sphereId: "61db334c-5aad-3cb1-d21e-8cec6c702cba", stoneId: "ebf9216b-9723-aa10-162f-8b6b836d1545"}} },
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