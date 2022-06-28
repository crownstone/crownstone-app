
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
  enoughCrownstonesForIndoorLocalization
} from "../../../util/DataUtil";
import {Icon} from "../../components/Icon";
import { SettingsBackground } from "../../components/SettingsBackground";
import { useDatabaseChange } from "../../components/hooks/databaseHooks";
import { useLiveView } from "../../components/hooks/viewHooks";



export function BehaviourMenu(props: { sphereId: sphereId}) {
  useLiveView(props);
  useDatabaseChange(['changeSphereSmartHomeState','changeSphereState']);

  let state = core.store.getState();
  let sphere : SphereData = state.spheres[props.sphereId];
  let behaviourEnabledState = true;
  if (sphere) {
    behaviourEnabledState = sphere.state.smartHomeEnabled === true
  }
  let items = [];

  items.push({ label: "BEHAVIOUR", type: 'largeExplanation' });
  let label = "You can disable behaviour so your house reverts to a normal, dumb, home. This is often used if you have guests. Guests prefer not to be left in the dark...";
  let disabled = false;
  if (DataUtil.isBehaviourUsed(props.sphereId)) {
    if (!DataUtil.inSphere(props.sphereId)) {
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
      SphereStateManager.userSetSmartHomeState(props.sphereId, !newState);
      core.eventBus.emit("showLoading",newState === true ? "Disabling behaviour..." : "Enabling behaviour...");
      setTimeout(() => { core.eventBus.emit("hideLoading"); }, 4000);
    }
  });
  items.push({label: label,  type:'explanation', below: true});

  return (
    <SettingsBackground testID={"LocalizationMenu"}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <ListEditableItems items={items} />
      </ScrollView>
    </SettingsBackground>
  );
}

BehaviourMenu.options = TopBarUtil.getOptions({ title: "Behaviour", closeModal: true })
