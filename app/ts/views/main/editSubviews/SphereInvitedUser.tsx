import {Languages} from "../../../Languages"
import * as React from 'react';
import {Component} from 'react';
import {Alert, ScrollView, View} from 'react-native';

import {IconButton} from '../../components/IconButton'
import {Background} from '../../components/Background'
import {ProfilePicture} from '../../components/ProfilePicture'
import {ListEditableItems} from '../../components/ListEditableItems'
import {CLOUD} from '../../../cloud/cloudAPI'
import {LOGe} from '../../../logging/Log'
import {background, colors, screenWidth} from "../../styles";
import {Permissions} from "../../../backgroundProcesses/PermissionManager";
import {core} from "../../../Core";
import {NavigationUtil} from "../../../util/navigation/NavigationUtil";
import {TopBarUtil} from "../../../util/TopBarUtil";
import {SettingsBackground} from "../../components/SettingsBackground";
import { SettingsScrollView } from "../../components/SettingsScrollView";

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("SphereInvitedUser", key)(a,b,c,d,e);
}


export class SphereInvitedUser extends Component<any, any> {
  static options(props) {
    return TopBarUtil.getOptions({title: lang("Invited_User")})
  }

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
    items.push({type:'explanation', label: lang("INVITE_WAS_SENT_TO")});
    items.push({label:user.email, type: 'info', labelStyle:{width:screenWidth}});

    items.push({type:'explanation', label: lang("MANAGE_INVITE")});
    items.push({
      label: lang("Resend_Invitation"),
      type:'button',
      style:{color:colors.iosBlue.hex},
      testID:"ResendInvitation",
      icon: <IconButton name="ios-mail" size={23} color="#fff" buttonStyle={{backgroundColor:colors.iosBlue.hex}} />,
      callback: () => {
        Alert.alert(
          lang("_Lets_remind_someone___Wo_header"),
          lang("_Lets_remind_someone___Wo_body"),
          [{text:lang("_Lets_remind_someone___Wo_left")}, {
          text:lang("_Lets_remind_someone___Wo_right"), onPress: () => {
            core.eventBus.emit('showLoading', 'Resending Email...');
            CLOUD.forSphere(this.props.sphereId).resendInvite(user.email)
              .then(() => {
                core.eventBus.emit('hideLoading');
                Alert.alert("It's sent!", "I have sent a new email to invite this user!", [{text:"OK"}])
              })
              .catch((err) => {
                core.eventBus.emit('hideLoading');
                Alert.alert(
                  lang("_Could_not_resend_email___header"),
                  lang("_Could_not_resend_email___body"),
                  [{text:lang("_Could_not_resend_email___left")}]);
                LOGe.info("Could not resend email", err?.message);
              })
        }}], { cancelable : false });
    }});

    let spherePermissions = Permissions.inSphere(this.props.sphereId);

    if ( user.accessLevel === 'admin'  && spherePermissions.inviteAdminToSphere  ||
         user.accessLevel === 'member' && spherePermissions.inviteMemberToSphere ||
         user.accessLevel === 'guest'  && spherePermissions.inviteGuestToSphere  ) {
      items.push({
        label: lang("Revoke_Invite"),
        type: 'button',
        testID:"RevokeInvitation",
        icon: <IconButton name="md-trash" size={22} color="#fff" buttonStyle={{backgroundColor: colors.red.hex}}/>,
        callback: () => {
          Alert.alert(
            lang("_Are_you_sure___Shall_I_r_header"),
            lang("_Are_you_sure___Shall_I_r_body"),
            [
              {text: lang("_Are_you_sure___Shall_I_r_left")},
              {text: lang("_Are_you_sure___Shall_I_r_right"), onPress: () => {
                core.eventBus.emit('showLoading', 'Revoking Invitation...');
                this.deleting = true;
                CLOUD.forSphere(this.props.sphereId).revokeInvite(user.email)
                  .then(() => {
                    core.eventBus.emit('hideLoading');
                    let defaultAction = () => {
                      core.store.dispatch({
                        type: 'REMOVE_SPHERE_USER',
                        sphereId: this.props.sphereId,
                        userId: this.props.userId,
                      });
                      NavigationUtil.back();
                    };
                    Alert.alert("Invitation Revoked!", "", [{
                      text: "OK",
                      onPress: defaultAction
                    }], {onDismiss: defaultAction});
                  })
                  .catch((err) => {
                    this.deleting = false;
                    core.eventBus.emit('hideLoading');
                    Alert.alert(
                      lang("_Could_not_revoke_invitat_header"),
                      lang("_Could_not_revoke_invitat_body"),
                      [{text: lang("_Could_not_revoke_invitat_left")}]);
                    LOGe.info("Could not revoke invitation", err?.message);
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
    const store = core.store;
    const state = store.getState();
    let user = state.spheres[this.props.sphereId].users[this.props.userId];

    return (
      <SettingsBackground testID={"SphereInvitedUser"}>
        <SettingsScrollView>
          <View style={{alignItems:'center', justifyContent:'center', width:screenWidth, paddingTop:40}}>
            <ProfilePicture
              value={user && user.picture || undefined}
              size={120}
            />
          </View>
          <ListEditableItems items={this._getItems(user)} separatorIndent={true} />
        </SettingsScrollView>
      </SettingsBackground>
    );
  }
}
