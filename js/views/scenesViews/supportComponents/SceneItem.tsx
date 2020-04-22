import { default as React, useEffect, useState }          from "react";
import { colors, screenWidth, styles }                    from "../../styles";
import { Image, Text, TextStyle, TouchableOpacity, View } from "react-native";
import { SceneConstants }                                 from "../constants/SceneConstants";
import { SlideSideFadeInView }                            from "../../components/animated/SlideFadeInView";
import { Icon }                                           from "../../components/Icon";
import { AlternatingContent }                             from "../../components/animated/AlternatingContent";

export function SceneItem({scene, stateEditMode, dragAction, eventBus, isBeingDragged}) {
  const [editMode, setEditMode] = useState(stateEditMode);
  const [drag, setDrag] = useState(isBeingDragged);

  useEffect(() => { let cleaner = eventBus.on('ChangeInEditMode', (data) => { setEditMode((data) ); }); return () => { cleaner(); } });
  useEffect(() => { let cleaner = eventBus.on('END_DRAG',         ()     => { setDrag(false); }); return () => { cleaner(); } });

  let color = drag ? colors.menuTextSelected.rgba(0.5) : colors.white.hex
  let subtext = null;

  if (editMode) { subtext = <SceneEditExplanation /> }
  if (drag)     { subtext = <Text style={{ fontStyle: 'italic' }}>{ "Drag me up or down" }</Text>; }



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
        style={{flexDirection:'row', height: SceneConstants.sceneHeight, flex:1, alignItems:'center'}}
        onLongPress={dragAction}
        onPress={() => {
          if (editMode) {
            dragAction();
          }
          else {
            //   execute me!
          }
        }}>
        <View style={{width: SceneConstants.sceneHeight, height: SceneConstants.sceneHeight}}>
          <Image source={require('../../../images/backgrounds/backgroundHD.png')} style={{width: SceneConstants.sceneHeight, height: SceneConstants.sceneHeight, borderTopLeftRadius: 10, borderBottomLeftRadius: 10}} />
          <SlideSideFadeInView visible={editMode} width={SceneConstants.sceneHeight} style={{position:'absolute', top:0}}>
            <View style={{width:SceneConstants.sceneHeight, height:SceneConstants.sceneHeight, backgroundColor: colors.menuTextSelected.rgba(0.25), ...styles.centered}}>
              <Icon name="md-create" size={30} color={colors.white.hex} />
            </View>
          </SlideSideFadeInView>
        </View>
        <View style={{flexDirection:'row', backgroundColor: color, flex:1, height: SceneConstants.sceneHeight, alignItems:'center'}}>
          <View style={{width:1, height: SceneConstants.sceneHeight, backgroundColor: colors.black.hex}} />
          <View style={{paddingLeft:10}}>
            <View style={{flex:4}} />
            <Text style={{fontSize:18, fontWeight:'bold'}}>{scene.name}</Text>
            { subtext && <View style={{flex:1}} /> }
            { subtext }
            <View style={{flex:4}} />
          </View>
          <View style={{flex:1}} />
        </View>
      </TouchableOpacity>
      <TouchableOpacity
        onPressIn={() => {
          if (editMode) {
            dragAction();
          }
        }}
        onPress={() => {
          //   execute me!
        }}
      >
        <View style={{width: SceneConstants.selectableWidth, height:SceneConstants.sceneHeight, alignItems:'flex-end', backgroundColor: color}}>
          <DragMeIconWhenEditing editMode={editMode} />
          <SlideSideFadeInView visible={!editMode} width={SceneConstants.arrowWidth} style={{position:'absolute', top:0.25*SceneConstants.sceneHeight, right:10}}>
            <View style={{width:SceneConstants.arrowWidth, height:0.5*SceneConstants.sceneHeight, padding:8, backgroundColor: colors.black.rgba(0.05), borderRadius: SceneConstants.roundness, ...styles.centered}}>
              <Icon name="ios-arrow-forward" size={18} color={'#888'} />
            </View>
          </SlideSideFadeInView>
        </View>
      </TouchableOpacity>
    </View>
  )
}

function DragMeIconWhenEditing({editMode}) {
  let buttonSize = {width:SceneConstants.buttonWidth, height: SceneConstants.sceneHeight};
  return (
    <SlideSideFadeInView visible={editMode} width={SceneConstants.buttonWidth} style={{position:'absolute', top:0}}>
      <View style={{...buttonSize, backgroundColor: colors.black.rgba(0.05), borderRadius: SceneConstants.roundness}}>
        <View style={{...buttonSize, padding:8, ...styles.centered, position:'absolute', top:0}}>
          <View style={{flex:0.5}} />
          <Icon name="md-arrow-round-up"  size={18} color={colors.black.rgba(0.3)} />
          <View style={{flex:3}} />
          <Icon name="c1-tap-fat" size={18} color={colors.black.rgba(0.7)} />
          <View style={{flex:3}} />
          <Icon name="md-arrow-round-down" size={18} color={colors.black.rgba(0.3)} />
          <View style={{flex:0.5}} />
        </View>
      </View>
    </SlideSideFadeInView>
  )
}

function SceneEditExplanation() {
  let color = colors.black.rgba(0.5);
  let fontStyle: TextStyle = { fontStyle:'italic', fontSize:14, color: color };
  return (
    <AlternatingContent
      style={{width: SceneConstants.textWidth, alignItems:'flex-start', height: 0.4*SceneConstants.sceneHeight}}
      switchDuration={3000}
      contentArray={[
        <View style={{flexDirection:'row', width: SceneConstants.textWidth, justifyContent:'flex-start'}}>
          <Icon name={"ios-arrow-round-back"} color={color} size={15} />
          <Text style={fontStyle}>{ "  Tap to edit" }</Text>
        </View>,
        <View style={{flexDirection:'row', width: SceneConstants.textWidth, justifyContent: 'flex-end'}}>
          <Text style={fontStyle}>{ "Hold to change order  " }</Text>
          <Icon name={"ios-arrow-round-forward"} color={color} size={15} />
        </View>
      ]}
    />
  );
}