import * as React from 'react'; import { Component } from 'react';
import {
  ScrollView,
  View
} from 'react-native';

import { Background }  from '../components/Background'
import { background, colors, screenWidth } from "../styles";

import {glyphMapC1, glyphMapC2, glyphMapC3} from "../../fonts/customIcons";
import {iconCorrections} from "../../fonts/iconCorrections";
import {DebugIconSelection} from "./DebugIconSelection";
import { NavigationUtil } from "../../util/NavigationUtil";
import { core } from "../../Core";
import { TopBarUtil } from "../../util/TopBarUtil";
import { LiveComponent } from "../LiveComponent";
import { AnimatedBackground } from "../components/animated/AnimatedBackground";
import {
  glyphMap_flaticon_custom_selection_1,
  glyphMap_flaticon_essentials,
  glyphMap_flaticon_household
} from "../../fonts/customIcons_flaticon";

const ioniconsIosList = [
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
  "ios-link",
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
  "ios-more",
  "ios-wifi",
  "ios-fastforward",
];
const ioniconsMdList = [
  "md-arrow-dropright",
  "md-analytics",
  "md-switch",
  "md-add",
  "md-add-circle",
  "md-arrow-back",
  "md-arrow-round-down",
  "md-arrow-down",
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
  "md-unlock",
  "md-wifi",
];

const MAX_NUMBER_SHOWN = 60;

export class IconDebug extends LiveComponent<{callback(icon: string) : void, icon: string, backgrounds: any}, any> {
  static options(props) {
    return TopBarUtil.getOptions({title:  "Pick an Icon", closeModal: true});
  }

  iconCorrectionsMap = {};
  categories = [];
  icons = {};

  constructor(props) {
    super(props);

    this.iconCorrectionsMap = {
      ...iconCorrections,
      'ionicons-ios': iconCorrections.ionicons,
      'ionicons-md': iconCorrections.ionicons,
    };

    this._createIconItem('c1','c1', glyphMapC1);
    this._createIconItem('c2','c2', glyphMapC2);
    this._createIconItem('c3','c3', glyphMapC3);
    this._createIconItem('ionicons-ios','ionicons-ios', ioniconsIosList)
    this._createIconItem('ionicons-md', 'ionicons-md',  ioniconsMdList)
    this._createIconItem('fiCS1','flatIcon custom 1',   glyphMap_flaticon_custom_selection_1);
    this._createIconItem('fiHS', 'flatIcon household',  glyphMap_flaticon_household         );
    this._createIconItem('fiE',  'flatIcon essentials', glyphMap_flaticon_essentials        );

  }

  _createIconItem(key, label, glyphs) {
    let glyphArray = [];
    if (Array.isArray(glyphs)) {
      glyphArray = glyphs;
    }
    else {
      glyphArray = Object.keys(glyphs);
    }

    if (glyphArray.length > MAX_NUMBER_SHOWN) {
      let steps = Math.ceil(glyphArray.length / MAX_NUMBER_SHOWN);
      let chunkMap = [];

      let getChunkKey = (iterator) => {
        return key + "_" + iterator;
      }

      for (let i = 0; i < steps; i++) {
        let chunkKey = getChunkKey(i);
        this.iconCorrectionsMap[chunkKey] = this.iconCorrectionsMap[key];
        chunkMap[i] = [];
        if (i < steps) {
          for (let j = i*MAX_NUMBER_SHOWN; j < (i+1)*MAX_NUMBER_SHOWN; j++) {
            chunkMap[i].push(glyphArray[j])
          }
        }
        else {
          for (let j = i*MAX_NUMBER_SHOWN; j < glyphArray.length; j++) {
            chunkMap[i].push(glyphArray[j])
          }
        }
      }

      for (let i = 0; i < steps; i++) {
        let chunkKey = getChunkKey(i);
        let itemCount = MAX_NUMBER_SHOWN;
        if (i == steps-1) {
          itemCount = glyphArray.length - MAX_NUMBER_SHOWN*(steps - 1);
        }
        this.categories.push({key: chunkKey, label: label + " part " + (i + 1) + " ("+ itemCount + "i)"});
        this.icons[chunkKey] = chunkMap[i]
      }
    }
    else {
      this.categories.push({key: key, label: label});
      this.icons[key] = glyphArray;
    }
  }


  render() {
    return (
      <Background fullScreen={true} image={background.detailsDark} hideNotifications={true} hideOrangeLine={true} >
        <View style={{backgroundColor: colors.csOrange.hex, height:2, width:screenWidth}} />
        <ScrollView>
          <DebugIconSelection
            categories={this.categories}
            icons={this.icons}
            offsets={this.iconCorrectionsMap}
            selectedIcon={this.props.icon}
            debug={true}
            callback={(newIcon) => {
              this.props.callback(newIcon);
              NavigationUtil.back();
            }}
          />
        </ScrollView>
      </Background>
    );
  }
}
