import React, {
  AppRegistry,
  Component,
  Dimensions,
  StyleSheet,
  Navigator,
  PixelRatio,
  StatusBar,
  TouchableHighlight,
  Text,
  View
} from 'react-native';

import {routes} from './UINavigator'
import {stylesIOS, colors} from '../styles'
let styles = stylesIOS;

var Icon = require('react-native-vector-icons/Ionicons');

export class Menubar extends Component {
  constructor() {
    super();
    this.state = {menu: 'HomeOverview'}
  }

  // required method or RN will crash.
  immediatelyRefresh() {

  }

  _onPressButton(nextItem) {
    // cache the routes.
    if (this.state.menu == nextItem) {
      routes[this.state.menu] = [];
      this.props.navigator.popToTop();
    }
    else {
      routes[this.state.menu] = this.props.navigator.getCurrentRoutes();
      this.state.menu = nextItem;
      this.props.navigator.immediatelyResetRouteStack(routes[this.state.menu]);
    }
  }

  render() {
    let pxRatio = PixelRatio.get();
    return (
      <View style={{height: 25*pxRatio, backgroundColor:colors.menuBackground.h, flexDirection:'row',}}>
        <View style={styles.menuView}>
          <TouchableHighlight onPress={() => this._onPressButton('HomeOverview')}>
          <View style={styles.centered} >
            <Icon name='ios-color-filter-outline' size={30} color={this.state.menu == 'HomeOverview' ? colors.menuTextSelected.h : colors.menuText.h} />
            <Text style={[styles.menuItem,                     {color:this.state.menu == 'HomeOverview' ? colors.menuTextSelected.h : colors.menuText.h}]}>Overview</Text>
          </View>
          </TouchableHighlight>
        </View>

        {this.props.appState.settings.complexity.statistics === true ? <View style={styles.menuView}>
          <TouchableHighlight onPress={() => this._onPressButton('StatisticsOverview')}>
            <View style={styles.centered} >
              <Icon name='ios-analytics-outline' size={30} color={this.state.menu == 'StatisticsOverview' ? colors.menuTextSelected.h : colors.menuText.h} />
              <Text style={[styles.menuItem,                  {color:this.state.menu == 'StatisticsOverview' ? colors.menuTextSelected.h : colors.menuText.h}]}>Statistics</Text>
            </View>
          </TouchableHighlight>
        </View> : undefined}

        {this.props.appState.settings.complexity.presets === true ? <View style={styles.menuView}>
          <TouchableHighlight onPress={() => this._onPressButton('PresetsOverview')}>
            <View style={styles.centered} >
              <Icon name='grid' size={30} color={this.state.menu == 'PresetsOverview' ? colors.menuTextSelected.h : colors.menuText.h} />
              <Text style={[styles.menuItem, {color:this.state.menu == 'PresetsOverview' ? colors.menuTextSelected.h : colors.menuText.h}]}>Presets</Text>
            </View>
          </TouchableHighlight>
        </View> : undefined}

        <View style={styles.menuView}>
          <TouchableHighlight onPress={() => this._onPressButton('SettingsOverview')}>
            <View style={styles.centered} >
              <Icon name='ios-gear-outline' size={30} color={this.state.menu == 'SettingsOverview' ? colors.menuTextSelected.h : colors.menuText.h} />
              <Text style={[styles.menuItem,          {color:this.state.menu == 'SettingsOverview' ? colors.menuTextSelected.h : colors.menuText.h}]}>Settings</Text>
            </View>
          </TouchableHighlight>
        </View>
      </View>
    );
  }
}