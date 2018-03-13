import * as React from 'react'; import { Component } from 'react';
import {
  Alert,
  Platform,
  Linking,
  TouchableHighlight,
  ScrollView,
  Switch,
  Text,
  View
} from 'react-native';

import { Background } from '../components/Background'
import { ListEditableItems } from '../components/ListEditableItems'
import {Actions} from "react-native-router-flux";
import {colors} from "../styles";
import {IconButton} from "../components/IconButton";

export class SettingsFAQ extends Component<any, any> {

  _getItems() {
    let items = [];

    items.push({
      type:'explanation',
      label:"Frequently Asked Questions",
    })

    items.push({
      type:'collapsable',
      label:"Crownstones can't dim",
      content:"Make sure dimming is enabled on the Crownstone:\n\n" +
      "- Make sure you are an Admin.\n" +
      "- Go to the Sphere Overview.\n" +
      "- Tap on a room.\n" +
      "- Select the Crownstone you want to dim.\n" +
      "- Tap on it's icon.\n" +
      "- Tap 'Edit' in the top right corner.\n" +
      "- Enable the Allow Dimming switch.",
      contentHeight: 215
    })

    items.push({
      type:'explanation',
      label:"More help is available on the website",
    })

    items.push({
      id:'Help',
      label:'Help',
      type:'navigation',
      icon: <IconButton name={'ios-cloudy'} size={22} color={colors.white.hex} buttonStyle={{backgroundColor: colors.green.hex }}/>,
      callback: () => {
        Linking.openURL('https://crownstone.rocks/app-help/').catch(err => {});
      }
    });

    return items;
  }

  render() {
    return (
      <Background image={this.props.backgrounds.menu} >
        <ScrollView>
          <ListEditableItems items={this._getItems()} separatorIndent={true} />
        </ScrollView>
      </Background>
    );
  }
}
