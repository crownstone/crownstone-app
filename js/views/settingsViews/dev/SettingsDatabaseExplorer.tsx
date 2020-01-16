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
import { TextEditBar } from "../../components/editComponents/TextEditBar";
import { TextEditInput } from "../../components/editComponents/TextEditInput";
import { Persistor } from "../../../router/store/Persistor";
import { StoreManager } from "../../../router/store/storeManager";

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
  dbState = {}

  constructor(props) {
    super(props);

    this.dbState = core.store.getState();
    this.state = { editField: null, editValue:null, committer: null };
  }

  navigationButtonPressed({ buttonId }) {
    if (buttonId === 'update') {
      this.dbState = core.store.getState();
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
          <TouchableOpacity
            key={url+'/'+key}
            style={[viewStyle,{paddingLeft: ignoreStep === false && step*15 + 5 || 5, backgroundColor: colors.menuTextSelected.rgba(0.1*step)}]}
            onPress={() => {
              if (this.state.editField !== null) {
                this.state.committer();
                this.setState({editField:null, editValue:null, committer:null});
              }
              else {
                this.setState({ editField: url + key, editValue: label, committer:() => {
                  stateSegment[key] = this.state.editValue;
                  StoreManager.persistor.persistChanges(null, this.dbState);
                }});
              }
            }}
          >
            {
              this.state.editField === url+key ?
                this.getEditField(stateSegment, key)
                :
                <Text style={textStyle}>{key + ": " + label}</Text>
            }
          </TouchableOpacity>
        );
      }
    })

    return items;
  }


  getEditField(stateSegment, key) {
    return (
      <TextEditInput
        autoFocus={true}
        style={{paddingVertical: 15}}
        value={this.state.editValue}
        blurOnSubmit={true}
        callback={(value) => { this.setState({editValue: value}); }}
      />
    );

    return null;
  }

  render() {
    return (
      <Background image={core.background.menu} >
        <ScrollView keyboardShouldPersistTaps="always">
          {this._getItems(this.dbState, this.expanded, '', 'BASE', 0) }
        </ScrollView>
      </Background>
    );
  }
}



