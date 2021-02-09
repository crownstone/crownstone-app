import { LiveComponent }          from "../../LiveComponent";

import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("SphereUser", key)(a,b,c,d,e);
}
import * as React from 'react';
import {
  Alert,
  ScrollView,
  View
} from 'react-native';
import {Permissions} from "../../../backgroundProcesses/PermissionManager";
import {CLOUD} from "../../../cloud/cloudAPI";
import {LOGe} from "../../../logging/Log";
import {Background} from "../../components/Background";
import { background, screenWidth } from "../../styles";
import {ProfilePicture} from "../../components/ProfilePicture";
import {ListEditableItems} from "../../components/ListEditableItems";
import { core } from "../../../core";
import { NavigationUtil } from "../../../util/NavigationUtil";
import { TopBarUtil } from "../../../util/TopBarUtil";


export class SphereUser extends LiveComponent<any, any> {
  static options(props) {
    return TopBarUtil.getOptions({title: lang("Sphere_User")})
  }

  deleting : boolean = false;
  unsubscribe : any;


  componentDidMount() {
    this.unsubscribe = core.eventBus.on("databaseChange", (data) => {
      let change = data.change;
      if  (change.updateSphereUser && this.deleting === false) {
        this.forceUpdate();
      }
    });
  }

  componentWillUnmount() {
    this.unsubscribe();
  }

  _getItems(user) {
    const store = core.store;

    let availablePermissions = [{label: lang("Member")},{label: lang("Guest")}];
    if (Permissions.inSphere(this.props.sphereId).inviteAdminToSphere) {
      availablePermissions = [{label: lang("Admin")},{label: lang("Member")},{label: lang("Guest")}];
    }

    let items = [];
    // room Name:
    items.push({type:'spacer'});
    items.push({label: lang("User"),  type: 'info', value: (user.firstName || "") + ' ' + (user.lastName || "")});
    items.push({label: lang("Email"),  type: 'info', value: user.email});
    items.push({
      type:'dropdown',
      buttons: true,
      label: lang("Access_Level"),
      dropdownHeight:150,
      value: user.accessLevel[0].toUpperCase() + user.accessLevel.substring(1),
      items: availablePermissions,
      callback: (permission) => {
        permission = permission.toLowerCase();
        core.eventBus.emit('showLoading', 'Updating user permissions...');
        CLOUD.forSphere(this.props.sphereId).changeUserAccess(user.email, permission)
          .then((result) => {
            core.eventBus.emit('hideLoading');
            store.dispatch({type: 'UPDATE_SPHERE_USER', sphereId: this.props.sphereId, userId: this.props.userId, data:{accessLevel: permission}});
          })
          .catch((err) => {
            core.eventBus.emit('hideLoading');
            Alert.alert(
              lang("_Something_went_wrong__Pl_header"),
              lang("_Something_went_wrong__Pl_body"),
              [{text:lang("_Something_went_wrong__Pl_left")}]);
            LOGe.info("Something went wrong during Updating user permissions.", err);
          })
        }
      }
    );

    items.push({type:'explanation', label: lang("REVOKE_PERMISSIONS")});
    items.push({label: lang("Remove_from_Sphere"), type:'button', callback: () => {
      Alert.alert(
        lang("_Are_you_sure_you_want_to_header"),
        lang("_Are_you_sure_you_want_to_body"),
        [{text:lang("_Are_you_sure_you_want_to_left")}, {
        text:lang("_Are_you_sure_you_want_to_right"), onPress: () => {
        this.deleting = true;
        core.eventBus.emit('showLoading', 'Removing user from Sphere...');
        CLOUD.forSphere(this.props.sphereId).deleteUserFromSphere(this.props.userId)
          .then((result) => {
            core.eventBus.emit('hideLoading');
            Alert.alert("User has been removed!", "The next time the user logs into the app, the users' device will be removed.", [{text:"OK", onPress:() => {
              core.store.dispatch({
                type: 'REMOVE_SPHERE_USER',
                sphereId: this.props.sphereId,
                userId: this.props.userId,
              });
              NavigationUtil.back();
            }}], {cancelable : false});
          })
          .catch((err) => {
            this.deleting = false;
            core.eventBus.emit('hideLoading');
            Alert.alert(
              lang("_Something_went_wrong__Ple_header"),
              lang("_Something_went_wrong__Ple_body"),
              [{text:lang("_Something_went_wrong__Ple_left")}]);
            LOGe.info("Something went wrong during Updating user permissions.", err);
          })

      }}])
    }});

    return items;
  }


  render() {
    const store = core.store;
    const state = store.getState();
    let user = state.spheres[this.props.sphereId].users[this.props.userId];

    return (
      <Background image={background.menu} hasNavBar={false}>
        <ScrollView>
          <View style={{alignItems:'center', justifyContent:'center', width: screenWidth, paddingTop:40}}>
            <ProfilePicture
              picture={user.picture}
              size={120}
            />
          </View>
          <ListEditableItems items={this._getItems(user)} separatorIndent={true} />
        </ScrollView>
      </Background>
    );
  }
}
