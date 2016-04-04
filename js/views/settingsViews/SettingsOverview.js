import React, {
  Component,
  Dimensions,
  TouchableHighlight,
  PixelRatio,
  ScrollView,
  Switch,
  Text,
  View
} from 'react-native';

import { TopBar } from './../components/Topbar'
import { Background } from './../components/Background'
import { ListEditableItems } from './../components/ListEditableItems'
import { EditSpacer } from './../components/EditSpacer'
import { stylesIOS, colors } from './../styles'
let styles = stylesIOS;

export class SettingsOverview extends Component {
  _getItems() {
    return [
      {label:'Manage Your Group',  type:'navigation',   callback: (newValue) => {}},
      {label:'Add, remove or change the permissions of the people in your group.',  type:'explanation', below:true},
      {label:'Manage Crownstones',  type:'navigation',  callback: (newValue) => {}},
      {label:'Here you can reset Crownstones to factory settings. (ie. remove ownership)',  type:'explanation', below:true},
      {label:'App Complexity',  type:'navigation',      callback: (newValue) => {}},
      {label:'You can add or remove features from your app interface to tailor it to your needs.',  type:'explanation', below:true},
      {label:'Log Out',  type:'button', callback: (newValue) => {}},
    ]
  }

  render() {
    return (
      <Background>
        <EditSpacer top={true} />
        <ListEditableItems items={this._getItems()} />
      </Background>
    );
  }
}
