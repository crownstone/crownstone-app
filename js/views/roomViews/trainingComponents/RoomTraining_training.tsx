import * as React from 'react'; import { Component } from 'react';
import {
  Animated,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  TouchableHighlight,
  TouchableOpacity,
  Text,
  View,
  Vibration
} from 'react-native';

import { TopBar } from '../../components/Topbar'
import { styles, colors, screenWidth, screenHeight } from '../../styles'
import { Icon } from '../../components/Icon';

import { Svg, Circle } from 'react-native-svg';
import {ProgressCircle} from "../../components/ProgressCircle";


export class RoomTraining_training extends Component<any, any> {
  render() {
    let icons = ['c1-locationPin1','ios-outlet-outline','ios-pin-outline','c1-brain','c1-male','c1-female'];

    return (
      <View style={{flex:1}}>
        <TopBar
          left={"Cancel"}
          notBack={true}
          leftAction={() => {this.props.cancel()}}
          title="Train Room"/>
        <View style={{flexDirection:'column', flex:1}}>
          <View style={{padding:30, alignItems:'center'}}>
            <Text style={{
              backgroundColor:'transparent',
              fontSize:20,
              fontWeight:'600',
              color: colors.menuBackground.hex,
              textAlign:'center'
            }}>{"Walk around the room so " + this.props.ai.name + " can learn to locate you within it. Each beat " + this.props.ai.he + " learns a bit more about the room!"}</Text>
          </View>

          <View style={{flex:1}} />

          <View style={{flex:1, alignItems:'center', justifyContent:'center', marginTop:-40}} >

            <View style={{width:0.5*screenWidth, height:0.5*screenWidth}}>
              <View>
                <View style={{position: 'absolute', top:0}}>
                  <View style={{backgroundColor:'#fff', width:0.5*screenWidth, height:0.5*screenWidth, borderRadius:0.25*screenWidth}} />
                </View>
                <View style={{position: 'absolute', top:0}}>
                  <ProgressCircle
                    radius={0.25*screenWidth}
                    borderWidth={10}
                    color={colors.lightBlue.hex}
                    progress={this.props.progress}
                  />
                </View>
                <View style={{position: 'absolute', top:0}}>
                  <View style={{backgroundColor:'transparent', width:0.5*screenWidth, height:0.5*screenWidth, borderRadius:0.25*screenWidth}} />
                  <Animated.View style={{marginTop: -0.5*screenWidth, opacity:this.props.opacity, backgroundColor:colors.green.hex, width:0.5*screenWidth, height:0.5*screenWidth, borderRadius:0.25*screenWidth, alignItems:'center', justifyContent:'center'}}>
                    <Icon name={icons[this.props.iconIndex]} size={0.3*screenWidth} color="#fff" style={{backgroundColor:'transparent'}} />
                  </Animated.View>
                  <View style={{backgroundColor:'transparent', marginTop: -0.5*screenWidth, width:0.5*screenWidth, height:0.5*screenWidth, borderRadius:0.25*screenWidth,  alignItems:'center', justifyContent:'center'}}>
                    <Text style={{backgroundColor:'transparent', fontSize:22, fontWeight:'200'}}>{this.props.progress > 0 ? Math.round(100*this.props.progress) + "%" : this.props.text}</Text>
                  </View>
                </View>
              </View>


            </View>
          </View>

          <View style={{flex:1}} />
        </View>
        </View>
    );
  }
}
