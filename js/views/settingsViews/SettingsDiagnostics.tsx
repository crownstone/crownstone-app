import * as React from 'react'; import { Component } from 'react';
import {
  Alert,
  Platform,
  Linking,
  TouchableOpacity,
  TouchableHighlight,
  ScrollView,
  Switch,
  Text,
  View
} from 'react-native';

import { Background } from '../components/Background'
import { ListEditableItems } from '../components/ListEditableItems'
import {colors, OrangeLine, screenWidth} from "../styles";

export class SettingsDiagnostics extends Component<any, any> {
  static navigationOptions = ({ navigation }) => {
    return {
      title: "Diagnostics",
    }
  };

  _getItems() {
    let items = [];




    items.push({
      type:'spacer',
    });

    return items;
  }

  render() {
    return (
      <Background image={this.props.backgrounds.menu} >
        <OrangeLine/>
        <ScrollView>
          <ListEditableItems items={this._getItems()} separatorIndent={false} />
        </ScrollView>
      </Background>
    );
  }
}
