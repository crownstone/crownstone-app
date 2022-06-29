import { LiveComponent }          from "../LiveComponent";

import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("RoomAdd", key)(a,b,c,d,e);
}
import * as React from 'react';
import {
  Platform
} from "react-native";


import { background, colors} from "../styles";

import { NavigationUtil } from "../../util/navigation/NavigationUtil";
import { RoomAddCore } from "./RoomAddCore";
import {Background, BackgroundCustomTopBar} from "../components/Background";
import { CustomTopBarWrapper } from "../components/CustomTopBarWrapper";


export class RoomAdd extends LiveComponent<any, any> {
  static options = {
    topBar: { visible: false, height: 0 }
  };

  _roomAddCoreReference = null;

  render() {
    return (
      <BackgroundCustomTopBar testID={"RoomAdd"}>
        <CustomTopBarWrapper
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
          leftButtonStyle={{width: 300}} style={{backgroundColor:'transparent', paddingTop:0}} >
        <RoomAddCore {...this.props} ref={(roomAddCore) => { this._roomAddCoreReference = roomAddCore; }} />
        </CustomTopBarWrapper>
      </BackgroundCustomTopBar>
    );
  }
}
