
import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("SphereEdit", key)(a,b,c,d,e);
}
import * as React from 'react';
import {
  Alert, RefreshControl,
  ScrollView
} from "react-native";

import { ListEditableItems } from '../components/ListEditableItems'
import { IconButton }        from '../components/IconButton'
import { background, colors } from "./../styles";
import { CLOUD }             from "../../cloud/cloudAPI";
import { createNewSphere }   from "../../util/CreateSphere";
import { core }              from "../../Core";
import { NavigationUtil }    from "../../util/navigation/NavigationUtil";
import { TopBarUtil }        from "../../util/TopBarUtil";
import { LiveComponent }     from "../LiveComponent";
import { BackgroundNoNotification } from "../components/BackgroundNoNotification";
import {Stacks} from "../Stacks";
import {Icon} from "../components/Icon";
import {SettingsBackground} from "../components/SettingsBackground";
import {Get} from "../../util/GetUtil";
import {Permissions} from "../../backgroundProcesses/PermissionManager";
import {Util} from "../../util/Util";
import {Bluenet} from "../../native/libInterface/Bluenet";

export class SphereEdit extends LiveComponent<any, any> {
  static options(props) {
    let state = core.store.getState();
    if (props.sphereId) {
      let sphere = state.spheres[props.sphereId];
      if (sphere) {
        return TopBarUtil.getOptions({title: lang("EditSphere"), closeModal: true})
      }
    }

    return TopBarUtil.getOptions({title:  lang("Welcome_"), closeModal: true})
  }


  unsubscribe = [];
  validationState : any;

  constructor(props) {
    super(props);

    let sphere = Get.sphere(props.sphereId);

    this.state = {syncing: false, sphereName: sphere?.config?.name ?? "Unnamed Sphere" };

    this.validationState = {sphereName:'valid'};
  }

  componentDidMount() {
    this.unsubscribe.push(core.eventBus.on("CloudSyncComplete", () => {
      if (this.state.syncing) {
        this.setState({syncing: false})
      }
    }));

    this.unsubscribe.push(core.eventBus.on("databaseChange", (data) => {
      let change = data.change;
      if (
        change.changeSpheres      && change.changeSpheres.sphereIds[this.props.sphereId]      ||
        change.changeSphereConfig && change.changeSphereConfig.sphereIds[this.props.sphereId]
      ) {
        if (Get.sphere(this.props.sphereId)) {
          this.forceUpdate();
        }
      }
    }));
  }

  componentWillUnmount() {
    this.unsubscribe.forEach((unsub) => { unsub(); });
  }

  _getItems() {
    let items = [];
    let state = core.store.getState();
    let amountOfSpheres = Object.keys(state.spheres).length;
    items.push({ type: 'spacer' });

    let sphere = Get.sphere(this.props.sphereId);

    if (!sphere) {
      if (amountOfSpheres === 0) {
        items.push({
          label: lang("Create_Sphere"),
          type: 'navigation',
          testID: "SphereEdit_createOnlySphere",
          icon: <Icon name='c1-sphere' size={25} color={colors.green.hex} buttonStyle={{ backgroundColor: colors.green.hex }}/>,
          callback: () => {
            createNewSphere(state.user.firstName + "'s Sphere")
              .then((localSphereId) => {
                setTimeout(() => {
                  NavigationUtil.setRoot(Stacks.loggedIn());
                }, 100)
              })
              .catch((err) => {
                Alert.alert(lang("Whoops"), lang("Something_went_wrong_with"), [{ text: lang("OK") }])
              });
          }
        });
        items.push({ label: lang("A_Sphere_contains_your_Cr"), type: 'explanation', below: true });
        return items;
      }
      else {
        items.push({label: lang("Sphere_Creation"),  type:'explanation'});
        items.push({
          label: lang("Create_a_new_Sphere"),
          icon: <Icon name="c1-sphere" size={25} color={colors.csBlueLight.hex}/>,
          type: 'navigation',
          callback: () => {
            NavigationUtil.navigate( "AddSphereTutorial");
          }
        });
        items.push({label: lang("Careful_a_sphere_is_not"),    type:'explanation', below: true});
        items.push({label: lang("More_items_are_available_"),  type:'explanation', below: false});
        return items;
      }
    }

    let spherePermissions = Permissions.inSphere(this.props.sphereId);
    if (spherePermissions.editSphere) {
      items.push({
        type:'textEdit',
        label: lang("Name"),
        testID: 'SphereName',
        value: this.state.sphereName,
        validation:{minLength:2},
        validationCallback: (result) => {this.validationState.sphereName = result;},
        callback: (newText) => {
          this.setState({sphereName: newText});
        },
        endCallback: (newText) => {
          if (sphere.config.name !== newText) {
            if (this.validationState.sphereName === 'valid' && newText.trim().length >= 2) {

              core.eventBus.emit('showLoading', lang("Changing_sphere_name___"));
              CLOUD.forSphere(this.props.sphereId).changeSphereName(newText)
                .then((result) => {
                  core.store.dispatch({type: 'UPDATE_SPHERE_CONFIG', sphereId: this.props.sphereId,  data: {name: newText}});
                  core.eventBus.emit('hideLoading');
                })
                .catch((err) => {
                  core.eventBus.emit('hideLoading');
                })
            }
            else {
              Alert.alert(
                lang("_Sphere_name_must_be_at_l_header"),
                lang("_Sphere_name_must_be_at_l_body"),
                [{text: lang("_Sphere_name_must_be_at_l_left")}]);
            }
          }
        }
      });
    }


    let coordinates = Util.getSphereLocation(this.props.sphereId);
    const city = Util.getNearestCity(coordinates);
    items.push({label: lang("SPHERE_LOCATION"),  type:'explanation', below:false});
    items.push({
      label: lang("Near_",city),
      type: spherePermissions.canSetSphereLocation ? 'navigation' : 'info',
      testID: 'SphereLocation',
      icon: <Icon name='c1-locationIcon1' size={15} radius={15}  color={colors.csBlue.hex} buttonStyle={{backgroundColor: colors.csBlue.hex}}/>,
      callback: () => {
        NavigationUtil.navigate( "SphereEditMap", {sphereId: this.props.sphereId});
      }
    });
    items.push({label: lang("We_use_the_location_of_th"),  type:'explanation', style:{paddingBottom:10}, below:true});


    items.push({
      label: lang("Rearrange_Rooms_"),
      type: 'navigation',
      testID: 'SphereEdit_rooms',
      icon: <Icon name='md-cube' size={30}  color={colors.green.hex}/>,
      callback: () => {
        NavigationUtil.dismissModal()
        core.eventBus.emit("SET_ARRANGING_ROOMS");
      }
    });


    items.push({
      label: lang("Users"),
      type: 'navigation',
      fieldId: 'sphereEdit_users',
      testID: 'SphereEdit_users',
      icon: <Icon name='c1-people' size={30}  color={colors.blue.hex}/>,
      callback: () => {
        NavigationUtil.navigate( "SphereUserOverview", {sphereId: this.props.sphereId});
      }
    });


    items.push({
      label: lang("Integrations"),
      type: 'navigation',
      testID: 'SphereEdit_integrations',
      icon: <Icon name='ios-link' size={30}  color={colors.csBlueDark.hex}/>,
      callback: () => {
        NavigationUtil.navigate( "SphereIntegrations", {sphereId: this.props.sphereId});
      }
    });

    items.push({label: lang("DANGER"),  type:'explanation', below: false});
    items.push({
      label: lang("Leave_Sphere"),
      icon: <Icon name="md-exit" size={22} color={colors.menuRed.hex} />,
      style: {color:colors.menuRed.hex},
      type: 'button',
      testID: 'LeaveSphere',
      callback: () => {
        this._leaveSphere(state);
      }
    });
    if (spherePermissions.deleteSphere) {
      items.push({
        label: lang("Delete_Sphere"),
        icon: <Icon name="md-exit" size={22}  color={colors.darkRed.hex} />,
        style: {color: colors.darkRed.hex},
        type: 'button',
        testID: 'DeleteSphere',
        callback: () => {
          this._deleteSphere(state);
        }
      });
    }
    items.push({label: lang("This_cannot_be_undone_"),  type:'explanation', below: true});
    items.push({label: lang("Sphere_Creation"),  type:'explanation'});
    items.push({
      label: lang("Create_a_new_Sphere"),
      icon: <Icon name="c1-sphere" size={25} color={colors.csBlueLight.hex}/>,
      type: 'navigation',
      testID: 'SphereEdit_createSphere',
      callback: () => {
        NavigationUtil.launchModal( "AddSphereTutorial", {sphereId: this.props.sphereId});
      }
    });
    items.push({label: lang("Careful_a_sphere_is_not"),  type:'explanation', below: true});

    items.push({type:'spacer'});
    items.push({type:'spacer'});
    items.push({type:'spacer'});

    return items;
  }


  _leaveSphere(state) {
    Alert.alert(
      lang("_Are_you_sure_you_want_to_header"),
      lang("_Are_you_sure_you_want_to_body"),
      [{text:lang("_Are_you_sure_you_want_to_left")},
        {
          text:lang("_Are_you_sure_you_want_to_right"), onPress:() => {
            core.eventBus.emit('showLoading',lang("Removing_you_from_this_Sp"));
            CLOUD.forUser(state.user.userId).leaveSphere(this.props.sphereId)
              .then(() => {
                this._processLocalDeletion()
              })
              .catch((err) => {

                let explanation =  lang("Please_try_again_later_");
                if (err && err?.data && err?.data.error && err?.data.error.message === "Trying to remove the only user from the sphere. Remove the sphere if there are no more users in it.") {
                  explanation =  lang("You_are_the_owner_of_this");
                }

                core.eventBus.emit('hideLoading');
                Alert.alert("Could not leave Sphere!", explanation, [{text:"OK"}]);
              })
          }}
      ]
    );
  }

  _processLocalDeletion(){
    core.eventBus.emit('hideLoading');
    let state = core.store.getState();
    let actions = [];
    if (state.app.activeSphere === this.props.sphereId)
      actions.push({type:"CLEAR_ACTIVE_SPHERE"});

    actions.push({type:'REMOVE_SPHERE', sphereId: this.props.sphereId});

    // stop tracking sphere.
    Bluenet.stopTrackingIBeacon(state.spheres[this.props.sphereId].config.iBeaconUUID);
    core.store.batchDispatch(actions);

    NavigationUtil.dismissAllModals()
  }

  _deleteSphere(state) {
    Alert.alert(
      lang("_Are_you_sure_you_want_to__header"),
      lang("_Are_you_sure_you_want_to__body"),
      [{text:lang("_Are_you_sure_you_want_to__left")},
        {text:lang("_Are_you_sure_you_want_to__right"), onPress:() => {
            let stones = state.spheres[this.props.sphereId].stones;
            let stoneIds = Object.keys(stones);
            if (stoneIds.length > 0) {
              Alert.alert(
                lang("Still_Crownstones_detecte"),
                lang("You_can_remove_then_by_go"),
                [{text:'OK'}]
              );
            }
            else {
              core.eventBus.emit('showLoading',lang("Removing_you_from_this_Sp"));
              CLOUD.deleteSphere(this.props.sphereId)
                .then(() => {
                  this._processLocalDeletion();
                })
                .catch((err) => {
                  core.eventBus.emit('hideLoading');
                  Alert.alert(
                    lang("_Could_not_delete_Sphere__header"),
                    lang("_Could_not_delete_Sphere__body"),
                    [{text:lang("_Could_not_delete_Sphere__left")}]);
                })
            }
          }}
      ]
    );
  }


  render() {
    return (
      <SettingsBackground testID={'SphereEdit'}>
        <ScrollView testID={"SphereEditScrollView"}>
          <RefreshControl
            refreshing={this.state.syncing}
            onRefresh={() => { this.setState({syncing: true}); CLOUD.sync(core.store, true) }}
            title={ lang("Syncing_with_the_Cloud___")}
            titleColor={colors.black.hex}
            colors={[colors.black.hex]}
            tintColor={colors.black.hex}
            progressViewOffset={-70}
          />
          <ListEditableItems items={this._getItems()} />
        </ScrollView>
      </SettingsBackground>
    );
  }
}
