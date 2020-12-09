import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("SphereHubOverview", key)(a,b,c,d,e);
}
import * as React from 'react';
import {
  Alert,
  ScrollView} from 'react-native';
import {colors, } from "../../styles";
import {Util} from "../../../util/Util";
import {Background} from "../../components/Background";
import {ListEditableItems} from "../../components/ListEditableItems";
import {DeviceEntry} from "../../components/deviceEntries/DeviceEntry";
import {Icon} from "../../components/Icon";
import {Permissions} from "../../../backgroundProcesses/PermissionManager";
import { core } from "../../../core";
import { NavigationUtil } from "../../../util/NavigationUtil";
import { TopBarUtil } from "../../../util/TopBarUtil";
import { HubEntry } from "../../components/deviceEntries/HubEntry";
import { STONE_TYPES } from "../../../Enums";
import { LiveComponent } from "../../LiveComponent";
import { Get } from "../../../util/GetUtil";



export class SphereHubOverview extends LiveComponent<any, any> {
  static options(props) {
    let state = core.store.getState();
    let sphere = state.spheres[props.sphereId] ;
    return TopBarUtil.getOptions({title: "Hubs in " + sphere.config.name});
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


    hubItemsToShow.forEach((hubItem) => {
      let location = Get.location(this.props.sphereId, hubItem?.data?.config?.locationId);
      let locationString = location ? 'In ' + location.config.name : 'Not in room.'
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


    items.push({label: lang("This_is_an_overvi ew_of_al"), type:'explanation', below:true});


    items.push({
      label: "Add hub",
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
      <Background image={core.background.menu} hasNavBar={false}>
        <ScrollView keyboardShouldPersistTaps="always">
          <ListEditableItems items={this._getItems()} separatorIndent={false} />
        </ScrollView>
      </Background>
    );
  }
}
