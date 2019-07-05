import { Navigation } from "react-native-navigation";
import { Views } from "./Views";
import SplashScreen from "react-native-splash-screen";
import { Platform } from "react-native";
import { Stacks } from "./Stacks";
import { colors } from "../views/styles"
import {
  TopbarButton,
  TopbarEmptyButton,
  TopbarLeftButtonNav,
  TopbarRightMoreButton
} from "../views/components/topbar/TopbarButton";
import { CancelButton } from "../views/components/topbar/CancelButton";
import { OverlayManager } from "../backgroundProcesses/OverlayManager";

let viewsLoaded = false;

export const loadRoutes = function() {
  if (viewsLoaded) { return; }
  viewsLoaded = true;


  // register all views
  Object.keys(Views).forEach((viewId) => {
    Navigation.registerComponent(viewId,    () => Views[viewId]);
  })

  // register all custom components used by the navigator:
  Navigation.registerComponent("topbarCancelButton",       () => CancelButton);
  Navigation.registerComponent("topbarLeftButton",         () => TopbarLeftButtonNav);
  Navigation.registerComponent("topbarRightMoreButton",    () => TopbarRightMoreButton);
  Navigation.registerComponent("topbarButton",             () => TopbarButton);
  Navigation.registerComponent("topbarEmptyButton",        () => TopbarEmptyButton);

  OverlayManager.init();
};

Navigation.events().registerAppLaunchedListener(() => {
  if (Platform.OS === 'ios') {
    SplashScreen.hide();
  }

  let defaultOptions = {
    topBar: {
      background: { color: colors.csBlueDarker.hex },
      title: {
        color: colors.white.hex,
        fontFamily: Platform.OS === 'ios' ? ".SFUIDisplay-Bold" : undefined,
      },
    },
    bottomTabs: {
      backgroundColor: colors.csBlueDarker.hex,
    },
    bottomTab: {
      textColor: colors.white.hex,
      selectedTextColor: colors.menuTextSelected.hex,
      fontSize: 11,
      iconColor: colors.white.hex,
      selectedIconColor: colors.menuTextSelected.hex,
    }
  };

  if (Platform.OS === 'android') {
    defaultOptions.topBar["leftButtonColor"]  = "#fff";
    defaultOptions.topBar["rightButtonColor"] = "#fff";
    defaultOptions.topBar["backButton"]       = { color: "#fff" };
  }

  Navigation.setDefaultOptions(defaultOptions);

  Navigation.setRoot({
    root: Stacks.initial()
  });

  // overwrite for Icon Debug view
  // Navigation.setRoot({
  //   root: {
  //     component: {
  //       name: 'IconDebug'
  //     }
  //   }
  // });
  // Navigation.registerComponent("IconDebug",        () => IconDebug);
});