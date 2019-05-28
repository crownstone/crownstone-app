import { Navigation } from "react-native-navigation";
import { Languages } from "../Languages";
import { colors } from "../views/styles";

export const Stacks = {

  initial: function() {
    return {
      component: {
        name: "Initializer"
      },
    }
  },

  aiStart: function(props) {
    return {
      stack: {
        children: [
          { component: {name: "AiStart", passProps: props} },
        ],
      },
    }
  },

  tutorial: function() {
    return {
      stack: {
        children: [
          { component: {name: "Tutorial"} },
        ],
      },
    }
  },

  newUser: function() {
    return {
      stack: {
        children: [
          { component: {name: "LoginSplash"} },
        ],
        options: {
          topBar: { visible: false }
        }
      },
    }
  },

  loggedIn: function() {
    return {
      bottomTabs: {
        children: [
          {
            stack: {
              children: [
                { component: {name: "SphereOverview"} },
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
                  text:  Languages.get("Tabs","Messages")(),
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
                  text:  Languages.get("Tabs","Settings")(),
                  icon: require('../images/icons/cog.png'),
                }
              }
            }
          },
        ]
      }
    }
  },

  logout: function() {
    return {
      component: {
        name: "Logout"
      }
    }
  },
}