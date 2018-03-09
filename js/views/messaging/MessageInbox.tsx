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
import {MessageCenter} from "../../backgroundProcesses/MessageCenter";


export class MessageInbox extends Component<any, any> {
  static navigationOptions = ({ navigation }) => {
    const { params } = navigation.state;

    let state = params.store.getState();
    let activeSphere = state.app.activeSphere;
    let title = "Messages";
    if (activeSphere && state.spheres[activeSphere]) {
      let sphere = state.spheres[activeSphere];
      title += " in " +  sphere.config.name;
    }

    return {
      title: title,
    }
  };

  unsubscribeStoreEvents : any;

  constructor(props) {
    super(props);

    this.init();
  }

  init() {
    let activeSphere = this._setActiveSphere();
    if (activeSphere) {
      let state = this.props.store.getState();
      let sphere = state.spheres[activeSphere];
      if (sphere.config.newMessageFound) {
        MessageCenter.newMessageStateInSphere(activeSphere, false);
      }
    }
  }


  _setActiveSphere() {
    // set the active sphere if needed and setup the object variables.
    let state = this.props.store.getState();
    let activeSphere = state.app.activeSphere;

    let sphereIds = Object.keys(state.spheres).sort((a,b) => {return state.spheres[b].config.name - state.spheres[a].config.name});

    // handle the case where we deleted a sphere that was active.
    if (state.spheres[activeSphere] === undefined) {
      activeSphere = null;
    }
    if (activeSphere === null && sphereIds.length > 0) {
      this.props.store.dispatch({type:"SET_ACTIVE_SPHERE", data: {activeSphere: sphereIds[0]}});
      return sphereIds[0];
    }

    return activeSphere;
  }



  componentDidMount() {
    this.unsubscribeStoreEvents = this.props.eventBus.on("databaseChange", (data) => {
      let change = data.change;

      if (
        change.changeStones       ||
        change.changeMessage      ||
        change.updateActiveSphere ||
        change.changeSphereState
      ) {
        let state = this.props.store.getState();
        let activeSphere = state.app.activeSphere;
        if (activeSphere) {
          let sphere = state.spheres[activeSphere];
          if (sphere.config.newMessageFound) {
            MessageCenter.newMessageStateInSphere(activeSphere, false);
          }
        }

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

      let messages = [];

      messageIds.forEach((messageId) => {
        messages.push({message: sphere.messages[messageId], id: messageId});
      });

      messages.sort((a,b) => { return b.message.config.updatedAt - a.message.config.updatedAt; });
      messages.forEach((messageData) => {
        let message = messageData.message;
        let backgroundColor = colors.white.rgba(0.75);
        let read = true;
        if (message.received[state.user.userId] && message.read[state.user.userId] === undefined) {
          read = false;
          backgroundColor = colors.green.hex;
        }

        items.push({__item:
          <View style={[styles.listView,{backgroundColor: backgroundColor, paddingRight:0, paddingLeft:0}]}>
            <MessageEntry
              store={this.props.store}
              message={message}
              read={read}
              messageId={messageData.id}
              sphere={sphere}
              sphereId={activeSphereId}
              self={state.user}
              size={45}
              deleteMessage={ () => { this.props.store.dispatch({type:'REMOVE_MESSAGE', sphereId: activeSphereId, messageId: messageData.id}) }}
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
    let messageExplanationStyle = {
      color: colors.green.hex,
      textAlign: 'center',
      paddingLeft: 30,
      backgroundColor:"transparent",
      paddingRight: 30,
      fontWeight: 'bold',
      fontStyle:'italic'
    };

    if (activeSphere && state.spheres[activeSphere]) {
      let sphere = state.spheres[activeSphere];

      let stonesAvailable = Object.keys(sphere.stones).length > 0;
      if (stonesAvailable) {
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
                <Text style={messageExplanationStyle}>
                  Tap the envelope icon to create a new message!
                </Text>
                <View style={{flex:2}} />
              </View>
            </ScrollView>
          );
        }

        return (
          <Background image={this.props.backgrounds.detailsDark}>
            <View style={{backgroundColor: colors.csOrange.hex, height: 1, width:screenWidth}} />
            { scrollView }
          </Background>
        );
      }
      else {
        return (
          <Background image={this.props.backgrounds.detailsDark}>
            <View style={{backgroundColor: colors.csOrange.hex, height: 1, width:screenWidth}} />
            <View style={{flex:1}} />
            <Text style={messageExplanationStyle}>Add some Crownstones to use messages!</Text>
            <View style={{flex:1}} />
          </Background>
        );
      }
    }
    else {
      return (
        <Background image={this.props.backgrounds.detailsDark}>
          <View style={{backgroundColor: colors.csOrange.hex, height: 1, width:screenWidth}} />
          <View style={{flex:1}} />
          <Text style={messageExplanationStyle}>Add a Sphere to use messages!</Text>
          <View style={{flex:1}} />
        </Background>
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