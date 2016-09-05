import React, { Component } from 'react' 
import {
  Animated,
  Dimensions,
  Image,
  NativeModules,
  StyleSheet,
  TouchableHighlight,
  Text,
  View
} from 'react-native';
var Actions = require('react-native-router-flux').Actions;


import { Background } from '../components/Background'
import { Icon } from '../components/Icon'
import { RoomLayer } from './RoomLayer'

import { styles, colors, screenWidth, screenHeight } from '../styles'


export class GroupOverview extends Component {
  constructor() {
    super();
    this.state = {presentUsers: {}};
  }

  componentDidMount() {
    const { store } = this.props;
    this.unsubscribe = store.subscribe(() => {
      // only rerender if we go to a different group
      if (this.renderState === undefined)
        return;

      const state = store.getState();

      if (this.renderState.app.activeGroup !== state.app.activeGroup) {
        console.log("triggering rerender of group overview");
        this.forceUpdate();
      }
    });
  }

  componentWillUnmount() {
    this.unsubscribe();
  }

  // experiment
  // shouldComponentUpdate(nextProps, nextState) {
  //   // console.log("Should component update?",nextProps, nextState)
  //   return false
  // }


  render() {
    console.log("RENDERING OVERVIEW");


    return (
      <Background background={require('../../images/mainBackgroundLight.png')}>
        {this._getRenderContent()}
      </Background>
    );
  }

  _getRenderContent() {
    const store = this.props.store;
    const state = store.getState();
    this.renderState = state;

    let groupsAvailable = Object.keys(state.groups).length;
    let stonesAvailable = 0;
    let activeGroup = state.app.activeGroup;

    if (groupsAvailable > 0 && activeGroup) {
      stonesAvailable = Object.keys(state.groups[activeGroup].stones);
    }

    if (groupsAvailable == 0) {
      return (
        <View style={{flex:1, alignItems:'center', justifyContent:'center'}}>
          <Icon name="c1-house" size={150} color={colors.blue.hex} style={{backgroundColor:'transparent'}} />
          <Text style={overviewStyles.mainText}>No Groups available.</Text>
          <Text style={overviewStyles.subText}>Go into the settings to create your own Group or wait to be added to those of others.</Text>
          </View>
      );
    }
    else if (activeGroup) {
      if (stonesAvailable == 0) {
        return (
          <View style={{flex:1, alignItems:'center', justifyContent:'center'}}>
            <Icon name="c2-pluginFront" size={150} color={colors.blue.hex} style={{backgroundColor:'transparent'}} />
            <Text style={overviewStyles.mainText}>No Crownstones Added.</Text>
            <Text style={overviewStyles.subText}>Go into the settings to add Crownstones.</Text>
            <Text style={overviewStyles.bottomText}>{'Currently in Group: ' + state.groups[activeGroup].config.name }</Text>
          </View>
        );
      }
      else {
        return (
          <View style={{flex:1}}>
            <RoomLayer store={store} groupId={state.app.activeGroup} />
            <Text style={overviewStyles.bottomText}>{'Currently in Group: ' + state.groups[activeGroup].config.name }</Text>
          </View>
        )
      }
    }
    else {
      return (
        <View style={{flex:1, alignItems:'center', justifyContent:'center'}}>
          <Icon name="c1-mapPin" size={150} color={colors.blue.hex} style={{backgroundColor:'transparent'}} />
          <Text style={overviewStyles.mainText}>No Groups in range...</Text>
        </View>
      );
    }
  }
}




const overviewStyles = StyleSheet.create({
  mainText:{
    backgroundColor:'transparent', textAlign:'center', color:colors.blue.hex, fontSize:25, padding:15, paddingBottom:0
  },
  subText: {
    backgroundColor:'transparent', textAlign:'center', color:colors.blue.hex, fontSize:15, padding:15, paddingBottom:0
  },
  bottomText: {
    position:'absolute', bottom:10, width:screenWidth, backgroundColor:'transparent', textAlign:'center', color:colors.blue.hex, fontSize:12, padding:15, paddingBottom:0
  }
});