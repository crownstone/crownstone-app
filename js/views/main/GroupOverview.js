import React, { Component } from 'react' 
import {
  Animated,
  Dimensions,
  Image,
  NativeModules,
  TouchableHighlight,
  Text,
  View
} from 'react-native';
var Actions = require('react-native-router-flux').Actions;


import { ProfilePicture } from '../components/ProfilePicture'
import { Background } from '../components/Background'
import { RoomCircle } from '../components/RoomCircle'
import { RoomLayer } from './RoomLayer'
import { hsv2rgb, hsl2rgb, hcl2rgb } from '../../util/colorConverters'
import { getPresentUsersFromState, getCurrentPowerUsageFromState } from '../../util/dataUtil'

import { styles, colors, width, height } from '../styles'


export class GroupOverview extends Component {
  constructor() {
    super();
    this.renderState = {};
    this.state = {presentUsers: {}};

    this.roomRadius = 0.35*0.5*width;
    this.userDiameter = 25;
    let availableSpace = (height - 175) - this.roomRadius; // for top bar and menu bar

    this.roomPositions = {
      locationId_A: {x:0.10*width, y:0.12*availableSpace},
      locationId_D: {x:0.55*width, y:0.25*availableSpace},
      locationId_B: {x:0.08*width, y:0.90*availableSpace},
      locationId_C: {x:0.60*width, y:0.75*availableSpace}
    };

    this.presentUsers = {}
  }

  componentDidMount() {
    const { store } = this.props;
    this.unsubscribe = store.subscribe(() => {
      // const state = store.getState();
      // if (this.renderState && this.renderState.groups != state.groups) {
      //   this.renderState = state;
        // console.log("Force Update")
        this.forceUpdate();
      // }
    });
  }

  componentWillUnmount() {
    this.unsubscribe();
  }

  // experiment
  // shouldComponentUpdate(nextProps, nextState) {
  //   console.log("Should component update?",nextProps, nextState)
  //   return true
  // }


  render() {
    console.log("RENDERING OVERVIEW");

    const store = this.props.store;
    const state = store.getState();
    this.renderState = state;
    //
    // if (state.app.activeGroup === undefined) {
    //   return (
    //     <Background background={require('../../images/mainBackgroundLight.png')}>
    //       <View style={{flex:1, alignItems:'center', justifyContent:'center'}}>
    //         <Text style={{backgroundColor:'transparent', color:'rgba(255,255,255,0.5)', fontSize:30}}>Trying to detect Group...</Text>
    //       </View>
    //     </Background>
    //   );
    // }
    // else {
    //   this.activeGroup = state.app.activeGroup;
    //   const rooms = state.groups[this.activeGroup].locations;
    //   if (Object.keys(rooms).length === 0) {
    //     return (
    //       <Background background={require('../../images/mainBackgroundLight.png')}>
    //         <View style={{flex:1, alignItems:'center', justifyContent:'center'}}>
    //           <Text style={{backgroundColor:'transparent', color:'rgba(255,255,255,0.5)', fontSize:30}}>No rooms defined yet.</Text>
    //           <Text style={{backgroundColor:'transparent', color:'rgba(255,255,255,0.5)', fontSize:30}}>Tap here to add them!</Text>
    //         </View>
    //       </Background>
    //     );
    //   }
    //   // update the users
      return (
        <Background background={require('../../images/mainBackgroundLight.png')}>
          <RoomLayer store={store} />
        </Background>
      )
    // }
  }
}
