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
import {
  availableScreenHeight,
  colors,
  OrangeLine,
  screenHeight,
  screenWidth,
  tabBarHeight,
  topBarHeight
} from '../styles'
import {Background} from "../components/Background";
import {TopBar} from "../components/Topbar";
import {IconButton} from "../components/IconButton";
import {Util} from "../../util/Util";
import { ListEditableItems } from "../components/ListEditableItems";
import { Icon } from "../components/Icon";
import { ProfilePicture } from "../components/ProfilePicture";
import {CLOUD} from "../../cloud/cloudAPI";
import {MessageUtil} from "../../util/MessageUtil";
import {BackAction} from "../../util/Back";
import {TopbarButton} from "../components/Topbar/TopbarButton";
import {CancelButton} from "../components/Topbar/CancelButton";


export const EVERYONE_IN_SPHERE = '__everyone_in_sphere__';
export const ANYWHERE_IN_SPHERE = '__sphere__';

export class MessageAdd extends Component<any, any> {
  static navigationOptions = ({ navigation }) => {
    const { params } = navigation.state;
    return {
      title: "New Message",
      headerLeft: <CancelButton onPress={BackAction} />,
      headerRight: <TopbarButton
        text={"Create"}
        onPress={() => {
          params.rightAction ? params.rightAction() : () => {}
        }}
      />
    }
  };

  constructor(props) {
    super(props);

    this.state = {
      everyoneInSphereIncludingOwner: true,
      triggerLocationId: ANYWHERE_IN_SPHERE,
      triggerEvent: 'enter',
      messageContent: '',
      recipients: {},
    };

    this.state.recipients[EVERYONE_IN_SPHERE] = true
    this.props.navigation.setParams({rightAction: () => { this._createMessage();}})
  }

  _createMessage() {
    if (this.state.messageContent.trim().length === 0) {
      Alert.alert("Message is empty..", "I can't send an empty message.", [{text:'Right'}]);
      return;
    }

    if (Object.keys(this.state.recipients).length === 0) {
      Alert.alert("No recipients..", "I can't send a message to nobody.", [{text:'Right'}]);
      return;
    }

    let state = this.props.store.getState();

    // gather array of recipients
    let recipients = [];
    let recipientIds = Object.keys(this.state.recipients);
    recipientIds.forEach((recipientId) => {
      if (this.state.recipients[recipientId] === true && recipientId !== EVERYONE_IN_SPHERE) {
        recipients.push(recipientId);
      }
    });

    let everyoneInSphere = this.state.recipients[EVERYONE_IN_SPHERE] === true;
    let everyoneInSphereIncludingOwner = everyoneInSphere && this.state.everyoneInSphereIncludingOwner;
    let localLocationIdToTrigger = this.state.triggerLocationId === ANYWHERE_IN_SPHERE ? null : this.state.triggerLocationId;
    let messageId = Util.getUUID();

    this.props.store.dispatch({
      type:'ADD_MESSAGE',
      sphereId: this.props.sphereId,
      messageId: messageId,
      data: {
        triggerLocationId: localLocationIdToTrigger,
        triggerEvent: this.state.triggerEvent,
        content: this.state.messageContent,
        everyoneInSphere: everyoneInSphere,
        everyoneInSphereIncludingOwner: everyoneInSphereIncludingOwner,
        senderId: state.user.userId,
        recipientIds: recipients
      }
    });

    MessageUtil.uploadMessage(
      this.props.store,
      this.props.sphereId,
      messageId,
      { triggerLocationId: localLocationIdToTrigger,
        triggerEvent: this.state.triggerEvent,
        content: this.state.messageContent,
        everyoneInSphere: everyoneInSphere,
        everyoneInSphereIncludingOwner: everyoneInSphereIncludingOwner,
      },
      recipients
    );

    BackAction();
  }

  _getLocationItems(sphere) {
    let locationIds = Object.keys(sphere.locations);
    let locationData = [];

    locationData.push({id: 'roomExplanation', type:'lightExplanation', label:'IN A ROOM' });
    locationIds.forEach((locationId) => {
      let location = sphere.locations[locationId];
      locationData.push({id: locationId, text: location.config.name, icon: location.config.icon, singular: true, selected: this.state.triggerLocationId === locationId});
    });

    locationData.push({id: 'sphereExplanation', type:'lightExplanation', label:'ANYWHERE IN THE SPHERE' });
    locationData.push({id: ANYWHERE_IN_SPHERE, text: sphere.config.name, icon: 'c1-sphere', singular: true, selected: this.state.triggerLocationId === ANYWHERE_IN_SPHERE});

    return locationData;
  }

  _getUserData(state, sphere) {
    let sphereUserData = sphere.users; // { userId: { firstName: null, lastName: null, email: null, invitationPending: false, present: false, picture: null, accessLevel: admin/member/guest, updatedAt: 1 }}
    let userIds = Object.keys(sphereUserData);
    let userData = [];

    userData.push({id: 'everyoneLabel', type:'lightExplanation', label: 'EVERYONE IN YOUR SPHERE' });
    userData.push({
      id: EVERYONE_IN_SPHERE,
      text: 'Everyone in the Sphere',
      icon: 'ios-people',
      iconSize: 35,
      singular: true,
      selected: this.state.recipients[EVERYONE_IN_SPHERE] === true
    });

    userData.push({id: 'specificUsersLabel', type:'lightExplanation', below: false, label: 'SPECIFIC USERS' });
    userIds.forEach((userId) => {
      if (sphereUserData[userId].invitationPending === false && state.user.userId !== userId) {
        userData.push({
          id: userId,
          text: sphereUserData[userId].firstName + " " + sphereUserData[userId].lastName,
          picture: sphereUserData[userId].picture,
          person: true,
          selected: this.state.recipients[userId] === true
        })
      }
    });

    userData.push({
      id: state.user.userId,
      text: state.user.firstName + " " + state.user.lastName,
      picture: state.user.picture,
      person: true,
      selected: this.state.recipients[state.user.userId] === true
    });

    return userData;
  }

  _getItems() {
    let state = this.props.store.getState();
    let sphere = state.spheres[this.props.sphereId];
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
    });
    items.push({type:'lightExplanation', below: true, align: 'right', style:{ paddingTop: 2, paddingRight: 5 }, label: '( ' + this.state.messageContent.length + ' / 140 )' });

    let userData = this._getUserData(state, sphere);
    items.push({type:'lightExplanation', below: false, label: 'RECIPIENTS', alreadyPadded: true});
    if (this.state.recipients[EVERYONE_IN_SPHERE] === true) {
      items.push({
        label: userData[1].text,
        type: 'navigation',
        icon:  <IconButton name={userData[1].icon} size={24} buttonSize={34} radius={17} button={true} color="#fff" buttonStyle={{backgroundColor: colors.green.hex, marginLeft:3, marginRight:7, borderColor: colors.white.hex, borderWidth: 2}}/>,
        callback: () => {
          Actions.selectFromList({items: userData, title: 'Recipients', callback: (selection) => {
            this.setState({recipients: selection});
          }});
        }
      });
      items.push({
        label: 'Including you',
        type: 'switch',
        wrapperStyle: { backgroundColor: colors.white.rgba(0.6) },
        style: {paddingLeft: 12},
        icon: <View style={{paddingLeft: 12}}>
          <IconButton name='ios-body' size={22} buttonSize={30} radius={15} button={true} color="#fff" buttonStyle={{backgroundColor: colors.menuTextSelected.hex, marginLeft:3, marginRight:7}}/>
        </View>,
        value: this.state.everyoneInSphereIncludingOwner,
        callback: (newValue) => {
          this.setState({everyoneInSphereIncludingOwner: newValue});
        }
      });
    }
    else {
      items.push({
        label: 'Add recipient',
        type: 'navigation',
        icon: <IconButton name='ios-body' size={23} buttonSize={30} radius={15} button={true} color="#fff" buttonStyle={{backgroundColor: colors.green.hex, marginLeft:3, marginRight:7}}/>,
        callback: () => {
          Actions.selectFromList({items: userData, title: 'Recipients', callback: (selection) => {
            this.setState({recipients: selection});
          }});
        }
      });

      userData.forEach((user) => {
        if (this.state.recipients[user.id] === true) {
          if (user.type === undefined) {
            let icon = user.icon ?
              <IconButton name={user.icon} size={22} buttonSize={30} radius={15} button={true} color="#fff" buttonStyle={{backgroundColor: colors.green.hex, marginLeft:3, marginRight:7, borderColor: colors.white.hex, borderWidth: 2}}/> :
              <ProfilePicture picture={user.picture} size={32} />;
            items.push({
              label: user.text,
              type: 'deletableEntry',
              wrapperStyle: { backgroundColor: colors.white.rgba(0.6) },
              icon:  <View style={{paddingLeft: 12}}>{icon}</View>,
              callback: () => {
                let newRecipients = this.state.recipients;
                delete newRecipients[user.id];
                this.setState({recipients: newRecipients});
              }
            });
          }
        }
      });
    }

    let locationItems = this._getLocationItems(sphere);
    items.push({type:'lightExplanation', below: false, label: 'LEAVE MESSAGE IN'});


    // show locations
    let selectLocation = () => {
      Actions.selectFromList({items: locationItems , title: 'Leave where?', submitOnSelect: true, callback: (selection) => {
        let selectedIds = Object.keys(selection);
        if (selectedIds.length > 0) {
          this.setState({triggerLocationId: Object.keys(selection)[0]});
        }
        else {
          this.setState({triggerLocationId:null});
        }
      }});
    };

    if (this.state.triggerLocationId) {
      let location;
      for (let i = 0; i < locationItems.length; i++) {
        if (this.state.triggerLocationId === locationItems[i].id) {
          location = locationItems[i];
          break;
        }
      }

      items.push({
        label: location.text,
        type: 'navigation',
        icon:  location.icon ?
          <IconButton name={location.icon} size={18} buttonSize={34} radius={17} button={true} color="#fff" buttonStyle={{backgroundColor: colors.csBlue.hex, marginLeft:3, marginRight:7, borderColor: colors.white.hex, borderWidth: 2}}/> :
          <ProfilePicture picture={location.picture} size={30} />,
        callback: selectLocation
      });
    }
    else {
      items.push({
        label: 'Select',
        type: 'navigation',
        icon: <IconButton name='md-pin' size={21} buttonSize={30} radius={15} button={true} color="#fff" buttonStyle={{backgroundColor: colors.csBlue.hex, marginLeft:3, marginRight:7}}/>,
        callback: selectLocation
      });
    }

    items.push({ type: 'lightExplanation', label:'WHEN SHOULD IT BE DELIVERED' });
    items.push({
      type: 'dropdown',
      label: 'Deliver message on',
      dropdownHeight: 130,
      valueRight: true,
      buttons: 2,
      valueStyle: {color: colors.darkGray2.hex, textAlign: 'right', fontSize: 15},
      value: this.state.triggerEvent,
      items: [{label:'Entering', value:'enter'},{label:'Exiting', value:'exit'}],
      callback: (newValue) => {
        this.setState({triggerEvent: newValue})
      }
    });
    items.push({ type: 'lightExplanation', label:'When entering is selected and the user is already there, the message will also be delivered!', below:true });

    items.push({ type: 'spacer' });

    return items;
  }

  render() {
    return (
      <Background hasNavBar={false} image={this.props.backgrounds.detailsDark} >
        <OrangeLine/>
        <ScrollView>
          <ListEditableItems items={this._getItems()} separatorIndent={false} />
        </ScrollView>
      </Background>
      );
  }
}
