/*import * as React from 'react'; import { Component } from 'react';
import {
  Dimensions,
  StyleSheet,
  TouchableOpacity,
  Text,
  View
} from 'react-native';

import { setupStyle, CancelButton } from '../setupViews/SetupShared'
var Actions = require('react-native-router-flux').Actions;


import { Background } from '../components/Background'
import { styles, colors} from '../styles'
import { Icon } from '../components/Icon';

/**
 * CURRENTLY DISABLED
 */
/*
export class CloudChoice extends Component<any, any> {
  render() {
    return (
      <Background hideInterface={true} background={require('../../images/mainBackground.png')}>
        <View style={styles.shadedStatusBar} />
        <View style={setupStyle.lineDistance} />
        <Text style={[setupStyle.h3, styles.centered, {flex:1,textAlign:'center'}]}>PLEASE SELECT</Text>
        <TouchableOpacity style={{paddingLeft:30, paddingRight:30}}>
          <View style={styles.rowCentered}>
            <Icon name="c1-cloud3" size={100} color="#fff" style={{backgroundColor:'transparent'}} />
            <View style={[{flexDirection:'column', flex:1}, styles.centered]}>
              <Text style={setupStyle.text}>Use the Cloud to store data</Text>
            </View>
          </View>
          <Text style={choiceStyle.smallText}>The cloud is used to allow multiple users to use your Crownstones. Crownstones, spheres, rooms are stored in the cloud and synces across devices.</Text>
        </TouchableOpacity>
        <View style={{flex:1}} />
        <TouchableOpacity style={{paddingLeft:30, paddingRight:30}}>
          <View style={styles.rowCentered}>
            <Icon name="c1-hdd2" size={60} color="#fff" style={{margin:20,backgroundColor:'transparent'}} />
            <View style={[{flexDirection:'column', flex:1}, styles.centered]}>
              <Text style={setupStyle.text}>Only store data on your phone</Text>
            </View>
          </View>
          <Text style={choiceStyle.smallText}>If you are the only user, you can run everything locally. If you uninstall your app, you'll need to physically reset all your Crownstones.</Text>
        </TouchableOpacity>
        <View style={{flex:1}} />
      </Background>
    )
  }
}

export const choiceStyle = StyleSheet.create(
  {
    smallText: {
      backgroundColor:'transparent',
      color:'#fff',
      fontSize: 13,
      textAlign:'center',
      fontWeight:'400',
    }
  }
);
*/