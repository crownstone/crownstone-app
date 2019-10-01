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
    //       { component: {name: "DeviceSmartBehaviour", passProps: {stoneId: "fa135188-6f74-767c-63eb-38315ee6475d", sphereId: "c1e653ba-6755-5402-71d7-d9b0172f502a"}} },
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
                { component: {name: "DeviceOverview", passProps: {sphereId: "c1e653ba-6755-5402-71d7-d9b0172f502a", stoneId: "c06fab96-ab03-9e01-7f94-c8cc6104d3b"}} },
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