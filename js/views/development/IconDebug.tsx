import * as React from 'react'; import { Component } from 'react';
import {
  Dimensions,
  Image,
  PixelRatio,
  TouchableHighlight,
  ScrollView,
  Text,
  View
} from 'react-native';

import { Background }  from '../components/Background'
import { IconSelection }  from '../components/IconSelection'
import {colors, screenWidth} from "../styles";
import {BackAction} from "../../util/Back";
import {glyphMapC1, glyphMapC2, glyphMapC3} from "../../fonts/customIcons";
import {iconCorrections} from "../../fonts/iconCorrections";

const Actions = require('react-native-router-flux').Actions;

let ioniconsIosList = [
  "ios-add-circle",
  "ios-analytics",
  "ios-arrow-back",
  "ios-arrow-down",
  "ios-arrow-dropdown",
  "ios-arrow-forward",
  "ios-battery-full",
  "ios-bluetooth",
  "ios-body",
  "ios-bug",
  "ios-build",
  "ios-camera-outline",
  "ios-checkmark",
  "ios-checkmark-circle",
  "ios-clock",
  "ios-close-circle",
  "ios-cloud",
  "ios-cloudy",
  "ios-cloudy-night",
  "ios-cog",
  "ios-contact",
  "ios-create",
  "ios-cut",
  "ios-document",
  "ios-eye",
  "ios-flash",
  "ios-flask",
  "ios-heart",
  "ios-help-circle",
  "ios-home",
  "ios-leaf",
  "ios-mail",
  "ios-navigate",
  "ios-nuclear",
  "ios-options",
  "ios-outlet-outline",
  "ios-people",
  "ios-phone-portrait",
  "ios-pin",
  "ios-pin-outline",
  "ios-remove-circle-outline",
  "ios-sad",
  "ios-settings",
  "ios-sunny",
  "ios-trash",
  "ios-warning",
]


let ioniconsMdList = [
  "md-add",
  "md-add-circle",
  "md-arrow-back",
  "md-book",
  "md-bulb",
  "md-checkmark",
  "md-clipboard",
  "md-close",
  "md-close-circle",
  "md-cloud-done",
  "md-cloud-download",
  "md-code-working",
  "md-color-wand",
  "md-create",
  "md-cube",
  "md-exit",
  "md-flask",
  "md-git-network",
  "md-help-circle",
  "md-information-circle",
  "md-lock",
  "md-log-in",
  "md-log-out",
  "md-mail",
  "md-menu",
  "md-pin",
  "md-power",
  "md-refresh-circle",
  "md-remove",
  "md-remove-circle",
  "md-share",
  "md-sync",
  "md-time",
  "md-trash",
  "md-unlock"
]

export class IconDebug extends Component<{callback(icon: string) : void, icon: string, backgrounds: any}, any> {
  static navigationOptions = ({ navigation }) => {
    return {
      title: "Pick an Icon",
    }
  };

  constructor(props) {
    super(props)
  }

  render() {
    let iconCorrectionsMap = {
      ...iconCorrections,
      'ionicons-ios': iconCorrections.ionicons,
      'ionicons-md': iconCorrections.ionicons,
    }


    return (
      <Background hasNavBar={false} image={this.props.backgrounds.detailsDark}>
        <View style={{backgroundColor: colors.csOrange.hex, height:2, width:screenWidth}} />
        <ScrollView>
          <IconSelection
            categories={[
              {key: 'c1', label: 'c1'},
              {key: 'c2', label: 'c2'},
              {key: 'c3', label: 'c3'},
              {key: 'ionicons-ios',  label: 'ionicons-ios'},
              {key: 'ionicons-md',  label: 'ionicons-md'},
              // {key: 'evilIcons', label: 'evilIcons'},
            ]}
            icons={{
              c1: Object.keys(glyphMapC1),
              c2: Object.keys(glyphMapC2),
              c3: Object.keys(glyphMapC3),
              "ionicons-ios": ioniconsIosList,
              "ionicons-md": ioniconsMdList,
            }}
            offsets={iconCorrectionsMap}
            selectedIcon={this.props.icon}
            debug={true}
            callback={(newIcon) => {
              this.props.callback(newIcon);
              BackAction();
            }}
          />
        </ScrollView>
      </Background>
    );
  }
}
