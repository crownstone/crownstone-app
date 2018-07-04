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
import { Background } from '../components/Background'
import { ListEditableItems } from '../components/ListEditableItems'
import { ProfilePicture } from '../components/ProfilePicture'
import { IconButton } from '../components/IconButton'
import { Bluenet } from '../../native/libInterface/Bluenet'
const Actions = require('react-native-router-flux').Actions;
import { colors } from './../styles';
import { getStonesAndAppliancesInSphere } from '../../util/DataUtil';
import { CLOUD } from '../../cloud/cloudAPI'
import { LOG } from '../../logging/Log'
import { Util } from "../../util/Util";
import {Permissions} from "../../backgroundProcesses/PermissionManager";
import {BackAction} from "../../util/Back";
import {OrangeLine} from "../styles";
import {addCrownstoneExplanationAlert} from "./AddItemsToSphere";

export class SphereEdit extends Component<any, any> {
  static navigationOptions = ({ navigation }) => {
    const { params } = navigation.state;
    let state = params.store.getState();
    let sphere = state.spheres[params.sphereId] ;
    return {
      title: 'Edit ' + sphere.config.name,
    }
  };

  deleting : boolean;
  validationState : any;
  unsubscribeStoreEvents : any;

  constructor(props) {
    super(props);

    const state = props.store.getState();
    let sphereSettings = state.spheres[props.sphereId].config;

    this.state = {sphereName: sphereSettings.name};
    this.deleting = false;
    this.validationState = {sphereName:'valid'};
  }

  componentDidMount() {
    this.unsubscribeStoreEvents = this.props.eventBus.on("databaseChange", (data) => {
      let change = data.change;
      if (
        change.changeSphereUsers  && change.changeSphereUsers.sphereIds[this.props.sphereId]  ||
        change.updateSphereUser   && change.updateSphereUser.sphereIds[this.props.sphereId]   ||
        change.changeSpheres      && change.changeSpheres.sphereIds[this.props.sphereId]      ||
        change.changeSphereConfig && change.changeSphereConfig.sphereIds[this.props.sphereId]
      ) {
        if (this.deleting === false)
          this.forceUpdate();
      }
    });
  }

  componentWillUnmount() {
    this.unsubscribeStoreEvents();
  }


  _getItems() {
    let items = [];

    const store = this.props.store;
    const state = store.getState();

    let spherePermissions = Permissions.inSphere(this.props.sphereId);

    items.push({label:'SPHERE DETAILS',  type:'explanation', below:false});
    if (spherePermissions.editSphere) {
      let sphereSettings = state.spheres[this.props.sphereId].config;
      items.push({
        type:'textEdit',
        label:'Name',
        value: this.state.sphereName,
        validation:{minLength:2},
        validationCallback: (result) => {this.validationState.sphereName = result;},
        callback: (newText) => {
          this.setState({sphereName: newText});
        },
        endCallback: (newText) => {
          if (sphereSettings.name !== newText) {
            if (this.validationState.sphereName === 'valid' && newText.trim().length >= 2) {
              this.props.eventBus.emit('showLoading', 'Changing sphere name...');
              CLOUD.forSphere(this.props.sphereId).changeSphereName(newText)
                .then((result) => {
                  store.dispatch({type: 'UPDATE_SPHERE_CONFIG', sphereId: this.props.sphereId,  data: {name: newText}});
                  this.props.eventBus.emit('hideLoading');
                })
                .catch((err) => {
                  this.props.eventBus.emit('hideLoading');
                })
            }
            else {
              Alert.alert('Sphere name must be at least 2 letters long', 'Please try again.', [{text: 'OK'}]);
            }
          }
        }
      });
    }
    else {
      items.push({
        type:'info',
        label:'Name',
        value: this.state.sphereName,
      });
    }

    let ai = Util.data.getAiData(state, this.props.sphereId);

    items.push({label:'PERSONAL ARTIFICIAL INTELLIGENCE',  type:'explanation', below:false});
    items.push({
      label: ai.name,
      type: spherePermissions.editSphere ? 'navigation' : 'info',
      icon: <IconButton name='c1-brain' size={21} radius={15} button={true} color="#fff" buttonStyle={{backgroundColor: colors.iosBlue.hex, marginLeft:3, marginRight:7}}/>,
      callback: () => {
        Actions.aiStart({sphereId: this.props.sphereId, canGoBack: true});
      }
    });
    items.push({label: ai.name + ' will do ' + ai.his + ' very best help you!',  type:'explanation', style:{paddingBottom:0}, below:true});


    items.push({label:'ROOMS',  type:'explanation', below:false});
    items.push({
      label: 'All Rooms in Sphere',
      type: 'navigation',
      icon: <IconButton name='md-cube' size={20} radius={15} button={true} color="#fff" buttonStyle={{backgroundColor: colors.green.hex, marginLeft:3, marginRight:7}}/>,
      callback: () => {
        Actions.sphereRoomOverview({sphereId: this.props.sphereId});
      }
    });
    items.push({
      label: 'Rearrange Rooms',
      icon: <IconButton name="md-cube" size={20} button={true} color="#fff" buttonStyle={{backgroundColor: colors.csBlue.hex, marginLeft:3, marginRight:7}} />,
      type: 'navigation',
      callback: () => {
        let state = this.props.store.getState();
        let sphere = state.spheres[this.props.sphereId];
        let locationIds = Object.keys(sphere.locations);
        if (locationIds.length > 0) {
          Actions.sphereRoomArranger({sphereId: this.props.sphereId});
        }
        else {
          Alert.alert("You don't have any rooms yet!", "First add a few rooms, then you can rearrange them!",[{text:"OK"}])
        }
      }
    });


    items.push({label:'CROWNSTONES',  type:'explanation', below:false});
    items.push({
      label: 'All Crownstones in Sphere',
      type: 'navigation',
      icon: <IconButton name='c2-pluginFilled' size={21} radius={5} button={true} color="#fff" buttonStyle={{backgroundColor: colors.purple.hex, marginLeft:3, marginRight:7}}/>,
      callback: () => {
        Actions.sphereCrownstoneOverview({sphereId: this.props.sphereId});
      }
    });
    items.push({
      label: 'Add a Crownstone',
      type: 'button',
      style: {color: colors.black.hex},
      icon: <IconButton name='c3-addRoundedfilled' size={21} radius={15} button={true} color="#fff" buttonStyle={{backgroundColor: colors.darkPurple.hex, marginLeft:3, marginRight:7}}/>,
      callback: () => {
        if (spherePermissions.canSetupCrownstone) {
          addCrownstoneExplanationAlert()
        }
        else {
          Alert.alert("Ask your Sphere Admin","Admins can add new Crownstones to Spheres. If you have a new Crownstone you'd like to add, ask the sphere Admin.",[{text:"OK"}]);
        }
      }
    });



    items.push({label:'USERS',  type:'explanation', below:false});
    items.push({
      label: 'User overview',
      type: 'navigation',
      icon: <IconButton name='c1-people' size={21} radius={5} button={true} color="#fff" buttonStyle={{backgroundColor: colors.blue.hex, marginLeft:3, marginRight:7}}/>,
      callback: () => {
        Actions.sphereUserOverview({sphereId: this.props.sphereId});
      }
    });
    if (spherePermissions.inviteGuestToSphere || spherePermissions.inviteMemberToSphere || spherePermissions.inviteAdminToSphere) {
      items.push({
        label: 'Invite someone new', // accessLevel[0].toUpperCase() + accessLevel.substring(1),  this capitalizes the first letter of the access level
        type: 'navigation',
        labelStyle: {color: colors.blinkColor1.hex},
        icon: <IconButton name="md-add" size={22} color="#fff" buttonStyle={{backgroundColor: colors.blinkColor1.hex, marginLeft: 3, marginRight: 7}}/>,
        callback: () => {
          Actions.sphereUserInvite({sphereId: this.props.sphereId});
        }
      });
    }

    if (spherePermissions.editSphere) {
      items.push({label: 'BEHAVIOUR', type: 'explanation', below: false});
      items.push({
        label: 'Sphere behaviour',
        type: 'navigation',
        icon: <IconButton name='c1-brain' size={21} radius={5} button={true} color="#fff" buttonStyle={{backgroundColor: colors.green2.hex, marginLeft: 3, marginRight: 7}}/>,
        callback: () => {
          Actions.sphereBehaviour({sphereId: this.props.sphereId});
        }
      });
    }


    items.push({label:'DANGER',  type:'explanation', below: false});
    items.push({
      label: 'Leave Sphere',
      icon: <IconButton name="md-exit" size={22} button={true} color="#fff" buttonStyle={{backgroundColor: colors.menuRed.hex, marginLeft:3, marginRight:7}} />,
      style: {color:colors.menuRed.hex},
      type: 'button',
      callback: () => {
        this._leaveSphere(state);
      }
    });
    if (spherePermissions.deleteSphere) {
      items.push({
        label: 'Delete Sphere',
        icon: <IconButton name="md-exit" size={22} button={true} color="#fff" buttonStyle={{backgroundColor: colors.darkRed.hex, marginLeft: 3, marginRight: 7}}/>,
        style: {color: colors.darkRed.hex},
        type: 'button',
        callback: () => {
          this._deleteSphere(state);
        }
      });
    }
    items.push({label:'This cannot be undone!',  type:'explanation', below: true});

    items.push({type:'spacer'});
    items.push({type:'spacer'});
    items.push({type:'spacer'});

    return items;
  }

  _leaveSphere(state) {
    Alert.alert(
      "Are you sure you want to leave this Sphere?",
      "If you are the Sphere owner, you will have to transfer ownership first.",
      [
        {text:'No'},
        {text:'Yes', onPress:() => {
            this.props.eventBus.emit('showLoading','Removing you from this Sphere in the Cloud.');
            CLOUD.forUser(state.user.userId).leaveSphere(this.props.sphereId)
              .then(() => {
                this._processLocalDeletion()
              })
              .catch((err) => {
                let explanation = "Please try again later.";
                if (err && err.data && err.data.error && err.data.error.message === "can't exit from sphere where user with id is the owner") {
                  explanation = "You are the owner of this Sphere. You cannot leave without transferring ownership to another user.";
                }

                this.props.eventBus.emit('hideLoading');
                Alert.alert("Could not leave Sphere!", explanation, [{text:"OK"}]);
              })
        }}
      ]
    );
  }

  _processLocalDeletion(){
    this.props.eventBus.emit('hideLoading');
    this.deleting = true;
    BackAction();

    let state = this.props.store.getState();
    let actions = [];
    if (state.app.activeSphere === this.props.sphereId)
      actions.push({type:"CLEAR_ACTIVE_SPHERE"});

    actions.push({type:'REMOVE_SPHERE', sphereId: this.props.sphereId});

    // stop tracking sphere.
    Bluenet.stopTrackingIBeacon(state.spheres[this.props.sphereId].config.iBeaconUUID);
    this.props.store.batchDispatch(actions);
  }

  _deleteSphere(state) {
    Alert.alert(
      "Are you sure you want to delete this Sphere?",
      "This is only possible if you have removed all Crownstones from this Sphere.",
      [
        {text:'No'},
        {text:'Yes', onPress:() => {
          let stones = getStonesAndAppliancesInSphere(state, this.props.sphereId);
          let stoneIds = Object.keys(stones);
          if (stoneIds.length > 0) {
            Alert.alert(
              "Still Crownstones detected in Sphere",
              "You can remove then by going to them in their rooms, tap them, click on the settings -> edit and press remove.",
              [{text:'OK'}]
            );
          }
          else {
            this.props.eventBus.emit('showLoading','Removing this Sphere in the Cloud.');
            CLOUD.forSphere(this.props.sphereId).deleteSphere()
              .then(() => {
                this._processLocalDeletion();
              })
              .catch((err) => {
                this.props.eventBus.emit('hideLoading');
                Alert.alert("Could not delete Sphere!", "Please try again later.", [{text:"OK"}]);
              })
          }
        }}
      ]
    );
  }

  render() {
    return (
      <Background image={this.props.backgrounds.menu} hasNavBar={false} >
        <OrangeLine/>
        <ScrollView>
          <ListEditableItems items={this._getItems()} />
        </ScrollView>
      </Background>
    );
  }
}
