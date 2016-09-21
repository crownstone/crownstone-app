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


export class SphereOverview extends Component {
  constructor() {
    super();
    this.state = {presentUsers: {}};
  }

  componentDidMount() {
    const { store } = this.props;
    this.unsubscribe = store.subscribe(() => {
      // only rerender if we go to a different sphere
      if (this.renderState === undefined)
        return;

      const state = store.getState();

      if (this.renderState.app.activeSphere !== state.app.activeSphere) {
        LOG("triggering rerender of sphere overview");
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

    let sphereIds = Object.keys(state.spheres);
    let noSpheres = sphereIds.length == 0;
    let noStones = true;
    let activeSphere = state.app.activeSphere;

    // check if we have ANY crownstone
    sphereIds.forEach((sphereId) => {
      if (Object.keys(state.spheres[sphereId].stones).length > 0) {
        noStones = false;
      }
    });

    if (noSpheres) {
      return (
        <View style={{flex:1, alignItems:'center', justifyContent:'center'}}>
          <Icon name="c1-house" size={150} color={colors.blue.hex} style={{backgroundColor:'transparent'}} />
          <Text style={overviewStyles.mainText}>No Spheres available.</Text>
          <Text style={overviewStyles.subText}>Go into the settings to create your own Sphere or wait to be added to those of others.</Text>
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
    else if (activeSphere) {
      return (
        <View style={{flex:1}}>
          <RoomLayer store={store} sphereId={state.app.activeSphere} />
          <Text style={overviewStyles.bottomText}>{'Currently in Sphere: ' + state.spheres[activeSphere].config.name }</Text>
        </View>
      );
    }
    else {
      return (
        <View style={{flex:1, alignItems:'center', justifyContent:'center'}}>
          <Icon name="c1-signpost" size={150} color={colors.blue.hex} style={{backgroundColor:'transparent'}} />
          <Text style={overviewStyles.mainText}>No Spheres in range...</Text>
          <Text style={overviewStyles.subText}>If you come in range of a sphere you are part of, the rooms and Crownstones will be shown automatically.</Text>
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