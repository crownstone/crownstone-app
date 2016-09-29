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


import { NativeBus } from '../../native/Proxy'
import { Background } from '../components/Background'
import { Icon } from '../components/Icon'
import { RoomLayer } from '../components/RoomLayer'
import { LOG } from '../../logging/Log'
import { styles, colors, screenWidth, screenHeight } from '../styles'


export class SphereOverview extends Component {
  constructor() {
    super();
    this.state = {presentUsers: {}, seeStoneInSetupMode: false};
    this.setupData = {};
    this.setupModeTimeout = undefined;
  }

  componentDidMount() {
    const { store } = this.props;

    this.unsubscribeNative = NativeBus.on(NativeBus.topics.setupAdvertisement, (setupAdvertisement) => {
      this.setupData[setupAdvertisement.handle] = setupAdvertisement;
      if (this.state.seeStoneInSetupMode === false) {
        this.setState({seeStoneInSetupMode:true});
      }
      else {
        if (this.setupModeTimeout !== undefined) {
          clearTimeout(this.setupModeTimeout);
          this.setupModeTimeout = undefined;
        }
      }

      // handle case for timeout (user moves away from crownstone
      this.setupModeTimeout = setTimeout(() => {
        this.setupModeTimeout = undefined;
        delete this.setupData[setupAdvertisement.handle];
        // redraw
        this.setState({seeStoneInSetupMode:false});
      }, 3000);

    });
    this.unsubscribeStore = store.subscribe(() => {
      // only rerender if we go to a different sphere
      if (this.renderState === undefined)
        return;

      const state = store.getState();

      if (this.renderState.app.activeSphere !== state.app.activeSphere) {
        LOG("triggering rerender of sphere overview");

        // Actions.refresh should update the navbar (showing add..)
        //TODO: use custom Topbar
        Actions.refresh();
        this.forceUpdate();
      }
    });
  }

  componentWillUnmount() {
    this.unsubscribeStore();
    this.unsubscribeNative();
  }

  // experiment
  // shouldComponentUpdate(nextProps, nextState) {
  //   // LOG("Should component update?",nextProps, nextState)
  //   return false
  // }


  render() {
    LOG("RENDERING OVERVIEW");

    const store = this.props.store;
    const state = store.getState();
    this.renderState = state;

    let sphereIds = Object.keys(state.spheres);
    let noSpheres = sphereIds.length == 0;
    let noStones = true;
    let activeSphere = state.app.activeSphere;
    let remoteSphere = state.app.remoteSphere;

    // check if we have ANY crownstone
    sphereIds.forEach((sphereId) => {
      if (Object.keys(state.spheres[sphereId].stones).length > 0) {
        noStones = false;
      }
    });

    if (noSpheres) {
      return (
        <Background image={this.props.backgrounds.main} >
          <View style={{flex:1, alignItems:'center', justifyContent:'center'}}>
            <Icon name="c1-house" size={150} color={colors.blue.hex} style={{backgroundColor:'transparent'}} />
            <Text style={overviewStyles.mainText}>No Spheres available.</Text>
            <Text style={overviewStyles.subText}>Go into the settings to create your own Sphere or wait to be added to those of others.</Text>
          </View>
        </Background>
      );
    }
    else if (this.state.seeStoneInSetupMode === true) {
      return (
        <Background image={this.props.backgrounds.mainRemoteNotConnected} >
          <View style={{flex:1, alignItems:'center', justifyContent:'center'}}>
            <RoomLayer store={store} sphereId={activeSphere || remoteSphere} seeStoneInSetupMode={this.state.seeStoneInSetupMode} setupData={this.setupData} />
            <Text style={overviewStyles.bottomTextNotConnected}>{'Click the Crownstone icon to add the new Crownstone to your Sphere!' }</Text>
          </View>
        </Background>
      );
    }
    else if (noStones) {
      return (
        <Background image={this.props.backgrounds.main} >
          <View style={{flex:1, alignItems:'center', justifyContent:'center'}}>
            <Icon name="c2-pluginFront" size={150} color={colors.blue.hex} style={{backgroundColor:'transparent'}} />
            <Text style={overviewStyles.mainText}>No Crownstones Added.</Text>
            <Text style={overviewStyles.subText}>Get close to a Crownstone and wait for it to appear! If it does not appear, try the recovery procedure in the settings.</Text>
          </View>
        </Background>
      );
    }
    else if (activeSphere) {
      return (
        <Background image={this.props.backgrounds.main} >
          <View style={{flex:1}}>
            <RoomLayer store={store} sphereId={activeSphere} />
            <Text style={overviewStyles.bottomText}>{'Currently in '  + state.spheres[activeSphere].config.name + '\'s Sphere.' }</Text>
          </View>
        </Background>
      );
    }
    else {
      return (
        <Background image={this.props.backgrounds.mainRemoteNotConnected} >
          <View style={{flex:1, alignItems:'center', justifyContent:'center'}}>
            <RoomLayer store={store} sphereId={remoteSphere} remote={true} />
            <Text style={overviewStyles.bottomTextNotConnected}>{'Currently viewing '  + state.spheres[remoteSphere].config.name + '\'s Sphere\s data.' }</Text>
          </View>
        </Background>
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
  },
  bottomTextNotConnected: {
    position:'absolute', bottom:10, width:screenWidth, backgroundColor:'transparent', textAlign:'center', color:colors.darkGray.hex, fontSize:12, padding:15, paddingBottom:0
  }
});