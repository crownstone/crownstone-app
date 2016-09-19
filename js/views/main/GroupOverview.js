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
import { RoomLayer } from '../components/RoomLayer'
import { LOG } from '../../logging/Log'
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
        LOG("triggering rerender of group overview");
        this.forceUpdate();
      }
    });
  }

  componentWillUnmount() {
    this.unsubscribe();
  }

  // experiment
  // shouldComponentUpdate(nextProps, nextState) {
  //   // LOG("Should component update?",nextProps, nextState)
  //   return false
  // }


  render() {
    LOG("RENDERING OVERVIEW");

    return (
      <Background image={this.props.backgrounds.main} >
        {this._getRenderContent()}
      </Background>
    );
  }

  _getRenderContent() {
    const store = this.props.store;
    const state = store.getState();
    this.renderState = state;

    let groupIds = Object.keys(state.groups);
    let noGroups = groupIds.length == 0;
    let noStones = true;
    let activeGroup = state.app.activeGroup;

    // check if we have ANY crownstone
    groupIds.forEach((groupId) => {
      if (Object.keys(state.groups[groupId].stones).length > 0) {
        noStones = false;
      }
    });

    if (noGroups) {
      return (
        <View style={{flex:1, alignItems:'center', justifyContent:'center'}}>
          <Icon name="c1-house" size={150} color={colors.blue.hex} style={{backgroundColor:'transparent'}} />
          <Text style={overviewStyles.mainText}>No Groups available.</Text>
          <Text style={overviewStyles.subText}>Go into the settings to create your own Group or wait to be added to those of others.</Text>
          </View>
      );
    }
    else if (noStones) {
      return (
        <View style={{flex:1, alignItems:'center', justifyContent:'center'}}>
          <Icon name="c2-pluginFront" size={150} color={colors.blue.hex} style={{backgroundColor:'transparent'}} />
          <Text style={overviewStyles.mainText}>No Crownstones Added.</Text>
          <Text style={overviewStyles.subText}>Go into the settings to add Crownstones.</Text>
        </View>
      );
    }
    else if (activeGroup) {
      return (
        <View style={{flex:1}}>
          <RoomLayer store={store} groupId={state.app.activeGroup} />
          <Text style={overviewStyles.bottomText}>{'Currently in Group: ' + state.groups[activeGroup].config.name }</Text>
        </View>
      );
    }
    else {
      return (
        <View style={{flex:1, alignItems:'center', justifyContent:'center'}}>
          <Icon name="c1-signpost" size={150} color={colors.blue.hex} style={{backgroundColor:'transparent'}} />
          <Text style={overviewStyles.mainText}>No Groups in range...</Text>
          <Text style={overviewStyles.subText}>If you come in range of a group you are part of, the rooms and Crownstones will be shown automatically.</Text>
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