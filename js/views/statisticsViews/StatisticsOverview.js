import React, {
  Component,
  TouchableHighlight,
  Text,
  View
} from 'react-native';

import {TopBar} from './../components/Topbar'
import {Background} from './../components/Background'

export class StatisticsOverview extends Component {
  _onPressButton() {
    this.props.goto('RoomOverview')
  }

  render() {
    return (
      <Background>
        <TopBar name={this.props.name} />
        <View style={{flex:1, alignItems:'center', justifyContent:'center'}}>
        <TouchableHighlight onPress={() => this._onPressButton()}>
          <Text>Statistics</Text>
        </TouchableHighlight>
          </View>
      </Background>
    )
  }
}
