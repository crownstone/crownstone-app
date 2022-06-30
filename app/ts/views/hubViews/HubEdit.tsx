import { LiveComponent } from "../LiveComponent";

import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("HubEdit", key)(a,b,c,d,e);
}
import * as React from 'react';
import {
  Alert,
  ScrollView
} from 'react-native';


import { colors, background } from "../styles";
import { CLOUD } from '../../cloud/cloudAPI'
import { IconButton } from '../components/IconButton'
import { ListEditableItems } from '../components/ListEditableItems'
import {Permissions} from "../../backgroundProcesses/PermissionManager";

import { core } from "../../Core";
import { NavigationUtil } from "../../util/navigation/NavigationUtil";
import { TopBarUtil } from "../../util/TopBarUtil";
import { BackgroundNoNotification } from "../components/BackgroundNoNotification";
import { SortingManager } from "../../logic/SortingManager";
import { Get } from "../../util/GetUtil";
import { HubHelper } from "../../native/setup/HubHelper";
import { OverlayUtil } from "../../util/OverlayUtil";


export class HubEdit extends LiveComponent<any, any> {
  static options(props) {
    return TopBarUtil.getOptions({title: lang("Edit_hub"), cancelModal: true, save: true});
  }

  deleting : boolean = false;
  unsubscribeStoreEvents : any;

  constructor(props) {
    super(props);

    let state = core.store.getState();
    let hub = state.spheres?.[this.props.sphereId]?.hubs?.[this.props.hubId];
    
    this.state = {
      locationId: hub.config.locationId,
    };

  }

  navigationButtonPressed({ buttonId }) {
    if (buttonId === 'save') {  this._updateHub(); }
  }


  componentDidMount() {
    // tell the component exactly when it should redraw
    this.unsubscribeStoreEvents = core.eventBus.on("databaseChange", (data) => {
      let change = data.change;
      let state = core.store.getState();

      // in case the sphere is deleted
      if (state.spheres[this.props.sphereId] === undefined) {
        return;
      }

      if (change.updateHubConfig && change.updateHubConfig.hubIds[this.props.hubId]) {
        if (this.deleting === false) {
          this.forceUpdate();
        }
      }
    });
  }


  componentWillUnmount() {
    this.unsubscribeStoreEvents();
  }


  constructHubOptions(hub: HubData, state) {
    let items = [];
    let locations = state.spheres[this.props.sphereId].locations;

    let location = locations[this.state.locationId];
    let locationLabel = lang("Not_in_a_room");
    if (location !== undefined) {
      locationLabel = location.config.name;
    }
    locationLabel += lang("__tap_to_change_")

    items.push({label: lang("HUB_IS_IN_ROOM_"), type: 'explanation', below: false});
    items.push({
      label: locationLabel,
      mediumIcon:  <IconButton name="md-cube" size={25} buttonSize={38}  color="#fff" buttonStyle={{backgroundColor:colors.green.hex}} />,
      type:  'button',
      style: {color: colors.blue.hex},
      callback: () => {
        OverlayUtil.callRoomSelectionOverlay(this.props.sphereId, (roomId) => {
          this.setState({locationId: roomId})
        })
      }
    });

    if (Permissions.inSphere(this.props.sphereId).removeCrownstone) {
      items.push({label: lang("DANGER"), type: 'explanation', below: false});
      items.push({
        label: lang("Remove_from_Sphere"),
        mediumIcon: <IconButton name="ios-trash" size={26} buttonSize={38}  color="#fff" buttonStyle={{backgroundColor:colors.red.hex}} />,
        type: 'button',
        callback: async  () => {
          Alert.alert(
            lang("Are_you_sure_you_want_to_"),
            lang("This_cannot_be_undone_"),
          [{text: lang("Delete"), onPress: async () => {
              let helper = new HubHelper();
              try { await CLOUD.deleteHub(hub.config.cloudId) } catch (e) {}
              Alert.alert(
                lang("_Success__arguments___OKn_header"),
                lang("_Success__arguments___OKn_body",lang("I_have_removed_this_Hub")),
                [{text:lang("_Success__arguments___OKn_left"), onPress: () => {
                    NavigationUtil.dismissModalAndBack();
                    SortingManager.removeFromLists(this.props.hubId);
                    core.store.dispatch({type: "REMOVE_HUB", sphereId: this.props.sphereId, hubId: this.props.hubId});
                    core.eventBus.emit('hideLoading');
                }}]);
            }, style: 'destructive'},{text:lang("Cancel"),style: 'cancel'}])
        }
      });
      items.push({label: lang("Removing_this_Hub_from_th"),  type:'explanation', below:true});
    }

    return items;
  }

  _updateHub() {
    const store = core.store;
    const state = store.getState();
    const hub = Get.hub(this.props.sphereId, this.props.hubId);

    let actions = [];
    if (hub.config.locationId !== this.state.locationId) {
      actions.push({
        type:'UPDATE_HUB_CONFIG',
        sphereId: this.props.sphereId,
        hubId: this.props.hubId,
        data: {
          locationId:  this.state.locationId,
        }});
    }

    if (actions.length > 0) {
      core.store.batchDispatch(actions);
    }

    NavigationUtil.dismissModal();
  }


  render() {
    const state = core.store.getState();
    const hub = Get.hub(this.props.sphereId, this.props.hubId);
    let options = this.constructHubOptions(hub, state);
    let backgroundImage = background.menu;

    return (
      <BackgroundNoNotification hasNavBar={false} image={backgroundImage}>
        <ScrollView>
          <ListEditableItems items={options} separatorIndent={true}/>
        </ScrollView>
      </BackgroundNoNotification>
    )
  }
}
