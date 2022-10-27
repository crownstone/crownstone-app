import {Navigation, Options, OptionsModalPresentationStyle} from "react-native-navigation";
import {Views} from "./Views";
import {Platform} from "react-native";
import {Stacks} from "./Stacks";
import {colors} from "../views/styles";
import {
  TopbarButton,
  TopbarEmptyButton,
  TopbarLeftButtonNav, TopbarRightHelpButton,
  TopbarRightMoreButton
} from "../views/components/topbar/TopbarButton";
import {CancelButton} from "../views/components/topbar/CancelButton";
import {OverlayManager} from "../backgroundProcesses/OverlayManager";
import {NavigationUtil, topBarComponentNames} from "../util/navigation/NavigationUtil";
import React from "react";
import {IconShowcase} from "./development/IconShowcase";
import { gestureHandlerRootHOC } from 'react-native-gesture-handler';

let viewsLoaded = false;

export const loadRoutes = function() {
  if (viewsLoaded) { return; }
  viewsLoaded = true;


  // register all views
  Object.keys(Views).forEach((viewId) => {
    Navigation.registerComponent(viewId,    () => gestureHandlerRootHOC(Views[viewId]));
  });

  // register all custom components used by the navigator:
  Navigation.registerComponent("topbarCancelButton",       () => gestureHandlerRootHOC(CancelButton));
  Navigation.registerComponent("topbarLeftButton",         () => gestureHandlerRootHOC(TopbarLeftButtonNav));
  Navigation.registerComponent("topbarRightMoreButton",    () => gestureHandlerRootHOC(TopbarRightMoreButton));
  Navigation.registerComponent("topbarRightHelpButton",    () => gestureHandlerRootHOC(TopbarRightHelpButton));
  Navigation.registerComponent("topbarButton",             () => gestureHandlerRootHOC(TopbarButton));
  Navigation.registerComponent("topbarEmptyButton",        () => gestureHandlerRootHOC(TopbarEmptyButton));

  topBarComponentNames.push("topbarCancelButton");
  topBarComponentNames.push("topbarLeftButton");
  topBarComponentNames.push("topbarRightMoreButton");
  topBarComponentNames.push("topbarButton");
  topBarComponentNames.push("topbarEmptyButton");

  OverlayManager.init();
};

Navigation.events().registerAppLaunchedListener(() => {
  let defaultOptions : Options = {
    statusBar: {
      visible:    true,
      drawBehind: true,
    },
    topBar: {
      drawBehind: true,
      background: { color: 'transparent'},
      title: {
        color: colors.black.hex,
      },
    },
    bottomTabs: {
      titleDisplayMode: "alwaysShow",
      backgroundColor: "transparent",
    },
    bottomTab: {
      textColor: colors.black.hex,
      selectedTextColor: colors.blue.hex,
      fontSize: 11,
      iconColor: colors.black.hex,
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
