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
import {Util} from "../../util/Util";
import {ListEditableItems} from "../components/ListEditableItems";
import {Icon} from "../components/Icon";
import {Permissions} from "../../backgroundProcesses/Permissions";
import {ANYWHERE_IN_SPHERE, EVERYONE_IN_SPHERE} from "./MessageAdd";
import {ProfilePicture} from "../components/ProfilePicture";
import {DoubleTapDelete} from "../components/DoubleTapDelete";
import {StackedIcons} from "../components/StackedIcons";

export class MessageEntry extends Component<{
  deleteThread(): void
  size: number,
  self: any,
  sphere: any,
  sphereId: string,
  thread: any,
  threadId: string,
}, any> {

  _getRecipients() {
    let members = this.props.thread.members;
    let memberIds = Object.keys(members);

    let recipients = [];
    memberIds.forEach((memberId) => {
      if (memberId === EVERYONE_IN_SPHERE) { // its everyone!
        recipients.push({id: memberId, icon: 'ios-people', label: 'Everyone in ' + this.props.sphere.config.name})
      }
      else if (memberId === this.props.self.userId) { // its you!
        recipients.push({id: memberId, picture: this.props.self.picture, label: 'You', color: colors.menuTextSelected.hex})
      }
      else if (this.props.sphere.users[memberId]) {  // existing member
        let sphereMember = this.props.sphere.users[memberId];
        recipients.push({id: memberId, picture: sphereMember.picture, label: sphereMember.firstName})
      }
      else { // unknown member
        recipients.push({id: memberId, icon:'ios-help-circle', label: 'Unknown User'})
      }
    });

    return recipients;

  }

  _getIcons(recipients, iconSize) {
    let items = [];

    let amount = Math.min(4, recipients.length);
    let iconSizes = {
      1: iconSize,
      2: 0.85*iconSize,
      3: 0.75*iconSize,
      4: 0.70*iconSize,
    };

    iconSize = iconSizes[amount];
    let borderWidth = Math.min(3,iconSize*0.1);

    for ( let i = 0; i < amount; i++) {
      let recipient = recipients[i];
      if (recipient.icon) {
        items.push(
          <IconButton
            name={recipient.icon}
            size={iconSize*0.8}
            buttonSize={iconSize}
            radius={iconSize*0.5}
            button={true}
            color="#fff"
            buttonStyle={{
              backgroundColor: colors.green.hex,
              borderColor: colors.white.hex,
              borderWidth: borderWidth
            }}
          />
        );
      }
      else {
        items.push(<ProfilePicture borderWidth={ borderWidth } picture={recipient.picture} size={iconSize} color={recipient.color} />);
      }
    }

    return <StackedIcons items={items} keyBase={this.props.threadId} size={iconSize} />
  }

  _getLabel(recipients) {
    let label = recipients[0].label;
    for (let i = 1; i < recipients.length - 1; i++) {
      label += ', ' + recipients[i].label
    }

    if (recipients.length > 1) {
      label += " and " + recipients[recipients.length - 1].label;
    }

    return label;
  }

  _getLatestMessage(recipients) : any {
    let result = {};
    let messageDate = 1;
    let messageIds = Object.keys(this.props.thread.messages);
    messageIds.forEach((messageId) => {
      let message = this.props.thread.messages[messageId];
      if (messageDate < message.sentAt) {
        messageDate = message.sentAt;
        result = message;
      }
    });

    return result;
  }

  render() {
    let padding = 10;
    let rowHeight = 90 - 2*padding;

    let iconSize = 50;
    let recipients = this._getRecipients();

    let icons = this._getIcons(recipients, iconSize);
    let label = this._getLabel(recipients);
    let message = this._getLatestMessage(recipients);


    let locationId = this.props.thread.config.triggerLocationId;

    let locationName = '';
    if (locationId === ANYWHERE_IN_SPHERE) {
      locationName = this.props.sphere.config.name;
    }
    else {
      locationName = this.props.sphere.locations[locationId].config.name;
    }

    let content = (
      <View style={{
        flexDirection: 'row',
        width: screenWidth,
        minHeight: rowHeight,
        justifyContent:'center',
        alignItems:'center',
        overflow:"hidden",
      }}>
        <View style={{
          width:          1.5*iconSize+15,
          alignItems:     'center',
          justifyContent: 'center',
          overflow:       'hidden',
        }}>
          {icons}
        </View>
        <View style={{flexDirection:'column', width: screenWidth - 2*iconSize - 50}}>
          <View style={{ flex:1 }} />
          <Text numberOfLines={1} style={{fontWeight:'bold', fontSize:14, color: colors.black.rgba(0.5)}}>{label}</Text>
          <Text style={{fontWeight:'300', paddingTop: 0.4*padding, paddingBottom: 0.4*padding, fontSize:13, color: colors.black.rgba(0.75)}}>{message.content}</Text>
          <Text numberOfLines={1} style={{fontWeight:'300',  fontSize:11, color: colors.black.rgba(0.25)}}>{locationName}</Text>
          <View style={{ flex:1 }} />
        </View>
        <View style={{ flex:1 }} />
        <View style={{height: rowHeight, width:60, alignItems: 'center', justifyContent:'center'}}>
          <DoubleTapDelete key={'deleteButton'+this.props.threadId} callback={() => { this.props.deleteThread() }}/>
        </View>
      </View>
    );

    return (
      <TouchableOpacity
        onPress={() => {
          Actions.messageThread({sphereId: this.props.sphereId, threadId: this.props.threadId});
        }}
        style={{
          flexDirection: 'row',
          width: screenWidth,
          minHeight: rowHeight,
          paddingTop: padding,
          paddingBottom:padding,
          justifyContent:'center',
        }}
      >
        { content }
      </TouchableOpacity>
    );
  }
}