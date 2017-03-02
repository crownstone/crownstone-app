import * as React from 'react'; import { Component } from 'react';
import {
  Alert,
  Dimensions,
  TouchableHighlight,
  PixelRatio,
  ScrollView,
  Switch,
  Text,
  View
} from 'react-native';


import { Background } from './../components/Background'
import { Util } from '../../util/Util'
import { styles, colors, screenWidth } from './../styles'
import {IconCircle} from "../components/IconCircle";


let floatingNetworkKey = '__null';

export class SettingsMeshOverview extends Component<any, any> {
  unsubscribeStoreEvents : any;

  componentDidMount() {
    this.unsubscribeStoreEvents = this.props.eventBus.on("databaseChange", (data) => {
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
    let networksAvailable = Object.keys(networks);
    let networkElements = [];

    networksAvailable.forEach((networkKey, i) => {
      networkElements.push(<Network
        key={"network_" + i}
        label={networkKey === floatingNetworkKey? 'Unconnected:' : 'Network #' + networkKey + ':'}
        data={networks[networkKey]}
        connected={networkKey !== floatingNetworkKey}
      />)
    });

    if (networksAvailable.length < 2) {
      return (
        <View style={{flex:1, alignItems:'center'}}>
          <View style={{flex:1, flexDirection:'row', width: 270 * networksAvailable.length}}>
            {networkElements}
          </View>
        </View>
      );
    }
    else {
      return (
        <ScrollView horizontal={true} style={{flex:1}}>
          <View style={{flex:1, flexDirection:'row', width: 270 * networksAvailable.length}}>
            {networkElements}
          </View>
        </ScrollView>
      );
    }

  }


  render() {
    const store = this.props.store;
    const state = store.getState();
    let sphereId = Util.data.getPresentSphere(state) || Object.keys(state.spheres)[0];
    let sphere = state.spheres[sphereId];
    let locationIds = Object.keys(state.spheres[sphereId].locations);
    locationIds.push(null); // to account for all floating crownstones

    let networks = {};

    // collect all mesh networks
    locationIds.forEach((locationId) => {
      let stonesInLocation = Util.data.getStonesInLocationArray(state, sphereId, locationId);
      stonesInLocation.forEach((stone) => {
        let key = stone.config.meshNetworkId || floatingNetworkKey;
        if (networks[key] === undefined) {
          networks[key] = [];
        }
        networks[key].push({
          location: locationId === null ? null : state.spheres[sphereId].locations[locationId],
          element: Util.data.getElement(sphere, stone)
        });
      });
    });


    // refine to hide networks with only one contestant
    let networkKeys = Object.keys(networks);
    networkKeys.forEach((networkKey) => {
      if (networks[networkKey].length === 1 && networkKey !== floatingNetworkKey) {
        networks[floatingNetworkKey].push(networks[networkKey][0]);
        delete networks[networkKey];
      }
    });

    // get the final network keys
    networkKeys = Object.keys(networks);

    return (
      <Background image={this.props.backgrounds.main}>
        <ScrollView>
          <Text style={{
            backgroundColor:'transparent',
            fontSize:16,
            fontWeight:'500',
            color: colors.menuBackground.hex,
            textAlign:'center',
            padding:20,
          }}>
            {"Here you can see which Crownstones in your Sphere are connected via the Mesh."}
          </Text>
          <Text style={{
            backgroundColor:'transparent',
            fontSize:14,
            fontWeight:'300',
            color: colors.menuBackground.hex,
            textAlign:'center',
            padding:20,
            paddingTop:0,
            paddingBottom:10,
          }}>
            {"It can take some time for me to hear what is connected to what. Make sure your phone is near Crownstones to hear they are connected to. If one Crownstone cannot see the others, try moving it closer to the nearest one."}
          </Text>
          { networkKeys.length === 1 && networkKeys[0] === floatingNetworkKey ? undefined :
            <Text style={{
              backgroundColor:'transparent',
              fontSize:16,
              fontWeight:'500',
              color: colors.menuBackground.hex,
              textAlign:'center',
              paddingTop:0,
              paddingBottom:5,
            }}>
              {"Mesh Networks:"}
            </Text>
          }
          { this.getNetworks(networks) }
        </ScrollView>
      </Background>
    );
  }
}


export class Network extends Component<any, any> {
  padding : number = 10;

  getStones() {
    let items = [];
    let width = 250 - 2 * this.padding;
    this.props.data.forEach((dataPoint, i) => {
      items.push(
        <View key={'items'+i} style={{width: width, flexDirection:'row', alignItems:'center', justifyContent:'flex-start', position:'relative', left:-5}}>
          <IconCircle icon={dataPoint.location ? dataPoint.location.config.icon : 'c2-pluginFilled'} size={50} backgroundColor={colors.green.hex} color={colors.csBlue.hex} borderColor={colors.csBlue.hex} style={{position:'relative', top:0, left:10}} />
          <IconCircle icon={dataPoint.element.config.icon}  size={40} backgroundColor={colors.csBlue.hex} color="#fff" borderColor={colors.csBlue.hex} />
          <Text style={{paddingLeft:5, backgroundColor:'transparent'}}>{dataPoint.element.config.name}</Text>
        </View>
      );
      if (this.props.connected !== false) {
        items.push(
          <View key={'spacer'+i} style={{flexDirection:'row',width: width, height: 50, alignItems:'center', justifyContent:'center'}} />
        );
      }
      else {
        items.push(<View key={'spacer'+i} style={{height: 20}}/>);
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
      let height = 100 * (this.props.data.length-1);
      return (
        <View style={{position:'absolute', top: 60, left: offset, width: 100, height: height}}>
          <View style={{position:'absolute', backgroundColor: colors.csBlue.rgba(0.05), top: 0, left: 25 - 0.5*w2, width: w2, height: height}} />
          <View style={{position:'absolute', backgroundColor: colors.csBlue.rgba(0.05), top: 0, left: 60 - 0.5*w1, width: w1, height: height}} />
          <View style={{position:'absolute', backgroundColor: colors.white.hex,         top: 0, left: 25 - 0.5*w3, width: w3, height: height}} />
          <View style={{position:'absolute', backgroundColor: colors.white.hex,         top: 0, left: 60 - 0.5*w2, width: w2, height: height}} />
        </View>
      );
    }
    return undefined;
  }

  render() {
    return (
      <View style={{
        marginLeft: 10,
        marginTop: 10,
        padding: this.padding,
        flexDirection:'column',
        alignItems:'center',
        borderColor:  colors.white.rgba(0.8),
        borderWidth:  3,
        borderRadius: 8,
        backgroundColor: colors.white.rgba(0.35),
      }}>
        {this.getConnector()}
        <Text style={{backgroundColor:'transparent', paddingBottom:10}}>{this.props.label}</Text>
        <View style={{paddingBottom: 5}}>
          { this.getStones() }
        </View>
      </View>
    );

  }
}