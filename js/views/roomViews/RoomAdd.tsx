import { LiveComponent }          from "../LiveComponent";

import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("RoomAdd", key)(a,b,c,d,e);
}
import * as React from 'react';
import {
  Alert, Platform,
  TouchableOpacity,
  View
} from "react-native";


import { availableModalHeight, colors, screenHeight, styles } from "../styles";

import { core } from "../../core";
import { NavigationUtil } from "../../util/NavigationUtil";
import { TopbarImitation } from "../components/TopbarImitation";
import { RoomAddCore } from "./RoomAddCore";
import { Background } from "../components/Background";


export class RoomAdd extends LiveComponent<any, any> {
  static options = {
    topBar: { visible: false, height: 0 }
  };

  _roomAddCoreReference = null;

  render() {
    return (
      <Background fullScreen={true} image={core.background.lightBlur} hideNotifications={true} hideOrangeLine={true} dimStatusBar={true}>
        <TopbarImitation
          leftStyle={{color: colors.black.hex}}
          left={Platform.OS === 'android' ? null : lang("Back")}
          leftAction={() => { if (this._roomAddCoreReference.canGoBack() === false) {
            if (this.props.isModal !== false) {
              NavigationUtil.dismissModal();
            }
            else {
              NavigationUtil.back();
            }
          }}}
          leftButtonStyle={{width: 300}} style={{backgroundColor:'transparent', paddingTop:0}} />
        <RoomAddCore {...this.props} ref={(roomAddCore) => { this._roomAddCoreReference = roomAddCore; }} />
      </Background>
    );
  }
}
