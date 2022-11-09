import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("RoomLayer", key)(a,b,c,d,e);
}
import * as React from 'react';
import {
  View
} from 'react-native';


import { RoomCircle }            from '../components/RoomCircle'
import {
  availableScreenHeight,
  screenWidth,
  statusBarHeight,
  tabBarHeight,
  topBarHeight,
  viewPaddingTop
} from "../styles";
import { UserLayer }             from './UserLayer';
import { ForceDirectedView }     from "../components/interactiveView/ForceDirectedView";
import { Util }                  from "../../util/Util";
import { core }                  from "../../Core";
import { OnScreenNotifications } from "../../notifications/OnScreenNotifications";
import { useEvent }              from "../components/hooks/eventHooks";
import { useDatabaseChange }     from "../components/hooks/databaseHooks";
import { useSafeAreaInsets }     from "react-native-safe-area-context";

export function RoomLayer(props) {
  const forceViewRef = React.useRef(null);

  const storePositions = () => {
    let nodes = forceViewRef.current.nodes;
    let nodeIds = Object.keys(nodes);
    let actions = [];
    nodeIds.forEach((nodeId) => {
      let node = nodes[nodeId];
      if (node.support === false && node.id !== null) {
        actions.push({type:"SET_LOCATION_POSITIONS", sphereId: props.sphereId, locationId: nodeId, data:{ x: node.x, y: node.y, setOnThisDevice: true}});
      }
    });
    if (actions.length > 0) {
      core.store.batchDispatch(actions);
    }
    props.setRearrangeRooms(false);
  }

  const resetPositions = () => {
    forceViewRef.current.initLayout();
    props.setRearrangeRooms(false);
  }

  useEvent("save_positions"  + props.viewId, storePositions);
  useEvent("reset_positions" + props.viewId, resetPositions);
  useDatabaseChange(['changeStones','stoneLocationUpdated','changeLocations','changeLocationPositions']);

  const baseRadius = 0.15 * screenWidth;
  const renderRoomCircle = (locationId, nodePosition) => {
    // variables to pass to the room overview
    return (
      <RoomCircle
        viewId={props.viewId}
        locationId={locationId}
        sphereId={props.sphereId}
        radius={baseRadius}
        pos={{x: nodePosition.x, y: nodePosition.y}}
        viewingRemotely={props.viewingRemotely}
        key={locationId || 'floating'}
        showHoldAnimation={!props.arrangingRooms}
        allowTap={!props.arrangingRooms}
        onHold={() => {
          props.setRearrangeRooms(true);
        }}
        touch={() => {
          forceViewRef.current.nodeTouch(locationId);
        }}
      />
    );
  }

  let insets = useSafeAreaInsets()

  let height = availableScreenHeight;
  let offset = 0;
  if (OnScreenNotifications.hasNotifications(props.sphereId)) {
    offset += 64;
  }
  let topOffset = offset;
  let bottomOffset = 50 - 0.5*baseRadius; // from the statusCommunication

  if (props.sphereId === null) {
    return <View style={{position: 'absolute', top: 0, left: 0, width: screenWidth, flex: 1}} />;
  }
  else {
    let roomData = Util.data.getLayoutDataRooms(props.sphereId);
    for (let roomId in roomData.initialPositions) {
      roomData.initialPositions[roomId].fixed = roomData.initialPositions[roomId].x !== null;
    }
    return (
      <ForceDirectedView
        ref={forceViewRef}
        viewId={props.viewId}
        topOffset={topOffset}
        bottomOffset={bottomOffset}
        drawToken={props.sphereId}
        nodeIds={roomData.roomIdArray}
        initialPositions={roomData.initialPositions}
        enablePhysics={roomData.usePhysics}
        nodeRadius={baseRadius}
        allowDrag={props.arrangingRooms}
        zoomOutCallback={props.zoomOutCallback}
        zoomInCallback={props.zoomInCallback}
        height={height}
        renderNode={(id, nodePosition) => { return renderRoomCircle(id, nodePosition); }}>
        { props.arrangingRooms === false && <UserLayer sphereId={props.sphereId} nodeRadius={baseRadius} /> }
      </ForceDirectedView>
    );
  }
}
