
import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("MessageAdd", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  Alert,
  ScrollView,
  View
} from 'react-native';


import {
  background,
  colors
} from "../styles";
import {Background} from "../components/Background";
import {IconButton} from "../components/IconButton";
import { ListEditableItems } from "../components/ListEditableItems";
import { ProfilePicture } from "../components/ProfilePicture";
import {MessageUtil} from "../../util/MessageUtil";

import { xUtil } from "../../util/StandAloneUtil";
import { NavigationUtil } from "../../util/NavigationUtil";
import { core } from "../../Core";
import { TopBarUtil } from "../../util/TopBarUtil";
import { LiveComponent } from "../LiveComponent";
import { BackgroundNoNotification } from "../components/BackgroundNoNotification";


export const EVERYONE_IN_SPHERE = '__everyone_in_sphere__';
export const ANYWHERE_IN_SPHERE = '__sphere__';

export class MessageAdd extends LiveComponent<any, any> {
  static options(props) {
    return TopBarUtil.getOptions({title: lang("New_Message"), cancelModal: true, create: true})
  }

  constructor(props) {
    super(props);

    this.state = {
      everyoneInSphereIncludingOwner: true,
      triggerLocationId: ANYWHERE_IN_SPHERE,
      triggerEvent: 'enter',
      messageContent: '',
      recipients: {},
    };

    this.state.recipients[EVERYONE_IN_SPHERE] = true;
  }

  navigationButtonPressed({ buttonId }) {
    if (buttonId === 'create') {  this._createMessage(); }
  }

  _createMessage() {
    if (this.state.messageContent.trim().length === 0) {
      Alert.alert(
lang("_Message_is_empty____I_ca_header"),
lang("_Message_is_empty____I_ca_body"),
[{text:lang("_Message_is_empty____I_ca_left")}]);
      return;
    }

    if (Object.keys(this.state.recipients).length === 0) {
      Alert.alert(
lang("_No_recipients____I_cant__header"),
lang("_No_recipients____I_cant__body"),
[{text:lang("_No_recipients____I_cant__left")}]);
      return;
    }

    let state = core.store.getState();

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
    let messageId = xUtil.getUUID();

    core.store.dispatch({
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
      core.store,
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

    NavigationUtil.dismissModal();
  }

  _getLocationItems(sphere) {
    let locationIds = Object.keys(sphere.locations);
    let locationData = [];

    locationData.push({id: 'roomExplanation', type:'explanation', label: lang("IN_A_ROOM")});
    locationIds.forEach((locationId) => {
      let location = sphere.locations[locationId];
      locationData.push({id: locationId, text: location.config.name, icon: location.config.icon, singular: true, selected: this.state.triggerLocationId === locationId});
    });

    locationData.push({id: 'sphereExplanation', type:'explanation', label: lang("ANYWHERE_IN_THE_SPHERE")});
    locationData.push({id: ANYWHERE_IN_SPHERE, text: sphere.config.name, icon: 'c1-sphere', singular: true, selected: this.state.triggerLocationId === ANYWHERE_IN_SPHERE});

    return locationData;
  }

  _getUserData(state, sphere) {
    let sphereUserData = sphere.users; // { userId: { firstName: null, lastName: null, email: null, invitationPending: false, present: false, picture: null, accessLevel: admin/member/guest, updatedAt: 1 }}
    let userIds = Object.keys(sphereUserData);
    let userData = [];

    userData.push({id: 'everyoneLabel', type:'explanation', label: lang("EVERYONE_IN_YOUR_SPHERE")});
    userData.push({
      id: EVERYONE_IN_SPHERE,
      text: lang("Everyone_in_the_Sphere"),
      icon: 'ios-people',
      iconSize: 35,
      singular: true,
      selected: this.state.recipients[EVERYONE_IN_SPHERE] === true
    });

    userData.push({id: 'specificUsersLabel', type:'explanation', below: false, label: lang("SPECIFIC_USERS")});

    userIds.sort((a,b) => { return sphereUserData[b].firstName > sphereUserData[a].firstName ? -1 : 1 });

    userIds.forEach((userId) => {
      // if (sphereUserData[userId].invitationPending === false && state.user.userId !== userId) {
        userData.push({
          id: userId,
          text: sphereUserData[userId].firstName + " " + (sphereUserData[userId].lastName || ""),
          picture: sphereUserData[userId].picture,
          person: true,
          selected: this.state.recipients[userId] === true
        })
      // }
    });

    // userData.push({
    //   id: state.user.userId,
    //   text: state.user.firstName + " " + (state.user.lastName || ""),
    //   picture: state.user.picture,
    //   person: true,
    //   selected: this.state.recipients[state.user.userId] === true
    // });

    return userData;
  }

  _getItems() {
    let state = core.store.getState();
    let sphere = state.spheres[this.props.sphereId];
    let items = [];

    items.push({type:'explanation', below: false, label: lang("MESSAGE")});
    items.push({
      type: 'textBlob',
      placeholder:  lang("Your_message___"),
      barHeight: 120,
      maxLength: 140,
      value: this.state.messageContent,
      callback: (newText) => {
        this.setState({messageContent: newText});
      },
    });
    items.push({type:'explanation', below: true, align: 'right', style:{ paddingTop: 2, paddingRight: 5 }, label: lang("__________",this.state.messageContent.length)});

    let userData = this._getUserData(state, sphere);
    items.push({type:'explanation', below: false, label: lang("RECIPIENTS"), alreadyPadded: true});
    if (this.state.recipients[EVERYONE_IN_SPHERE] === true) {
      items.push({
        label: userData[1].text,
        type: 'navigation',
        icon:  <IconButton name={userData[1].icon} size={24} buttonSize={34} radius={17}  color="#fff" buttonStyle={{backgroundColor: colors.green.hex, marginLeft:3, marginRight:7, borderColor: colors.white.hex, borderWidth: 2}}/>,
        callback: () => {
         NavigationUtil.navigate( "SelectFromList",{items: userData, title: lang("Recipients"), callback: (selection) => {
            this.setState({recipients: selection});
          }});
        }
      });
      items.push({
        label: lang("Including_you"),
        type: 'switch',
        wrapperStyle: { backgroundColor: colors.white.rgba(0.6) },
        style: {paddingLeft: 12},
        icon: <View style={{paddingLeft: 12}}>
          <IconButton name='ios-body' size={22} buttonSize={30} radius={15}  color="#fff" buttonStyle={{backgroundColor: colors.blue.hex, marginLeft:3, marginRight:7}}/>
        </View>,
        value: this.state.everyoneInSphereIncludingOwner,
        callback: (newValue) => {
          this.setState({everyoneInSphereIncludingOwner: newValue});
        }
      });
    }
    else {
      items.push({
        label: lang("Add_recipient"),
        type: 'navigation',
        icon: <IconButton name='ios-body' size={23} buttonSize={30} radius={15}  color="#fff" buttonStyle={{backgroundColor: colors.green.hex, marginLeft:3, marginRight:7}}/>,
        callback: () => {
         NavigationUtil.navigate( "SelectFromList",{items: userData, title: lang("Recipients"), callback: (selection) => {
            this.setState({recipients: selection});
          }});
        }
      });

      userData.forEach((user) => {
        if (this.state.recipients[user.id] === true) {
          if (user.type === undefined) {
            let icon = user.icon ?
              <IconButton name={user.icon} size={22} buttonSize={30} radius={15}  color="#fff" buttonStyle={{backgroundColor: colors.green.hex, marginLeft:3, marginRight:7, borderColor: colors.white.hex, borderWidth: 2}}/> :
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
    items.push({type:'explanation', below: false, label: lang("LEAVE_MESSAGE_IN")});


    // show locations
    let selectLocation = () => {
     NavigationUtil.navigate( "SelectFromList",{items: locationItems , title: lang("Leave_where_"), submitOnSelect: true, callback: (selection) => {
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
          <IconButton name={location.icon} size={18} buttonSize={34} radius={17}  color="#fff" buttonStyle={{backgroundColor: colors.csBlue.hex, marginLeft:3, marginRight:7, borderColor: colors.white.hex, borderWidth: 2}}/> :
          <ProfilePicture picture={location.picture} size={30} />,
        callback: selectLocation
      });
    }
    else {
      items.push({
        label: lang("Select"),
        type: 'navigation',
        icon: <IconButton name='md-pin' size={21} buttonSize={30} radius={15}  color="#fff" buttonStyle={{backgroundColor: colors.csBlue.hex, marginLeft:3, marginRight:7}}/>,
        callback: selectLocation
      });
    }

    items.push({ type: 'explanation', label: lang("WHEN_SHOULD_IT_BE_DELIVER")});
    items.push({
      type: 'dropdown',
      label: lang("Deliver_message_on"),
      dropdownHeight: 130,
      valueRight: true,
      buttons: 2,
      valueStyle: {color: colors.darkGray2.hex, textAlign: 'right', fontSize: 15},
      value: this.state.triggerEvent,
      items: [{label: lang("Entering"), value:'enter'},{label: lang("Exiting"), value:'exit'}],
      callback: (newValue) => {
        this.setState({triggerEvent: newValue})
      }
    });
    items.push({ type: 'explanation', label: lang("When_entering_is_selected"), below:true });

    items.push({ type: 'spacer' });

    return items;
  }

  render() {
    return (
      <BackgroundNoNotification hasNavBar={false} image={background.main} >
        <ScrollView>
          <ListEditableItems items={this._getItems()} separatorIndent={false} />
        </ScrollView>
      </BackgroundNoNotification>
      );
  }
}
