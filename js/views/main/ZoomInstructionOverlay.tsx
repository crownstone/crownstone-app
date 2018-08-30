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
        }}>You can go to the sphere overview just by zooming out!</Text>
        <View style={{flex:1, paddingBottom:0, padding:10, alignItems:'center', justifyContent:'center'}}>
          <ScrollView style={{}}>
            <View style={WNStyles.innerScrollView}>
              <Image source={require('../../images/tutorial/zoomForSphereOverview.png')} style={{width:564*size, height:851*size}} />
              <View style={{height:30}} />
              <Text style={WNStyles.detail}>{
                "You'll have to do this once to get rid of this pop up!"
              }</Text>
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
                <Text style={{fontSize: 15, color: colors.blue.hex}}>{"I'll try it!"}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </OverlayBox>
    );
  }

}
