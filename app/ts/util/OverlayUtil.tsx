import { Languages } from "../Languages";

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("OverlayUtil", key)(a,b,c,d,e);
}

import * as React from "react";
import { core } from "../Core";
import { RoomList } from "../views/components/RoomList";
import { colors, statusBarHeight, topBarHeight } from "../views/styles";
import { DataUtil } from "./DataUtil";
import { Get } from "./GetUtil";
import { ScrollView } from "react-native";
import { LocationLists } from "../views/selection/SelectCrownstone";




export const OverlayUtil = {

  callRoomSelectionOverlay: function(sphereId, callback) {
    core.eventBus.emit('showListOverlay', {
      title: lang("Select_Room"),
      getItems: () => {
        const state = core.store.getState();
        const sphere = state.spheres[sphereId];
        let locationIds = Object.keys(sphere.locations);
        locationIds.sort((a,b) => {
          return sphere.locations[a].config.name > sphere.locations[b].config.name ? 1 : -1;
        })
        let items = [];
        locationIds.forEach((locationId) => {
          let location = sphere.locations[locationId];
          items.push({
            id: locationId,
            component:
              <RoomList
                icon={location.config.icon}
                name={location.config.name}
                hideSubtitle={true}
                showNavigationIcon={true}
              />
          });
        });

        return items;
      },
      callback: (locationId) => {
        callback(locationId)
      },
      allowMultipleSelections: false,
      themeColor: colors.lightGreen2.hex,
      selection: null,
      separator: false,
      image: require("../../assets/images/overlayCircles/roomsCircle.png")
    });
  },


  callCrownstoneSelectionOverlay: function(sphereId, callback) {
    core.eventBus.emit('showSelectCrownstoneOverlay', {
      title: lang("Select_Crownstone"),
      sphereId, callback
    });
  },



  callRoomSelectionOverlayForStonePlacement: function(sphereId, stoneId) {
    OverlayUtil.callRoomSelectionOverlay(sphereId, (locationId) => {
      core.store.dispatch({type:"UPDATE_STONE_LOCATION", sphereId: sphereId, stoneId: stoneId, data:{locationId: locationId}});
      let hub = DataUtil.getHubByStoneId(sphereId, stoneId);
      if (hub) {
        core.store.dispatch({type:"UPDATE_HUB_LOCATION", sphereId: sphereId, hubId: hub.id, data: {locationId: locationId}});
      }
    })
  },

  callRoomSelectionOverlayForHubPlacement: function(sphereId, hubId) {
    OverlayUtil.callRoomSelectionOverlay(sphereId, (locationId) => {
      core.store.dispatch({type:"UPDATE_HUB_LOCATION", sphereId: sphereId, hubId: hubId, data: {locationId: locationId}});
      let hub = Get.hub(sphereId, hubId);
      if (hub && hub.config.linkedStoneId) {
        core.store.dispatch({type:"UPDATE_STONE_LOCATION", sphereId: sphereId, stoneId: hub.config.linkedStoneId, data:{locationId: locationId}});
      }
    })
  },
}
