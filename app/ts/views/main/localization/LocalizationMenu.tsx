
import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("LocalizationMenu", key)(a,b,c,d,e);
}
import * as React from 'react';
import {
  ScrollView,
  TouchableOpacity,
  Text,
  View, Alert, Linking
} from "react-native";


import { colors, deviceStyles, background } from "../../styles";
import {Background} from "../../components/Background";
import {IconButton} from "../../components/IconButton";
import { core } from "../../../Core";
import { NavigationUtil } from "../../../util/navigation/NavigationUtil";
import { Permissions } from "../../../backgroundProcesses/PermissionManager";
import { TopBarUtil } from "../../../util/TopBarUtil";
import { LiveComponent } from "../../LiveComponent";
import { createNewSphere } from "../../../util/CreateSphere";
import { Stacks } from "../../Stacks";
import { ListEditableItems } from "../../components/ListEditableItems";
import { SphereStateManager } from "../../../backgroundProcesses/SphereStateManager";
import {
  canUseIndoorLocalizationInSphere,
  DataUtil,
  enoughCrownstonesForIndoorLocalization, requireMoreFingerprints
} from "../../../util/DataUtil";
import {Icon} from "../../components/Icon";

export class LocalizationMenu extends LiveComponent<any, any> {
  static options(props) {
    return TopBarUtil.getOptions({ title: "Localization", closeModal: true });
  }

  unsubscribeEventListener = () => {};

  componentDidMount() {
    this.unsubscribeEventListener = core.eventBus.on("databaseChange", (data) => {
      let change = data.change;
      if (
        change.changeSphereSmartHomeState && change.changeSphereSmartHomeState.sphereIds[this.props.sphereId] ||
        change.changeSphereState          && change.changeSphereState.sphereIds[this.props.sphereId]
      ) {
        this.forceUpdate();
      }
    });
  }

  componentWillUnmount() {
    this.unsubscribeEventListener();
  }

  _getExitingLocalizationItems(items: any[]) {
    items.push({
      label: "Improve localization",
      type: 'navigation',
      testID: 'ImproveLocalization',
      icon: <Icon name='c1-locationPin1' size={30} color={colors.blue.hex}/>,
      callback: () => {
        NavigationUtil.navigate( "SphereCrownstoneOverview", {sphereId: this.props.sphereId});
      }
    });
    items.push({label: "Is the localization not working correctly? This will take you through the steps to identify the problem and improve the localization!",  type:'explanation', below: true});

    items.push({ label: "Quick fix", type: 'largeExplanation' });
    items.push({
      label: "My localization made a mistake just now...",
      type: 'navigation',
      numberOfLines: 2,
      testID: 'LocalizationMistake',
      icon: <Icon name='c1-router' size={30} color={colors.csBlue.hex}/>,
      callback: () => {
        NavigationUtil.navigate( "SphereHubOverview", {sphereId: this.props.sphereId});
      }
    });
    items.push({label: "If the localization was wrong and you've been in the same room for at least 2 minutes, use this to quickly fix the problem!",  type:'explanation', below: true});
  }

  _getTrainingRoomItems(items: any[]) {
    let disabled = false;
    let label = "By teaching the localization where all your rooms are, you can use your location for behaviour!"
    if (!DataUtil.inSphere(this.props.sphereId)) {
      disabled = true;
      label = "You have to be in the sphere to setup indoor localization...";
    }

    items.push({
      label: "Let's setup localization!",
      type: 'navigation',
      disabled: disabled,
      testID: 'setupLocalization',
      icon: <Icon name='c1-locationPin1' size={25} color={colors.blue.hex}/>,
      callback: () => {
        NavigationUtil.navigate( "SetupLocalization", {sphereId: this.props.sphereId});
      }
    });
    items.push({label: label,  type:'explanation', below: true});

    this._getLearnAboutLocalizationItems(items);
  }

  _getLearnAboutLocalizationItems(items: any[]) {
    items.push({
      label: "Learn about indoor localization",
      type: 'navigation',
      numberOfLines: 3,
      testID: 'ImproveLocalization',
      icon: <Icon name='md-book' size={30} color={colors.blueDark.hex}/>,
      callback: () => {
        Linking.openURL('https://crownstone.rocks/positioning-users/').catch(err => {})
      }
    });
    items.push({label: "You need at least 4 Crownstones to enable indoor localization. Find out why this is, and what it can do for you!",  type:'explanation', below: true});
  }


  _getBehaviourItems(items: any[]) {
    let state = core.store.getState();
    let sphere : SphereData = state.spheres[this.props.sphereId];
    let behaviourEnabledState = true;
    if (sphere) {
      behaviourEnabledState = sphere.state.smartHomeEnabled === true
    }

    items.push({ label: "BEHAVIOUR", type: 'largeExplanation' });
    let label = "You can disable behaviour so your house reverts to a normal, dumb, home. This is often used if you have guests. Guests prefer not to be left in the dark...";
    let disabled = false;
    if (DataUtil.isBehaviourUsed(this.props.sphereId)) {
      if (!DataUtil.inSphere(this.props.sphereId)) {
        label = "You have to be in the sphere to enable/disable behaviour...";
        disabled = true;
      }
    }
    else {
      label = "No Crownstones have behaviour at the moment...";
      disabled = true;
    }

    items.push({
      label: "Disable behaviour",
      type: 'switch',
      testID: 'Disable_behaviour',
      disabled: disabled,
      icon: <Icon name='c1-brain' size={30} color={colors.green.hex} />,
      value: !behaviourEnabledState,
      callback: (newState) => {
        SphereStateManager.userSetSmartHomeState(this.props.sphereId, !newState);
        core.eventBus.emit("showLoading",newState === true ? "Disabling behaviour..." : "Enabling behaviour...");
        setTimeout(() => { core.eventBus.emit("hideLoading"); }, 4000);
      }
    });
    items.push({label: label,  type:'explanation', below: true});

  }

  _getItems() {
    let items = [];

    this._getBehaviourItems(items);

    let enoughCrownstones = enoughCrownstonesForIndoorLocalization(this.props.sphereId);
    let trainingRequired  = requireMoreFingerprints(this.props.sphereId);

    items.push({ label: "INDOOR LOCALIZATION", type: 'largeExplanation' });
    if (enoughCrownstones) {
      if (trainingRequired) {
        this._getTrainingRoomItems(items);
      }
      else {
        this._getExitingLocalizationItems(items);
      }
    }
    else {
      this._getLearnAboutLocalizationItems(items)
    }

    items.push({type:'spacer'});
    items.push({type:'spacer'});
    items.push({type:'spacer'});

    return items;
  }


  render() {
    return (
      <Background image={background.main} hasNavBar={false} testID={"LocalizationMenu"}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <ListEditableItems items={this._getItems()} />
        </ScrollView>
      </Background>
    );
  }
}
