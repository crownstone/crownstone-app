import { eventBus } from "./util/EventBus";
import { NativeBus } from "./native/libInterface/NativeBus";


export const core : core = {
  background: {
    main                   : require('./images/backgrounds/mainBackgroundLight.jpg'),
    menu                   : require('./images/backgrounds/menuBackground.jpg'),
    mainRemoteNotConnected : require('./images/backgrounds/mainBackgroundLightNotConnected.jpg'),
    mainDarkLogo           : require('./images/backgrounds/backgroundWLogo.jpg'),
    mainDark               : require('./images/backgrounds/background.jpg'),
    light                  : require('./images/backgrounds/lightBackground2_blur.jpg'),
    lightBlur              : require('./images/backgrounds/lightBackground2_blur.jpg'),
    lightBlurLighter       : require('./images/backgrounds/lightBackground2_blur_lighter.jpg'),
    lightBlurBW            : require('./images/backgrounds/lightBackground2_blur_bw.jpg'),
    detailsDark            : require('./images/backgrounds/darkBackground4.jpg'),
  },
  eventBus: eventBus,
  nativeBus: NativeBus,
  store: { getState: () => { return {}; } },
};

