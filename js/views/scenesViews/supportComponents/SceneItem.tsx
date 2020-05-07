import { default as React, useEffect, useState }          from "react";
import { colors, screenWidth, styles }                    from "../../styles";
import { ActivityIndicator, Alert, Image, Text, TextStyle, TouchableOpacity, View } from "react-native";
import { SceneConstants }                                 from "../constants/SceneConstants";
import { SlideSideFadeInView }                            from "../../components/animated/SlideFadeInView";
import { Icon }                                           from "../../components/Icon";
import { AlternatingContent }                             from "../../components/animated/AlternatingContent";
import { PICTURE_GALLERY_TYPES, SCENE_STOCK_PICTURE_LIST } from "../ScenePictureGallery";
import { xUtil } from "../../../util/StandAloneUtil";
import { MapProvider } from "../../../backgroundProcesses/MapProvider";
import { core } from "../../../core";
import { NavigationUtil } from "../../../util/NavigationUtil";
import { BatchCommandHandler } from "../../../logic/BatchCommandHandler";
import { SortingManager } from "../../../logic/SortingManager";
import { IconCircle } from "../../components/IconCircle";

export function SceneItem({sphereId, sceneId, scene, stateEditMode, dragAction, eventBus, isBeingDragged}) {
  const [editMode, setEditMode] = useState(stateEditMode);
  const [drag, setDrag] = useState(isBeingDragged);
  const [activated, setActivated] = useState(false);

  useEffect(() => { let cleaner = eventBus.on('ChangeInEditMode', (data) => { setEditMode((data) ); }); return () => { cleaner(); } });
  useEffect(() => { let cleaner = eventBus.on('END_DRAG',         ()     => { setDrag(false); }); return () => { cleaner(); } });

  let color = drag ? colors.menuTextSelected.rgba(0.5) : colors.white.hex
  let subtext = getLocationSubtext(sphereId, scene);

  if (activated) { subtext = "Setting the scene!"; }
  if (editMode)  { subtext = "Press and hold to change the order!"; }
  if (drag)      { subtext = "Drag me up or down!"; }

  let image = getScenePictureSource(scene);

  return (
    <View style={{
      flexDirection:'row', borderRadius: SceneConstants.roundness, overflow:'hidden',
      backgroundColor: "transparent",
      width: screenWidth - 2*SceneConstants.padding,
      height: SceneConstants.sceneHeight,
      alignItems:'center', marginBottom: 15
    }}>
      <TouchableOpacity
        activeOpacity={editMode ? 0.7 : 0.3}
        style={{flexDirection:'row', height: SceneConstants.sceneHeight, flex:1, alignItems:'center'}}
        onPress={() => {
          if (editMode === false) {
            let switchData = scene.data;
            let action = false;
            Object.keys(switchData).forEach((stoneCID) => {
              action = true;
              let stoneData = MapProvider.stoneCIDMap[sphereId][stoneCID];
              BatchCommandHandler.loadPriority(stoneData.stone, stoneData.id, sphereId, {commandName:"multiSwitch", state: switchData[stoneCID]}).catch()
            })
            if (action) {
              BatchCommandHandler.executePriority();
            }

            setActivated(true);
            setTimeout(() => { setActivated(false); }, 2000);
          }
          else {
            NavigationUtil.launchModal("SceneEdit", {sphereId: sphereId, sceneId: sceneId});
          }
        }}
        onLongPress={dragAction}
      >
      <SlideSideFadeInView visible={drag} width={40} />
        <Image source={image} style={{width: SceneConstants.sceneHeight, height: SceneConstants.sceneHeight, borderTopLeftRadius: 10, borderBottomLeftRadius: 10}} />
        <View style={{flexDirection:'row', backgroundColor: color, flex:1, height: SceneConstants.sceneHeight, alignItems:'center'}}>
          <View style={{width:1, height: SceneConstants.sceneHeight, backgroundColor: colors.black.hex}} />
          <View style={{paddingLeft:10}}>
            <View style={{flex:4}} />
            <Text style={{fontSize:18, fontWeight:'bold'}}>{scene.name}</Text>
            <View style={{flex:1}} />
            <Text style={{fontSize: 13, fontStyle: 'italic' }}>{subtext}</Text>
            <View style={{flex:4}} />
          </View>
          <View style={{flex:1}} />
        </View>
        <SlideSideFadeInView visible={!drag} width={SceneConstants.buttonWidth} duration={300} style={{backgroundColor: color}}>
          <EditIcons
            color={color}
            editMode={editMode}
            editCallback={  () => { NavigationUtil.launchModal("SceneEdit", {sphereId: sphereId, sceneId: sceneId}) }}
            deleteCallback={() => { Alert.alert("Are you sure?","Do you want to delete this scene?", [{text:"Cancel"},{text:"OK", onPress: (() => {
              SortingManager.removeFromLists(sceneId);
              core.store.dispatch({
                type:"REMOVE_SCENE",
                sphereId: sphereId,
                sceneId: sceneId,
              })
            })}])}}
          />
          <SlideSideFadeInView visible={!editMode} width={SceneConstants.buttonWidth} style={{height: SceneConstants.sceneHeight}}  duration={300}>
            <View style={{width: SceneConstants.buttonWidth, height:SceneConstants.sceneHeight, ...styles.centered, paddingLeft:20}}>
              { activated ? <ActivityIndicator size={"large"} /> : <IconCircle
                icon={'ios-play'}
                borderColor={colors.white.hex}
                color={colors.white.hex}
                backgroundColor={colors.green.rgba(0.7)}
                size={SceneConstants.playWidth}
              />}
            </View>
          </SlideSideFadeInView>
        </SlideSideFadeInView>
      </TouchableOpacity>
    </View>
  )
}

function getLocationSubtext(sphereId: string, scene : SceneData) {
  let data = scene.data;
  let locations = [];
  let locationMap = {};
  let sphere = core.store.getState().spheres[sphereId]
  let locationCount = Object.keys(sphere.locations).length;
  Object.keys(data).forEach((stoneCID) => {
    let locationName = MapProvider.stoneCIDMap[sphereId]?.[stoneCID]?.locationName;
    if (locationName) {
      if (locationMap[locationName] === undefined) {
        locationMap[locationName] = true;
        locations.push(locationName);
      }
    }
  });

  if (locations.length == locationCount) {
    return "All rooms";
  }
  else if (locations.length > 2) {
    return "Multiple rooms";
  }
  else if (locations.length > 1) {
    return locations[0] + " and " + locations[1];
  }
  else if (locations.length === 1) {
    return locations[0];
  }
  else {
    return "Not affecting rooms."
  }

}

function EditIcons({editMode, color, editCallback, deleteCallback}) {
  let buttonStyle = {width: 0.5*SceneConstants.buttonWidth, height: SceneConstants.sceneHeight,...styles.centered}
  return (
    <SlideSideFadeInView visible={editMode} width={SceneConstants.buttonWidth} style={{position:'absolute', top:0}} duration={300}>
      <View style={{flexDirection:'row'}}>
        <TouchableOpacity style={buttonStyle} onPress={editCallback}>
          <Icon name="md-create" size={24} color={colors.menuTextSelected.hex} />
        </TouchableOpacity>
        <TouchableOpacity style={buttonStyle} onPress={deleteCallback}>
          <Icon name={'ios-trash'} color={colors.red.rgba(0.6)} size={30} />
        </TouchableOpacity>
      </View>
    </SlideSideFadeInView>
  )
}

export const getScenePictureSource = function(scene) {
  if (scene.pictureSource === PICTURE_GALLERY_TYPES.STOCK) {
    return SCENE_STOCK_PICTURE_LIST[scene.picture];
  }
  else if (scene.pictureSource === PICTURE_GALLERY_TYPES.CUSTOM) {
    // custom
    return { uri: xUtil.preparePictureURI(scene.picture) };
  }
  else {
    return require("../../../images/icons/downloadFromCrownstone.png");
  }
}