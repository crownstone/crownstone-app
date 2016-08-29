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

import { styles, colors, width, screenHeight } from '../styles'


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
        console.log("triggering rerender of group overview")
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
          <RoomLayer store={store} groupId={state.app.activeGroup} />
        </Background>
      )
    // }
  }
}
