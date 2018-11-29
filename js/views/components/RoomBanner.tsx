
import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("RoomBanner", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  Dimensions,
  Image,
  PixelRatio,
  Platform,
  StyleSheet,
  Text,
  View
} from 'react-native';

import { styles, colors, screenWidth} from '../styles'
import { ProfilePicture } from './ProfilePicture'
import { Icon } from './Icon'


let LEFT_RATIO = 0.5;
let RIGHT_RATIO = 0.30;
let ELEMENT_HEIGHT = 100;
let ELEMENT_OFFSET = 0.1*ELEMENT_HEIGHT;

export class RoomBanner extends Component<any, any> {
  getOverlayContent() {
    if (this.props.overlayText !== undefined) {
      return <Text style={styles.roomImageText}>{this.props.overlayText}</Text>;
    }
    else if (this.props.viewingRemotely === true) {
      return <Text style={styles.roomImageText}>{ lang("Not_in_Sphere") }</Text>;
    }
    else if (this.props.canDoLocalization === true) {
      if (this.props.presentUsers.length === 0) {
        return <Text style={styles.roomImageText}>{ lang("Nobody_Present") }</Text>;
      }
      else {
        let users = [];
        let presentUsers = this.props.presentUsers;
        let maxVisible = 3;
        for (let i = 0; i < presentUsers.length && i < maxVisible; i++) {
          let user = presentUsers[i];
          if (user && user.data) {
            users.push(
              <ProfilePicture
                key={user.id + 'roomFace' + i}
                picture={user.data.picture}
                size={30}
                innerSize={30}
                name={user.data.firstName}
                style={{position: 'relative', top: Platform.OS === 'android' ? 0 : 2, padding: 2}}
              />
            );
          }
        }
        if (this.props.presentUsers.length > maxVisible) {
          users.push(<View key={'roomNumberIndicator'} style={[{
            width: 30,
            height:30,
            padding:2,
            backgroundColor:colors.white.hex,
            borderRadius:0.5*30,
          }, styles.centered]}>
            <Text style={{color:colors.menuBackground.hex, fontSize:15}}>{'+' + (presentUsers.length - maxVisible)}</Text>
          </View>);
        }
        return users;
      }
    }
    else if (this.props.amountOfStonesInRoom === 0) {
      return <Text style={styles.roomImageText}>{ lang("No_Crownstones_in_this_ro") }</Text>;
    }
    else if (this.props.amountOfStonesInRoom === 1) {
      return <Text style={styles.roomImageText}>{ lang("_Crownstone",this.props.amountOfStonesInRoom) }</Text>;
    }
    else {
      return <Text style={styles.roomImageText}>{ lang("_Crownstones",this.props.amountOfStonesInRoom) }</Text>;
    }
  }

  getUsage() {
    if (this.props.viewingRemotely === true) {
      return <Icon name="ios-cloudy-night" size={30} color="#fff" style={{backgroundColor:"transparent"}} />
    }
    else if (this.props.usage !== undefined) {
      return <Text style={bannerStyles.roomImageText}>{ lang("_W",this.props.usage) }</Text>
    }
    else {
      return <Icon name="c2-crownstone" size={45} color="#fff" style={{backgroundColor:"transparent"}} />
    }

  }

  getIcons() {
    let color1 = colors.green.hex;
    let color2 = colors.darkGreen.hex;
    let color3 = colors.blue.hex;
    if (this.props.viewingRemotely === true) {
      color1 = "#fff";
      color2 = "#fff";
      color3 = "#fff";
    }

    return (
      <View style={{flexDirection:'row', height:0.7*ELEMENT_HEIGHT}}>
        <Icon name="c2-pluginFront" size={100} color={color1} style={{position:'absolute', backgroundColor:'transparent', top:-25, left:105}} />
        <Icon name="c2-pluginFront" size={100} color={color2} style={{position:'absolute', backgroundColor:'transparent', top:20,  left:175}} />
        <Icon name="c2-pluginFront" size={160} color={color3} style={{position:'absolute', backgroundColor:'transparent', top:-32, left:-30}} />
      </View>
    )
  }

  getLeftContent(leftRatio) {
    if (this.props.floatingCrownstones === true && this.props.overlayText === undefined) {
      return this.getIcons();
    }

    return (
      <View style={{height:0.7*ELEMENT_HEIGHT, width: leftRatio*screenWidth, backgroundColor:'transparent'}}>
        <View style={[bannerStyles.whiteLeft, {height: 0.5*ELEMENT_HEIGHT, width:(leftRatio-0.05)*screenWidth+ELEMENT_OFFSET}]} />
        <View style={[bannerStyles.blueLeft,  {height: 0.5*ELEMENT_HEIGHT, width:(leftRatio-0.05)*screenWidth, top: ELEMENT_OFFSET, flexDirection:'row'}]}>
          {this.getOverlayContent()}
        </View>
      </View>
    )
  }

  getRightContent() {
    if (!(this.props.noCrownstones === true && this.props.viewingRemotely === false) && this.props.hideRight !== true) {
      return (
        <View
          style={{height:0.7*ELEMENT_HEIGHT, width: RIGHT_RATIO*screenWidth, backgroundColor:'transparent', alignItems:'flex-end'}}>
          <View
            style={[bannerStyles.whiteRight, {height: 0.5*ELEMENT_HEIGHT, width:(RIGHT_RATIO-0.05) * screenWidth+ELEMENT_OFFSET}]}/>
          <View
            style={[bannerStyles.blueRight,  {height: 0.5*ELEMENT_HEIGHT, width:(RIGHT_RATIO-0.05) * screenWidth, top: ELEMENT_OFFSET}]}>
            {this.getUsage()}
          </View>
        </View>
      )
    }
  }

  render() {
    let leftRatio = this.props.hideRight === true ? 0.95 : LEFT_RATIO;
    let backgroundColor = undefined;

    if (this.props.floatingCrownstones === true && this.props.overlayText === undefined) {
      backgroundColor = this.props.color || colors.iosBlue.rgba(0.3);
    }
    else if (this.props.noCrownstones === true && this.props.viewingRemotely === false) {
      backgroundColor = this.props.color || colors.green.rgba(0.8);
      leftRatio = 0.95;
    }
    else {
      backgroundColor = this.props.color || colors.green.rgba(0.7);
    }

    return (
      <View style={{width:screenWidth, height:ELEMENT_HEIGHT, backgroundColor: backgroundColor, justifyContent:'center', borderBottomWidth :1, borderColor: colors.menuBackground.rgba(0.2), overflow:"hidden"}}>
        <View style={{flexDirection:'row'}}>
          {this.getLeftContent(leftRatio)}
          <View style={{flex:1}} />
          {this.getRightContent()}
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