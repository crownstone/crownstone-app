
import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("OverlayUtil", key)(a,b,c,d,e);
}
import { core } from "../../core";
import { RoomList } from "../components/RoomList";
import * as React from "react";
import { colors } from "../styles";
import { DataUtil } from "../../util/DataUtil";


export const OverlayUtil = {

  callRoomSelectionOverlay: function(sphereId, callback, currentLocationId?) {
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
                showNavigationIcon={false}
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
      image: require("../../images/overlayCircles/roomsCircle.png")
    });
  },


  callRoomSelectionOverlayForStonePlacement: function(sphereId, stoneId) {
    OverlayUtil.callRoomSelectionOverlay(sphereId, (locationId) => {
      core.store.dispatch({type:"UPDATE_STONE_LOCATION", sphereId: sphereId, stoneId: stoneId, data:{locationId: locationId}});
      let hub = DataUtil.getHubByStoneId(sphereId, stoneId);
      if (hub) {
        core.store.dispatch({type:"UPDATE_HUB_CONFIG", sphereId: sphereId, hubId: hub.id, data:{locationId: locationId}});
      }
    })
  },
}