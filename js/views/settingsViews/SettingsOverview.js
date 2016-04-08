import React, {
  Alert,
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
var Actions = require('react-native-router-flux').Actions;
import { stylesIOS, colors } from './../styles'
let styles = stylesIOS;

export class SettingsOverview extends Component {
  _getItems() {
    return [
      {label:'Manage Account',  type:'navigation',   callback: (newValue) => {}},
      {label:'Manage Group',  type:'navigation',   callback: (newValue) => {}},
      //{label:'Add, remove, or change the permissions of the people in your group.',  type:'explanation', below:true},
      {label:'Manage Crownstones', type:'navigation',  callback: (newValue) => {}},
      //{label:'Here you can reset Crownstones to factory settings. (ie. remove ownership)',  type:'explanation', below:true},
      {label:'Manage Locations',   type:'navigation',      callback: (newValue) => {}},
      //{label:'You can add or remove locations (rooms) to your app. Localization works in rooms without Crownstones but it may be less accurate.',  type:'explanation', below:true},
      {label:'App Complexity',     type:'navigation',      callback: (newValue) => {}},
      //{label:'You can add or remove features from your app interface to tailor it to your needs.',  type:'explanation', below:true},
      {type:'spacer'},
      {label:'Log Out',  type:'button', callback: () => {this._logoutPopup()}},
    ]
  }

  _logoutPopup() {
    Alert.alert('Log out','Are you sure?',[
      {text: 'Cancel', style: 'cancel'},
      {text: 'OK', onPress: () => this._logout()},
    ])
  }

  _logout() {
    const store = this.props.store;
    store.dispatch({
      type:'USER_LOG_OUT'
    });
    Actions.loginSplash();
  }

  render() {
    return (
      <Background>
        <EditSpacer top={true} />
        <ScrollView>
          <ListEditableItems items={this._getItems()} />
        </ScrollView>
      </Background>
    );
  }
}
