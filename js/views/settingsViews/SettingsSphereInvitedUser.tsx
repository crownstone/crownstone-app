import { Component } from 'react'
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

import { Icon } from './../components/Icon'
import { IconButton } from './../components/IconButton'
import { Background } from './../components/Background'
import { ProfilePicture } from './../components/ProfilePicture'
import { ListEditableItems } from './../components/ListEditableItems'
import { logOut, processImage, safeDeleteFile } from '../../util/Util'
import { CLOUD } from '../../cloud/cloudAPI'
import { LOG } from '../../logging/Log'
import { styles, colors, screenWidth } from './../styles'
const Actions = require('react-native-router-flux').Actions;

export class SettingsSphereInvitedUser extends Component<any, any> {
  deleting : boolean;
  unsubscribe : any;

  constructor() {
    super();
    this.deleting = false;
  }

  componentDidMount() {
    const { store } = this.props;
    this.unsubscribe = store.subscribe(() => {
      if (this.deleting !== true) {
        this.forceUpdate();
      }
    })
  }

  componentWillUnmount() {
    this.unsubscribe();
  }


  _getItems(user) {
    const store = this.props.store;
    let items = [];
    // room Name:
    items.push({type:'spacer'});
    items.push({type:'explanation', label:'INVITE WAS SENT TO'});
    items.push({label:user.email, type: 'info'});

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
                LOG.error("Could not resend email", err);
              })
        }}]);
    }});
    items.push({
      label:'Revoke Invite',
      type:'button',
      icon: <IconButton name="md-trash" size={22} color="#fff" buttonStyle={{backgroundColor:colors.red.hex}} />,
      callback: () => {
      Alert.alert(
        "Are you sure?",
        "Shall I revoke the invitation?",
        [{text:'No'}, {text:'Yes', onPress: () => {
          this.props.eventBus.emit('showLoading', 'Revoking Invitation...');
          this.deleting = true;
          CLOUD.forSphere(this.props.sphereId).revokeInvite(user.email)
            .then(() => {
              Alert.alert("Invitation Revoked!", "", [{text:"OK", onPress: () => {
                this.props.eventBus.emit('hideLoading');
                this.props.store.dispatch({
                  type: 'REMOVE_SPHERE_USER',
                  sphereId: this.props.sphereId,
                  userId: this.props.userId,
                });
                Actions.pop();
              }}]);
            })
            .catch((err) => {
              this.deleting = false;
              LOG.error("Could not revoke invitation", err);
            })
          }}]);
    }});

    return items;
  }



  render() {
    const store = this.props.store;
    const state = store.getState();
    let user = state.spheres[this.props.sphereId].users[this.props.userId];

    return (
      <Background image={this.props.backgrounds.menu} >
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
