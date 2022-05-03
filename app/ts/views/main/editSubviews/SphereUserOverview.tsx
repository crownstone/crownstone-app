import { LiveComponent }          from "../../LiveComponent";

import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("SphereUserOverview", key)(a,b,c,d,e);
}
import * as React from 'react';
import {
  ScrollView} from 'react-native';
import {Permissions} from "../../../backgroundProcesses/PermissionManager";
import {IconButton} from "../../components/IconButton";
import { background, colors } from "../../styles";

import {ProfilePicture} from "../../components/ProfilePicture";
import {Background} from "../../components/Background";
import {ListEditableItems} from "../../components/ListEditableItems";
import { core } from "../../../Core";
import { NavigationUtil } from "../../../util/navigation/NavigationUtil";
import { TopBarUtil } from "../../../util/TopBarUtil";


export class SphereUserOverview extends LiveComponent<any, any> {
  static options(props) {
    let state = core.store.getState();
    let sphere = state.spheres[props.sphereId] ;
    return TopBarUtil.getOptions({title: lang("Users_in_",sphere.config.name)});
  }

  unsubscribeStoreEvents : any;


  componentDidMount() {
    this.unsubscribeStoreEvents = core.eventBus.on("databaseChange", (data) => {
      let change = data.change;
      if (
        change.changeSphereUsers  && change.changeSphereUsers.sphereIds[this.props.sphereId]  ||
        change.updateSphereUser   && change.updateSphereUser.sphereIds[this.props.sphereId]
      ) {
        this.forceUpdate();
      }
    })
  }

  componentWillUnmount() {
    this.unsubscribeStoreEvents();
  }

  _getUsersWithAccess(state, accessLevel) {
    let spherePermissions = Permissions.inSphere(this.props.sphereId);
    let result = [];
    let users = state.spheres[this.props.sphereId].users;
    for (let userId in users) {
      if (users.hasOwnProperty(userId)) {
        if (users[userId].accessLevel == accessLevel) {
          if (users[userId].invitationPending === true) {
            result.push({
              label: users[userId].email,
              testID: `user:${users[userId].email}`,
              type: (userId === state.user.userId || spherePermissions.manageUsers === false) ? 'info' :  "navigation",
              icon: <IconButton name='ios-mail' size={27} radius={17}  color={colors.white.hex} style={{position:'relative', top:1}} buttonStyle={{backgroundColor: colors.darkGray.hex, width:34, height:34, marginLeft:3}}/>,
              callback: () => {
                NavigationUtil.navigate( "SphereInvitedUser",{
                  title: users[userId].email,
                  userId: userId,
                  invitePending: true,
                  sphereId: this.props.sphereId
                });
              }
            });
          }
          else {
            result.push({
              label: ((users[userId].firstName + " ") || "") + (users[userId].lastName || ""),
              testID: `user:${users[userId].email}`,
              type: (userId === state.user.userId ||  spherePermissions.manageUsers === false) ? 'info' :  "navigation",
              icon: <ProfilePicture picture={users[userId].picture} borderless={false} />,
              callback: () => {
                NavigationUtil.navigate( "SphereUser",{
                  title: users[userId].firstName,
                  userId: userId,
                  sphereId: this.props.sphereId
                });
              }
            });
          }
        }
      }
    }

    return result
  }

  _getItems() {
    let items = [];

    const store = core.store;
    const state = store.getState();

    items.push({label: lang("ADMINS"),  type:'explanation', below:false});
    items = items.concat(this._getUsersWithAccess(state,'admin'));
    items.push({label: lang("Admins_can_add__configure"), style:{paddingBottom:0}, type:'explanation', below:true});

    let members = this._getUsersWithAccess(state,'member');
    if (members.length > 0) {
      items.push({label: lang("MEMBERS"),  type: 'explanation', below: false});
      items = items.concat(members);
      items.push({label: lang("Members_can_configure_Cro"), style:{paddingBottom:0}, type:'explanation', below:true});
    }

    let guest = this._getUsersWithAccess(state, 'guest');
    if (guest.length > 0) {
      items.push({label: lang("GUESTS"),  type:'explanation', below: false});
      items = items.concat(guest);
      items.push({label: lang("Guests_can_control_Crowns"), style:{paddingBottom:0}, type:'explanation', below:true});
    }

    let spherePermissions = Permissions.inSphere(this.props.sphereId);
    if (spherePermissions.inviteGuestToSphere || spherePermissions.inviteMemberToSphere || spherePermissions.inviteAdminToSphere) {
      items.push({label: lang("ADD_MORE_PEOPLE"),  type:'explanation', below: false});
      items.push({
        label: lang("Invite_someone_new_"), // accessLevel[0].toUpperCase() + accessLevel.substring(1),  this capitalizes the first letter of the access level
        type: 'navigation',
        testID: 'AddUser',
        labelStyle: {color: colors.blue.hex, fontWeight:'bold'},
        icon: <IconButton name="md-add" size={22} color="#fff" buttonStyle={{backgroundColor: colors.green.hex, marginLeft: 3, marginRight: 7}}/>,
        callback: () => {
          NavigationUtil.launchModal( "SphereUserInvite",{ sphereId: this.props.sphereId });
        }
      });
    }

    items.push({type:'spacer'});
    items.push({type:'spacer'});
    items.push({type:'spacer'});

    return items;
  }


  render() {
    return (
      <Background image={background.menu} hasNavBar={false} testID={'SphereUserOverview'}>
        <ScrollView>
          <ListEditableItems items={this._getItems()} />
        </ScrollView>
      </Background>
    );
  }
}
