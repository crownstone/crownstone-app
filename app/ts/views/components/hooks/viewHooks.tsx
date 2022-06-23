import * as React from 'react';
import {core} from "../../../Core";
import {useForceUpdate} from "./databaseHooks";
import { Navigation } from "react-native-navigation";
import { useEffect } from "react";
import { NavigationUtil } from "../../../util/navigation/NavigationUtil";

type buttonId = string;
type callback = () => void;

export function useTabBarButtons(props, buttonCallbacks: Record<buttonId, callback>) {
  useEffect(() => {
    let listener = Navigation.events().registerNavigationButtonPressedListener(({buttonId, componentId}) => {
      if (componentId === props.componentId) {
        if (buttonCallbacks[buttonId]) {
          buttonCallbacks[buttonId]();
        }
      }
    })

    return () => { listener.remove(); };
  }, []);
}

export function useLiveView(props, buttonCallbacks: Record<buttonId, callback> = {}) {
  let usedButtonCallbacks = {
    closeModal:  () => { NavigationUtil.dismissModal(); },
    cancelBack:  () => { NavigationUtil.back(); },
    backModal:   () => { NavigationUtil.back(); },
    cancelModal: () => { NavigationUtil.dismissModal(); },
    ...buttonCallbacks
  };

  useTabBarButtons(props, usedButtonCallbacks);
}
