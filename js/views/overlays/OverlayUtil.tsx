
import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("OverlayUtil", key)(a,b,c,d,e);
}
import { core } from "../../core";
import { RoomList } from "../components/RoomList";
import * as React from "react";
import { colors } from "../styles";


export const OverlayUtil = {

  callRoomSelectionOverlay: function(sphereId, callback) {
    core.eventBus.emit('showListOverlay', {
      title: lang("Select_Room"),
      getItems: () => {
        const state = core.store.getState();
        const sphere = state.spheres[sphereId];
        let items = [];
        Object.keys(sphere.locations).forEach((locationId) => {
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
      core.store.dispatch({type:"UPDATE_STONE_LOCATION", sphereId: sphereId, stoneId: stoneId, data:{locationId: locationId}})
    })
  },
}