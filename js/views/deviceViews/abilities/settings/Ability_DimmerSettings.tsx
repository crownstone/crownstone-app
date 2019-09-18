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


export class Ability_DimmerSettings extends Component<any, any> {
  static options(props) {
    return TopBarUtil.getOptions({title: "Dimmer Settings"});
  }

  disable() {
    core.store.dispatch({type:"UPDATE_DIMMER", sphereId: this.props.sphereId, stoneId: this.props.stoneId, data: { targetState: false, synced:false }});
    NavigationUtil.back();
  }

  render() {
    return (
      <Background hasNavBar={false} image={core.background.lightBlurLighter}>
        <ScrollView >
          <View style={{flex:1, alignItems:'center', justifyContent:'center'}}>
            <View style={{height:40}} />
            <ScaledImage source={require('../../../../images/overlayCircles/dimmingCircleGreen.png')} sourceWidth={600} sourceHeight={600} targetWidth={0.2*screenHeight} />
            <View style={{height:40}} />
            <Text style={styles.boldExplanation}>{ "Dimming allows you to set the mood, and to use the Twilight mode behaviours." }</Text>
            <Text style={styles.explanation}>{ "It is up to you to determine which devices can be dimmed. Naturally, you wouldn't want to dim anything other than lights!" }</Text>
            <Text style={styles.explanation}>{ "The Crownstones can safely dim up to 100W." }</Text>
            <View style={{height:10}} />
            <View style={{width:screenWidth}}>
              <Separator fullLength={true} />
              <NavigationBar
                setActiveElement={()=>{ }}
                largeIcon={<IconButton name="md-information-circle" buttonSize={44} size={30} radius={10} color="#fff" buttonStyle={{backgroundColor: colors.green.hex}} />}
                label={"Dimming compatibilty"}
                callback={() => { this.props.information(); }}
              />
              <Separator  />
              <ButtonBar
                setActiveElement={()=>{ }}
                largeIcon={<IconButton name="md-remove-circle" buttonSize={44} size={30} radius={10} color="#fff" buttonStyle={{backgroundColor: colors.menuRed.hex}} />}
                label={"Disable dimming"}
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