import { LiveComponent }          from "../../LiveComponent";
import * as React from 'react';
import {
  ScrollView, Text, TouchableOpacity, TextStyle, ViewStyle, Alert
} from "react-native";

import { BackgroundNoNotification } from '../../components/BackgroundNoNotification'
import { TopBarUtil } from "../../../util/TopBarUtil";
import { core } from "../../../Core";
import { background, colors, screenWidth } from "../../styles";
import { TextEditInput } from "../../components/editComponents/TextEditInput";
import { StoreManager } from "../../../database/storeManager";
import { SettingsNavbarBackground } from "../../components/SettingsBackground";

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

const italicTextStyle : TextStyle = {
  fontSize: 14,
  fontStyle:'italic',
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
    if (buttonId === 'cancel') {
      this.setState({ editField: null, editValue:null, committer: null });
      TopBarUtil.updateOptions(this.props.componentId, {update:true,cancel:false, save:false});
    }
    if (buttonId === 'save') {
      if (this.state.committer) {
        this.state.committer();
      }
      this.setState({ editField: null, editValue:null, committer: null });
      TopBarUtil.updateOptions(this.props.componentId, {update:true,cancel:false, save:false});
    }
  }

  _getItems(stateSegment, expandedPath, url, baseKey, step) {
    let items = [];
    let state = core.store.getState();

    let keys = Object.keys(stateSegment);
    keys.forEach((key) => {
      if (typeof stateSegment[key] === 'object' && stateSegment[key] !== null) {
        // this is nested, tapping it will open/close it

        let shownValue = key;
        let usedStyle = textStyle;
        if (isUUID(key)) {
          if (stateSegment[key]?.config?.name) {
            shownValue = stateSegment[key].config.name + " (from ID)";
          }
          else if (stateSegment[key]?.name) {
            shownValue = stateSegment[key].name + " (from ID)";
          }
          else if (stateSegment[key]?.firstName) {
            shownValue = stateSegment[key].firstName + " " + stateSegment[key].lastName + " (from ID)";
          }
          else if (stateSegment[key]?.content) {
            shownValue = stateSegment[key].content + " (from ID)";
          }

          if (shownValue != key) {
            usedStyle = italicTextStyle; // use the italic style to indicate we have modified the key
          }
        }

        items.push(
          <TouchableOpacity key={url+'/'+key} style={[viewStyle,{paddingLeft: step*15 + 5, backgroundColor: colors.blue.rgba(0.1*step)}]}
            onPress={ () => {
              if (expandedPath[baseKey][key] !== undefined) {
                delete expandedPath[baseKey][key];
              }
              else {
                expandedPath[baseKey][key] = {};
              }
              this.forceUpdate();
            }}
            onLongPress={ () => {
              Alert.alert("Delete entry?", "Are you sure you want to delete this entry?", [{text: "Cancel"}, {text: "Delete", onPress: async () => {
                delete stateSegment[key];
                await StoreManager.persistor.persistChanges(null, this.dbState);
                this.forceUpdate()
              }}]);
            }}
          >
            <Text style={usedStyle}>{shownValue}</Text>
          </TouchableOpacity>
        );
        if (expandedPath[baseKey][key] !== undefined) {
          items = items.concat(this._getItems(stateSegment[key], expandedPath[baseKey], url+'/'+key, key, step+1))
        }

        return;
      }

      let label = stateSegment[key];
      let ignoreStep = false;

      // if it is an object, stringify it.
      if (typeof label === 'string' && label.indexOf("{") !== -1 && label.indexOf("}") !== -1) {
        let data = JSON.parse(stateSegment[key]);
        label = "\n" + JSON.stringify(data, undefined, 2);
        ignoreStep = true;
      }

      items.push(
        <TouchableOpacity
          key={url+'/'+key}
          style={[viewStyle,{paddingLeft: ignoreStep === false && step*15 + 5 || 5, backgroundColor: colors.blue.rgba(0.1*step)}]}
          onPress={() => {
            // only for devs who have unlocked the dev app.
            if (state.development.devAppVisible) {

              if (this.state.editField === null) {
                this.setState({ editField: url + key, editValue: label, committer:() => {
                  stateSegment[key] = this.state.editValue;
                  StoreManager.persistor.persistChanges(null, this.dbState);
                }});

                TopBarUtil.updateOptions(this.props.componentId, {update:false,cancel:true, save: true});
              }
            }
          }}
        >
          {
            this.state.editField === url+key ? this.getEditField(stateSegment, key) : <Text style={textStyle}>{ key + ": " + label }</Text>
          }
        </TouchableOpacity>
      );
    })

    return items;
  }


  getEditField(stateSegment, key) {
    return (
      <TextEditInput
        autoFocus={true}
        style={{paddingVertical: 15, backgroundColor:colors.white.hex, borderRadius:3, borderColor: colors.black.rgba(0.1), borderWidth:1}}
        value={this.state.editValue}
        blurOnSubmit={true}
        callback={(value) => { this.setState({editValue: value}); }}
      />
    );

    return null;
  }

  render() {
    return (
      <SettingsNavbarBackground>
        <ScrollView keyboardShouldPersistTaps="always">
          {this._getItems(this.dbState, this.expanded, '', 'BASE', 0) }
        </ScrollView>
      </SettingsNavbarBackground>
    );
  }
}


function isUUID(value) {
  if (value.length === 24) {
    // check if the value is a hex string
    return /^[0-9a-f]{24}$/i.test(value);
  }
  // check if the value is a uuid v4
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}
