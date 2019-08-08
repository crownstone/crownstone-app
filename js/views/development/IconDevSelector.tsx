import * as React from 'react'; import { Component } from 'react';
import {
  ScrollView,
  View
} from 'react-native';

import { Background }  from '../components/Background'
import {colors, screenWidth} from "../styles";

import { NavigationUtil } from "../../util/NavigationUtil";
import { core } from "../../core";
import { TopBarUtil } from "../../util/TopBarUtil";
import { LiveComponent } from "../LiveComponent";
import { DevIconSelection } from "./DevIconSelection";
import {
  glyphMap_flaticon_custom_selection_1,
  glyphMap_flaticon_essentials,
  glyphMap_flaticon_household
} from "../../fonts/customIcons_flaticon";




let categories = [
  {key: '__new',         label: "__new"     },
  {key: 'selected',      label: 'selected', },
  {key: 'hidden',        label: 'hidden',   },
];

/*
Lights

'fiCS1-bar',
'fiCS1-chandelier',
'fiCS1-chandelier-1',
'fiCS1-chandeliers',
'fiCS1-desk',
'fiCS1-desk-1',
'fiCS1-desk-lamp',
'fiCS1-desk-lamp-1',
'fiCS1-desk-lamp-2',
'fiCS1-dining-table',
'fiCS1-flame',
'fiCS1-flashlight',
'fiCS1-floor',
'fiCS1-floor-1',
'fiCS1-floor-2',
'fiCS1-floor-3',
'fiCS1-furniture-and-household',
'fiCS1-furniture-and-household-1',
'fiCS1-furniture-and-household-2',
'fiCS1-furniture-and-household-3',
'fiCS1-furniture-and-household-4',
'fiCS1-furniture-and-household-5',
'fiCS1-furniture-and-household-6',
'fiCS1-furniture-and-household-7',
'fiCS1-furniture-and-household-8',
'fiCS1-furniture-and-household-9',
'fiCS1-furniture-and-household-10',
'fiCS1-furniture-and-household-11',
'fiCS1-furniture-and-household-13',
'fiCS1-furniture-and-household-14',
'fiCS1-furniture-and-household-15',
'fiCS1-idea',
'fiCS1-illuminated',
'fiCS1-indoor',
'fiCS1-invention',
'fiCS1-lamp',
'fiCS1-lamp-1',
'fiCS1-lamp-2',
'fiCS1-lamp-3',
'fiCS1-lamp-4',
'fiCS1-lamp-5',
'fiCS1-lamp-6',
'fiCS1-lamp-7',
'fiCS1-lamp-8',
'fiCS1-lamp-9',
'fiCS1-lamp-10',
'fiCS1-lamp-11',
'fiCS1-lamp-12',
'fiCS1-lamp-13',
'fiCS1-lamp-14',
'fiCS1-lamp-15',
'fiCS1-lamp-16',
'fiCS1-lamp-17',
'fiCS1-lamp-18',
'fiCS1-lamp-19',
'fiCS1-lamp-20',
'fiCS1-lamp-21',
'fiCS1-lamp-22',
'fiCS1-lamp-23',
'fiCS1-lamp-24',
'fiCS1-lamppost',
'fiCS1-lamps',
'fiCS1-light',
'fiCS1-light-1',
'fiCS1-light-2',
'fiCS1-light-3',
'fiCS1-light-4',
'fiCS1-light-5',
'fiCS1-light-6',
'fiCS1-light-bulb',
'fiCS1-lightbulb',
'fiCS1-living-room',
'fiCS1-living-room-1',
'fiCS1-night-stand',
'fiCS1-spotlight',
'fiCS1-spotlight-1',
'fiCS1-spotlight-2',
'fiCS1-stage',
'fiCS1-street-lamp',
'fiCS1-street-lamp-1',
'fiCS1-street-lamp-2',
'fiCS1-street-lamp-3',
'fiCS1-streetlight',
'fiCS1-table-lamp',
'fiE-idea',
 */

export class IconDevSelector extends LiveComponent<{callback(icon: string) : void, icon: string, backgrounds: any}, any> {
  static options(props) {
    return TopBarUtil.getOptions({title:  "Pick an Icon", closeModal: true});
  }

  c1Maps = {};
  chunks = 1;

  constructor(props) {
    super(props);

    this.chunks = props.chunks || 1;
  }

  render() {
    let icons = {
      __new: Object.keys(glyphMap_flaticon_household),
      selected: [],
      hidden:   [],
    }

    return (
      <Background fullScreen={true} image={core.background.detailsDark} hideOrangeBar={true}>
        <View style={{backgroundColor: colors.csOrange.hex, height:2, width:screenWidth}} />
        <ScrollView>
          <DevIconSelection
            categories={categories}
            icons={icons}
            selectedIcon={this.props.icon}
            debug={true}
            offsets={{}}
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
