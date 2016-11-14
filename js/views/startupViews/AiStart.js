import React, { Component } from 'react'
import {
  Animated,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  TouchableHighlight,
  TouchableOpacity,
  Text,
  View
} from 'react-native';

var Actions = require('react-native-router-flux').Actions;

import { Background } from '../components/Background'
import { styles, colors, screenWidth, screenHeight } from '../styles'
import { Icon } from '../components/Icon';
import { TextEditInput } from '../components/editComponents/TextEditInput'
import loginStyles from './LoginStyles'

export class AiStart extends Component {
  constructor() {
    super();
    this.state = {aiName: 'Rosii', aiSex:'female'}
  }

  render() {
    let state = this.props.store.getState();
    let userFirstName = state.user.firstName;

    return (
      <Background hideTabBar={true} image={this.props.backgrounds.main}>
        <View style={[styles.centered, {flex:1}]}>
          <View style={{flex:1}} />
          <Icon name="c1-house" size={0.175*screenHeight} color={colors.menuBackground.hex} />
          <View style={{flex:1}} />
          <Text style={aiStyle.largeText}>{"Welcome " + userFirstName + "!"}</Text>
          <Text style={aiStyle.boldText}>{"I'm your house!"}</Text>
          <View style={{flex:1}} />
          <Text style={aiStyle.text}>{"What would you like to call me?"}</Text>
          <View style={[loginStyles.textBoxView, {width: 0.8*screenWidth}]}>
            <TextEditInput
              style={{width: 0.8*screenWidth, padding:10}}
              placeholder='Name your house!'
              autocorrect={false}
              placeholderTextColor='#888'
              value={this.state.aiName}
              callback={(newValue) => {this.setState({aiName:newValue});}} />
          </View>
          <View style={{flex:1}} />
          <Text style={aiStyle.text}>{"What's my gender?"}</Text>
          <View style={{flexDirection:'row', paddingBottom:10}}>
            <View style={{flex:1}} />
            <TouchableOpacity onPress={() => {this.setState({aiSex:'male'});}}>
              <Icon name="c1-male" size={0.2*screenWidth} color={this.state.aiSex === 'male' ? colors.menuBackground.hex : colors.menuBackground.rgba(0.15)} />
            </TouchableOpacity>
            <View style={{flex:1}} />
            <TouchableOpacity onPress={() => {this.setState({aiSex:'female'});}}>
              <Icon name="c1-female" size={0.2*screenWidth} color={this.state.aiSex === 'female' ? colors.menuBackground.hex : colors.menuBackground.rgba(0.15)} />
            </TouchableOpacity>
            <View style={{flex:1}} />
          </View>
          <View style={{flex:1}} />
          <TouchableOpacity style={aiStyle.button} onPress={() => { this.handleAnswer(userFirstName); }}>
            <Text style={aiStyle.boldText}>{"OK"}</Text>
          </TouchableOpacity>
          <View style={{flex:1}} />
        </View>
      </Background>
    );
  }

  handleAnswer(userFirstName) {
    let name = this.state.aiName;
    name.replace(" ","");

    if (name.length === 0) {
      Alert.alert("Ehmm " + userFirstName + ".. :(", "I'd really like a name... Could you give me one please?", [{text:"Right Away!"}])
    }
    else {
      Alert.alert("Thank you!", "It's nice to meet you too!", [{text:"Let's get started!", onPress:() => {
        let sphereId = this.props.sphereId || Object.keys(this.props.store.getState().spheres)[0];
        this.props.store.dispatch({type:'USER_UPDATE', data: {isNew: false}});
        this.props.store.dispatch({type:'UPDATE_SPHERE_CONFIG', sphereId: sphereId, data: {aiName: this.state.aiName, aiSex: this.state.aiSex}});
        if (this.props.canGoBack === true) {
          Actions.pop();
        }
        else {
          Actions.tabBar();
        }
      }}])

    }
  }
}


let aiStyle = StyleSheet.create({
  text: {
    fontSize:16, backgroundColor:'transparent', color:colors.menuBackground.hex, padding:10
  },
  boldText: {
    fontSize:16, fontWeight:'bold', backgroundColor:'transparent', color:colors.menuBackground.hex, padding:10
  },
  largeText: {
    fontSize:30, fontWeight:'bold', backgroundColor:'transparent', color:colors.menuBackground.hex
  },
  button: {
    borderWidth: 2, width:90, height:50, borderRadius:25, borderColor: colors.menuBackground.rgba(0.75), alignItems:'center', justifyContent:'center'
  }
});

