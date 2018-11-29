
import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("ZoomInstructionOverlay", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Image,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableHighlight,
  TouchableOpacity,
  Text,
  View
} from 'react-native';
import {OverlayBox} from "../components/overlays/OverlayBox";
import {WNStyles} from "../overlays/WhatsNew/WhatsNewStyles";
import {availableScreenHeight, colors, screenWidth, styles} from "../styles";



export class ZoomInstructionOverlay extends Component<any, any> {

  render() {
    let factor = 0.0001*screenWidth;
    let size = 8*factor;

    return (
      <OverlayBox
        visible={this.props.visible}
        overrideBackButton={true}
        wrapperStyle={{height: availableScreenHeight}}
        canClose={true}
        height={availableScreenHeight - 90}
        style={{padding:0}}
        closeCallback={this.props.closeCallback}
      >
        <View style={{flex:1, paddingBottom:0, padding:10, alignItems:'center', justifyContent:'center'}}>
          <ScrollView style={{}}>
            <View style={WNStyles.innerScrollView}>
              <Text style={{
                fontSize: 17,
                fontWeight:'bold',
                backgroundColor:'transparent',
                color:colors.csBlue.hex,
                textAlign:'center',
                paddingLeft:30, paddingRight:30,
                marginTop:25,
                marginBottom:25,
                overflow:'hidden'
              }}>{ lang("You_can_go_to_the_sphere_") }</Text>
              <Image source={require('../../images/tutorial/zoomForSphereOverview.png')} style={{width:564*size, height:851*size}} />
              <View style={{height:30}} />
              <Text style={WNStyles.detail}>{ lang("Youll_have_to_do_this_onc") }</Text>
              <View style={{height:30}} />
              <TouchableOpacity
                onPress={() => { this.props.closeCallback(); }}
                style={[styles.centered, {
                  width: 0.4 * screenWidth,
                  height: 36,
                  borderRadius: 18,
                  borderWidth: 2,
                  borderColor: colors.blue.rgba(0.5),
                }]}
              >
                <Text style={{fontSize: 15, color: colors.blue.hex}}>{ lang("Ill_try_it_") }</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </OverlayBox>
    );
  }

}
