import { LiveComponent }          from "../../LiveComponent";

import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("SettingsBleDebug", key)(a,b,c,d,e);
}
import * as React from 'react';
import {
  ScrollView, View, Text, TouchableOpacity, Alert, TextStyle, ViewStyle
} from "react-native";

import { Background } from '../../components/Background'
import { ListEditableItems } from '../../components/ListEditableItems'
import { TopBarUtil } from "../../../util/TopBarUtil";
import { core } from "../../../core";
import { colors, screenWidth } from "../../styles";
import { NavigationUtil } from "../../../util/NavigationUtil";

const viewStyle : ViewStyle = {
  width: screenWidth,
  borderColor: colors.black.rgba(0.2),
  borderBottomWidth: 1,
  justifyContent:'center',

}

const textStyle : TextStyle = {
  fontSize: 14,
  fontWeight:'bold',
  paddingVertical: 15
}

export class SettingsDatabaseExplorer extends LiveComponent<any, any> {
  static options(props) {
    return TopBarUtil.getOptions({title: "Database Explorer", update: true});
  }

  expanded = { "BASE": {} };
  state = {}

  constructor(props) {
    super(props);

    this.state = core.store.getState();
  }

  navigationButtonPressed({ buttonId }) {
    if (buttonId === 'update') {
      this.state = core.store.getState();
      this.forceUpdate();
    }
  }

  _getItems(stateSegment, expandedPath, url, baseKey, step) {
    let items = [];

    let keys = Object.keys(stateSegment);
    keys.forEach((key) => {
      if (typeof stateSegment[key] === 'object' && stateSegment[key] !== null) {
        // this is nested
        items.push(
          <TouchableOpacity key={url+'/'+key} style={[viewStyle,{paddingLeft: step*15 + 5, backgroundColor: colors.menuTextSelected.rgba(0.1*step)}]} onPress={ () => {
            if (expandedPath[baseKey][key] !== undefined) {
              delete expandedPath[baseKey][key];
            }
            else {
              expandedPath[baseKey][key] = {};
            }
            this.forceUpdate();
          }}>
            <Text style={textStyle}>{key}</Text>
          </TouchableOpacity>
        );
        if (expandedPath[baseKey][key] !== undefined) {
          items = items.concat(this._getItems(stateSegment[key], expandedPath[baseKey], url+'/'+key, key, step+1))
        }
      }
      else {
        let label = stateSegment[key];
        let ignoreStep = false;
        if (typeof label === 'string' && label.indexOf("{") !== -1 && label.indexOf("}") !== -1) {
          let data = JSON.parse(stateSegment[key]);
          label = "\n" + JSON.stringify(data, undefined, 2);
          ignoreStep = true;
        }
        items.push(
          <View key={url+'/'+key} style={[viewStyle,{paddingLeft: ignoreStep === false && step*15 + 5 || 5, backgroundColor: colors.menuTextSelected.rgba(0.1*step)}]}>
            <Text style={textStyle}>{key+": "+label}</Text>
          </View>
        );
      }
    })


    return items;
  }


  render() {
    return (
      <Background image={core.background.menu} >
        <ScrollView keyboardShouldPersistTaps="always">
          {this._getItems(this.state, this.expanded, '', 'BASE', 0) }
        </ScrollView>
      </Background>
    );
  }
}
