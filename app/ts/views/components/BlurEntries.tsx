import * as React from "react";

import { DraggableProps, useDraggable } from "./hooks/draggableHooks";
import { Text, TouchableOpacity, View } from "react-native";
import { SlideSideFadeInView }          from "./animated/SlideFadeInView";
import { BlurView }                     from "@react-native-community/blur";
import {appStyleConstants, colors, rowstyles, screenWidth, styles} from "../styles";
import {DevIconRight, SettingsIconRight} from "./EditIcon";
import {SettingsBackground} from "./SettingsBackground";
import {core} from "../../Core";

type ReactHOC = (props) => React.ComponentElement<any, any>

interface BlurEntryProps {
  dimMode?:  boolean,
  editMode?: boolean,

  settings?: boolean,
  settingsItem?:  ReactHOC | React.ComponentElement<any, any>,

  title:        ReactHOC | React.ComponentElement<any, any> | string,
  iconItem?:    ReactHOC | React.ComponentElement<any, any>,
  paddingItem?: ReactHOC | React.ComponentElement<any, any>,
  control?:     ReactHOC | React.ComponentElement<any, any>,
  labelItem?:   ReactHOC | React.ComponentElement<any, any>,

  backgroundColor?: string,

  editSettingsCallback?: () => void
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
        backgroundColor: props.backgroundColor ?? colors.white.rgba(0.4),
        marginHorizontal: 12,
        marginBottom: 12,
        borderRadius: appStyleConstants.roundness,
        alignItems:'center',
        paddingLeft: 15,
      }}>
      { renderPropItem(props.iconItem,props) }
      <View style={{ flex:1 }}>
        { renderPropItem(props.paddingItem, props) }
        {
          typeof props.title === 'string' ?
            <Text style={{...rowstyles.title, paddingLeft:15}}>{props.title}</Text> :
            renderPropItem(props.title, props)
        }
        { renderPropItem(props.labelItem, props) }
      </View>
      {
        props.settings && props.settingsItem && renderPropItem(props.settingsItem, props) ||
        props.settings && <BlurEntrySettingsIcon visible={props.editMode} callback={props.editSettingsCallback} />
      }
      { renderPropItem(props.control, props) }
    </BlurView>
  );
}

export function BlurEntrySettingsIcon(props: {callback: () => void, visible: boolean}) {
  return (
    <SlideSideFadeInView visible={props.visible} width={60}>
      <SettingsIconRight style={{height: 55}} onPress={() => {
        props.callback();
      }}/>
    </SlideSideFadeInView>
  );
}

export function BlurEntryDevIcon(props: {callback: () => void, visible: boolean}) {
  let state = core.store.getState();
  let isDeveloper = state.user.developer;
  return (
    <SlideSideFadeInView visible={isDeveloper && props.visible} width={35}>
      <DevIconRight style={{height: 55, paddingHorizontal:4}} onPress={() => {
        props.callback();
      }}/>
    </SlideSideFadeInView>
  );
}

export function renderPropItem(item: ReactHOC | React.ComponentElement<any, any> | undefined, props: any) : React.ComponentElement<any, any> | undefined {
  if (!item) { return; }
  if (typeof item === 'object')   { return item; }
  if (typeof item === 'function') { return item(props); }
  return item;
}


export function BlurMessageBar(props) {
  return (
    <BlurView
      blurType={'light'}
      blurAmount={2}
      style={{
        ...styles.centered,
        width: props.width ?? screenWidth - 30,
        marginHorizontal:15,
        marginTop: props.marginTop,
        flexDirection:'row',
        height: props.height ?? 60,
        borderRadius: appStyleConstants.roundness,
        borderWidth: 2,
        borderColor: props.borderColor ?? colors.white.hex,
        backgroundColor: props.backgroundColor ?? colors.white.rgba(0.5)
      }}>
      {props.children}
    </BlurView>
  )
}

export function TouchableBlurMessageBar(props) {
  return (
    <TouchableOpacity onPress={props.onPress}>
      <BlurMessageBar {...props} />
    </TouchableOpacity>
  )
}
