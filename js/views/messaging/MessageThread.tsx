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
import { ListEditableItems } from "../components/ListEditableItems";
import { Icon } from "../components/Icon";
import { ProfilePicture } from "../components/ProfilePicture";
import {ANYWHERE_IN_SPHERE, EVERYONE_IN_SPHERE} from "./MessageAdd";



export class MessageThread extends Component<any, any> {
  constructor() {
    super();
  }

  componentWillMount() {}

  componentDidMount() {}

  componentWillUnmount() {}

  _getLabel(recipients) {
    let label = recipients[0];
    for (let i = 1; i < recipients.length - 1; i++) {
      label += ', ' + recipients[i]
    }

    if (recipients.length > 1) {
      label += " and " + recipients[recipients.length - 1];
    }

    return label;
  }

  _getMessages(message, state) {
    let result = [];
    let selfSentStyle = {
      backgroundColor: colors.csBlue.hex,
      borderRadius: 15,
      maxWidth: 0.8*screenWidth,
      alignItems:'flex-start',
      justifyContent:'center',
      padding: 12,
      marginLeft: 15,
      marginRight: undefined,
      alignSelf: 'flex-start',
    };
    let otherSentStyle = {...selfSentStyle};
    otherSentStyle.marginRight = 15;
    otherSentStyle.marginLeft = undefined;
    otherSentStyle.alignSelf = 'flex-end';
    otherSentStyle.alignItems = 'flex-end';
    otherSentStyle.backgroundColor= colors.menuTextSelected.hex;


    if (message.config.sender === state.user.userId) {
      result.push(
        <View style={{width:screenWidth}} key={"message"}>
          <View style={selfSentStyle}>
            <Text style={{
              backgroundColor: "transparent",
              color: colors.white.hex,
              textAlign: 'left',
            }}>{message.config.content}</Text>
          </View>
          <Text style={{
            backgroundColor: "transparent",
            fontSize: 12,
            fontWeight:'bold',
            color: colors.white.rgba(0.5),
            paddingLeft: 25,
            paddingTop: 5,
            paddingBottom: 20
          }}>{Util.getDateTimeFormat(message.config.sentAt)}</Text>
        </View>
      );
    }
    else {
      result.push(
        <View style={{width:screenWidth}} key={"message"}>
          <View style={otherSentStyle}>
            <Text style={{
              backgroundColor: "transparent",
              color: colors.white.hex,
              textAlign: 'right',
            }}>{message.config.content}</Text>
          </View>
          <Text style={{
            backgroundColor: "transparent",
            fontSize: 12,
            fontWeight:'bold',
            width: screenWidth,
            color: colors.white.rgba(0.5),
            paddingRight: 25,
            textAlign: 'right',
            paddingTop: 5,
            paddingBottom: 20
          }}>{Util.getDateTimeFormat(message.config.sentAt)}</Text>
        </View>
      );
    }

    return result;
  }

  render() {
    let state = this.props.store.getState();
    let sphere = state.spheres[this.props.sphereId];
    let message = sphere.messages[this.props.messageId];
    let members = message.recipients;
    let memberIds = Object.keys(members);
    let locationId = message.config.triggerLocationId;

    let locationName = '';
    if (locationId === ANYWHERE_IN_SPHERE) {
      locationName = sphere.config.name;
    }
    else {
      locationName = sphere.locations[locationId].config.name;
    }

    let recipients = [];
    memberIds.forEach((memberId) => {
      if (memberId === EVERYONE_IN_SPHERE) { // its everyone!
        recipients.push('everyone in ' + sphere.config.name);
      }
      else if (memberId === state.user.userId) { // its you!
        recipients.push('you')
      }
      else if (sphere.users[memberId]) {  // existing member
        let sphereMember = sphere.users[memberId];
        recipients.push(sphereMember.firstName + ' ' + sphereMember.lastName);
      }
      else { // unknown member
        recipients.push('unknown user')
      }
    });

    let label = this._getLabel(recipients);

    return (
      <Background image={this.props.backgrounds.detailsDark} hideTopBar={true}>
        <TopBar
          leftAction={() => { Actions.pop(); }}
          title={ 'Found in the ' + locationName }
        />
        <View style={{backgroundColor:colors.csOrange.hex, height:1, width:screenWidth}} />
        <ScrollView style={{flex:1}}>
          <Text style={{color:colors.white.hex, padding: 15, width: screenWidth, fontStyle:'italic', backgroundColor:"transparent", textAlign:'center'}}>{'for ' + label}</Text>
          { this._getMessages(message, state) }
        </ScrollView>
      </Background>
    );
  }
}


