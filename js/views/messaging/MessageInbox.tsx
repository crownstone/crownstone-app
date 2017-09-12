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
import {EVERYONE_IN_SPHERE} from "./MessageAdd";
import {ProfilePicture} from "../components/ProfilePicture";


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

  _getMessages() {
    let items = [];

    let state = this.props.store.getState();
    let activeSphere = state.app.activeSphere;

    let sphere = state.spheres[activeSphere];
    let threadIds = Object.keys(sphere.messageThreads);
    if (threadIds.length > 0) {
      items.push({label:'MESSAGES', type: 'lightExplanation',  below:false});

      threadIds.forEach((threadId) => {
        let thread = sphere.messageThreads[threadId];

        items.push({__item:
          <View style={[styles.listView,{backgroundColor: colors.white.rgba(0.75), paddingRight:0}]}>
            <MessageEntry
              thread={thread}
              threadId={threadId}
              sphereName={sphere.config.name}
              sphereUsers={sphere.users}
              self={state.user}
              size={45}
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
              <View style={{flex:0.3}} />
              { headerText }
              <View style={{flex:0.6}} />
              { iconButton }
              <View style={{flex:0.8}} />
              <ListEditableItems key="empty" items={items} style={{width:screenWidth}} />
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



class MessageEntry extends Component<{size: number, sphereUsers: any, thread: any, threadId: string, self: any, sphereName: string}, any> {

  _getRecipients() {
    let members = this.props.thread.members;
    let memberIds = Object.keys(members);

    let recipients = [];
    memberIds.forEach((memberId) => {
      if (memberId === EVERYONE_IN_SPHERE) { // its everyone!
        recipients.push({id: memberId, icon: 'ios-people', label: 'Everyone in ' + this.props.sphereName})
      }
      else if (memberId === this.props.self.userId) { // its you!
        recipients.push({id: memberId, picture: this.props.self.picture, label: 'You', color: colors.menuTextSelected.hex})
      }
      else if (this.props.sphereUsers[memberId]) {  // existing member
        let sphereMember = this.props.sphereUsers[memberId];
        recipients.push({id: memberId, picture: sphereMember.picture, label: sphereMember.firstName + ' ' + sphereMember.lastName})
      }
      else { // unknown member
        recipients.push({id: memberId, icon:'ios-help-circle', label: 'Unknown User'})
      }
    });

    return recipients;

  }

  _getIcons(recipients, iconSize) {
    let items = [];

    recipients.forEach((recipient) => {
      let obj;
      if (recipient.icon) {
        obj = <IconButton name={recipient.icon} size={iconSize*0.8} buttonSize={iconSize} radius={iconSize*0.5} button={true} color="#fff" buttonStyle={{
          backgroundColor: colors.green.hex,
          borderColor: colors.white.hex,
          borderWidth: 3
        }}/>
      }
      else {
        obj = <ProfilePicture borderWidth={3} picture={recipient.picture} size={iconSize} color={recipient.color} />
      }

      items.push(obj);
    });
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

  _getLatestMessage() {

  }

  render() {
    let rowHeight = 90;

    let iconSize = 50;
    let recipients = this._getRecipients();

    let icons = this._getIcons(recipients, iconSize);
    let label = this._getLabel(recipients);

    let content = (
      <View style={{ flexDirection: 'row', width: screenWidth - 15, height: rowHeight, justifyContent:'center' }}>
        <View style={{
          height: rowHeight,
          width: 1.5*iconSize,
          alignItems: 'flex-start',
          justifyContent:'center',
          overflow:"hidden"
        }}>
          {icons}
        </View>
        <View style={{flexDirection:'column'}}>
          <Text style={{paddingTop:15, fontWeight:'bold', fontSize:15, color: colors.black.rgba(0.5)}}>{label}</Text>
        </View>
        <View style={{ flex:1 }} />
        <View style={{height: rowHeight, width:60, alignItems: 'center', justifyContent:'center'}}>
          <IconButton
            name={"md-create"}
            size={14}
            color={colors.white.hex}
            buttonStyle={{backgroundColor: colors.darkBackground.hex, width:20, height:20, borderRadius:10}}
          />
        </View>
      </View>
    );

    return (
      <TouchableOpacity
        onPress={() => {
          // Actions.deviceScheduleEdit({sphereId: this.props.sphereId, stoneId: this.props.stoneId, scheduleId: this.props.scheduleId});
        }}
        style={{
          flexDirection: 'row',
          width: screenWidth - 15,
          height: rowHeight,
          justifyContent:'center',
        }}
      >
        { content }
      </TouchableOpacity>
    );
  }
}


class StackedIcons extends Component<{items:any[], size: number, keyBase: string}, any> {
  render() {
    let items = [];
    this.props.items.forEach((item, index) => {
      items.push(
        <View
          key={'stackedItems' + this.props.keyBase + '_' + index}
          style={{
            marginLeft: index > 0 ? -this.props.size : 0,
            position:'relative',
            left: (this.props.items.length - index)*0.25*this.props.size - 0.25*this.props.size
          }}
        >
          {item}
        </View>
      );
    });

    return (
      <View style={{
        flexDirection:'row',
        height: this.props.size,
        width: (this.props.items.length-1)*0.25*this.props.size + this.props.size,
      }}>
        {items}
      </View>
    )
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