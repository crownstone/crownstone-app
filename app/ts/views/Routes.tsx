import {Navigation, Options, OptionsModalPresentationStyle} from "react-native-navigation";
import {Views} from "./Views";
import {Platform} from "react-native";
import {Stacks} from "./Stacks";
import {colors} from "../views/styles";
import {
  TopbarButton,
  TopbarEmptyButton,
  TopbarLeftButtonNav,
  TopbarRightMoreButton
} from "../views/components/topbar/TopbarButton";
import {CancelButton} from "../views/components/topbar/CancelButton";
import {OverlayManager} from "../backgroundProcesses/OverlayManager";
import {NavigationUtil, topBarComponentNames} from "../util/NavigationUtil";
import React from "react";


let viewsLoaded = false;

export const loadRoutes = function() {
  if (viewsLoaded) { return; }
  viewsLoaded = true;


  // register all views
  Object.keys(Views).forEach((viewId) => {
    Navigation.registerComponent(viewId,    () => Views[viewId]);
  });

  // register all custom components used by the navigator:
  Navigation.registerComponent("topbarCancelButton",       () => CancelButton);
  Navigation.registerComponent("topbarLeftButton",         () => TopbarLeftButtonNav);
  Navigation.registerComponent("topbarRightMoreButton",    () => TopbarRightMoreButton);
  Navigation.registerComponent("topbarButton",             () => TopbarButton);
  Navigation.registerComponent("topbarEmptyButton",        () => TopbarEmptyButton);

  topBarComponentNames.push("topbarCancelButton");
  topBarComponentNames.push("topbarLeftButton");
  topBarComponentNames.push("topbarRightMoreButton");
  topBarComponentNames.push("topbarButton");
  topBarComponentNames.push("topbarEmptyButton");

  OverlayManager.init();
};

Navigation.events().registerAppLaunchedListener(() => {
  let defaultOptions : Options = {
    topBar: {
      background: { color: colors.csBlueDarker.hex },
      title: {
        color: colors.white.hex,
      },
    },
    bottomTabs: {
      titleDisplayMode: "alwaysShow",
      backgroundColor: colors.csBlueDarker.hex,
    },
    bottomTab: {
      textColor: colors.white.hex,
      selectedTextColor: colors.blue.hex,
      fontSize: 11,
      iconColor: colors.white.hex,
      selectedIconColor: colors.blue.hex,
    },
    layout: {
      orientation: ['portrait'],
    },
    modalPresentationStyle: Platform.OS === 'android' ? OptionsModalPresentationStyle.overCurrentContext : OptionsModalPresentationStyle.fullScreen
  };

  if (Platform.OS === 'android') {
    defaultOptions.topBar["leftButtonColor"]  = "#fff";
    defaultOptions.topBar["rightButtonColor"] = "#fff";
    defaultOptions.topBar["backButton"]       = { color: "#fff", testID: "BackButton" };
  }

  Navigation.setDefaultOptions(defaultOptions);

  NavigationUtil.init();

  NavigationUtil.setRoot(Stacks.initial());

  // overwrite for Icon Debug view
  // Navigation.registerComponent("IconDevSelector", () => IconShowcase);
  // NavigationUtil.setRoot({ component: { name: 'IconDevSelector' }});
});
