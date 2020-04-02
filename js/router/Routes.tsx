import { Navigation, Options, OptionsModalPresentationStyle } from "react-native-navigation";
import { Views } from "./Views";
import SplashScreen from "react-native-splash-screen";
import { Platform } from "react-native";
import { Stacks } from "./Stacks";
import { colors } from "../views/styles";
import {
  TopbarButton,
  TopbarEmptyButton,
  TopbarLeftButtonNav,
  TopbarRightMoreButton
} from "../views/components/topbar/TopbarButton";
import { CancelButton } from "../views/components/topbar/CancelButton";
import { OverlayManager } from "../backgroundProcesses/OverlayManager";
import { NavigationUtil, topBarComponentNames } from "../util/NavigationUtil";
import React from "react";


import "./TextFontFix";
import { IconDevSelector } from "../views/development/IconDevSelector";
import { IconDebug } from "../views/development/IconDebug";


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
  if (Platform.OS === 'ios') {
    SplashScreen.hide();
  }

  let defaultOptions : Options = {
    topBar: {
      background: { color: colors.csBlueDarker.hex },
      title: {
        color: colors.white.hex,
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
    },
    layout: {
      orientation: ['portrait'],
    },
    modalPresentationStyle: OptionsModalPresentationStyle.fullScreen
  };

  if (Platform.OS === 'android') {
    defaultOptions.topBar["leftButtonColor"]  = "#fff";
    defaultOptions.topBar["rightButtonColor"] = "#fff";
    defaultOptions.topBar["backButton"]       = { color: "#fff" };
  }



  Navigation.setDefaultOptions(defaultOptions);

  NavigationUtil.init();

  NavigationUtil.setRoot(Stacks.initial());

  // overwrite for Icon Debug view
  // Navigation.registerComponent("IconDevSelector",        () => IconDebug);
  // NavigationUtil.setRoot({ component: { name: 'IconDevSelector' }});
});