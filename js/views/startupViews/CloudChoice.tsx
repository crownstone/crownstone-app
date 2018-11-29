
import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("CloudChoice", key)(a,b,c,d,e);
}
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
      <Background background={require('../../images/mainBackground.png')}>
        <View style={styles.shadedStatusBar} />
        <View style={setupStyle.lineDistance} />
        <Text style={[setupStyle.h3, styles.centered, {flex:1,textAlign:'center'}]}>{ lang("PLEASE_SELECT") }</Text>
        <TouchableOpacity style={{paddingLeft:30, paddingRight:30}}>
          <View style={styles.rowCentered}>
            <Icon name="c1-cloud3" size={100} color="#fff" style={{backgroundColor:'transparent'}} />
            <View style={[{flexDirection:'column', flex:1}, styles.centered]}>
              <Text style={setupStyle.text}>{ lang("Use_the_Cloud_to_store_da") }</Text>
            </View>
          </View>
          <Text style={choiceStyle.smallText}>{ lang("The_cloud_is_used_to_allo") }</Text>
        </TouchableOpacity>
        <View style={{flex:1}} />
        <TouchableOpacity style={{paddingLeft:30, paddingRight:30}}>
          <View style={styles.rowCentered}>
            <Icon name="c1-hdd2" size={60} color="#fff" style={{margin:20,backgroundColor:'transparent'}} />
            <View style={[{flexDirection:'column', flex:1}, styles.centered]}>
              <Text style={setupStyle.text}>{ lang("Only_store_data_on_your_p") }</Text>
            </View>
          </View>
          <Text style={choiceStyle.smallText}>{ lang("If_you_are_the_only_user_") }</Text>
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