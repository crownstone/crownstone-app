
import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("SceneItem", key)(a,b,c,d,e);
}
import { default as React, useEffect, useState }          from "react";
import { colors, screenWidth, styles }                    from "../../styles";
import { ActivityIndicator, Alert, Image, Text, TextStyle, TouchableOpacity, View } from "react-native";
import { PICTURE_GALLERY_TYPES, SCENE_STOCK_PICTURE_LIST, SceneConstants } from "../constants/SceneConstants";
import { SlideSideFadeInView }                            from "../../components/animated/SlideFadeInView";
import { Icon }                                           from "../../components/Icon";
import { AlternatingContent }                             from "../../components/animated/AlternatingContent";
import { xUtil } from "../../../util/StandAloneUtil";
import { MapProvider } from "../../../backgroundProcesses/MapProvider";
import { core } from "../../../Core";
import { NavigationUtil } from "../../../util/NavigationUtil";
import { SortingManager } from "../../../logic/SortingManager";
import { IconCircle } from "../../components/IconCircle";
import { migrateScene, migrateSceneSwitchData } from "../../../backgroundProcesses/migration/steps/upToV4_3";
import { OnScreenNotifications } from "../../../notifications/OnScreenNotifications";
import { Util } from "../../../util/Util";
import { tell } from "../../../logic/constellation/Tellers";

export function SceneItem({sphereId, sceneId, scene, stateEditMode, eventBus}) {
  const [editMode, setEditMode] = useState(stateEditMode);
  // const [drag, setDrag] = useState(isBeingDragged);
  const [activated, setActivated] = useState(false);
  const [available, setAvailable] = useState(core.bleState.bleAvailable && core.bleState.bleBroadcastAvailable);

  useEffect(() => { let cleaner = eventBus.on('ChangeInEditMode', (data) => { setEditMode((data) ); }); return () => { cleaner(); } });
  useEffect(() => { return Util.bleWatcherEffect(setAvailable); });
  // useEffect(() => { let cleaner = eventBus.on('END_DRAG',         ()     => { setDrag(false); }); return () => { cleaner(); } });

  let color = colors.white.hex;
  let subtext = getLocationSubtext(sphereId, scene);

  if (activated) { subtext = lang("Setting_the_scene_"); }
  if (editMode)  { subtext = lang("Tap_to_edit_"); }
  // if (drag)      { subtext = "Drag me up or down!"; }

  let image = getScenePictureSource(scene);

  return (
    <View style={{
      flexDirection:'row',
      borderRadius: SceneConstants.roundness,
      overflow:'hidden',
      backgroundColor: 'transparent',
      width: screenWidth - 2*SceneConstants.padding,
      height: SceneConstants.sceneHeight,
      alignItems:'center', marginBottom: 15
    }}>
      <TouchableOpacity
        activeOpacity={editMode ? 0.7 : 0.3}
        style={{flexDirection:'row', height: SceneConstants.sceneHeight, flex:1, alignItems:'center'}}
        onPress={() => {
          if (!available) { return }
          if (editMode === false) {
            let switchData = scene.data;
            executeScene(switchData, sphereId, sceneId);

            setActivated(true);
            setTimeout(() => { setActivated(false); }, 2000);
          }
          else {
            NavigationUtil.launchModal("SceneEdit", {sphereId: sphereId, sceneId: sceneId});
          }
        }}
        // onLongPress={dragAction}
      >
      {/*<SlideSideFadeInView visible={drag} width={40} />*/}
        { image ? <Image source={image} style={{width: SceneConstants.sceneHeight, height: SceneConstants.sceneHeight, borderTopLeftRadius: 10, borderBottomLeftRadius: 10}} />
         : <MissingImage /> }
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
        <SlideSideFadeInView visible={true} width={SceneConstants.buttonWidth} duration={300} style={{backgroundColor: color}}>
          <EditIcons
            color={color}
            editMode={editMode}
            editCallback={  () => { NavigationUtil.launchModal("SceneEdit", {sphereId: sphereId, sceneId: sceneId}) }}
            deleteCallback={() => { Alert.alert(
              lang("_Are_you_sure___Do_you_wa_header"),
              lang("_Are_you_sure___Do_you_wa_body"),
              [{text:lang("_Are_you_sure___Do_you_wa_left")},{
              text:lang("_Are_you_sure___Do_you_wa_right"), onPress: (() => {
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
              {available ? (activated ? <ActivityIndicator size={"large"} /> : <IconCircle
                icon={'ios-play'}
                borderColor={colors.white.hex}
                color={colors.white.hex}
                backgroundColor={colors.green.rgba(0.7)}
                size={SceneConstants.playWidth}
              />) : <IconCircle
                icon={'ios-bluetooth'}
                borderColor={colors.white.hex}
                color={colors.white.hex}
                backgroundColor={colors.csOrange.rgba(0.7)}
                size={SceneConstants.playWidth}
              />}
            </View>
          </SlideSideFadeInView>
        </SlideSideFadeInView>
      </TouchableOpacity>
    </View>
  )
}

function MissingImage(props) {
  return (
    <View style={{width: SceneConstants.sceneHeight, height: SceneConstants.sceneHeight, borderTopLeftRadius: 10, borderBottomLeftRadius: 10, backgroundColor: colors.white.hex}}>
      <View style={{flex:1, ...styles.centered, backgroundColor:colors.blue.hex}}>
        <Icon name={"md-photos"} color={colors.white.hex} size={50} />
      </View>
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
    return lang("All_rooms");
  }
  else if (locations.length > 2) {
    return lang("Multiple_rooms");
  }
  else if (locations.length > 1) {
    return locations[0] + lang("_and_") + locations[1];
  }
  else if (locations.length === 1) {
    return locations[0];
  }
  else {
    return lang("Not_affecting_rooms_")
  }

}

function EditIcons({editMode, color, editCallback, deleteCallback}) {
  let buttonStyle = {width: 0.5*SceneConstants.buttonWidth, height: SceneConstants.sceneHeight,...styles.centered}
  return (
    <SlideSideFadeInView visible={editMode} width={SceneConstants.buttonWidth} style={{position:'absolute', top:0}} duration={300}>
      <View style={{flexDirection:'row'}}>
        <TouchableOpacity style={buttonStyle} onPress={editCallback}>
          <Icon name="md-create" size={24} color={colors.blue.hex} />
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
    if (scene.picture === null) {
      return undefined;
    }
    return { uri: xUtil.preparePictureURI(scene.picture) };
  }
  else {
    return undefined;
  }
}

export const verifySceneIntegrity = function(switchData, sphereId, sceneId) {
  let deletedStones = false;
  let correctedList = {};

  // migrate to new format of crownstone switch values. We have changed this from 0..1 to 0..100
  // we place this here as an additional backup of the migration that is done on start.
  if (sceneId) {
    let {migrationRequired, action, switchData: newSwitchData} = migrateScene(sphereId, sceneId);
    if (migrationRequired) {
      core.store.dispatch(action);
      switchData = newSwitchData;
    }
  }
  else {
    switchData = migrateSceneSwitchData(switchData);
  }


  Object.keys(switchData).forEach((stoneCID) => {
    let stoneData = MapProvider.stoneCIDMap[sphereId][stoneCID];
    if (!stoneData) {
      deletedStones = true;
    }
    else {
      correctedList[stoneCID] = switchData[stoneCID];
    }
  })

  if (deletedStones && sceneId) {
    core.store.dispatch({type:"SCENE_UPDATE", sphereId, sceneId, data: { data: correctedList }})
  }
  return correctedList;
}

export const executeScene = function(switchData, sphereId: string, sceneId: string = null) {
  let action = false;
  let correctedList = verifySceneIntegrity(switchData, sphereId, sceneId);

  Object.keys(correctedList).forEach((stoneCID) => {
    action = true;
    let stoneData = MapProvider.stoneCIDMap[sphereId][stoneCID];
    tell(stoneData.stone).multiSwitch(correctedList[stoneCID]).catch(() => {});
  })
}