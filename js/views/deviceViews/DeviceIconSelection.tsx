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
import { TopBar }  from '../components/Topbar'
import { IconSelection }  from '../components/IconSelection'
const Actions = require('react-native-router-flux').Actions;


let categories = [
  {key: 'lights', label: 'Lights'},
  {key: 'tech', label: 'Tech'},
  {key: 'furniture', label: 'Furniture'},
  {key: 'bathroom', label: 'Bathroom'},
  {key: 'office', label: 'Office'},
  {key: 'bedRoom', label: 'Bedroom'},
  {key: 'tools', label: 'Tools'},
  {key: 'kitchen', label: 'Kitchen'},
  {key: 'outside', label: 'Outside'},
  {key: 'rides', label: 'Rides'},
  {key: 'miscellaneous', label: 'Miscellaneous'},
];

let listOfIcons = {
  lights: [
    'c1-lamp1',
    'c1-lamp2',
    'c1-lamp3',
    'c1-lamp5',
    'c1-lamp6',
    'c1-lamp7',
    'c1-bulb',
    'c1-studiolight',
    'c1-desklamp',
    'c1-light1',
    'c1-standingLamp',
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
  ],
  tools: [
    'c1-drill1',
    'c1-powerSaw',
    'c1-grinder',
    'c1-drill2',
    'c1-circularSaw',
  ],
  tech: [
    'c1-hdd1',
    'c1-hdd2',
    'c1-transmitHdd',
    'c1-musicPlayer',
    'c1-controller1',
    'c1-console',
    'c1-controller2',
    'c1-controller3',
    'c1-controller4',
    'c1-scanner',
    'c1-scanner2',
    'c1-dvd',
    'c1-appleLogo',
    'c1-laptop',
    'c1-speaker2',
    'c1-speaker',
    'c1-fan2',
    'c1-pc',
    'c1-printer',
    'c1-lab',
    'c1-microscope',
    'c1-atom',
    'c1-recycler',
    'c1-nuclear',
    'c1-projector',
    'c1-monitor',
    'c1-tv',
    'c1-tv1',
    'c1-socket',
    'c1-socket2',
  ],
  office: [
    'c1-archive',
    'c1-fan',
    'c1-alarm1',
    'c1-alarm2',
    'c1-airco',
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
    'c1-cleaver',
    'c1-coffeepot',
    'c1-coffee3',
    'c1-coffeemachine',
    'c1-coffee4',
    'c1-coffeebean',
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
  ]
};

export class DeviceIconSelection extends Component<any, any> {
  render() {
    const store   = this.props.store;
    const state   = store.getState();
    const selectedIcon = this.props.icon || state.spheres[this.props.sphereId].appliances[this.props.applianceId].config.icon;

    return (
      <Background hideInterface={true} image={this.props.backgrounds.main}>
        <TopBar
          left={"Back"}
          leftAction={Actions.pop}
          title="Pick an Icon"/>
        <ScrollView>
          <IconSelection
            categories={categories}
            icons={listOfIcons}
            selectedIcon={selectedIcon}
            callback={
            this.props.selectCallback !== undefined ?
              this.props.selectCallback :
              (newIcon) => {
                store.dispatch({type:'UPDATE_APPLIANCE_CONFIG', sphereId: this.props.sphereId, applianceId: this.props.applianceId, data:{icon: newIcon}});
                Actions.pop();
              }}
          />
        </ScrollView>
      </Background>
    );
  }
}
