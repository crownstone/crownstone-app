
import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("HubOverview", key)(a,b,c,d,e);
}
import {LiveComponent} from "../LiveComponent";

import * as React from 'react';

import {Background} from '../components/Background'
import {SphereDeleted} from "../static/SphereDeleted";
import {core} from "../../Core";
import {TopBarUtil} from "../../util/TopBarUtil";
import {availableScreenHeight, background, colors, deviceStyles, screenWidth, styles} from "../styles";
import {ActivityIndicator, Alert, ScrollView, Text, TextStyle, TouchableOpacity, View} from "react-native";
import {Icon} from "../components/Icon";
import {AnimatedCircle} from "../components/animated/AnimatedCircle";
import {DataUtil} from "../../util/DataUtil";
import {Get} from "../../util/GetUtil";
import { Navigation } from "react-native-navigation";
import {SettingsBackground} from "../components/SettingsBackground";
import { HubUtil } from "../../util/HubUtil";
import {
  HubIssue_CLOUD_ID_MISSING,
  HubIssue_Fixing,
  HubIssue_HUB_NOT_CONNECTED_TO_THE_INTERNET,
  HubIssue_HUB_NOT_FROM_THIS_SPHERE, HubIssue_HUB_NOT_INITIALIZED,
  HubIssue_HUB_NOT_REPORTED_TO_CLOUD_TIMEOUT,
  HubIssue_HUB_REPORTS_ERROR, HubIssue_MULTIPLE_HUB_INSTANCES_ON_STONE, HubIssue_NO_HUB_IN_DB,
  HubIssue_NO_LINKED_STONE,
  HubIssue_NO_PROBLEM, HubIssue_NO_UART_CONNECTION,
  HubIssue_UART_ENCRYPTION_NOT_ENABLED
} from "./HubProblems";
import {NavigationUtil} from "../../util/navigation/NavigationUtil";
import {StoneUtil} from "../../util/StoneUtil";
import {ListEditableItems} from "../components/ListEditableItems";
import {HubHelper} from "../../native/setup/HubHelper";
import {StoneAvailabilityTracker} from "../../native/advertisements/StoneAvailabilityTracker";
import { OverlayUtil } from "../../util/OverlayUtil";


//
export class HubOverview extends LiveComponent<any, { fixing: boolean }> {
  static options(props) {
    getTopBarProps(props);
    return TopBarUtil.getOptions(NAVBAR_PARAMS_CACHE);
  }

  unsubscribeStoreEvents;


  constructor(props) {
    super(props);

    this.state = {fixing: false};
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
        (change.removeStone          && change.removeStone.stoneIds[this.props.stoneId])
      ) {
        return this.forceUpdate();
      }

      let stone = state.spheres[this.props.sphereId].stones[this.props.stoneId];
      if (!stone || !stone.config) { return; }

      if (
        !change.removeStone &&
        (
          change.updateHubConfig ||
          change.changeHubs ||
          change.changeAppSettings ||
          change.stoneLocationUpdated    && change.stoneLocationUpdated.stoneIds[this.props.stoneId]    ||
          change.changeStoneAvailability && change.changeStoneAvailability.stoneIds[this.props.stoneId] ||
          change.updateStoneConfig       && change.updateStoneConfig.stoneIds[this.props.stoneId]
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

  _updateNavBar() {
    getTopBarProps(this.props);
    Navigation.mergeOptions(this.props.componentId, TopBarUtil.getOptions(NAVBAR_PARAMS_CACHE))
  }

  componentWillUnmount() {
    this.unsubscribeStoreEvents();
  }


  getStateEntries(hub: HubData, stone: StoneData) {
    let issueDetected = HubUtil.getProblems(this.props.sphereId, this.props.hubId, this.props.stoneId);

    if (this.state.fixing) { return HubIssue_Fixing(); }

    let setFixingState = (fixingState) => { this.setState({fixing: fixingState}); }

    switch (issueDetected) {
      case "NO_HUB_IN_DB":
        return HubIssue_NO_HUB_IN_DB(this.props.sphereId, stone, setFixingState);
      case "NO_LINKED_STONE":
        return HubIssue_NO_LINKED_STONE();
      case "HUB_NOT_INITIALIZED":
        return HubIssue_HUB_NOT_INITIALIZED(this.props.sphereId, stone.id, setFixingState);
      case "MULTIPLE_HUB_INSTANCES_ON_STONE":
        return HubIssue_MULTIPLE_HUB_INSTANCES_ON_STONE(this.props.sphereId, stone.id, setFixingState)
      case "HUB_NOT_FROM_THIS_SPHERE":
        return HubIssue_HUB_NOT_FROM_THIS_SPHERE(this.props.sphereId, stone.id, setFixingState);
      case "NO_UART_CONNECTION":
        return HubIssue_NO_UART_CONNECTION();
      case "UART_ENCRYPTION_NOT_ENABLED":
        return HubIssue_UART_ENCRYPTION_NOT_ENABLED(this.props.sphereId, stone.id, setFixingState);
      case "CLOUD_ID_MISSING":
        return HubIssue_CLOUD_ID_MISSING(this.props.sphereId, stone, hub, setFixingState);
      case "HUB_NOT_REPORTED_TO_CLOUD_TIMEOUT":
        return HubIssue_HUB_NOT_REPORTED_TO_CLOUD_TIMEOUT();
      case "HUB_NOT_CONNECTED_TO_THE_INTERNET":
        return HubIssue_HUB_NOT_CONNECTED_TO_THE_INTERNET();
      case "HUB_REPORTS_ERROR":
        return HubIssue_HUB_REPORTS_ERROR();
      default:
        return HubIssue_NO_PROBLEM(hub);
    }
  }

  _getItems(hub: HubData, stone: StoneData) {
    let items = [];

    items.push({
      id: 'My Account',
      label: lang("Appearence"),
      testID: 'Appearence',
      icon: <Icon name={'ion5-information-circle'} size={30} color={colors.purple.hex} />,
      type: 'navigation',
      callback: () => {
        NavigationUtil.navigate( "DeviceEditAppearence", {sphereId: this.props.sphereId, stoneId: this.props.stoneId});
      }
    });
    items.push({type: 'explanation', label: lang("Change_name__icon__etc_"), below: true});

    let location = Get.location(this.props.sphereId, stone.config.locationId);
    let locationLabel = lang("Not_in_a_room");
    if (location !== undefined) {
      locationLabel = location.config.name;
    }

    items.push({
      label: locationLabel,
      icon:  <Icon name="md-cube" size={25} color={colors.green.hex} />,
      type:  'navigation',
      style: {color: colors.blue.hex},
      callback: () => {
        OverlayUtil.callRoomSelectionOverlayForHubPlacement(this.props.sphereId, hub.id);
      }
    });
    items.push({type: 'explanation', label: lang("Move_the_hub_to_another_r"), below: true});

    items.push({label: lang("DANGER"), type: 'explanation', below: false, alreadyPadded: true});
    items.push({
      label: lang("Remove_Hub"),
      mediumIcon: <Icon name="ios-trash" size={26} color={colors.red.hex} />,
      type: 'button',
      callback: () => {
        StoneUtil.remove.hub.now(this.props.sphereId, this.props.stoneId);
      }
    });

    items.push({label: lang("Removing_this_Hub_"), type: 'explanation', below: true});

    return items;
  }



  render() {
    const state = core.store.getState();
    const sphere = state.spheres[this.props.sphereId];
    if (!sphere) {
      return <SphereDeleted/>
    }

    let hub   = Get.hub(this.props.sphereId, this.props.hubId) ?? DataUtil.getHubByStoneId(this.props.sphereId, this.props.stoneId);
    let stone = Get.stone(this.props.sphereId, this.props.stoneId ?? hub.config.linkedStoneId);

    return (
      <SettingsBackground>
        <ScrollView testID={'HubOverview_scrollview'} contentContainerStyle={{paddingTop:20}}>
          { this.getStateEntries(hub, stone) }
          <ListEditableItems items={this._getItems(hub, stone)} />
        </ScrollView>
      </SettingsBackground>
    )
  }
}

function getTopBarProps(props) {
  const state = core.store.getState();
  const hub = state.spheres[props.sphereId].hubs[props.hubId];
  const stone = state.spheres[props.sphereId].stones[props.stoneId];

  NAVBAR_PARAMS_CACHE = {
    title: stone?.config?.name ?? hub?.config?.name,
    closeModal: true,
  }
  return NAVBAR_PARAMS_CACHE;
}

let NAVBAR_PARAMS_CACHE : topbarOptions = null;

