import React, { Component } from 'react' 
import {
  Dimensions,
  Image,
  PixelRatio,
  StyleSheet,
  Text,
  View
} from 'react-native';

import { styles, colors, screenWidth} from '../styles'
import { ProfilePicture } from './ProfilePicture'
import { Icon } from './Icon'

export class RoomBanner extends Component {
  getPresentUsers() {
    if (this.props.presentUsers.length === 0)
      return (
        <View>
          <Text style={styles.roomImageText}>Nobody Present</Text>
        </View>
      );
    else {
      let user = this.props.presentUsers[0]
      return (
        <View>
          <ProfilePicture picture={user.picture} size={30} innerSize={33} name={user.data.firstName} />
        </View>
      );
    }
  }

  render() {
    let height = 100;
    let leftRatio = 0.5;
    let rightRatio = 0.30;
    let offset = 0.1*height;

    // usage is null
    if (this.props.noCrownstones === true) {
      leftRatio = 0.95;
      return (
        <View style={{width:screenWidth, height:height, backgroundColor: this.props.color || colors.green.hex, justifyContent:'center'}}>
          <View style={{flexDirection:'row'}}>
            <View style={{height:0.7*height, width: leftRatio*screenWidth, backgroundColor:'transparent'}}>
              <View style={[bannerStyles.whiteLeft, {height: 0.5*height, width:(leftRatio-0.05)*screenWidth+offset}]} />
              <View style={[bannerStyles.blueLeft,  {height: 0.5*height, width:(leftRatio-0.05)*screenWidth, top: offset}]}>
                {this.getPresentUsers()}
              </View>
            </View>
          </View>
        </View>
      );
    }
    else if (this.props.floatingCrownstones === true) {
      return (
        <View style={{width:screenWidth, height:height, backgroundColor: this.props.color || colors.blue.hex, justifyContent:'center'}}>
          <View style={{flexDirection:'row'}}>
            <Icon name="c2-pluginFront" size={100} color={colors.green.hex} style={{position:'absolute', backgroundColor:'transparent', top:-25, left:105}} />
            <Icon name="c2-pluginFront" size={100} color={colors.orange.hex} style={{position:'absolute',backgroundColor:'transparent', top:20, left:175}} />
            <Icon name="c2-pluginFront" size={160} color="#fff" style={{position:'absolute', backgroundColor:'transparent', top:-32, left:-30}} />

            <View style={{flex:1}} />
            <View style={{height:0.7*height, width: rightRatio*screenWidth, backgroundColor:'transparent', alignItems:'flex-end'}}>
              <View style={[bannerStyles.whiteRight, {height: 0.5*height, width:(rightRatio-0.05) * screenWidth+offset}]} />
              <View style={[bannerStyles.blueRight,  {height: 0.5*height, width:(rightRatio-0.05) * screenWidth, top: offset}]}>
                <Text style={bannerStyles.roomImageText}>{this.props.usage + ' W'} </Text>
              </View>
            </View>
          </View>
        </View>
      );
    }
    else {
      return (
        <View style={{width:screenWidth, height:height, backgroundColor: this.props.color || colors.green.hex, justifyContent:'center'}}>
          <View style={{flexDirection:'row'}}>
            <View style={{height:0.7*height, width: leftRatio*screenWidth, backgroundColor:'transparent'}}>
              <View style={[bannerStyles.whiteLeft, {height:0.5*height, width:(leftRatio-0.05)*screenWidth+offset}]} />
              <View style={[bannerStyles.blueLeft,  {height: 0.5*height, width:(leftRatio-0.05)*screenWidth, top: offset}]}>
                {this.getPresentUsers()}
              </View>
            </View>
            <View style={{flex:1}} />
            <View style={{height:0.7*height, width: rightRatio*screenWidth, backgroundColor:'transparent', alignItems:'flex-end'}}>
              <View style={[bannerStyles.whiteRight, {height: 0.5*height, width:(rightRatio-0.05) * screenWidth+offset}]} />
              <View style={[bannerStyles.blueRight,  {height: 0.5*height, width:(rightRatio-0.05) * screenWidth, top: offset}]}>
                <Text style={bannerStyles.roomImageText}>{this.props.usage + ' W'} </Text>
              </View>
            </View>
          </View>
        </View>
      );
    }


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
    backgroundColor:colors.menuBackground.hex,
    alignItems:'center',
    justifyContent:'center'
  },
  blueRight: {
    position:'relative',
    backgroundColor:colors.menuBackground.hex,
    alignItems:'center',
    justifyContent:'center'
  },
  roomImageText:{
    fontSize:17,
    fontWeight: 'bold',
    color:'#ffffff',
  },
});