import { eventBus } from "./util/EventBus";
import { NativeBus } from "./native/libInterface/NativeBus";

function getBackground(type, remotely) {
  let backgroundImage;
  switch (type) {
    case "menu":
      backgroundImage = core.background.menu;
      if (remotely === true) {
        backgroundImage = core.background.menuRemoteNotConnected;
      }
      break;
    case "dark":
      backgroundImage = core.background.main;
      if (remotely === true) {
        backgroundImage = core.background.mainRemoteNotConnected;
      }
      break;
    default:
      backgroundImage = core.background.main;
      if (remotely === true) {
        backgroundImage = core.background.mainRemoteNotConnected;
      }
      break;
  }

  return backgroundImage;
}


export const core : core = {
  background: {
    main                   : require('./images/mainBackgroundLight.png'),
    menu                   : require('./images/menuBackground.png'),
    mainRemoteNotConnected : require('./images/mainBackgroundLightNotConnected.png'),
    menuRemoteNotConnected : require('./images/menuBackgroundRemoteNotConnected.png'),
    mainDarkLogo           : require('./images/backgroundWLogo.png'),
    mainDark               : require('./images/background.png'),
    detailsDark            : require('./images/darkBackground.png'),
  },
  eventBus: eventBus,
  nativeBus: NativeBus,
  store: {},
  storeInitialized: false,
  sessionMemory: {
    loginEmail: null,
    cameraSide: 'front',
    cacheBusterUniqueElement: Math.random(),
    developmentEnvironment: false,
  },
};