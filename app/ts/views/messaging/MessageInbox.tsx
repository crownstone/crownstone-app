import { LiveComponent }          from "../LiveComponent";

import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("MessageInbox", key)(a,b,c,d,e);
}
import * as React from 'react';
import {
  ScrollView,
  Text,
  TouchableOpacity,
  StyleSheet,
  View, TextStyle
} from "react-native";


import {
  availableModalHeight,
  background,
  colors,
  screenHeight,
  screenWidth, statusBarHeight,
  styles, topBarHeight
} from "../styles";
import {IconButton} from "../components/IconButton";
import {ListEditableItems} from "../components/ListEditableItems";
import {MessageEntry} from "./MessageEntry";
import {MessageCenter} from "../../backgroundProcesses/MessageCenter";
import { core } from "../../Core";
import { NavigationUtil } from "../../util/navigation/NavigationUtil";
import { TopBarUtil } from "../../util/TopBarUtil";
import { Background } from "../components/Background";
import {Get} from "../../util/GetUtil";
import { LifeCycleView } from "../components/LifeCycleView";
import {
  MessageDeletedId,
} from "../../cloud/sections/newSync/transferrers/MessageDeletedTransferNext";
import {MessageReadID} from "../../cloud/sections/newSync/transferrers/MessageReadTransferNext";


export class MessageInbox extends LiveComponent<any, any> {
  static options(props) {
    let sphere = Get.sphere(props.sphereId);
    let title =  lang("Messages") + lang("_in_",sphere.config.name);
    return TopBarUtil.getOptions({title: title, closeModal: true});
  }


  messageReadStateWatcher: MessageReadStateWatcher;
  unsubscribeStoreEvents : any;

  constructor(props) {
    super(props);
    this.init();
  }

  init() {
    this.messageReadStateWatcher = new MessageReadStateWatcher(this.props.sphereId);
  }


  componentDidMount() {
    this.unsubscribeStoreEvents = core.eventBus.on("databaseChange", (data) => {
      let change = data.change;

      if (change.changeStones || change.changeMessage) {
        this.forceUpdate();
      }
    });
  }


  componentWillUnmount() {
    this.messageReadStateWatcher.resetTimers();
    this.unsubscribeStoreEvents();
  }


  _getMessages() {
    let items = [];

    let user   = Get.user();
    let sphere = Get.sphere(this.props.sphereId);
    let messageIds = Object.keys(sphere.messages);
    if (messageIds.length === 0) { return items; }

    items.push({label: lang("MESSAGES"), type: 'explanation',  below:false});
    let messages = Object.values(sphere.messages);
    messages.sort((a,b) => { return b.updatedAt - a.updatedAt; });

    for (let message of messages) {
      // hide messages that are not visible to us yet.
      if (message.visible === false && message.senderId !== user.userId) { continue; }

      // hide messages that have been locally deleted.
      if (message.deleted?.[MessageDeletedId]?.value === true)           { continue; }

      let backgroundColor = colors.white.rgba(0.75);
      let read = true;
      if (message.read?.[MessageReadID]?.value !== true) {
        read = false;
        backgroundColor = colors.green.hex;
      }

      items.push({__item:
        <LifeCycleView
          style={[styles.listView,{backgroundColor: backgroundColor, paddingRight:0, paddingLeft:0}]}
          layout={(event) => {
            let {y, height} = event.nativeEvent.layout;
            this.messageReadStateWatcher.setMessagePosition(message.id, y, height);
          }}
          unmount={() => {
            this.messageReadStateWatcher.removeMessageFromWatcher(message.id);
          }}
        >
          <MessageEntry
            message={message}
            read={read}
            messageId={message.id}
            sphere={sphere}
            sphereId={this.props.sphereId}
            self={user}
            size={45}
            deleteMessage={ () => { MessageCenter.markMessageAsDeleted(this.props.sphereId, message.id) }}
            readMessage={   () => { this.messageReadStateWatcher.markAsRead(message.id); }}
          />
        </LifeCycleView>
      })
    };

    return items;
  }

  render() {
    let messageExplanationStyle : TextStyle = {
      color: colors.csBlueDarker.hex,
      textAlign: 'center',
      paddingLeft: 30,
      backgroundColor:"transparent",
      paddingRight: 30,
      fontWeight: 'bold',
      fontStyle:'italic'
    };

    let sphere = Get.sphere(this.props.sphereId);

    let stonesAvailable = Object.keys(sphere.stones).length > 0;
    if (!stonesAvailable) {
      return (
        <Background fullScreen={true} image={background.main}>
          <View style={{flex:1}} />
          <Text style={messageExplanationStyle}>{ lang("Add_some_Crownstones_to_u") }</Text>
          <View style={{flex:1}} />
        </Background>
      );
    }


    let iconSize = 0.14*screenHeight;
    let items = this._getMessages();

    let iconButton = (
      <TouchableOpacity
        onPress={() => { NavigationUtil.launchModal( "MessageAdd",{ sphereId: this.props.sphereId }); }}
      >
        <IconButton
          name="ios-mail"
          size={iconSize*0.85}
          color="#fff"
          addIcon={true}
          buttonSize={iconSize}
          buttonStyle={{backgroundColor:colors.csBlueDark.hex, borderRadius: 0.2*iconSize}}
        />
      </TouchableOpacity>
    );

    let headerText = <Text style={textStyle.specification}>{ lang("You_can_leave_messages_in") }</Text>;

    let scrollView;
    if (items.length > 1) { // min size is 1 since the items always have an explanation entry
      scrollView = (
        <ScrollView
          onScroll={(event) => {
            this.messageReadStateWatcher.scrollView(event.nativeEvent.contentOffset.y+statusBarHeight);
          }}
          scrollEventThrottle={64}
          contentContainerStyle={{flexGrow:1, minHeight: availableModalHeight,  width: screenWidth, alignItems:'center'}}
        >
          <View style={{height: 10}} />
          { headerText }
          <View style={{height: 0.4*iconSize}} />
          { iconButton }
          <View style={{height: 0.1*iconSize}} />
          <ListEditableItems key="empty" items={items} style={{width:screenWidth}} onLayout={(event) => {
            this.messageReadStateWatcher.setMessageStartPosition(event.nativeEvent.layout.y);
            this.forceUpdate();
          }}/>
          <View style={{height: 0.4*iconSize}} />
        </ScrollView>
      );
    }
    else {
      scrollView = (
        <ScrollView style={{height: availableModalHeight, width: screenWidth}}>
          <View style={{flex:1, minHeight: availableModalHeight, width: screenWidth, alignItems:'center'}}>
            <View style={{height: 0.3*iconSize}} />
            { headerText }
            <View style={{height: 0.4*iconSize}} />
            { iconButton }
            <View style={{height: 0.6*iconSize}} />
            <Text style={messageExplanationStyle}>{ lang("Tap_the_envelope_icon_to_") }</Text>
            <View style={{flex:2}} />
          </View>
        </ScrollView>
      );
    }



    return (
      <Background fullScreen={true} image={background.main}>
        { scrollView }
      </Background>
    );
  }
}





/**
 * This class checks if a message has been in view for 2 seconds, and if so, marks it as read automatically.
 */
class MessageReadStateWatcher {

  messageStartY = 1000;
  offset        = 0;
  messages      = {};

  sphereId: sphereId;

  constructor(sphereId) {
    this.sphereId = sphereId;
  }

  resetTimers() {
    for (let messageId in this.messages) {
      clearTimeout(this.messages[messageId]?.timer);
    }
  }

  removeMessageFromWatcher(messageId) {
    if (this.messages[messageId]) {
      clearTimeout(this.messages[messageId].timer);
      delete this.messages[messageId];
    }
  }

  setMessageStartPosition(messageStartY) {
    this.messageStartY = messageStartY;
  }

  setMessagePosition(messageId, y, height) {
    if (this.messages[messageId] === undefined) {
      let message = Get.message(this.sphereId, messageId);
      this.messages[messageId] = {
        y: y, height: height,
        isRead: message?.read?.[Get.userId()] !== undefined,
        timer: null
      };
      this.isInView(messageId);
    }
  }

  scrollView(newOffset) {
    this.offset = newOffset;
    this.evaluateAllMessages();
  }

  evaluateAllMessages() {
    for (let messageId in this.messages) {
      this.isInView(messageId);
    }
  }

  markAsRead(messageId) {
    if (this.messages[messageId]?.isRead === false) {
      MessageCenter.markMessageAsRead(this.sphereId, messageId);
      this.messages[messageId].isRead = true;
    }
  }

  isInView(messageId) {
    let viewTop = Math.round(this.offset) + (topBarHeight-statusBarHeight);
    let viewBottom = Math.round(this.offset + screenHeight);

    if (this.messages[messageId]) {
      if (this.messages[messageId].isRead) { return; }

      // get the percentage of the message that is in view
      let message = this.messages[messageId];
      let messageHeight = message.height;
      let pageY = message.y + this.messageStartY;

      if ((pageY+messageHeight) >= viewTop && pageY < viewBottom) {
        let percentageTop = (pageY+messageHeight-viewTop) / messageHeight;
        let percentageBottom = (viewBottom-pageY) / messageHeight;
        let percentage = Math.min(percentageTop, percentageBottom);

        if (percentage > 0.8) {
          if (this.messages[messageId].timer === null) {
            this.messages[messageId].timer = setTimeout(() => {
              this.markAsRead(messageId);
            }, 2000);
          }
        }
      }
      else {
        clearTimeout(this.messages[messageId].timer);
        this.messages[messageId].timer = null;
      }
    }
  }
}


export const textStyle = StyleSheet.create({
  title: {
    color:colors.csBlueDarker.hex,
    fontSize:30,
    paddingBottom:10,
    fontWeight:'bold'
  },
  explanation: {
    color:colors.csBlueDarker.hex,
    width:screenWidth,
    textAlign:'center',
    fontSize:13,
    padding:5,
    paddingLeft:25,
    paddingRight:25,
  },
  case: {
    color:colors.csBlueDarker.hex,
    width:screenWidth,
    textAlign:'center',
    fontSize:13,
    padding:5,
  },
  value: {
    color:colors.csBlueDarker.hex,
    textAlign:'center',
    fontSize:15,
    fontWeight:'bold'
  },
  specification: {
    backgroundColor:"transparent",
    color:colors.csBlueDarker.hex,
    width:screenWidth,
    textAlign:'center',
    fontSize:15,
    padding:15,
    fontWeight:'bold'
  },
});
