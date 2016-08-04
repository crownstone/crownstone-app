import React, { Component } from 'react' 
import {
  
  Dimensions,
  PixelRatio,
  Text,
  View
} from 'react-native';

import { ButtonBar }      from './editComponents/ButtonBar'
import { CheckBar }       from './editComponents/CheckBar'
import { EditSpacer }     from './editComponents/EditSpacer'
import { Explanation }    from './editComponents/Explanation'
import { IconEdit }       from './editComponents/IconEdit'
import { InfoBar }        from './editComponents/InfoBar'
import { NavigationBar }  from './editComponents/NavigationBar'
import { PictureEdit }    from './editComponents/PictureEdit'
import { SliderBar }      from './editComponents/SliderBar'
import { SwitchBar }      from './editComponents/SwitchBar'
import { TextEditBar }    from './editComponents/TextEditBar'
import { TimePicker }     from './editComponents/TimePicker'

import { styles, width } from '../styles'

/**
 *
 * This module offers the following types:

 * button - Just a text which acts like a button (modeled after iOS Delete contact button)
     --> {label: field label, callback: callback to store changes}

 * checkbar - Just a text which acts like a button (modeled after iOS Delete contact button)
     --> {label: field label, value: boolean, callback: (newValue) => {}}

 * explanation - Text above or below an editable item with padding.
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

 * switch - native boolean switch
     --> {label: field label, value: boolean, callback: (newValue) => {}}

 * textEdit - TextEdit field
     --> {label: field label, value: text, callback: (newValue) => {}}

 */
export class EditableItem extends Component {

  render() {
    let pxRatio = PixelRatio.get();
    let height = 21*pxRatio;
    let heightLarge = 40*pxRatio;

    if (this.props.setActiveElement === undefined) {
      this.props.setActiveElement = () => {};
    }

    switch (this.props.type) {
      case 'button':
        return <ButtonBar barHeight={height} {...this.props} />;
      case 'checkbar':
        return <CheckBar barHeight={height} {...this.props} />;
      case 'explanation':
        return <Explanation text={this.props.label} {...this.props} />;
      case 'icon':
        return <IconEdit barHeightLarge={heightLarge} {...this.props} />;
      case 'info':
        return <InfoBar barHeight={height} {...this.props} />;
      case 'navigation':
        return <NavigationBar barHeight={height} {...this.props} />;
      case 'picture':
        return <PictureEdit barHeightLarge={heightLarge} {...this.props} />;
      case 'switch':
        return <SwitchBar barHeight={height} {...this.props} />;
      case 'slider':
        return <SliderBar barHeight={height} {...this.props} />;
      case 'spacer':
        return <EditSpacer />;
      case 'textEdit':
        return <TextEditBar barHeight={height} {...this.props} />;
      case 'timePicker':
        return <TimePicker barHeight={height} {...this.props} />;
      default:
        return (
          <View>
            <View style={[styles.listView, {height, flex:1}]}>
              <Text>{this.props.label + ' - UNHANDLED for ' + this.props.type}</Text>
            </View>
          </View>
        );
    }
  }
}
