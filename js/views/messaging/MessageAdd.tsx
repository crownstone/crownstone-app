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


export class MessageAdd extends Component<any, any> {
  constructor() {
    super();

    this.state = {
      triggerLocationId: null,
      triggerEvent: null,
      messageContent: '',
      recipients: {}
    };
  }

  componentWillMount() {}

  componentDidMount() {}

  componentWillUnmount() {}

  _createMessage() {}

  _getItems() {
    let state = this.props.store.getState();
    let sphere = state.spheres[this.props.sphereId];
    let locationIds = Object.keys(sphere.locations);
    let locationData = [];

    locationIds.forEach((locationId) => {
      let location = sphere.locations[locationId];
      locationData.push({id: locationId, name: location.config.name, icon: location.config.icon});
    });

    console.log(locationData)

    let sphereUserData = sphere.users; // { userId: { firstName: null, lastName: null, email: null, invitationPending: false, present: false, picture: null, accessLevel: admin/member/guest, updatedAt: 1 }}
    let userIds = Object.keys(sphereUserData);
    let users = [];
    userIds.forEach((userId) => {
      if (sphereUserData[userId].invitationPending === false) {
        users.push({
          id: userId,
          name: sphereUserData[userId].firstName + " " + sphereUserData[userId].lastName,
          picture: sphereUserData[userId].picture
        })
      }
    });

    let items = [];

    items.push({type:'lightExplanation', below: false, label: 'MESSAGE' });
    items.push({
      type: 'textBlob',
      placeholder: "Your message...",
      barHeight: 120,
      maxLength: 140,
      value: this.state.messageContent,
      callback: (newText) => {
        this.setState({messageContent: newText});
      },
      endCallback: (newText) => {

      }
    });
    items.push({type:'lightExplanation', below: true, align: 'right', style:{paddingTop:2, paddingRight:5}, label: '( ' + this.state.messageContent.length + ' / 140 )' });

    items.push({type:'lightExplanation', below: false, label: 'RECIPIENTS', alreadyPadded: true});
    items.push({
      label: 'Add recipient',
      type: 'navigation',
      icon: <IconButton name='ios-body' size={23} radius={15} button={true} color="#fff" buttonStyle={{backgroundColor: colors.green.hex, marginLeft:3, marginRight:7}}/>,
      callback: () => {
        Actions.selectFromList({items: users, title: 'Recipients', callback: (selection) => {
          this.setState({recipients: selection});
        }});
      }
    });

    items.push({type:'lightExplanation', below: false, label: 'LEAVE MESSAGE IN'});
    items.push({
      label: 'Select room',
      type: 'navigation',
      icon: <IconButton name='md-pin' size={21} radius={17} button={true} color="#fff" buttonStyle={{backgroundColor: colors.csBlue.hex, marginLeft:3, marginRight:7}}/>,
      callback: () => {
        Actions.selectFromList({items: locationData, title: 'Leave where?', callback: (selection) => {
          this.setState({recipients: selection});
        }});
      }
    });

    return items;
  }

  render() {
    return (
      <Background image={this.props.backgrounds.detailsDark} hideTopBar={true}>
        <TopBar
          leftAction={() => { Actions.pop(); }}
          right={'Create'}
          rightStyle={{fontWeight: 'bold'}}
          rightAction={() => { this._createMessage(); }}
          title={"New Message"}
        />
        <View style={{backgroundColor:colors.csOrange.hex, height:1, width:screenWidth}} />
        <ScrollView style={{flex:1}}>
          <ListEditableItems items={this._getItems()} separatorIndent={true} />
        </ScrollView>
      </Background>
      );
  }
}
