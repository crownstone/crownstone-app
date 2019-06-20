import { eventBus } from "./util/EventBus";
import { NativeBus } from "./native/libInterface/NativeBus";

export const core : core = {
  background: {
    main                   : require('./images/backgrounds/mainBackgroundLight.png'),
    menu                   : require('./images/backgrounds/menuBackground.png'),
    mainRemoteNotConnected : require('./images/backgrounds/mainBackgroundLightNotConnected.png'),
    mainDarkLogo           : require('./images/backgrounds/backgroundWLogo.png'),
    mainDark               : require('./images/backgrounds/background.png'),
    light                  : require('./images/backgrounds/lightBackground2.png'),
    detailsDark            : require('./images/backgrounds/darkBackground4.png'),
  },
  eventBus: eventBus,
  nativeBus: NativeBus,
  store: {},
  sessionMemory: {
    loginEmail: null,
    cameraSide: 'front',
    cacheBusterUniqueElement: Math.random(),
    developmentEnvironment: false,
  },
};