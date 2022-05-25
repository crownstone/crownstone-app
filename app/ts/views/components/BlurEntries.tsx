import * as React from "react";

import { DraggableProps, useDraggable } from "./hooks/draggableHooks";
import { Text, TouchableOpacity, View } from "react-native";
import { SlideSideFadeInView }          from "./animated/SlideFadeInView";
import { BlurView }                     from "@react-native-community/blur";
import { colors, rowstyles }            from "../styles";
import { SceneConstants }               from "../scenesViews/constants/SceneConstants";
import { SettingsIconRight }            from "./EditIcon";

type ReactHOC = (props) => React.ComponentElement<any, any>

interface BlurEntryProps {
  dimMode: boolean,
  editMode: boolean,

  settings?: boolean,

  title:        ReactHOC | React.ComponentElement<any, any> | string,
  iconItem?:    ReactHOC | React.ComponentElement<any, any>,
  paddingItem?: ReactHOC | React.ComponentElement<any, any>,
  control?:     ReactHOC | React.ComponentElement<any, any>,
  labelItem?:   ReactHOC | React.ComponentElement<any, any>,

  editSettingsCallback: () => void
}
interface DraggableBlurEntryProps extends DraggableProps, BlurEntryProps {}

export function DraggableBlurEntry(props: DraggableBlurEntryProps) {
  // include draggable
  let {dragging, triggerDrag} = useDraggable(props.isBeingDragged, props.eventBus, props.dragAction);

  return (
    <TouchableOpacity
      activeOpacity={props.editMode ? 0.5 : 1.0}
      onLongPress={() => { if (props.editMode) { triggerDrag(); } }}
      style={{flexDirection:'row'}}
    >
      <SlideSideFadeInView visible={dragging} width={40} />
      <BlurEntry {...props} />
    </TouchableOpacity>
  );
}


export function BlurEntry(props: BlurEntryProps) {
  return (
    <BlurView
      blurType={"light"}
      blurAmount={5}
      style={{
        flexDirection:'row',
        height: 70,
        flex:1,
        backgroundColor: colors.white.rgba(0.4),
        marginHorizontal: 12,
        marginBottom: 12,
        borderRadius: SceneConstants.roundness,
        alignItems:'center',
        paddingLeft: 15,
      }}>
      { renderPropItem(props.iconItem,props) }
      <View style={{ flex:1}}>
        { renderPropItem(props.paddingItem, props) }
        {
          typeof props.title === 'string' ?
            <Text style={{...rowstyles.title, paddingLeft:15}}>{props.title}</Text> :
            renderPropItem(props.title, props)
        }
        { renderPropItem(props.labelItem, props) }
      </View>
      {
        props.settings !== false && (
          <SlideSideFadeInView visible={props.editMode} width={60}>
            <SettingsIconRight style={{height: 55}} onPress={() => {
              props.editSettingsCallback();
            }}/>
          </SlideSideFadeInView>
        )
      }
      { renderPropItem(props.control, props) }
    </BlurView>
  );
}



export function renderPropItem(item: ReactHOC | React.ComponentElement<any, any> | undefined, props: any) : React.ComponentElement<any, any> | undefined {
  if (!item) { return; }
  if (typeof item === 'object')   { return item; }
  if (typeof item === 'function') { return item(props); }
  return item;
}

