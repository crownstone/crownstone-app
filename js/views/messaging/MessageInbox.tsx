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
import {availableScreenHeight, colors, screenHeight, screenWidth, styles, tabBarHeight, topBarHeight} from '../styles'
import {Background} from "../components/Background";
import {TopBar} from "../components/Topbar";
import {IconButton} from "../components/IconButton";
import {ListEditableItems} from "../components/ListEditableItems";
import {MessageEntry} from "./MessageEntry";


export class MessageInbox extends Component<any, any> {
  unsubscribeStoreEvents : any;

  componentDidMount() {
    this.unsubscribeStoreEvents = this.props.eventBus.on("databaseChange", (data) => {
      let change = data.change;

      if (change.changeMessageThread) {
        this.forceUpdate();
      }
    });
  }

  componentWillUnmount() {
    this.unsubscribeStoreEvents();
  }

  _getMessages() {
    let items = [];

    let state = this.props.store.getState();
    let activeSphereId = state.app.activeSphere;

    let sphere = state.spheres[activeSphereId];
    let messageIds = Object.keys(sphere.messages);
    if (messageIds.length > 0) {
      items.push({label:'MESSAGES', type: 'lightExplanation',  below:false});

      messageIds.forEach((messageId) => {
        let message = sphere.messages[messageId];

        items.push({__item:
          <View style={[styles.listView,{backgroundColor: colors.white.rgba(0.75), paddingRight:0, paddingLeft:0}]}>
            <MessageEntry
              message={message}
              messageId={messageId}
              sphere={sphere}
              sphereId={activeSphereId}
              self={state.user}
              size={45}
              deleteMessage={ () => { this.props.store.dispatch({type:'REMOVE_MESSAGE', sphereId: activeSphereId, messageId: messageId}) }}
            />
          </View>
        })
      });
    }

    return items;
  }

  render() {
    let state = this.props.store.getState();
    let activeSphere = state.app.activeSphere;

    if (activeSphere) {
      let iconSize = 0.14*screenHeight;
      let items = this._getMessages();

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
      if (items.length > 0) {
        scrollView = (
          <ScrollView style={{height: availableScreenHeight, width: screenWidth}}>
            <View style={{flex:1, minHeight: availableScreenHeight,  width: screenWidth, alignItems:'center'}}>
              <View style={{height: 0.3*iconSize}} />
              { headerText }
              <View style={{height: 0.4*iconSize}} />
              { iconButton }
              <View style={{height: 0.1*iconSize}} />
              <ListEditableItems key="empty" items={items} style={{width:screenWidth}} />
              <View style={{height: 0.4*iconSize}} />
            </View>
          </ScrollView>
        );
      }
      else {
        scrollView = (
          <ScrollView style={{height: availableScreenHeight, width: screenWidth}}>
            <View style={{flex:1, minHeight: availableScreenHeight,  width: screenWidth, alignItems:'center'}}>
              <View style={{height: 0.3*iconSize}} />
              { headerText }
              <View style={{height: 0.4*iconSize}} />
              { iconButton }
              <View style={{height: 0.6*iconSize}} />
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
});