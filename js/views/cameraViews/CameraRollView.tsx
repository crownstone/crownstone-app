
import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("CameraRollView", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import { NavigationUtil } from "../../util/NavigationUtil";
import { TopBarUtil } from "../../util/TopBarUtil";
import CameraRollPicker from 'react-native-camera-roll-picker';


export class CameraRollView extends Component<any, any> {
  static options(props) {
    return TopBarUtil.getOptions({title:  lang('Choose_a_Picture'), closeModal: true});
  }

  selected = false;

  render() {
   return (
     <CameraRollPicker
       callback={(x) => {
         // avoid double presses and wrong input.
         if (x && Array.isArray(x) && x.length > 0 && x[0] && x[0].uri) {
           if (this.selected === false) {
             this.selected = true;
             this.props.selectCallback(x[0].uri);
             NavigationUtil.back();
           }
         }
       }}
       selectSingleItem={true}
       groupTypes={"All"}
       imageMargin={2}
       imagesPerRow={4}
     />
   )
  }
}
