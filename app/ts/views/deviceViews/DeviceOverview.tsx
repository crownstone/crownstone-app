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
import { colors, styles} from "../styles";
import { Alert } from "react-native";
import { Icon } from "../components/Icon";
import { NavigationUtil } from "../../util/navigation/NavigationUtil";
import { Navigation } from "react-native-navigation";
import { SettingsBackground } from "../components/SettingsBackground";
import { ListEditableItems } from "../components/ListEditableItems";
import { Get } from "../../util/GetUtil";
import { STONE_TYPES } from "../../Enums";
import { xUtil } from "../../util/StandAloneUtil";
import { MINIMUM_REQUIRED_FIRMWARE_VERSION } from "../../ExternalConfig";
import { StoneUtil } from "../../util/StoneUtil";
import { OverlayUtil } from "../../util/OverlayUtil";
import { SettingsScrollView } from "../components/SettingsScrollView";


export class  DeviceOverview extends LiveComponent<any, any> {
  static options(props) {
    getTopBarProps(props);
    return TopBarUtil.getOptions(NAVBAR_PARAMS_CACHE);
  }

  unsubscribeStoreEvents;
  deleted = false;


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
        if (this.deleted) { return; }

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
    getTopBarProps(this.props);
    Navigation.mergeOptions(this.props.componentId, TopBarUtil.getOptions(NAVBAR_PARAMS_CACHE))
  }


  _getItems(stone: StoneData) {
    let items = [];

    let canSwitch = stone.config.type === STONE_TYPES.plug || stone.config.type === STONE_TYPES.builtin || stone.config.type === STONE_TYPES.builtinOne;
    canSwitch = canSwitch && xUtil.versions.canIUse(stone.config.firmwareVersion, MINIMUM_REQUIRED_FIRMWARE_VERSION);

    items.push({type: 'explanation', label: lang("CROWNSTONE_SETTINGS")});
    items.push({
      id: 'My Account',
      label: lang("Appearance"),
      testID: 'DeviceAppearance',
      icon: <Icon name={'ion5-information-circle'} size={30} color={colors.purple.hex} />,
      type: 'navigation',
      callback: () => {
        NavigationUtil.navigate( "DeviceEditAppearance", {sphereId: this.props.sphereId, stoneId: this.props.stoneId});
      }
    });
    items.push({type: 'explanation', label: lang("Change_name__icon__etc_"), below: true});

    if (canSwitch) {
      items.push({
        id: 'abilities',
        label: lang("Abilities"),
        testID: 'DeviceAbilities',
        icon: <Icon name={'ios-school'} size={30} color={colors.csBlueLight.hex}/>,
        type: 'navigation',
        callback: () => {
          NavigationUtil.navigate("DeviceAbilities", {sphereId: this.props.sphereId, stoneId: this.props.stoneId});
        }
      });
      items.push({type: 'explanation', label: lang("Enable_dimming__switchcra"), below: true});
      items.push({
        id: 'behaviour',
        label: lang("Behaviour"),
        testID: 'DeviceBehaviour',
        icon: <Icon name={'c1-brain'} size={30} color={colors.csBlue.hex}/>,
        type: 'navigation',
        callback: () => {
          NavigationUtil.navigate("DeviceSmartBehaviour", {sphereId: this.props.sphereId, stoneId: this.props.stoneId});
        }
      });
      items.push({type: 'explanation', label: lang("Turn_on_if_when____"), below: true});
    }

    let location = Get.location(this.props.sphereId, stone.config.locationId);
    let locationLabel = lang("Not_in_a_room");
    if (location !== undefined) {
      locationLabel = location.config.name;
    }

    items.push({
      label: locationLabel,
      icon:  <Icon name="md-cube" size={25} color={colors.green.hex} />,
      type:  'navigation',
      testID: 'DeviceChangeRoom',
      style: {color: colors.blue.hex},
      callback: () => {
        OverlayUtil.callRoomSelectionOverlayForStonePlacement(this.props.sphereId, this.props.stoneId);
      }
    });
    items.push({type: 'explanation', label: lang("Move_the_Crownstone_to_an"), below: true});

    if (canSwitch) {
      items.push({
        id: 'lock',
        label: lang("Unlock_Crownstone_switchL",stone.config.locked),
        testID: 'DeviceUnlock',
        icon: <Icon name={'md-lock'} size={30} color={colors.blue.hex}/>,
        type: 'navigation',
        callback: () => {
          if (stone.abilities.dimming.enabledTarget) {
            Alert.alert("Can't lock...", lang("You_can_only_lock_Crownst"), [{text:lang("OK")}])
            return;
          }
          if (stone.config.locked) {
            StoneUtil.unlockCrownstone(this.props.sphereId, this.props.stoneId);
          } else {
            StoneUtil.lockCrownstone(this.props.sphereId, this.props.stoneId);
          }
        }
      });
    }

    items.push({label: lang("DANGER"), type: 'explanation', below: false});
    items.push({
      label: lang("Remove_Crownstone"),
      mediumIcon: <Icon name="ios-trash" size={26} color={colors.red.hex} />,
      type: 'button',
      testID: 'DeviceRemove',
      callback: () => {
        Alert.alert(
          lang("_Are_you_sure___Removing__header"),
          lang("_Are_you_sure___Removing__body"),
          [{text: lang("_Are_you_sure___Removing__left"), style: 'cancel'}, {
            text: lang("_Are_you_sure___Removing__right"), style:'destructive', onPress: async () => {
              this.deleted = true;
              await StoneUtil.remove.crownstone.now(this.props.sphereId, this.props.stoneId).catch((err) => {});
            }}]
        )
      }
    });
    items.push({label: lang("Removing_this_Crownstone_"),  type:'explanation', below:true});
    items.push({label: lang("firmware__",   stone.config.firmwareVersion,   lang("Not_checked_")), style: {fontSize: 10}, type:'explanation', below:true});


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
      <SettingsBackground testID={"DeviceOverview"}>
        <SettingsScrollView testID={'DeviceOverview_scrollview'}>
          <ListEditableItems items={this._getItems(stone)} />
        </SettingsScrollView>
      </SettingsBackground>
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

