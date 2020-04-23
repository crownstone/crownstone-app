import { default as React, useEffect, useState }          from "react";
import { colors, screenWidth, styles }                    from "../../styles";
import { Image, Text, TextStyle, TouchableOpacity, View } from "react-native";
import { SceneConstants }                                 from "../constants/SceneConstants";
import { SlideSideFadeInView }                            from "../../components/animated/SlideFadeInView";
import { Icon }                                           from "../../components/Icon";
import { AlternatingContent }                             from "../../components/animated/AlternatingContent";
import { PICTURE_GALLERY_TYPES, SCENE_STOCK_PICTURE_LIST } from "../ScenePictureGallery";
import { xUtil } from "../../../util/StandAloneUtil";
import { MapProvider } from "../../../backgroundProcesses/MapProvider";
import { core } from "../../../core";

export function SceneItem({sphereId, scene, stateEditMode, dragAction, eventBus, isBeingDragged}) {
  const [editMode, setEditMode] = useState(stateEditMode);
  const [drag, setDrag] = useState(isBeingDragged);

  useEffect(() => { let cleaner = eventBus.on('ChangeInEditMode', (data) => { setEditMode((data) ); }); return () => { cleaner(); } });
  useEffect(() => { let cleaner = eventBus.on('END_DRAG',         ()     => { setDrag(false); }); return () => { cleaner(); } });

  let color = drag ? colors.menuTextSelected.rgba(0.5) : colors.white.hex
  let subtext = getLocationSubtext(sphereId, scene);

  if (editMode) { subtext = "Press and hold to change the order!"; }
  if (drag)     { subtext = "Drag me up or down!"; }

  let image = getScenePictureSource(scene);

  return (
    <View style={{
      flexDirection:'row', borderRadius: SceneConstants.roundness, overflow:'hidden',
      backgroundColor: "transparent",
      width: screenWidth - 2*SceneConstants.padding,
      height: SceneConstants.sceneHeight,
      alignItems:'center', marginBottom: 15
    }}>
      <SlideSideFadeInView visible={drag} width={40} />
      <TouchableOpacity
        activeOpacity={1}
        style={{flexDirection:'row', height: SceneConstants.sceneHeight, flex:1, alignItems:'center', backgroundColor: color,}}
        onLongPress={dragAction}
        onPress={() => {
        }}>
        <Image source={image} style={{width: SceneConstants.sceneHeight, height: SceneConstants.sceneHeight, borderTopLeftRadius: 10, borderBottomLeftRadius: 10}} />
        <View style={{flexDirection:'row', backgroundColor: color, flex:1, height: SceneConstants.sceneHeight, alignItems:'center'}}>
          <View style={{width:1, height: SceneConstants.sceneHeight, backgroundColor: colors.black.hex}} />
          <View style={{paddingLeft:10}}>
            <View style={{flex:4}} />
            <Text style={{fontSize:18, fontWeight:'bold'}}>{scene.name}</Text>
            <View style={{flex:1}} />
            <Text style={{ fontSize: 13, fontStyle: 'italic' }}>{subtext}</Text>
            <View style={{flex:4}} />
          </View>
          <View style={{flex:1}} />
        </View>
      </TouchableOpacity>
      <SlideSideFadeInView visible={!drag} width={SceneConstants.buttonWidth}>
        <View style={{width: SceneConstants.buttonWidth, height:SceneConstants.sceneHeight, alignItems:'flex-end', backgroundColor: color}}>
          <EditIcons editMode={editMode} />
          <SlideSideFadeInView visible={!editMode} width={SceneConstants.arrowWidth} style={{position:'absolute', top:0.25*SceneConstants.sceneHeight, right:10}}>
            <View style={{width:SceneConstants.arrowWidth, height:0.5*SceneConstants.sceneHeight, padding:8, backgroundColor: colors.black.rgba(0.05), borderRadius: SceneConstants.roundness, ...styles.centered}}>
              <Icon name="ios-arrow-forward" size={18} color={'#888'} />
            </View>
          </SlideSideFadeInView>
        </View>
      </SlideSideFadeInView>
    </View>
  )
}

function getLocationSubtext(sphereId: string, scene : SceneData) {
  let data = scene.data;
  let locations = [];
  let sphere = core.store.getState().spheres[sphereId]
  let locationCount = Object.keys(sphere.locations).length;
  Object.keys(data).forEach((stoneCID) => {
    console.log("stoneCID", stoneCID, MapProvider.stoneCIDMap[sphereId])
    locations.push(MapProvider.stoneCIDMap[sphereId]?.[stoneCID]?.locationName);
  });

  console.log("locations", locations)
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

function EditIcons({editMode}) {
  let buttonStyle = {width: 0.5*SceneConstants.buttonWidth, height: SceneConstants.sceneHeight,...styles.centered}
  return (
    <SlideSideFadeInView visible={editMode} width={SceneConstants.buttonWidth} style={{position:'absolute', top:0}}>
      <View style={{flexDirection:'row'}}>
        <TouchableOpacity style={buttonStyle}>
          <Icon name="md-create" size={24} color={colors.menuTextSelected.hex} />
        </TouchableOpacity>
        <TouchableOpacity style={buttonStyle}>
          <Icon name={'ios-trash'} color={colors.red.rgba(0.6)} size={34} />
        </TouchableOpacity>
      </View>
    </SlideSideFadeInView>
  )
}

export const getScenePictureSource = function(scene) {
  if (scene.pictureSource === PICTURE_GALLERY_TYPES.STOCK) {
    return SCENE_STOCK_PICTURE_LIST[scene.picture];
  }
  else {
    // custom
    return { uri: xUtil.preparePictureURI(scene.picture) };
  }
}