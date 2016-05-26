import React, { Component } from 'react' 
import {
  
  Dimensions,
  Image,
  PixelRatio,
  StyleSheet,
  Text,
  View
} from 'react-native';

import { styles, colors} from '../styles'

export class RoomBanner extends Component {
  _getPresenceData() {
    if (this.props.presence.length === 0)
      return (
        <View>
          <Text style={styles.roomImageText}>Nobody Present</Text>
        </View>
      );
    else {
      return (
        <View>
          <Text style={styles.roomImageText}>TODO: GET ICONS</Text>
        </View>
      );
    }
  }

  render() {
    let pxRatio = PixelRatio.get();
    let width = Dimensions.get('window').width;
    let height = 50*pxRatio;

    let leftRatio = 0.5;
    let rightRatio = 0.30;
    let offset = 0.1*height;

    return (
      <View style={{width:width, height:height, backgroundColor: this.props.color || colors.green.h, justifyContent:'center'}}>
        <View style={{flexDirection:'row'}}>
          <View style={{height:0.7*height, width: leftRatio*width, backgroundColor:'transparent'}}>
            <View style={[bannerStyles.whiteLeft, {height:0.5*height, width:(leftRatio-0.05)*width+offset}]} />
            <View style={[bannerStyles.blueLeft,  {height: 0.5*height, width:(leftRatio-0.05)*width, top: offset}]}>
              {this._getPresenceData()}
            </View>
          </View>
          <View style={{flex:1}} />
          <View style={{height:0.7*height, width: rightRatio*width, backgroundColor:'transparent', alignItems:'flex-end'}}>
            <View style={[bannerStyles.whiteRight, {height: 0.5*height, width:(rightRatio-0.05) * width+offset}]} />
            <View style={[bannerStyles.blueRight,  {height: 0.5*height, width:(rightRatio-0.05) * width, top: offset}]}>
              <Text style={bannerStyles.roomImageText}>{this.props.usage} W</Text>
            </View>
          </View>
        </View>
      </View>
    );
  }
}


export const bannerStyles = StyleSheet.create({
  whiteLeft: {
    position:'absolute',
    bottom:0,
    left:0,
    backgroundColor:'white'
  },
  whiteRight: {
    position:'absolute',
    top:0,
    right:0,
    backgroundColor:'white'
  },
  blueLeft: {
    position:'relative',
    backgroundColor:colors.menuBackground.h,
    alignItems:'center',
    justifyContent:'center'
  },
  blueRight: {
    position:'relative',
    backgroundColor:colors.menuBackground.h,
    alignItems:'center',
    justifyContent:'center'
  },
  roomImageText:{
    fontSize:17,
    fontWeight: 'bold',
    color:'#ffffff',
  },
});