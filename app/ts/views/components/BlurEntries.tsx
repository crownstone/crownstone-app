import * as React from "react";

import { DraggableProps, useDraggable } from "./hooks/draggableHooks";
import { Text, TouchableOpacity, View } from "react-native";
import { SlideSideFadeInView }          from "./animated/SlideFadeInView";
import { BlurView }                     from "@react-native-community/blur";
import {appStyleConstants, colors, rowstyles, screenWidth, styles} from "../styles";
import {DevIconRight, SettingsIconRight} from "./EditIcon";
import { DataUtil } from "../../util/DataUtil";

type ReactHOC = (props) => React.ComponentElement<any, any>

export interface BlurEntryProps {
  dimMode?:  boolean,
  editMode?: boolean,

  settings?: boolean,
  settingsItem?:  ReactHOC | React.ComponentElement<any, any>,

  title:          ReactHOC | React.ComponentElement<any, any> | string,
  iconItem?:      ReactHOC | React.ComponentElement<any, any>,
  paddingItem?:   ReactHOC | React.ComponentElement<any, any>,
  control?:       ReactHOC | React.ComponentElement<any, any>,
  labelItem?:     ReactHOC | React.ComponentElement<any, any>,

  heightOffset?:  number,

  titleColor?:      string,
  backgroundColor?: string,
  opacity?:         number,

  editSettingsCallback?: () => void
}


export interface TappableBlurEntryProps extends BlurEntryProps, BlurEntryProps {
  tapCallback?         : () => void
  tapSettingsCallback? : () => void
  longPressCallback?   : () => void
  longPressSettingsCallback? : () => void
}


interface DraggableBlurEntryProps extends DraggableProps, BlurEntryProps {
  tapCallback?         : () => void
  tapSettingsCallback? : () => void
  longPressCallback?   : () => void
}


export function DraggableBlurEntry(props: DraggableBlurEntryProps) {
  // include draggable
  let {dragging, triggerDrag} = useDraggable(props.isBeingDragged, props.eventBus, props.dragAction);

  let editOpacity = 0.5;
  let opacity = props.tapCallback ? 0.5 : 1;
  return (
    <TouchableOpacity
      activeOpacity={props.editMode ? editOpacity : opacity}
      onLongPress={() => { if (props.editMode) { triggerDrag(); } else if (props.longPressCallback) { props.longPressCallback(); }}}
      onPress={() => { if (props.tapCallback) {
        if (props.editMode && props.tapSettingsCallback) {
          props.tapSettingsCallback();
        }
        else {
          props.tapCallback();
        }
      }}}
      style={{flexDirection:'row'}}
    >
      <SlideSideFadeInView visible={dragging} width={40} />
      <BlurEntry {...props} />
    </TouchableOpacity>
  );
}


export function TappableBlurEntry(props: TappableBlurEntryProps) {
  return (
    <TouchableOpacity
      activeOpacity={ props.tapCallback || props.editMode && (props.tapSettingsCallback) ? 0.3 : 1.0 }
      onLongPress={() => {
        if (props.editMode && props.longPressSettingsCallback) {
          props.longPressSettingsCallback();
        }
        else if (props.longPressCallback) {
          props.longPressCallback();
        }}}
      onPress={() => {
        if (props.editMode && props.tapSettingsCallback) {
          props.tapSettingsCallback();
        }
        else if (props.tapCallback) {
          props.tapCallback();
        }
      }}
      style={{flex:1}}
    >
      <BlurEntry {...props} />
    </TouchableOpacity>
  );
}

export function BlurEntry(props: BlurEntryProps) {
  return (
    <BlurView
      blurType={"light"}
      blurAmount={8}
      style={{
        flexDirection:'row',
        height: 70 + (props.heightOffset ?? 0),
        flex:1,
        backgroundColor: props.backgroundColor ?? colors.white.rgba(0.5),
        marginHorizontal: 12,
        marginBottom: 12,
        borderRadius: appStyleConstants.roundness,
        alignItems:'center',
        paddingLeft: 15,
        opacity: props.opacity ?? 1
      }}>
      { renderPropItem(props.iconItem,props) }
      <View style={{ flex:1 }}>
        { renderPropItem(props.paddingItem, props) }
        {
          typeof props.title === 'string' ?
            <Text style={{...rowstyles.title, color: props.titleColor ?? rowstyles.title.color, paddingLeft:15}}>{props.title}</Text> :
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
  let isDeveloper = DataUtil.isDeveloper();
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
        borderWidth: 1,
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
