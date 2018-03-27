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
  static navigationOptions = ({ navigation }) => {
    return {
      title: "FAQ",
    }
  };

  _getItems() {
    let items = [];

    items.push({
      type:'largeExplanation',
      label:"Frequently Asked Questions\n\nHow do I ...",
    })

    items.push({
      type:'collapsable',
      label:"... add a Crownstone?",
      content:"You just have to hold it close if the Crownstone is in setup mode:\n\n" +
      "- Go to the Sphere Overview\n  (with the room bubbles)\n" +
      "- Hold the phone physically close to the Crownstone you want to add.\n" +
      "- Select the blue bubble.\n" +
      "- Tap the blue Crownstone icon to add it.",
      contentHeight: 175
    });

    items.push({
      type:'collapsable',
      label:"... add someone to my Sphere?",
      content:"If you're an Admin or Member you can invite people.\n\n" +
      "- Go to the Settings -> Spheres\n" +
      "- Select the Sphere you want to add people to.\n" +
      "- Select 'Invite someone new'",
      contentHeight: 145
    });


    items.push({
      type:'collapsable',
      label:"... move a Crownstone to a room?",
      content:"Moving the Crownstone is done in the Crownstone overview:\n\n" +
      "- Go to the Sphere Overview\n  (with the room bubbles)\n" +
      "- Tap the bubble containing your Crownstone.\n" +
      "- Select the Crownstone you want to move.\n" +
      "- Tap 'Located in' in the top right corner.",
      contentHeight: 175
    });


    items.push({
      type:'collapsable',
      label:"... dim with my Crownstone?",
      content:"Make sure dimming is enabled on the Crownstone:\n\n" +
      "- Make sure you are an Admin.\n" +
      "- Go to the Sphere Overview\n    (with the room bubbles)\n" +
      "- Tap on a room.\n" +
      "- Select the Crownstone you want to dim.\n" +
      "- Tap 'Edit' in the top right corner.\n" +
      "- Enable the Allow Dimming switch.",
      contentHeight: 200
    });

    items.push({
      type:'collapsable',
      label:"... use indoor localization?",
      content:"Indoor localization on room level works when you have 4 or more Crownstones. If you have less than 4, you can use home enter/exit and near/far. You set these rules per Crownstone.\n\n" +
      "- Go to the Sphere Overview\n    (with the room bubbles)\n" +
      "- Tap on a room.\n" +
      "- Select a Crownstone.\n" +
      "- Swipe the Crownstone overview left to go to the Behaviours.\n",
      contentHeight: 235
    });

    items.push({
      type:'collapsable',
      label:"... use schedules?",
      content:"These can be found in the Crownstone overview.\n\n" +
      "- Go to the Sphere Overview\n    (with the room bubbles)\n" +
      "- Tap on a room.\n" +
      "- Select a Crownstone.\n" +
      "- Swipe the Crownstone overview left twice to go to the Schedules.\n",
      contentHeight: 175
    });

    items.push({
      type:'largeExplanation',
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

    items.push({
      type:'spacer',
    })

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
