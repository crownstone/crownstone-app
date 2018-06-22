import * as React from 'react'; import { Component } from 'react';
import {
  Image,
  StyleSheet,
  ScrollView,
  Text,
  View,
} from 'react-native';
import {screenWidth} from "../../../styles";
import {WNStyles} from "../WhatsNewStyles";


export class MeshTopology extends Component<any, any> {
  render() {
    let factor = 0.0001*screenWidth;
    let size = 12*factor;
    return (
      <View style={{flex:1, paddingBottom:0, alignItems:'center', justifyContent:'center'}}>
        <ScrollView style={[WNStyles.outerScrollView,{width: this.props.width}]}>
          <View style={WNStyles.innerScrollView}>
            <Text style={WNStyles.text}>Mesh Topology Visualization</Text>
            <Image source={require('../../../../images/whatsNew/2.1.0/meshTopology.png')} style={{width:485*size, height:722*size, marginTop: 20, marginBottom: 20}} />
            <Text style={WNStyles.detail}>We've added a visualisation of the mesh network, this feature shows you the quality of the connections between Crownstones within a mesh.</Text>
          </View>
        </ScrollView>
      </View>
    );
  }
}


