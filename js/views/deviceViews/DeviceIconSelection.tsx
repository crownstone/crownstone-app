
import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("DeviceIconSelection", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  ScrollView} from 'react-native';

import { Background }  from '../components/Background'
import { IconSelection }  from '../components/IconSelection'
import { NavigationUtil } from "../../util/NavigationUtil";
import { core } from "../../core";
import { TopbarBackButton } from "../components/topbar/TopbarButton";
import { TopBarUtil } from "../../util/TopBarUtil";
import { LiveComponent } from "../LiveComponent";





let categories = [
  // {key: '__new', label: lang("__new")},
  {key: 'lights', label: lang("Lights")},
  {key: 'tech', label: lang("Tech")},
  {key: 'furniture', label: lang("Furniture")},
  {key: 'bathroom', label: lang("Bathroom")},
  {key: 'office', label: lang("Office")},
  {key: 'bedRoom', label: lang("Bedroom")},
  {key: 'tools', label: lang("Tools")},
  {key: 'kitchen', label: lang("Kitchen")},
  {key: 'outside', label: lang("Outside")},
  {key: 'rides', label: lang("Rides")},
  {key: 'miscellaneous', label: lang("Miscellaneous")},
];

let listOfIcons = {
  lights: [
    'c1-christmasLights',
    'c1-deskLight',
    'c1-lamp1',
    'c1-lamp2',
    'c1-lamp3',
    'c1-lamp5',
    'c1-lamp6',
    'c1-lamp7',
    'c1-bulb',
    'c1-studiolight',
    'c1-desklamp',
    'c1-standingLamp',
    'c1-theaterLight',
  ],
  miscellaneous: [
    'c1-chatBubbles',
    'c1-people',
    'c1-pool',
    'c1-crosshairs',
    'c1-crosshairsPin',
    'c1-Pin',
    'c1-skull',
    'c1-xmastree',
    'c1-house',
    'c1-safety-pin',
    'c1-wheel-barrow',
    'c1-squiggly',
    'c1-stars',
    'c1-wheel-barrow-lines',
    'c1-massage',
    'c1-weights',
    'c1-cinema',
    'c1-fireplace',
    'c1-curtains',
    'c1-nuclear-circle',
    'c1-meditation',
    'c1-makeupTable',
    'c1-iron1',
    'c1-musicNote',
    'c1-musicCompose',
    'c1-dance2',
    'c1-movieCamera',
    'c1-band',
    'c1-drums',
    'c1-musicalNotes',
    'c1-mannequin',
    'c1-radiator',
    'c1-thermometer',
    'c1-wheelchair2',
    'c1-recordPlayer',
    'c1-waterSensor',
    'c1-windSensor',
  ],
  tools: [
    'c1-drill1',
    'c1-powerSaw',
    'c1-grinder',
    'c1-drill2',
    'c1-circularSaw',
    'c1-hammer',
  ],
  tech: [
    'c1-console',
    'c1-controller1',
    'c1-controller2',
    'c1-controller3',
    'c1-controller4',
    'c1-dvd',
    'c1-fan2',
    'c1-lab',
    'c1-microscope',
    'c1-atom',
    'c1-recycler',
    'c1-nuclear',
    'c1-appleLogo',
    'c1-projector',
    'c1-tv',
    'c1-tv1',
    'c1-tv2',
    'c1-socket',
    'c1-socket2',
    'c1-vacuum',
    'c1-vacuum2',
    'c1-robot',
    'c1-wifiLogo',
    'c1-router',
    'c1-musicPlayer',
    'c1-speakers1',
    'c1-speakers3',
    'c1-speaker2',
    'c1-speaker',
  ],
  office: [
    'c1-scanner',
    'c1-scanner2',
    'c1-hdd1',
    'c1-hdd2',
    'c1-transmitHdd',
    'c1-laptop',
    'c1-screen',
    'c1-computer',
    'c1-pc',
    'c1-printer',
    'c1-monitor',
    'c1-archive',
    'c1-fan',
    'c1-alarm1',
    'c1-alarm2',
    'c1-airco',
    'c1-airco2',
    'c1-alarmClock',
    'c1-cube1',
    'c1-cube2',
  ],
  bedRoom: [
    'c1-shirt1',
    'c1-weight',
    'c1-shirt2',
    'c1-shirt3',
    'c1-iron',
    'c1-speechbubble',
    'c1-bedOnWheels',
    'c1-baby',
    'c1-babyCarriage',
  ],
  kitchen: [
    'c1-foodWine',
    'c1-blender1',
    'c1-blender2',
    'c1-blender3',
    'c1-fridge',
    'c1-fridge2',
    'c1-fridge3',
    'c1-fridge4',
    'c1-inductionCooker',
    'c1-forkKnife',
    'c1-cocktailGlass1',
    'c1-drink',
    'c1-boiler',
    'c1-coffee1',
    'c1-plate',
    'c1-beer',
    'c1-cocktailGlass2',
    'c1-blender4',
    'c1-dinnerbulb',
    'c1-plate2',
    'c1-coffee2',
    'c1-soup',
    'c1-oven',
    'c1-oven2',
    'c1-oven3',
    'c1-cleaver',
    'c1-coffeepot',
    'c1-coffee3',
    'c1-coffeemachine',
    'c1-coffee4',
    'c1-coffeebean',
    'c1-mixer',
    'c1-toaster',
    'c1-exhaustHood',
    'c1-exhaustHood2',
    'c1-microwave',
  ],
  rides: [
    'c1-car1',
    'c1-bike',
    'c1-motorbike',
  ],
  furniture: [
    'c1-stellingkast',
    'c1-chillChair1',
    'c1-chillChair2',
    'c1-portrait',
    'c1-closet1',
    'c1-closet2',
    'c1-closet3',
    'c1-desk',
    'c1-bed',
    'c1-tvSetup',
    'c1-rockingChair',
    'c1-bunkBeds',
    'c1-officeChair',
    'c1-tvSetup2',
    'c1-computerDesk',
    'c1-cupboard',
    'c1-couch',
    'c1-chair',
    'c1-bookshelf',
    'c1-bed-couch',
  ],
  outside: [
    'c1-cat',
    'c1-horse',
    'c1-frost1',
    'c1-frost2',
    'c1-rain1',
    'c1-fire1',
    'c1-weather1',
    'c1-tree',
    'c1-sun',
    'c1-sunrise',
    'c1-leaf',
    'c1-plant',
    'c1-droplet',
    'c1-tree-pot',
    'c1-arrow-target',
    'c1-garage',
  ],
  bathroom: [
    'c1-sink1',
    'c1-sink2',
    'c1-sink3',
    'c1-sink4',
    'c1-washingMachine',
    'c1-toiletPaper',
    'c1-toiletroll2',
    'c1-showertub',
    'c1-washingmachine2',
    'c1-wcsign',
    'c1-swimming-circle',
    'c1-medicine',
    'c1-testtube',
    'c1-medicine-bottle',
    'c1-wheel-chair',
    'c1-hairDryer',
    'c1-hairIron',
    'c1-hairIron2',
    'c1-hairCurler',
    'c1-iron2',
    'c1-shaver1',
    'c1-shaver2',
    'c1-toothbrush',
  ],
  // __new: []
};

export const getRandomDeviceIcon = function() {
  let keys = Object.keys(listOfIcons);
  let index = Math.floor(Math.random()*keys.length);
  let set = listOfIcons[keys[index]];
  return set[Math.floor(Math.random()*set.length)]
}

export class DeviceIconSelection extends LiveComponent<{callback(icon: string) : void, icon: string, backgrounds: any}, any> {
  static options(props) {
    return TopBarUtil.getOptions({title:  lang("Pick_an_Icon"), closeModal: true });
  }

  constructor(props) {
    super(props)
  }

  render() {
    return (
      <Background hasNavBar={false} image={core.background.detailsDark}>
        <ScrollView>
          <IconSelection
            categories={categories}
            icons={listOfIcons}
            selectedIcon={this.props.icon}
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