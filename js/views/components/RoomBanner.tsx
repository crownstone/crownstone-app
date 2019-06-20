
import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("RoomBanner", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  Platform,
  StyleSheet,
  Image,
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

  getLeftContent(leftRatio) {
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
    return (
      <View style={{width:screenWidth, height:ELEMENT_HEIGHT, backgroundColor: colors.white.hex, borderBottomWidth :1, borderColor: colors.menuBackground.rgba(0.2), overflow:"hidden"}}>
        <Image source={require("../../images/backgrounds/RoomBannerBackground.png")} style={{width: screenWidth, height: ELEMENT_HEIGHT, opacity: 0.7, position:'absolute', top:0, left:0}} resizeMode={"cover"} />
        <View style={{flexDirection:'row', width: screenWidth, height: ELEMENT_HEIGHT, alignItems:'center', justifyContent:'center', position:'absolute', top:0, left:0}}>
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