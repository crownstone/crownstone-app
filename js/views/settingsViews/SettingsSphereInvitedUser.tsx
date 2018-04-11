import * as React from 'react'; import { Component } from 'react';
import {
  Alert,
  Dimensions,
  TouchableHighlight,
  PixelRatio,
  ScrollView,
  Switch,
  Text,
  View
} from 'react-native';

import { IconButton } from './../components/IconButton'
import { Background } from './../components/Background'
import { ProfilePicture } from './../components/ProfilePicture'
import { ListEditableItems } from './../components/ListEditableItems'
import { CLOUD } from '../../cloud/cloudAPI'
import { LOG } from '../../logging/Log'
import {colors, screenWidth, OrangeLine} from './../styles'
import {Permissions} from "../../backgroundProcesses/PermissionManager";
import {BackAction} from "../../util/Back";
const Actions = require('react-native-router-flux').Actions;

export class SettingsSphereInvitedUser extends Component<any, any> {
  static navigationOptions = ({ navigation }) => {
    return { title: "Invited User" }
  };

  deleting : boolean;
  unsubscribe : any;

  constructor(props) {
    super(props);
    this.deleting = false;
  }


  _getItems(user) {
    let items = [];
    // room Name:
    items.push({type:'spacer'});
    items.push({type:'explanation', label:'INVITE WAS SENT TO'});
    items.push({label:user.email, type: 'info', labelStyle:{width:screenWidth}});

    items.push({type:'explanation', label:'MANAGE INVITE'});
    items.push({
      label:'Resend Invitation',
      type:'button',
      style:{color:colors.iosBlue.hex},
      icon: <IconButton name="ios-mail" size={23} color="#fff" buttonStyle={{backgroundColor:colors.iosBlue.hex}} />,
      callback: () => {
        Alert.alert(
          "Let's remind someone!",
          "Would you like me to send another invitation email?.",
          [{text:'No'}, {text:'Yes', onPress: () => {
            this.props.eventBus.emit('showLoading', 'Resending Email...');
            CLOUD.forSphere(this.props.sphereId).resendInvite(user.email)
              .then(() => {
                this.props.eventBus.emit('hideLoading');
                Alert.alert("It's sent!", "I have sent a new email to invite this user!", [{text:"OK"}])
              })
              .catch((err) => {
                this.props.eventBus.emit('hideLoading');
                Alert.alert("Could not resend email..", "Please try again later.", [{text:"OK"}]);
                LOG.error("Could not resend email", err);
              })
        }}], { cancelable : false });
    }});

    let spherePermissions = Permissions.inSphere(this.props.sphereId);

    if ( user.accessLevel === 'admin'  && spherePermissions.inviteAdminToSphere  ||
         user.accessLevel === 'member' && spherePermissions.inviteMemberToSphere ||
         user.accessLevel === 'guest'  && spherePermissions.inviteGuestToSphere  ) {
      items.push({
        label: 'Revoke Invite',
        type: 'button',
        icon: <IconButton name="md-trash" size={22} color="#fff" buttonStyle={{backgroundColor: colors.red.hex}}/>,
        callback: () => {
          Alert.alert(
            "Are you sure?",
            "Shall I revoke the invitation?",
            [{text: 'No'}, {
              text: 'Yes', onPress: () => {
                this.props.eventBus.emit('showLoading', 'Revoking Invitation...');
                this.deleting = true;
                CLOUD.forSphere(this.props.sphereId).revokeInvite(user.email)
                  .then(() => {
                    let defaultAction = () => {
                      this.props.eventBus.emit('hideLoading');
                      this.props.store.dispatch({
                        type: 'REMOVE_SPHERE_USER',
                        sphereId: this.props.sphereId,
                        userId: this.props.userId,
                      });
                      BackAction();
                    };
                    Alert.alert("Invitation Revoked!", "", [{
                      text: "OK",
                      onPress: defaultAction
                    }], {onDismiss: defaultAction});
                  })
                  .catch((err) => {
                    this.deleting = false;
                    this.props.eventBus.emit('hideLoading');
                    Alert.alert("Could not revoke invitation..", "Please try again later.", [{text: "OK"}]);
                    LOG.error("Could not revoke invitation", err);
                  })
              }
            }
            ],
            {cancelable: false});
        }
      });
    }

    return items;
  }


  render() {
    const store = this.props.store;
    const state = store.getState();
    let user = state.spheres[this.props.sphereId].users[this.props.userId];

    return (
      <Background image={this.props.backgrounds.menu} >
        <OrangeLine/>
        <ScrollView>
          <View style={{alignItems:'center', justifyContent:'center', width:screenWidth, paddingTop:40}}>
            <ProfilePicture
              value={user.picture}
              size={120}
            />
          </View>
          <ListEditableItems items={this._getItems(user)} separatorIndent={true} />
        </ScrollView>
      </Background>
    );
  }
}
