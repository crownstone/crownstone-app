import { LiveComponent }          from "../LiveComponent";

import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("DeviceOverview", key)(a,b,c,d,e);
}
import * as React from 'react';

import { SphereDeleted }        from "../static/SphereDeleted";
import { StoneDeleted }         from "../static/StoneDeleted";
import { core } from "../../Core";
import { TopBarUtil } from "../../util/TopBarUtil";
import { colors } from "../styles";
import {
  Alert, ScrollView,
  TouchableOpacity,
  View,
  ViewStyle
} from "react-native";
import { StoneAvailabilityTracker } from "../../native/advertisements/StoneAvailabilityTracker";
import { Icon } from "../components/Icon";
import { NavigationUtil } from "../../util/navigation/NavigationUtil";
import { Navigation } from "react-native-navigation";
import {SettingsBackground} from "../components/SettingsBackground";
import {CLOUD} from "../../cloud/cloudAPI";
import {LOG, LOGe} from "../../logging/Log";
import {tell} from "../../logic/constellation/Tellers";
import {SortingManager} from "../../logic/SortingManager";
import {StoneUtil} from "../../util/StoneUtil";
import {ListEditableItems} from "../components/ListEditableItems";
import { IconButton } from "../components/IconButton";
import { OverlayUtil } from "../overlays/OverlayUtil";
import { Get } from "../../util/GetUtil";


export class  DeviceOverview extends LiveComponent<any, any> {
  static options(props) {
    getTopBarProps(props);
    return TopBarUtil.getOptions(NAVBAR_PARAMS_CACHE);
  }

  unsubscribeStoreEvents;
  deleting = false

  constructor(props) {
    super(props);

    const state = core.store.getState();
    const sphere = state.spheres[this.props.sphereId];
    if (!sphere) {
      return;
    }
    const stone = sphere.stones[this.props.stoneId];
    if (!stone) {
      return;
    }
  }

  navigationButtonPressed({ buttonId }) {
    if (buttonId === 'deviceEdit')    {
      NavigationUtil.launchModal( "DeviceEdit",{sphereId: this.props.sphereId, stoneId: this.props.stoneId});
    }
  }

  componentDidMount() {
    let state = core.store.getState();

    if (state.app.hasSeenDeviceSettings === false) {
      core.store.dispatch({ type: 'UPDATE_APP_SETTINGS', data: { hasSeenDeviceSettings: true } })
    }

    this.unsubscribeStoreEvents = core.eventBus.on("databaseChange", (data) => {
      let change = data.change;
      let state = core.store.getState();
      if (
        (state.spheres[this.props.sphereId] === undefined) ||
        (change.removeSphere         && change.removeSphere.sphereIds[this.props.sphereId]) ||
        (change.removeStone          && change.removeStone.stoneIds[this.props.stoneId])    ||
        (change.stoneChangeAbilities && change.stoneChangeAbilities.stoneIds[this.props.stoneId])
      ) {
        return this.forceUpdate();
      }

      let stone = state.spheres[this.props.sphereId].stones[this.props.stoneId];
      if (!stone || !stone.config) { return; }

      if (
        !change.removeStone &&
        (
          change.changeAppSettings ||
          change.stoneLocationUpdated && change.stoneLocationUpdated.stoneIds[this.props.stoneId] ||
          change.updateStoneConfig    && change.updateStoneConfig.stoneIds[this.props.stoneId]
        )
      ) {
        if (change.updateStoneConfig && change.updateStoneConfig.stoneIds[this.props.stoneId]) {
          this._updateNavBar();
        }
        this.forceUpdate();
        return
      }
    });
  }

  componentWillUnmount() {
    this.unsubscribeStoreEvents();
  }



  _updateNavBar() {
    Navigation.mergeOptions(this.props.componentId, TopBarUtil.getOptions(NAVBAR_PARAMS_CACHE))
  }

  _getLockIcon(stone) {
    let wrapperStyle : ViewStyle = {
      width: 35,
      height: 35,
      position: 'absolute',
      bottom: 0,
      right: 0,
      alignItems: 'center',
      justifyContent: "center"
    };
    if (StoneAvailabilityTracker.isDisabled(this.props.stoneId) === false && stone.config.locked === false) {
      return (
        <TouchableOpacity
          onPress={() => { core.eventBus.emit('showLockOverlay', { sphereId: this.props.sphereId, stoneId: this.props.stoneId })} }
          style={wrapperStyle}>
          <Icon name={"md-unlock"} color={colors.csBlueDarker.rgba(0.5)} size={30} />
        </TouchableOpacity>
      );
    }
    else {
      return <View style={wrapperStyle} />;
    }
  }



  _getItems(stone: StoneData) {
    let items = [];

    items.push({type: 'explanation', label: "CROWNSTONE SETTINGS"});
    items.push({
      id: 'My Account',
      label: "Appearence",
      testID: 'Appearence',
      icon: <Icon name={'ion5-information-circle'} size={30} color={colors.purple.hex} />,
      type: 'navigation',
      callback: () => {
        NavigationUtil.navigate( "DeviceEditAppearence", {sphereId: this.props.sphereId, stoneId: this.props.stoneId});
      }
    });
    items.push({type: 'explanation', label: "Change name, icon, etc.", below: true});
    items.push({
      id: 'abilities',
      label: lang("Abilities"),
      testID: 'Appearence',
      icon: <Icon name={'ios-school'} size={30} color={colors.green.hex} />,
      type: 'navigation',
      callback: () => {
        NavigationUtil.navigate("DeviceAbilities", {sphereId: this.props.sphereId, stoneId: this.props.stoneId});
      }
    });
    items.push({type: 'explanation', label: "Enable dimming, switchcraft, etc.", below: true});
    items.push({
      id: 'behaviour',
      label: lang("Behaviour"),
      testID: 'Appearence',
      icon: <Icon name={'c1-brain'} size={30} color={colors.csBlue.hex} />,
      type: 'navigation',
      callback: () => {
        NavigationUtil.navigate("DeviceSmartBehaviour", {sphereId: this.props.sphereId, stoneId: this.props.stoneId});
      }
    });
    items.push({type: 'explanation', label: "Turn on if/when ...", below: true});


    let location = Get.location(this.props.sphereId, stone.config.locationId);
    let locationLabel = lang("Not_in_a_room");
    if (location !== undefined) {
      locationLabel = location.config.name;
    }

    items.push({
      label: locationLabel,
      icon:  <Icon name="md-cube" size={23} color={colors.lightCsOrange.hex} />,
      type:  'navigation',
      style: {color: colors.blue.hex},
      callback: () => {
        OverlayUtil.callRoomSelectionOverlay(this.props.sphereId, (roomId) => {
          this.setState({locationId: roomId})
        })
      }
    });
    items.push({type: 'explanation', label: "Move the Crownstone to another room", below: true});

    items.push({
      id: 'lock',
      label: stone.config.locked ? "Unlock Crownstone switch" : "Lock Crownstone switch",
      testID: 'Appearence',
      icon: <Icon name={'md-lock'} size={30} color={colors.blue.hex} />,
      type: 'navigation',
      callback: () => {
        if (stone.config.locked) {
          StoneUtil.lockCrownstone(this.props.sphereId, this.props.stoneId);
        }
        else {
          StoneUtil.unlockCrownstone(this.props.sphereId, this.props.stoneId);
        }
      }
    });

    items.push({label: lang("DANGER"), type: 'explanation', below: false});
    items.push({
      label: "Remove Crownstone",
      mediumIcon: <Icon name="ios-trash" size={26} color={colors.red.hex} />,
      type: 'button',
      callback: () => {
        // if (hub) {
        //   if (StoneAvailabilityTracker.isDisabled(this.props.stoneId)) {
        //     Alert.alert(lang("Cant_see_this_one_"),
        //       lang("This_Crownstone_has_not_b"),
        //       [{text:lang("Delete_anyway"), onPress: () => {this._removeCloudOnly()}, style: 'destructive'},
        //         {text:lang("Cancel"),style: 'cancel', onPress: () => {}}]
        //     )
        //   }
        //   else {
        //     Alert.alert(
        //       lang("Are_you_sure_you_want_to_"),
        //       lang("This_cannot_be_undone_"),
        //       [{text: "Delete", onPress: async () => {
        //           core.eventBus.emit('showLoading', lang("Resetting_hub___"));
        //           let helper = new HubHelper();
        //           try {
        //             await helper.factoryResetHub(this.props.sphereId, this.props.stoneId);
        //             this._removeCrownstoneFromRedux();
        //           }
        //           catch(err) {
        //             core.eventBus.emit('hideLoading');
        //             if (err?.message === "HUB_REPLY_TIMEOUT") {
        //               Alert.alert(lang("The_hub_is_not_responding"),
        //                 lang("If_this_hub_is_broken__yo"),
        //                 [{ text: lang("Delete_anyway"), onPress: () => {this._removeCrownstone(stone).catch((err) => {});} , style: 'destructive'},{text:lang("Cancel"),style: 'cancel'}]);
        //             }
        //             else {
        //               Alert.alert(
        //                 lang("_Something_went_wrong_____header"),
        //                 lang("_Something_went_wrong_____body"),
        //                 [{text: lang("_Something_went_wrong_____left") }]);
        //             }
        //           }
        //         }, style: 'destructive'},{text:lang("Cancel"),style: 'cancel'}])
        //   }
        // }
        // else {
          core.eventBus.emit('hideLoading');
          Alert.alert(
            lang("_Are_you_sure___Removing__header"),
            lang("_Are_you_sure___Removing__body"),
            [{text: lang("_Are_you_sure___Removing__left"), style: 'cancel'}, {
              text: lang("_Are_you_sure___Removing__right"), style:'destructive', onPress: () => {
                this._removeCrownstone(stone).catch((err) => {});
              }}]
          )
        }
      // }
    });
    // if (hub) {
    //   items.push({label: lang("Removing_this_Hub_"),  type:'explanation', below:true});
    // }
    // else {
      items.push({label: lang("Removing_this_Crownstone_"),  type:'explanation', below:true});
    // }

    return items;
  }


  render() {
    const state = core.store.getState();
    const sphere = state.spheres[this.props.sphereId];
    if (!sphere) {
      return <SphereDeleted/>
    }
    const stone = sphere.stones[this.props.stoneId];
    if (!stone) {
      return <StoneDeleted/>
    }

    return (
      <SettingsBackground>
        <ScrollView testID={'DeviceOverview_scrollview'}>
          <ListEditableItems items={this._getItems(stone)} />
        </ScrollView>
      </SettingsBackground>
    )
  }

  async _removeCrownstone(stone) {
    core.eventBus.emit('showLoading', lang("Looking_for_the_Crownston"));
    let {discovered, mode} = await StoneUtil.discoverCrownstone(stone);
    if (!discovered) {
      core.eventBus.emit('hideLoading');
      Alert.alert(
        lang("_Cant_see_this_one___We_c_header"),
        lang("_Cant_see_this_one___We_c_body"),
        [
          {
            text:lang("_Cant_see_this_one___We_c_left"),
            onPress: async () => {
              await this._removeWithoutReset();
              NavigationUtil.dismissModal();
            }, style: 'destructive'
          },
          {
            text:lang("_Cant_see_this_one___We_c_right"), style: "cancel", onPress: () => {}
          }
      ]);
      return;
    }

    if (mode === 'setup') {
      await this._removeWithoutReset();
      NavigationUtil.dismissModal();
      return;
    }

    try { await this._factoryResetCrownstone(stone); } catch (err) {
      Alert.alert(
        lang("_Encountered_a_problem____header"),
        lang("_Encountered_a_problem____body"),
        [
          {text:lang("_Encountered_a_problem____left"), style:'destructive', onPress: async () => {
            await this._removeWithoutReset();
            NavigationUtil.dismissModal();
          }},
          {text:lang("_Encountered_a_problem____right")}
        ]);
      return;
    }

    // discovered Crownstone in operation mode
    try { await this._removeCrownstoneFromCloud(); } catch (err) { return; }
    this._removeCrownstoneFromRedux(true);
  }

  async _removeWithoutReset() {
    try {
      await this._removeCrownstoneFromCloud();
      this._removeCrownstoneFromRedux(false);
    }
    catch(err) {}
  }


  async _removeCrownstoneFromCloud()  {
    core.eventBus.emit('showLoading', lang("Removing_the_Crownstone_fr"));
    // let hub = DataUtil.getHubByStoneId(this.props.sphereId, this.props.stoneId);
    // if (hub && hub.config.cloudId) {
    //   CLOUD.deleteHub(hub.config.cloudId)
    //     .catch((err) => {
    //       return new Promise<void>((resolve, reject) => {
    //         if (err && err?.status === 404) {
    //           resolve();
    //         }
    //       })
    //     })
    // }
    CLOUD.forSphere(this.props.sphereId).deleteStone(this.props.stoneId)
      .catch((err) => {
        return new Promise<void>((resolve, reject) => {
          if (err && err?.status === 404) {
            resolve();
          }
          else {
            LOGe.info("COULD NOT DELETE IN CLOUD", err?.message);
            reject();
          }
        })
      })
      .catch((err) => {
        LOG.info("error while asking the cloud to remove this crownstone", err?.message);
        core.eventBus.emit('hideLoading');
        Alert.alert(
          lang("_Encountered_Cloud_Issue__header"),
          lang("_Encountered_Cloud_Issue__body"),
          [{text:lang("_Encountered_Cloud_Issue__left")
        }]);
        throw err;
      })
  }


  async _factoryResetCrownstone(stone) {
    core.eventBus.emit('showLoading', lang("Factory_resetting_the_Cro"));
    try {
      await tell(stone).commandFactoryReset();
    }
    catch(err) {
      LOGe.info("DeviceEdit: error during removeCloudReset, commandFactoryReset phase.", err?.message);
      core.eventBus.emit('hideLoading');
      throw err;
    };
  }


  _removeCrownstoneFromRedux(factoryReset = false) {
    // let hub = DataUtil.getHubByStoneId(this.props.sphereId, this.props.stoneId);

    // deleting makes sure we will not draw this page again if we delete it's source from the database.
    this.deleting = true;

    let labelText =  lang("I_have_removed_this_Crown");
    // if (hub) {
    //   labelText =  lang("I_have_removed_this_Hub");
    // }
    // else {
    if (factoryReset === false) {
      labelText =  lang("I_have_removed_this_Crowns");
    }
    // }

    Alert.alert(
      lang("_Success__arguments___OKn_header"),
      lang("_Success__arguments___OKn_body",labelText),
      [{text:lang("_Success__arguments___OKn_left"), onPress: () => {
          SortingManager.removeFromLists(this.props.stoneId);
          core.store.dispatch({type: "REMOVE_STONE", sphereId: this.props.sphereId, stoneId: this.props.stoneId});
          // if (hub) {
          //   SortingManager.removeFromLists(hub.id);
          //   core.store.dispatch({type: "REMOVE_HUB", sphereId: this.props.sphereId, hubId: hub.id});
          // }
        }}]
    )
  }

}

function getTopBarProps(props) {
  const state = core.store.getState();
  const stone = state.spheres[props.sphereId].stones[props.stoneId];

  NAVBAR_PARAMS_CACHE = {
    title: stone.config.name,
    closeModal: true,
  }

  return NAVBAR_PARAMS_CACHE;
}



let NAVBAR_PARAMS_CACHE : topbarOptions = null;

