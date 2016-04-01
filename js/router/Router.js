import React, {
  AppRegistry,
  Navigator,
  Component,
  Dimensions,
  Image,
  PixelRatio,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Text,
  View
} from 'react-native';
import {Scene, Reducer, Router, Switch, TabBar, Modal, Schema, Actions} from 'react-native-router-flux';
import { createStore } from 'redux'
import CrownstoneReducer from './store/reducer'
import initialStateActionList from './store/initialState'

import { GroupOverview }       from '../views/GroupOverview'
import { RoomOverview }        from '../views/roomViews/RoomOverview'
import { RoomEdit }            from '../views/roomViews/RoomEdit'
import { DeviceEdit }          from '../views/deviceViews/DeviceEdit'
import { DeviceBehaviourEdit } from '../views/deviceViews/DeviceBehaviourEdit'
import { SettingsOverview }    from '../views/settingsViews/SettingsOverview'
import {stylesIOS, colors}     from '../views/styles'
let styles = stylesIOS;

var Icon = require('react-native-vector-icons/Ionicons');

const store = createStore(CrownstoneReducer);
initialStateActionList.forEach((action) => {
  store.dispatch(action);
});


const reducerCreate = params=> {
  const defaultReducer = Reducer(params);
  return (state, action)=>{
    if (state) {
      let currentTabIndex = state.index;
      if (state.children[currentTabIndex].name === action.key && action.type === 'jump') {
        return defaultReducer(state, {key: state.children[currentTabIndex].children[0].name, type:'reset'})
      }
    }
    return defaultReducer(state, action);
  }
};

class TabIcon extends React.Component {
  render(){
    return (
    <View style={styles.centered} >
      <Icon name={this.props.iconString} size={30} color={this.props.selected ?  colors.menuTextSelected.h : colors.menuText.h} />
      <Text style={[styles.menuItem, {color:this.props.selected ?  colors.menuTextSelected.h : colors.menuText.h}]}>{this.props.title}</Text>
    </View>
    );
  }
}

let backButtonFunction = function() {
  if (this.props.navigationState.index === 0) {
    return null;
  }
  return (
      <TouchableOpacity style={[{
        width: 100,
        height: 37,
        position: 'absolute',
        bottom: 4,
        left: 2,
        padding: 8,
        justifyContent:'center',
    }]} onPress={Actions.pop}>
        <View style={{flexDirection:'row', alignItems:'center'}}>
          <Icon name="ios-arrow-back" size={25} color={'#ffffff'} style={{marginTop:2,paddingRight:6}} />
          <Text style={styles.topBarLeft}>Back</Text>
        </View>
      </TouchableOpacity>
  );
};

let onRightFunctionEdit = function(params) {
  Actions.roomEdit({room:params.room, roomId: params.roomId});
};

export class AppRouter extends React.Component {
  constructor(props) {
    super();
    this.props = props;
  }

  render() {
    return <Router createReducer={reducerCreate} store={store}>
      <Scene key="tabBar" tabs={true} tabBarStyle={{backgroundColor:colors.menuBackground.h}}>
        <Scene key="overview" title="Overview" icon={TabIcon} iconString="ios-color-filter-outline" navigationBarStyle={{backgroundColor:colors.menuBackground.h}} titleStyle={{color:'white'}} renderBackButton={backButtonFunction}>
          <Scene key="groupOverview" component={GroupOverview} title="Group Overview" />
          <Scene key="roomOverview"  component={RoomOverview} onRight={onRightFunctionEdit} rightTitle="Edit" rightButtonTextStyle={{color:'white'}} />
          <Scene key="roomEdit"      component={RoomEdit} title="Edit Room" />
          <Scene key="deviceEdit"    component={DeviceEdit} title="Edit Device" />
          <Scene key="deviceBehaviourEdit" component={DeviceBehaviourEdit} title="Edit Behaviour" />
        </Scene>
        <Scene key="settings" title="Settings" icon={TabIcon} iconString="ios-gear-outline" navigationBarStyle={{backgroundColor:colors.menuBackground.h}} titleStyle={{color:'white'}} renderBackButton={backButtonFunction}>
          <Scene key="Settings" component={SettingsOverview} title="Settings"/>
        </Scene>
      </Scene>
    </Router>;
  }
}
