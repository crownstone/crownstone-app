import * as React from 'react'; import { Component } from 'react';
import { AnimatedMenu } from "../views/components/animated/AnimatedMenu";
import { LibMessages } from "../views/overlays/LibMessages";
import { DfuOverlay } from "../views/overlays/DfuOverlay";
import { LockOverlay } from "../views/overlays/LockOverlay";
import { LocalizationSetupStep1 } from "../views/overlays/LocalizationSetupStep1";
import { LocalizationSetupStep2 } from "../views/overlays/LocalizationSetupStep2";
import { TapToToggleCalibration } from "../views/overlays/TapToToggleCalibration";
import { LocationPermissionOverlay } from "../views/overlays/LocationPermissionOverlay";
import { BleStateOverlay } from "../views/overlays/BleStateOverlay";
import { ErrorOverlay } from "../views/overlays/ErrorOverlay";
import { WhatsNewOverlay } from "../views/overlays/WhatsNewOverlay";
import { OptionPopup } from "../views/components/OptionPopup";
import { Processing } from "../views/components/Processing";
import { AppWithNavigationState, navigationStore } from "./NavigationReducer";
import { Provider } from 'react-redux';
import { ListOverlay } from "../views/overlays/ListOverlay";
import { AicoreTimeCustomizationOverlay } from "../views/overlays/AicoreTimeCustomizationOverlay";


export class Router extends Component {
  render() {
    return (
      [
        <Provider store={navigationStore} key={"AppContainer"}>
          <AppWithNavigationState />
        </Provider>,

        <AicoreTimeCustomizationOverlay key={"AicoreTimeCustomizationOverlay"}    />,
        <AnimatedMenu              key={"AnimatedMenu"}    />,
        <LibMessages               key={"LibMessages"}     />,
        <DfuOverlay                key={"DfuOverlay"}      />,
        <LockOverlay               key={"LockOverlay"}     />,
        <LocalizationSetupStep1    key={"LocalizationSetupStep1"}    />,
        <LocalizationSetupStep2    key={"LocalizationSetupStep2"}    />,
        <TapToToggleCalibration    key={"TapToToggleCalibration"}    />,
        <LocationPermissionOverlay key={"LocationPermissionOverlay"} />,
        <ListOverlay               key={"ListOverlay"} />,
        <BleStateOverlay           key={"BleStateOverlay"} />,
        <ErrorOverlay              key={"ErrorOverlay"}    />,
        <WhatsNewOverlay           key={"WhatsNewOverlay"} />,
        <OptionPopup               key={"OptionPopup"}     />,
        <Processing                key={"Processing"}      />,
      ]
    );
  }
}

