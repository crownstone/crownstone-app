
import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("SphereUserOverview", key)(a,b,c,d,e);
}
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
import {Permissions} from "../../../backgroundProcesses/PermissionManager";
import {IconButton} from "../../components/IconButton";
import {colors, OrangeLine} from "../../styles";
import {Actions} from "react-native-router-flux";
import {ProfilePicture} from "../../components/ProfilePicture";
import {Background} from "../../components/Background";
import {ListEditableItems} from "../../components/ListEditableItems";


export class SphereUserOverview extends Component<any, any> {
  static navigationOptions = ({ navigation }) => {
    const { params } = navigation.state;
    let state = params.store.getState();
    let sphere = state.spheres[params.sphereId] ;
    return {
      title: lang("Users_in_",sphere.config.name),
      headerTruncatedBackTitle: lang("Back"),
    }
  };

  unsubscribeStoreEvents : any;


  componentDidMount() {
    this.unsubscribeStoreEvents = this.props.eventBus.on("databaseChange", (data) => {
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
              type: (userId === state.user.userId || spherePermissions.manageUsers === false) ? 'info' :  lang("navigation"),
              icon: <IconButton name='ios-mail' size={27} radius={17} button={true} color={colors.white.hex} style={{position:'relative', top:1}} buttonStyle={{backgroundColor: colors.darkGray.hex, width:34, height:34, marginLeft:3}}/>,
              callback: () => {
                Actions.sphereInvitedUser({
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
              label: users[userId].firstName + " " + users[userId].lastName,
              type: (userId === state.user.userId ||  spherePermissions.manageUsers === false) ? 'info' :  lang("navigation"),
              icon: <ProfilePicture picture={users[userId].picture} borderless={false} />,
              callback: () => {
                Actions.sphereUser({
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

    const store = this.props.store;
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
        labelStyle: {color: colors.menuTextSelected.hex, fontWeight:'bold'},
        icon: <IconButton name="md-add" size={22} color="#fff" buttonStyle={{backgroundColor: colors.green.hex, marginLeft: 3, marginRight: 7}}/>,
        callback: () => {
          Actions.sphereUserInvite({sphereId: this.props.sphereId});
        }
      });
    }

    items.push({type:'spacer'})
    items.push({type:'spacer'})
    items.push({type:'spacer'})

    return items;
  }


  render() {
    return (
      <Background image={this.props.backgrounds.menu} hasNavBar={false}>
        <OrangeLine/>
        <ScrollView>
          <ListEditableItems items={this._getItems()} />
        </ScrollView>
      </Background>
    );
  }
}
