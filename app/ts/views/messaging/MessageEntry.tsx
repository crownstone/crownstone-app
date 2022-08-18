
import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("MessageEntry", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  ActivityIndicator,
  Text,
  TouchableOpacity,
  View, ViewStyle
} from "react-native";

import {colors, screenWidth, updateScreenHeight} from '../styles'
import {IconButton} from "../components/IconButton";
import {ANYWHERE_IN_SPHERE} from "./MessageAdd";
import {ProfilePicture} from "../components/ProfilePicture";
import {DoubleTapDelete} from "../components/DoubleTapDelete";
import {StackedIcons} from "../components/StackedIcons";
import {MessageUtil} from "../../util/MessageUtil";
import { core } from "../../Core";
import {MapProvider} from "../../backgroundProcesses/MapProvider";
import { MessageCenter } from "../../backgroundProcesses/MessageCenter";

export class MessageEntry extends Component<{
  readMessage(): void
  deleteMessage(): void
  size: number,
  self: any,
  sphere: any,
  sphereId: string,
  message: any,
  messageId: string,
  read: boolean,
}, any> {

  _getRecipients() {
    let userArray = [];
    let senderId = this.props.message.config.senderId;
    if (this.props.message.config.senderId !== this.props.self.userId) {
      if (this.props.sphere.users[senderId]) {  // existing member
        let sphereMember = this.props.sphere.users[senderId];
        userArray.push({id: senderId, picture: sphereMember.picture, label: sphereMember.firstName})
      }
      else { // unknown member
        userArray.push({id: senderId, icon:'ios-help-circle', label: lang("Unknown_User")})
      }
    }
    else {
      let recipients = this.props.message.recipients;
      let recipientIds = Object.keys(recipients);

      recipientIds.forEach((memberId) => {
        if (memberId === this.props.self.userId) { // its you!
          userArray.push({id: memberId, picture: this.props.self.picture, label: lang("You"), color: colors.blue.hex})
        }
        else if (this.props.sphere.users[memberId]) {  // existing member
          let sphereMember = this.props.sphere.users[memberId];
          userArray.push({id: memberId, picture: sphereMember.picture, label: sphereMember.firstName})
        }
        else { // unknown member
          userArray.push({id: memberId, icon:'ios-help-circle', label: lang("Unknown_User")})
        }
      });

      if (this.props.message.config.everyoneInSphere) {
        userArray.push({icon: 'ios-people', label: lang("Everyone_in_",this.props.sphere.config.name)})
      }

    }


    return userArray;
  }

  _getIcons(recipients, iconSize) {
    if (recipients.length === 0) {
      return undefined;
    }

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

    return <StackedIcons items={items} keyBase={this.props.messageId} size={iconSize} />
  }

  _getLabel(recipients) {
    if (recipients.length === 0) {
      return "Nobody";
    }
    let label = recipients[0].label;
    for (let i = 1; i < recipients.length - 1; i++) {
      label +=  lang("__",recipients[i].label)}

    if (recipients.length > 1) {
      label +=  lang("_and_",recipients[recipients.length - 1].label);
    }

    return label;
  }


  _getSubText() {
    if (this.props.message.config.sendFailed) {
      return <Text numberOfLines={1} style={{fontWeight:'bold',  fontSize:12, color: colors.red.hex}}>{ lang("Failed_to_send__tap_to_re") }</Text>
    }
    else if (this.props.message.config.sendFailed === false && this.props.message.config.sent === false) {
      return (
        <View style={{flexDirection:"row", alignItems:'center'}}>
          <ActivityIndicator size="small" />
          <Text numberOfLines={1} style={{fontWeight:'bold', paddingLeft:10, fontSize:12, color: colors.black.rgba(0.5)}}>{ lang("Sending_message___") }</Text>
        </View>
      )
    }
    else {
      let locationId = this.props.message.config.triggerLocationId;

      let locationName;
      if (locationId === ANYWHERE_IN_SPHERE || locationId === null) {
        locationName = this.props.sphere.config.name;
      }
      else {
        let localLocationId = MapProvider.cloud2localMap.locations[locationId] || locationId;
        locationName = this.props.sphere?.locations?.[localLocationId]?.config.name ?? this.props.sphere?.config.name;
      }
      return <Text numberOfLines={1} style={{fontSize:11, color: colors.black.rgba(0.25)}}>{locationName}</Text>
    }
  }


  render() {
    let padding = 10;
    let rowHeight = 90 - 2*padding;

    let iconSize = 50;
    let recipients = this._getRecipients();

    let icons = this._getIcons(recipients, iconSize);
    let label = this._getLabel(recipients);

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
          <Text style={{paddingTop: 0.4*padding, paddingBottom: 0.4*padding, fontSize:13, color: colors.black.rgba(0.75)}}>{this.props.message.config.content}</Text>
          { this._getSubText() }
          <View style={{ flex:1 }} />
        </View>
        <View style={{ flex:1 }} />
        <View style={{height: rowHeight, width:60, alignItems: 'center', justifyContent:'center'}}>
          <DoubleTapDelete key={'deleteButton'+this.props.messageId} callback={() => {
            // we delete it and mark it read if required.
            if (this.props.read === false) {
              MessageCenter.markMessageAsRead(this.props.sphereId, this.props.messageId);
            }

            this.props.deleteMessage();
          }}/>
        </View>
      </View>
    );


    let style : ViewStyle = {
      flexDirection:  'row',
      width:          screenWidth,
      minHeight:      rowHeight,
      paddingTop:     padding,
      paddingBottom:  padding,
      justifyContent: 'center',
    };
    if (this.props.message.config.sendFailed || this.props.read === false) {
      return (
        <TouchableOpacity
          style={style}
          onPress={() => {
            if (this.props.message.config.sendFailed) {
              core.store.dispatch({type: "APPEND_MESSAGE", sphereId: this.props.sphereId, messageId: this.props.messageId, data: { sendFailed: false, sent: false }});
              MessageUtil.uploadMessage(
                core.store,
                this.props.sphereId,
                this.props.messageId,
                this.props.message.config,
                Object.keys(this.props.message.recipients),
              );
            }

            if (this.props.read === false) {
              MessageCenter.markMessageAsRead(this.props.sphereId, this.props.messageId);
              this.props.readMessage();
            }
          }}
        >
          { content }
        </TouchableOpacity>
      );
    }
    else {
      return (
        <View style={style}>
          { content }
        </View>
      );
    }


  }
}
