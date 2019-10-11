
import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("SettingsMeshTopologyHelp", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  ScrollView,
  Text,
  View
} from 'react-native';


import { Background } from './../components/Background'
import { colors, styles } from "./../styles";
import {screenWidth} from "../styles";
import {IconButton} from "../components/IconButton";
import {MeshElement} from "../components/MeshElement";
import { core } from "../../core";
import { TopBarUtil } from "../../util/TopBarUtil";


export class SettingsMeshTopologyHelp extends Component<any, any> {
  static options(props) {
    return TopBarUtil.getOptions({title:  lang("Mesh_Help")});
  }

  render() {
    let mockData = {deviceIcon: 'c1-studiolight', locationIcon: 'c1-cinema', locationTitle: lang("Movie_Room"), element:{config:{name:lang("Device")}}, stone:{config:{name:'Device', firmwareVersion: '2.3.0'}}};
    return (
      <Background hasNavBar={false} image={core.background.menu}>
                <ScrollView >
          <View style={{flex:1, alignItems:'center', justifyContent:'center'}}>
            <View style={{height:10}} />
            <Text style={styles.title}>{ lang("Mesh_Topology") }</Text>
            <View style={{height:20}} />
            <IconButton name="md-share" buttonSize={80} size={60}  color="#fff" buttonStyle={{backgroundColor:colors.green.hex}} />
            <View style={{height:10}} />
            <Text style={styles.explanation}>{ lang("Crownstones_can_talk_to_e") }</Text>
            <View style={{ width:screenWidth, height:120, alignItems:'center', justifyContent:'center'}}>
              <MeshElement key={"explanation1"} id={1} nodeData={mockData} pos={[0,0]} radius={50} />
            </View>
            <Text style={styles.explanation}>{ lang("Every_other_second_the_Cr") }</Text>
            <View style={{width:screenWidth, height:120, alignItems:'center', justifyContent:'center'}}>
              <MeshElement __reachableOverride={true} key={"explanation2"} id={1} nodeData={mockData} pos={[0,0]} radius={50} />
            </View>
            <Text style={styles.explanation}>{ lang("Every_second__the_backgro") }</Text>
            <View style={{width:280, height:135, alignItems:'center', justifyContent:'center', overflow:'hidden'}}>
              <MeshElement __expandOverride={true} key={"explanation2"} id={1} nodeData={mockData} pos={{x:60, y:20}} radius={30} />
            </View>
            <Text style={styles.explanation}>{ lang("The_connectivity_among_Cr") }</Text>

            <Text style={styles.header}>{ lang("Enjoy_the_Mesh_") }</Text>
            <View style={{height:100}} />
          </View>
        </ScrollView>
      </Background>
    );
  }
}