import React, {
  AppRegistry,
  Component,
  Dimensions,
  StyleSheet,
  Navigator,
  StatusBar,
  TouchableHighlight,
  Text,
  View
} from 'react-native';

import {Menubar} from './Menubar'
import {HomeOverview}       from '../GroupOverview'
import {StatisticsOverview} from '../statisticsViews/StatisticsOverview'
import {PresetsOverview}    from '../presetViews/PresetsOverview'
import {SettingsOverview}   from '../settingsViews/SettingsOverview'
import {RoomOverview}       from '../roomViews/RoomOverview'
import {RoomEdit}           from '../roomViews/RoomEdit'

import {ImageStore}         from '../../ImageStore'

export let imageStore = new ImageStore();
var buildStyleInterpolator = require('buildStyleInterpolator');

export let routes = {
  'HomeOverview':       [{name: 'HomeOverview',       index: 0}],
  'StatisticsOverview': [{name: 'StatisticsOverview', index: 0}],
  'PresetsOverview':    [{name: 'PresetsOverview',    index: 0}],
  'SettingsOverview':   [{name: 'SettingsOverview',   index: 0}]
};

export class UINavigator extends Component {
  constructor(props) {
    super();

    // this will start the preloading of images.
    imageStore.update(props.appState);
    this.props = props;
  }

  _renderScene(route, navigator) {
    let goto = (where, props) => {
      var nextIndex = route.index + 1;
      navigator.push({
        name: where,
        index: nextIndex,
        props: props
      });
    };

    let back = () => {
      if (route.index > 0) {
        navigator.pop();
      }
    };

    let data = {appState: this.props.appState, routeProps: route.props};

    switch (route.name) {
      case 'HomeOverview':
        return <HomeOverview navigator={navigator} name={route.name} data={data} goto={goto} back={back}/>;
      case 'StatisticsOverview':
        return <StatisticsOverview navigator={navigator} name={route.name} data={data} goto={goto} back={back}/>;
      case 'PresetsOverview':
        return <PresetsOverview navigator={navigator} name={route.name} data={data} goto={goto} back={back}/>;
      case 'SettingsOverview':
        return <SettingsOverview navigator={navigator} name={route.name} data={data} goto={goto} back={back}/>;
      case 'RoomOverview':
        return <RoomOverview navigator={navigator} name={route.name} data={data} goto={goto} back={back}/>
      case 'RoomEdit':
        return <RoomEdit navigator={navigator} name={route.name} data={data} goto={goto} back={back}/>
      default:
        return <SettingsOverview navigator={navigator} name={route.name} data={data} goto={goto} back={back}/>;
    }
  }

  _configureScene(route, routeStack) {
    var NoTransition = {
      opacity: {
        from: 1,
        to: 1,
        min: 1,
        max: 1,
        type: 'linear',
        extrapolate: false,
        round: 100,
      },
    };

    return  {
      ...Navigator.SceneConfigs.FloatFromLeft,
      gestures: null,
      defaultTransitionVelocity: 100,
      animationInterpolators: {
        into: buildStyleInterpolator(NoTransition),
        out: buildStyleInterpolator(NoTransition),
      },
    };

    //return Navigator.SceneConfigs.PushFromRight;
  }

  render() {
    // this preloads new images if there is a change. If not this will not do anything.
    imageStore.update(this.props.appState);

    return <Navigator
      initialRoute={routes['HomeOverview'][0]}
      renderScene={this._renderScene.bind(this)}
      navigationBar={<Menubar appState={this.props.appState} />}
      configureScene={this._configureScene}
    />
  }
}
