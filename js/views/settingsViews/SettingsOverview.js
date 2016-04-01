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
import { stylesIOS, colors } from './../styles'
let styles = stylesIOS;

export class SettingsOverview extends Component {
  constructor() {
    super();
    this.state = {
      items: [
        {label:'Manage Your Group',  type:'navigation', value:true, callback: (newValue) => {this.state.items[0].value = newValue; this.setState(this.state);}},
        {label:'Add, remove or change the permissions of the people in your group.',  type:'explanation', below:true},
        {label:'Manage Crownstones',  type:'navigation', value:true, callback: (newValue) => {this.state.items[0].value = newValue; this.setState(this.state);}},
        {label:'Here you can reset Crownstones to factory settings. (ie. remove ownership)',  type:'explanation', below:true},
        {label:'App Complexity',  type:'navigation', value:true, callback: (newValue) => {this.state.items[1].value = newValue; this.setState(this.state);}},
        {label:'You can add or remove features from your app interface to taylor it to your needs.',  type:'explanation', below:true}
    ]}
  }

  render() {
    return (
      <Background><ListEditableItems items={this.state.items} /></Background>
    )
  }
}
