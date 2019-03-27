import { LiveComponent }          from "../LiveComponent";

import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("SettingsMeshOverview", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  Animated,
  ScrollView,
  Text,
  View
} from 'react-native';

import { Background } from './../components/Background'
import { Util } from '../../util/Util'
import {colors, screenWidth, OrangeLine} from './../styles'
import { IconCircle } from "../components/IconCircle";
import { core } from "../../core";

let FLOATING_NETWORK_KEY = '__null';

export class SettingsMeshOverview extends LiveComponent<any, any> {
  static navigationOptions = ({ navigation }) => {
    return { title: lang("Mesh_Overview")}
  };

  unsubscribeStoreEvents : any;
  lastOffset : number = null;

  constructor(props) {
    super(props);
    this.state = { leftOffset: new Animated.Value(0) };
  }

  componentDidMount() {
    this.unsubscribeStoreEvents = core.eventBus.on("databaseChange", (data) => {
      let change = data.change;
      if ( change.meshIdUpdated ) {
        this.forceUpdate();
      }
    });
  }

  componentWillUnmount() {
    this.unsubscribeStoreEvents();
  }


  getNetworks(networks) {
    let networksAvailable = Object.keys(networks).sort((a,b) => {return a > b ? -1 : 1});
    let networkElements = [];
    networksAvailable.forEach((networkKey) => {
      networkElements.push(<Network
        key={networkKey}
        label={networkKey === FLOATING_NETWORK_KEY ? lang("not_in_mesh") : lang("network", networkKey) }
        data={networks[networkKey]}
        connected={networkKey !== FLOATING_NETWORK_KEY}
      />)
    });

    let offset = 0;
    let networkWidth = 300 * networkElements.length;
    if (networkElements.length < 2) {
      offset = screenWidth * 0.5 - networkWidth * 0.5;
    }

    if (this.lastOffset === null) {
      this.state.leftOffset.setValue(offset);
    }
    else {
      Animated.timing(this.state.leftOffset, {toValue: offset, duration: 400}).start();
    }
    this.lastOffset = offset;

    return (
      <ScrollView horizontal={true} style={{flex:1}}>
        <Animated.View style={{flex:1, flexDirection:'row', width: networkWidth, position:'relative', left: this.state.leftOffset, paddingBottom: 30 }}>
          {networkElements}
        </Animated.View>
      </ScrollView>
    );
  }

  render() {
    const store = core.store;
    const state = store.getState();
    let sphereId = state.app.activeSphere || Util.data.getPresentSphereId(state) || Object.keys(state.spheres)[0];
    let locationIds = Object.keys(state.spheres[sphereId].locations);
    locationIds.push(null); // to account for all floating crownstones

    let networks = {};

    // collect all mesh networks
    locationIds.forEach((locationId) => {
      let stonesInLocation = Util.data.getStonesInLocationArray(state, sphereId, locationId);
      stonesInLocation.forEach((stone) => {
        let key = stone.config.meshNetworkId || FLOATING_NETWORK_KEY;
        if (networks[key] === undefined) {
          networks[key] = [];
        }
        networks[key].push({
          location: locationId === null ? null : state.spheres[sphereId].locations[locationId],
          element: Util.data.getElement(core.store, sphereId, null, stone) // we get away with using no stone id since it is only used for self repair. Without ID, the self repair won't do anything.
        });
      });
    });


    // refine to hide networks with only one contestant
    let networkKeys = Object.keys(networks);
    networkKeys.forEach((networkKey) => {
      if (networks[networkKey].length === 1 && networkKey !== FLOATING_NETWORK_KEY) {
        if (networks[FLOATING_NETWORK_KEY] === undefined) {
          networks[FLOATING_NETWORK_KEY] = [];
        }

        networks[FLOATING_NETWORK_KEY].push(networks[networkKey][0]);
        delete networks[networkKey];
      }
    });

    // get the final network keys
    networkKeys = Object.keys(networks);

    return (
      <Background image={core.background.detailsDark}>
        <OrangeLine/>
        <ScrollView>
          <Text style={{
            backgroundColor:'transparent',
            fontSize:16,
            fontWeight:'500',
            color: colors.white.hex,
            textAlign:'center',
            padding:20,
          }}>{ lang("Here_you_can_see_which_Cr") }</Text>
          <Text style={{
            backgroundColor:'transparent',
            fontSize:14,
            fontWeight:'300',
            color: colors.white.hex,
            textAlign:'center',
            padding:20,
            paddingTop:0,
            paddingBottom:10,
          }}>{ lang("It_can_take_some_time_for") }</Text>
          { networkKeys.length === 1 && networkKeys[0] === FLOATING_NETWORK_KEY ? undefined :
            <Text style={{
              backgroundColor:'transparent',
              fontSize:16,
              fontWeight:'500',
              color: colors.white.hex,
              textAlign:'center',
              paddingTop:0,
              paddingBottom:5,
            }}>{ lang("Mesh_Networks_") }</Text>
          }
          { this.getNetworks(networks) }
        </ScrollView>
      </Background>
    );
  }
}


export class Network extends Component<any, any> {
  padding : number = 10;
  connectedDistance : number = 50;
  unconnectedDistance : number = 20;
  nodeHeight : number = 50;

  constructor(props) {
    super(props);

    this.state = {
      connectionLineHeight: new Animated.Value(this.getLineHeight(props)),
      height: new Animated.Value(this.getHeight(props)),
      opacity: new Animated.Value(0)
    };
  }

  componentDidMount() {
    Animated.timing(this.state.opacity, {toValue: 1, duration: 400}).start();
  }

  getLineHeight(props) {
    let dataPointsCount = props.data.length;
    return (this.connectedDistance + this.nodeHeight) * (dataPointsCount-1);
  }
  getHeight(props) {
    let dataPointsCount = props.data.length;
    let interNodeDistance = this.unconnectedDistance;
    if (props.connected !== false) {
      interNodeDistance = this.connectedDistance;
    }
    return dataPointsCount * this.nodeHeight + (dataPointsCount-1) * interNodeDistance + 50 + 10;
  }

  componentWillUpdate( nextProps, nextState ) {
    if (nextProps.remove === true) {
      Animated.timing(this.state.opacity, {toValue: 0, duration: 200}).start();
      return;
    }

    let currentHeight = this.getLineHeight(this.props);
    let newHeight = this.getLineHeight(nextProps);

    if (currentHeight !== newHeight) {
      let fullHeight = this.getHeight(nextProps);

      Animated.timing(this.state.height, {toValue: fullHeight, duration: 400}).start();
      Animated.timing(this.state.connectionLineHeight, {toValue: newHeight, duration: 400}).start();
    }
  }

  getStones() {
    let items = [];
    let width = 250 - 2 * this.padding;
    this.props.data.forEach((dataPoint, i) => {
      items.push(
        <View key={'items'+i} style={{width: width, flexDirection:'row', alignItems:'center', justifyContent:'flex-start', position:'relative', left:-5}}>
          <IconCircle icon={dataPoint.location ? dataPoint.location.config.icon : 'c2-pluginFilled'} size={this.nodeHeight} backgroundColor={colors.green.hex} color={colors.csBlue.hex} borderColor={colors.csBlue.hex} style={{position:'relative', top:0, left:10}} />
          <IconCircle icon={dataPoint.element.config.icon}  size={40} backgroundColor={colors.csBlue.hex} color="#fff" borderColor={colors.csBlue.hex} />
          <Text style={{paddingLeft:10, color:colors.white.hex, backgroundColor:'transparent'}}>{dataPoint.element.config.name}</Text>
        </View>
      );
      if (this.props.connected !== false) {
        items.push(
          <View key={'spacer'+i} style={{flexDirection:'row',width: width, height: this.connectedDistance, alignItems:'center', justifyContent:'center'}} />
        );
      }
      else {
        items.push(<View key={'spacer'+i} style={{height: this.unconnectedDistance}}/>);
      }
    });

    items.pop();

    return items;
  }

  getConnector() {
    if (this.props.connected !== false) {
      let offset = this.padding + 5; // 5 is the offset because of the circle overlap
      let w1 = 8;
      let w2 = 4;
      let w3 = 2;
      let w4 = 6;
      return (
        <Animated.View style={{position:'absolute', top: 60, left: offset, width: 100, height: this.state.connectionLineHeight}}>
          <Animated.View style={{position:'absolute', backgroundColor: colors.csBlue.rgba(0.05), top: 0, left: 25 - 0.5*w2, width: w2, height: this.state.connectionLineHeight }} />
          <Animated.View style={{position:'absolute', backgroundColor: colors.csBlue.rgba(0.05), top: 0, left: 60 - 0.5*w1, width: w1, height: this.state.connectionLineHeight }} />
          <Animated.View style={{position:'absolute', backgroundColor: colors.white.hex,         top: 0, left: 25 - 0.5*w3, width: w3, height: this.state.connectionLineHeight }} />
          <Animated.View style={{position:'absolute', backgroundColor: colors.white.hex,         top: 0, left: 60 - 0.5*w2, width: w2, height: this.state.connectionLineHeight }} />
        </Animated.View>
      );
    }
    return undefined;
  }

  render() {
    return (
      <Animated.View style={{
        marginLeft: 10,
        marginTop: 10,
        padding: this.padding,
        flexDirection:'column',
        alignItems:'center',
        borderColor:  colors.white.hex,
        borderWidth:  3,
        borderRadius: 8,
        backgroundColor: colors.white.rgba(0.25),
        height: this.state.height,
        opacity: this.state.opacity
      }}>
        {this.getConnector()}
        <Text style={{backgroundColor:'transparent', color:colors.white.hex, fontWeight:'500', paddingBottom:10}}>{this.props.label}</Text>
        <View style={{paddingBottom: 5}}>
          { this.getStones() }
        </View>
      </Animated.View>
    );

  }
}