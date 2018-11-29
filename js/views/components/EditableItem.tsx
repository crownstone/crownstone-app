
import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("EditableItem", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  
  Dimensions,
  PixelRatio,
  Text,
  View
} from 'react-native';

import { ButtonBar }         from './editComponents/ButtonBar'
import { CheckBar }          from './editComponents/CheckBar'
import { Dropdown }          from './editComponents/Dropdown'
import { DeletableEntry }    from "./editComponents/DeletableEntry";
import { EditSpacer }        from './editComponents/EditSpacer'
import { Explanation }       from './editComponents/Explanation'
import { LargeExplanation }  from "./editComponents/LargeExplanation";
import { IconEdit }          from './editComponents/IconEdit'
import { InfoBar }           from './editComponents/InfoBar'
import { NavigationBar }     from './editComponents/NavigationBar'
import { PictureEdit }       from './editComponents/PictureEdit'
import { SliderBar }         from './editComponents/SliderBar'
import { OptionalSwitchBar } from './editComponents/OptionalSwitchBar'
import { SwitchBar }         from './editComponents/SwitchBar'
import { TextEditBar }       from './editComponents/TextEditBar'
import { TimePicker }        from './editComponents/TimePicker'
import { TextBlob }          from "./editComponents/TextBlob";

import {styles, colors, NORMAL_ROW_SIZE, LARGE_ROW_SIZE, EXTRA_LARGE_ROW_SIZE} from '../styles'
import {CollapsableBar} from "./editComponents/Collapsable";


/**
 *
 * This module offers the following types:

 * button - Just a text which acts like a button (modeled after iOS Delete contact button)
     --> {label: field label, callback: callback to store changes}

 * checkbar - Just a text which acts like a button (modeled after iOS Delete contact button)
     --> {label: field label, value: boolean, callback: (newValue) => {}}

 * collapsable - Just a text which acts like a button (modeled after iOS Delete contact button)
     --> {label: field label, content: string, contentHeight: number}

 * explanation - Text above or below an editable item with padding.
     --> {label: text, below: boolean, style: style object to overrule explanation style}

 * lightExplanation - Text above or below an editable item with padding.
     --> {label: text, below: boolean, style: style object to overrule explanation style}

 * largeExplanation - Text above or below an editable item with padding.
     --> {label: text, below: boolean, style: style object to overrule explanation style}

 * icon - Trigger to change the icon
     --> {label: field label, value: iconName, callback: (newValue) => {}}

 * info - looks the same as a navigation bar except it does not have the forward icon nor can you click on it.
    --> {
     largeIcon: RN object to be in front of the label,
     icon: RN object to be in front of the label,
     label: field label,
     value: text,
     valueStyle: style object to overrule value style,
     labelStyle: style object to overrule label style
   }
 * navigation - text with an > for navigation in a menu. The value and valueStyle is optional
     --> {
     largeIcon: RN object to be in front of the label,
     icon: RN object to be in front of the label,
     label: field label,
     value: text,
     callback: (newValue) => {},
     valueStyle: style object to overrule value style,
     labelStyle: style object to overrule label style
   }

 * picture - Trigger to remove a picture or add one
     --> {label: field label, value: pictureURI, callback: (newValue) => {}}

 * slider - slider control with optional label
     --> {label: field label, value: boolean, callback: (newValue) => {}}

 * spacer - Empty space to separate editable items.
     --> {}

 * optionalSwitch - native boolean switch with a cancel button
 --> {label: field label, value: boolean, callback: (newValue) => {}}

 * switch - native boolean switch
     --> {label: field label, value: boolean, callback: (newValue) => {}}

 * textEdit - TextEdit field
     --> {label: field label, value: text, callback: (newValue) => {}}

 */
export class EditableItem extends Component<any, any> {
  render() {

    if (this.props.__item !== undefined) {
      return this.props.__item;
    }

    switch (this.props.type) {
      case 'button':
        return <ButtonBar barHeight={NORMAL_ROW_SIZE} {...this.props} />;
      case 'checkbar':
        return <CheckBar barHeight={NORMAL_ROW_SIZE} {...this.props} />;
      case 'collapsable':
        return <CollapsableBar barHeight={NORMAL_ROW_SIZE} {...this.props} />;
      case 'dropdown':
        return <Dropdown barHeight={NORMAL_ROW_SIZE} {...this.props} />;
      case 'deletableEntry':
        return <DeletableEntry barHeight={NORMAL_ROW_SIZE} {...this.props} />;
      case 'explanation':
        return <Explanation text={this.props.label} {...this.props} />;
      case 'lightExplanation':
        return <Explanation text={this.props.label} {...this.props} color={colors.white.hex} />;
      case 'largeExplanation':
        return <LargeExplanation text={this.props.label} {...this.props} />;
      case 'largeLightExplanation':
        return <LargeExplanation text={this.props.label} {...this.props} color={colors.white.hex} />;
      case 'icon':
        return <IconEdit barHeightLarge={EXTRA_LARGE_ROW_SIZE} {...this.props} />;
      case 'info':
        return <InfoBar barHeight={NORMAL_ROW_SIZE} {...this.props} />;
      case 'disabledInfo':
        return <InfoBar barHeight={NORMAL_ROW_SIZE} {...this.props} style={[this.props.style, {color: colors.darkGray2.hex }]} />;
      case 'navigation':
        return <NavigationBar barHeight={NORMAL_ROW_SIZE} {...this.props} />;
      case 'picture':
        return <PictureEdit barHeightLarge={EXTRA_LARGE_ROW_SIZE} {...this.props} />;
      case 'optionalSwitch':
        return <OptionalSwitchBar barHeight={NORMAL_ROW_SIZE} {...this.props} />;
      case 'switch':
        return <SwitchBar barHeight={NORMAL_ROW_SIZE} {...this.props} />;
      case 'slider':
        return <SliderBar barHeight={NORMAL_ROW_SIZE} {...this.props} />;
      case 'spacer':
        return <EditSpacer {...this.props} />;
      case 'textEdit':
        return <TextEditBar barHeight={NORMAL_ROW_SIZE} {...this.props} />;
      case 'textBlob':
        return <TextBlob barHeight={NORMAL_ROW_SIZE} {...this.props} />;
      case 'timePicker':
        return <TimePicker barHeight={NORMAL_ROW_SIZE} {...this.props} />;
      default:
        return (
          <View>
            <View style={[styles.listView, {NORMAL_ROW_SIZE, flex:1} ]}>
              <Text>{ lang("___UNHANDLED_for_",this.props.label,this.props.type) }</Text>
            </View>
          </View>
        );
    }
  }
}
