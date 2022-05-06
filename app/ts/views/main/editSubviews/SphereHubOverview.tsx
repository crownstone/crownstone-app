import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("SphereHubOverview", key)(a,b,c,d,e);
}
import * as React from 'react';
import {
  Alert,
  ScrollView} from 'react-native';
import { background, colors } from "../../styles";
import {Background} from "../../components/Background";
import {ListEditableItems} from "../../components/ListEditableItems";
import {DeviceEntry} from "../../components/deviceEntries/DeviceEntry";
import {Icon} from "../../components/Icon";
import {Permissions} from "../../../backgroundProcesses/PermissionManager";
import { core } from "../../../Core";
import { NavigationUtil } from "../../../util/navigation/NavigationUtil";
import { TopBarUtil } from "../../../util/TopBarUtil";
import { HubEntry } from "../../components/deviceEntries/HubEntry";
import { STONE_TYPES } from "../../../Enums";
import { LiveComponent } from "../../LiveComponent";
import { Get } from "../../../util/GetUtil";
import {SettingsBackground} from "../../components/SettingsBackground";



export class SphereHubOverview extends LiveComponent<any, any> {
  static options(props) {
    let state = core.store.getState();
    let sphere = state.spheres[props.sphereId] ;
    return TopBarUtil.getOptions({title: lang("Hubs_in_",sphere.config.name)});
  }

  unsubscribe : any;

  componentDidMount() {
    this.unsubscribe = core.eventBus.on("databaseChange", (data) => {
      let change = data.change;
      if (change.changeSpheres || change.updateActiveSphere || change.changeHubs) {
        this.forceUpdate();
      }
    });
  }

  componentWillUnmount() {
    this.unsubscribe();
  }

  _getItems() {
    let items = [];

    const store = core.store;
    let state = store.getState();
    let sphere = state.spheres[this.props.sphereId];
    let stones = sphere.stones;
    let hubs = sphere.hubs;


    let linkedStoneMap = {};


    let hubItemsToShow = [];
    for (let [hubId, hub] of Object.entries<HubData>(hubs)) {
      let linkedStoneId = hub.config.linkedStoneId;
      linkedStoneMap[linkedStoneId] = hub;
      hubItemsToShow.push({type:'hub', id: hubId, data: hub})
    }

    for (let [stoneId, stone] of Object.entries<StoneData>(stones)) {
      if (stone.config.type === STONE_TYPES.hub) {
        if (linkedStoneMap[stoneId] === undefined) {
          hubItemsToShow.push({type:'hubStone', id: stoneId, data: stone})
        }
        else {
          // this is already shown in the hub list via the hub Id
        }
      }
      else if (stone.config.type === STONE_TYPES.crownstoneUSB) {
        hubItemsToShow.push({type:'dongle', id: stoneId, data: stone})
      }
    }

    if (hubItemsToShow.length == 0) {
      items.push({label: lang("There_are_no_hubs_or_dong"),  type:'largeExplanation', below:false});
      return items;
    }

    items.push({label: lang("HUBS___CROWNSTONE_USBs_IN"), type:'explanation', below:false});

    hubItemsToShow.forEach((hubItem) => {
      let location = Get.location(this.props.sphereId, hubItem?.data?.config?.locationId);
      let locationString = location ? lang("In_", location.config.name) : lang("Not_in_room_")
      switch (hubItem.type) {
        case "hub":
          items.push({
            __item: <HubEntry
              hubId={hubItem.id}
              sphereId={this.props.sphereId}
              statusText={locationString}
              allowSwitchView={false}
              viewingRemotely={false}
              hideExplanation={true}
            />
          });
          break;
        case "dongle":
          items.push({
            __item: <DeviceEntry
              stoneId={hubItem.id}
              sphereId={this.props.sphereId}
              statusText={locationString}
              allowSwitchView={false}
              viewingRemotely={false}
              hideExplanation={true}
            />
          });
          break;
        case "hubStone":
          items.push({
            __item: <HubEntry
              stoneId={hubItem.id}
              sphereId={this.props.sphereId}
              statusText={locationString}
              allowSwitchView={false}
              viewingRemotely={false}
              hideExplanation={true}
            />
          });
          break;
      }
    })
    items.push({label: lang("This_is_an_overview_of_al"), type:'explanation', below:true});

    items.push({
      label: lang("Add_hub"),
      largeIcon: <Icon name="c3-addRoundedfilled" size={60} color={colors.green.hex} style={{position: 'relative', top: 2}}/>,
      style: {color: colors.blue.hex, fontWeight: 'bold'},
      type: 'button',
      callback: () => {
        if (Permissions.inSphere(this.props.sphereId).canSetupCrownstone) {
          NavigationUtil.launchModal("AddCrownstone", {sphereId: this.props.sphereId});
        }
        else {
          Alert.alert(
            lang("_Ask_your_Sphere_Admin__A_header"),
            lang("_Ask_your_Sphere_Admin__A_body"),
            [{text:lang("_Ask_your_Sphere_Admin__A_left")}]);
        }
      }
    });

    items.push({type:'spacer'});
    items.push({type:'spacer'});

    return items;
  }

  render() {
    return (
      <SettingsBackground testID={"SphereHubOverview"}>
        <ScrollView keyboardShouldPersistTaps="always">
          <ListEditableItems items={this._getItems()} separatorIndent={false} />
        </ScrollView>
      </SettingsBackground>
    );
  }
}
