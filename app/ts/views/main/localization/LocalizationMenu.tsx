
import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("LocalizationMenu", key)(a,b,c,d,e);
}
import * as React from 'react';
import {
  ScrollView,
  TouchableOpacity,
  Text,
  View, Alert
} from "react-native";


import { colors, deviceStyles, background } from "../../styles";
import {Background} from "../../components/Background";
import {IconButton} from "../../components/IconButton";
import { core } from "../../../Core";
import { NavigationUtil } from "../../../util/NavigationUtil";
import { Permissions } from "../../../backgroundProcesses/PermissionManager";
import { TopBarUtil } from "../../../util/TopBarUtil";
import { LiveComponent } from "../../LiveComponent";
import { createNewSphere } from "../../../util/CreateSphere";
import { Stacks } from "../../Stacks";
import { ListEditableItems } from "../../components/ListEditableItems";
import { SphereStateManager } from "../../../backgroundProcesses/SphereStateManager";



export class LocalizationMenu extends LiveComponent<any, any> {
  static options(props) {
    return TopBarUtil.getOptions({ title: "Localization", closeModal: true });
  }

  unsubscribeEventListener = () => {};

  componentDidMount() {
    this.unsubscribeEventListener = core.eventBus.on("databaseChange", (data) => {
      let change = data.change;
      if (change.changeSphereSmartHomeState && change.changeSphereSmartHomeState.sphereIds[this.props.sphereId]) {
        this.forceUpdate();
      }
    });
  }

  componentWillUnmount() {
    this.unsubscribeEventListener();
  }

  _getItems() {
    let items = [];
    let state = core.store.getState();
    let radius = 12;

    let sphere = state.spheres[this.props.sphereId];
    let behaviourEnabledState = true;
    if (sphere) {
      behaviourEnabledState = sphere.state.smartHomeEnabled === true
    }

    items.push({ label: "BEHAVIOUR", type: 'largeExplanation' });
    items.push({
      label: "Disable behaviour",
      type: 'switch',
      testID: 'Disable_behaviour',
      largeIcon: <IconButton name='c1-brain' buttonSize={55} size={40} radius={radius}  color="#fff" buttonStyle={{backgroundColor: colors.green.hex}}/>,
      value: !behaviourEnabledState,
      callback: (newState) => {
        SphereStateManager.userSetSmartHomeState(this.props.sphereId, !newState);
        core.eventBus.emit("showLoading",newState === true ? "Disabling behaviour..." : "Enabling behaviour...");
        setTimeout(() => { core.eventBus.emit("hideLoading"); }, 4000);
      }
    });
    items.push({label: "You can disable behaviour so your house reverts to a normal, dumb, home. This is often used if you have guests. Guests prefer not to be left in the dark...",  type:'explanation', below: true});

    items.push({ label: "Localization", type: 'largeExplanation', alreadyPadded: true });
    items.push({
      label: "Improve localization",
      type: 'navigation',
      testID: 'ImproveLocalization',
      largeIcon: <IconButton name='c1-locationPin1' buttonSize={55} size={30} radius={radius}  color="#fff" buttonStyle={{backgroundColor: colors.blue.hex}}/>,
      callback: () => {
        NavigationUtil.navigate( "SphereCrownstoneOverview", {sphereId: this.props.sphereId});
      }
    });
    items.push({label: "Is the localization not working correctly? This will take you through the steps to identify the problem and improve the localization!",  type:'explanation', below: true});

    items.push({ label: "Quick fix", type: 'largeExplanation', alreadyPadded: true });
    items.push({
      label: "My localization made a mistake just now...",
      type: 'navigation',
      numberOfLines: 2,
      testID: 'LocalizationMistake',
      largeIcon: <IconButton name='c1-router' buttonSize={55} size={40} radius={radius}  color="#fff" buttonStyle={{backgroundColor: colors.csBlue.hex}}/>,
      callback: () => {
        NavigationUtil.navigate( "SphereHubOverview", {sphereId: this.props.sphereId});
      }
    });
    items.push({label: "If the localization was wrong and you've been in the same room for at least 2 minutes, use this to quickly fix the problem!",  type:'explanation', below: true});

    items.push({type:'spacer'});
    items.push({type:'spacer'});
    items.push({type:'spacer'});

    return items;
  }


  render() {
    return (
      <Background image={background.main} hasNavBar={false} testID={"SphereAdd"}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <ListEditableItems items={this._getItems()} />
        </ScrollView>
      </Background>
    );
  }
}
