import * as React from 'react'; import { Component } from 'react';
import {
  Button,
  ScrollView,
  Switch,
  Text, TouchableOpacity,
  View
} from "react-native";


import { colors, screenHeight, screenWidth, styles } from "../../../styles";
import {Background} from "../../../components/Background";
import {IconButton} from "../../../components/IconButton";
import {ScaledImage} from "../../../components/ScaledImage";
import { core } from "../../../../core";
import { TopBarUtil } from "../../../../util/TopBarUtil";
import { Separator } from "../../../components/Separator";
import { ButtonBar } from "../../../components/editComponents/ButtonBar";
import { NavigationUtil } from "../../../../util/NavigationUtil";
import { NavigationBar } from "../../../components/editComponents/NavigationBar";


export class Ability_SwitchcraftSettings extends Component<any, any> {
  static options(props) {
    return TopBarUtil.getOptions({title: "Switchcraft Settings"});
  }

  disable() {
    core.store.dispatch({type:"UPDATE_ABILITY_SWITCHCRAFT", sphereId: this.props.sphereId, stoneId: this.props.stoneId, data: { enabledTarget: false, synced:false }});
    NavigationUtil.back();
  }

  render() {
    return (
      <Background hasNavBar={false} image={core.background.lightBlurLighter}>
        <ScrollView >
          <View style={{flex:1, alignItems:'center', justifyContent:'center'}}>
            <View style={{height:40}} />
            <ScaledImage source={require('../../../../images/overlayCircles/switchcraft.png')} sourceWidth={600} sourceHeight={600} targetWidth={0.2*screenHeight} />
            <View style={{height:40}} />
            <Text style={styles.boldExplanation}>{ "This Crownstone is configured to use Switchcraft. Ensure that the wall switch that is switching it has the Switchcraft modification applied." }</Text>
            <Text style={styles.explanation}>{ "Tap the installation & information button for instructions for modifying your wall switch." }</Text>
            <Text style={styles.explanation}>{ "Swichcraft should only be enabled for Crownstones connected to a physical wall switch." }</Text>
            <View style={{height:10}} />
            <View style={{width:screenWidth}}>
              <Separator fullLength={true} />
              <NavigationBar
                setActiveElement={()=>{ }}
                largeIcon={<IconButton name="md-information-circle" buttonSize={44} size={30} radius={10} color="#fff" buttonStyle={{backgroundColor: colors.green.hex}} />}
                label={"Installation & Information"}
                callback={() => { this.props.information(); }}
              />
              <Separator  />
              <ButtonBar
                setActiveElement={()=>{ }}
                largeIcon={<IconButton name="md-remove-circle" buttonSize={44} size={30} radius={10} color="#fff" buttonStyle={{backgroundColor: colors.menuRed.hex}} />}
                label={"Disable Switchcraft"}
                callback={() => { this.disable() }}
              />
              <Separator fullLength={true} />
            </View>
            <View style={{height:100}} />
          </View>
        </ScrollView>
      </Background>
    )
  }
}