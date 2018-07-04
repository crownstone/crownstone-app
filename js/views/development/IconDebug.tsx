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
import {DebugIconSelection} from "./DebugIconSelection";

const Actions = require('react-native-router-flux').Actions;

export class IconDebug extends Component<{callback(icon: string) : void, icon: string, backgrounds: any}, any> {
  static navigationOptions = ({ navigation }) => {
    return {
      title: "Pick an Icon",
    }
  };

  c1Maps = {}
  iconCorrectionsMap = {}
  chunks = 10;

  constructor(props) {
    super(props);

    this.chunks = props.chunks || 10;

    let c1Glyphs = Object.keys(glyphMapC1);

    let stepSize = Math.floor(c1Glyphs.length / this.chunks);
    this.iconCorrectionsMap = {
      ...iconCorrections,
      'ionicons-ios': iconCorrections.ionicons,
      'ionicons-md': iconCorrections.ionicons,
    }

    for (let i = 0; i < this.chunks; i++) {
      this.iconCorrectionsMap['c1_'+i] = iconCorrections.c1;
      this.c1Maps[i] = [];
      if (i < this.chunks-1) {
        for (let j = i*stepSize; j < (i+1)*stepSize; j++) {
          this.c1Maps[i].push(c1Glyphs[j])
        }
      }
      else {
        for (let j = i*stepSize; j < c1Glyphs.length; j++) {
          this.c1Maps[i].push(c1Glyphs[j])
        }
      }
    }
  }

  render() {
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
      "ios-eye-off",
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
      "md-eye",
      "md-eye-off",
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

    let categories = [];
    let icons = {}
    for (let i = 0; i < this.chunks; i++) {
      categories.push({key: 'c1_' + i, label:'c1 part '+i})
      icons['c1_' + i] = this.c1Maps[i]
    }
    categories.push({key: 'c2', label: 'c2'})
    categories.push({key: 'c3', label: 'c3'})
    categories.push({key: 'ionicons-ios', label: 'ionicons-ios'})
    categories.push({key: 'ionicons-md',  label: 'ionicons-md'})

    icons['c2'] = Object.keys(glyphMapC2);
    icons['c3'] = Object.keys(glyphMapC3);
    icons['ionicons-ios'] = ioniconsIosList;
    icons['ionicons-md']  = ioniconsMdList;

    return (
      <Background hasNavBar={false} image={this.props.backgrounds.detailsDark}>
        <View style={{backgroundColor: colors.csOrange.hex, height:2, width:screenWidth}} />
        <ScrollView>
          <DebugIconSelection
            categories={categories}
            icons={icons}
            offsets={this.iconCorrectionsMap}
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
