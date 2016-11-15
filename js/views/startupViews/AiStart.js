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
import { styles, colors, screenWidth, screenHeight, topBarHeight } from '../styles'
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

    let availableHeight = screenHeight - topBarHeight - 3*16 - 30 - 50 - 50;

    return (
      <Background hideTabBar={true} image={this.props.backgrounds.main}>
        <View style={[styles.centered, {flex:1}]}>
          <View style={{flex:1}} />
          <Icon name="c1-house" size={0.26*availableHeight} color={colors.menuBackground.hex} />
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
              <Icon name="c1-male" size={0.21*availableHeight} color={this.state.aiSex === 'male' ? colors.menuBackground.hex : colors.menuBackground.rgba(0.15)} />
            </TouchableOpacity>
            <View style={{flex:1}} />
            <TouchableOpacity onPress={() => {this.setState({aiSex:'female'});}}>
              <Icon name="c1-female" size={0.21*availableHeight} color={this.state.aiSex === 'female' ? colors.menuBackground.hex : colors.menuBackground.rgba(0.15)} />
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
      let state = this.props.store.getState();
      let sphereId = this.props.sphereId || Object.keys(state.spheres)[0];
      let title = "Thank you!";
      let detail = "It's nice to finally meet you!";
      let button = "Let's get started!";
      if (this.props.canGoBack === true) {
        if (this.state.aiName === state.spheres[sphereId].config.aiName && this.state.aiSex === state.spheres[sphereId].config.aiSex) {
          detail = "I think my name and gender describe me perfectly too!";
          button = "You're right!";
        }
        else if (this.state.aiName !== state.spheres[sphereId].config.aiName && this.state.aiSex === state.spheres[sphereId].config.aiSex) {
          detail = "This name is much better, great choice!";
          button = "It suits you!";
        }
        else if (this.state.aiName === state.spheres[sphereId].config.aiName && this.state.aiSex !== state.spheres[sphereId].config.aiSex) {
          detail = "You're right! I feel much more like myself as a " + (this.state.aiSex === 'male' ? 'man' : 'woman') + '!';
          button = "I thought so too!";
        }
        else {
          detail = "I'm a like whole new person now! Hi! It's great to meet you!";
          button = "Nice to meet you too!";
        }
      }
      Alert.alert(title, detail, [{text: button, onPress:() => {
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

