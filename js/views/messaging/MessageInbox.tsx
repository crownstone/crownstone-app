import * as React from 'react'; import { Component } from 'react';
import {
  Alert,
  Animated,
  Image,
  TouchableHighlight,
  ScrollView,
  Text,
  TouchableOpacity,
  StyleSheet,
  View
} from 'react-native';

const Actions = require('react-native-router-flux').Actions;
import {availableScreenHeight, colors, screenHeight, screenWidth, tabBarHeight, topBarHeight} from '../styles'
import {Background} from "../components/Background";
import {TopBar} from "../components/Topbar";
import {IconButton} from "../components/IconButton";
import {Util} from "../../util/Util";
import {ListEditableItems} from "../components/ListEditableItems";
import {Icon} from "../components/Icon";


export class MessageInbox extends Component<any, any> {
  unsubscribeStoreEvents : any[] = [];
  unsubscribeSetupEvents : any[] = [];

  constructor() {
    super();
    this.state = {

    };
  }

  componentWillMount() {

  }

  componentDidMount() {

  }

  componentWillUnmount() {

  }

  render() {
    let state = this.props.store.getState();
    let activeSphere = state.app.activeSphere;

    if (activeSphere) {

      let iconSize = 0.14*screenHeight;

      let items = [];

      let sphere = state.spheres[activeSphere];
      let threadIds = Object.keys(sphere.messageThreads);


      let iconButton = (
        <TouchableOpacity
          onPress={() => { Actions.messageAdd({ sphereId: activeSphere }); }}
        >
          <IconButton
            name="ios-mail"
            size={iconSize*0.85}
            color="#fff"
            addIcon={true}
            buttonSize={iconSize}
            buttonStyle={{backgroundColor:colors.csBlue.hex, borderRadius: 0.2*iconSize}}
          />
        </TouchableOpacity>
      );

      let headerText = <Text style={textStyle.specification}>{'You can leave messages in a Sphere or room for your friends to find!'}</Text>;

      let scrollView;
      if (threadIds.length > 0) {
        scrollView = (
          <ScrollView style={{height: availableScreenHeight, width: screenWidth}}>
            <View style={{flex:1, minHeight: availableScreenHeight,  width: screenWidth, alignItems:'center'}}>
              <View style={{flex:0.3}} />
              { headerText }
              <View style={{flex:0.6}} />
              { iconButton }
              <View style={{flex:0.8}} />
              <Text style={{
                color: colors.green.hex,
                textAlign: 'center',
                paddingLeft: 30,
                backgroundColor:"transparent",
                paddingRight: 30,
                fontWeight: 'bold',
                fontStyle:'italic'
              }}>
                Tap the envelope icon to create a new message!
              </Text>
              <View style={{flex:2}} />
            </View>
          </ScrollView>
        );
      }
      else {
        scrollView = (
          <ScrollView style={{height: availableScreenHeight, width: screenWidth}}>
            <View style={{flex:1, minHeight: availableScreenHeight,  width: screenWidth, alignItems:'center'}}>
              <View style={{flex:0.6}} />
              { headerText }
              <View style={{flex:0.6}} />
              { iconButton }
              <View style={{flex:0.6}} />
              <Text style={{
                color: colors.green.hex,
                textAlign: 'center',
                paddingLeft: 30,
                backgroundColor:"transparent",
                paddingRight: 30,
                fontWeight: 'bold',
                fontStyle:'italic'
              }}>
                Tap the envelope icon to create a new message!
              </Text>
              <View style={{flex:2}} />
            </View>
          </ScrollView>
        );
      }

      return (
        <Background hideTopBar={true} image={this.props.backgrounds.detailsDark}>
          <TopBar title="Messages" />
          <View style={{backgroundColor: colors.csOrange.hex, height: 1, width:screenWidth}} />
          { scrollView }
        </Background>
      )
    }
    else {
      return (
        <View style={{width: screenWidth, height:screenHeight}}>
          <Text>No Sphere....</Text>
        </View>
      );

    }

  }
}


var WARNING_COLOR;
export const textStyle = StyleSheet.create({
  title: {
    color:colors.white.hex,
    fontSize:30,
    paddingBottom:10,
    fontWeight:'bold'
  },
  explanation: {
    color:colors.white.hex,
    width:screenWidth,
    textAlign:'center',
    fontSize:13,
    padding:5,
    paddingLeft:25,
    paddingRight:25,
    fontWeight:'400'
  },
  case: {
    color:colors.white.hex,
    width:screenWidth,
    textAlign:'center',
    fontSize:13,
    padding:5,
    fontWeight:'400',
  },
  value: {
    color:colors.white.hex,
    textAlign:'center',
    fontSize:15,
    fontWeight:'600'
  },
  specification: {
    backgroundColor:"transparent",
    color:colors.white.hex,
    width:screenWidth,
    textAlign:'center',
    fontSize:15,
    padding:15,
    fontWeight:'600'
  },
  warning: {
    color: WARNING_COLOR,
    width:screenWidth,
    textAlign:'center',
    fontStyle:'italic',
    fontSize:13,
    padding:15,
    fontWeight:'600'
  }

});