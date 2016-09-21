import React, { Component } from 'react'
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
var Actions = require('react-native-router-flux').Actions;


let categories = [
  {key: 'livingRoom', label: 'Living Room'},
  {key: 'kitchen', label: 'Kitchen'},
  {key: 'bathroom', label: 'Bathroom'},
  {key: 'office', label: 'Office'},
  {key: 'bedRoom', label: 'Bed Room'},
  {key: 'garage', label: 'Garage'},
  {key: 'miscellaneous', label: 'Miscellaneous'},
];

let listOfIcons = {
  bathroom: [
    'c1-showertub',
    'c1-sink1',
    'c1-sink2',
    'c1-sink3',
    'c1-sink4',
    'c1-toiletroll2',
    'c1-toiletPaper',
    'c1-washingMachine',
    'c1-washingmachine2',
  ],
  kitchen:[
    'c1-foodWine',
    'c1-blender3',
    'c1-forkKnife',
    'c1-cocktailGlass1',
    'c1-drink',
    'c1-boiler',
    'c1-droplet',
    'c1-soup',
    'c1-blender4',
    'c1-dinnerbulb',
    'c1-plate2',
    'c1-coffee2',
    'c1-cupboard',
    'c1-coffee1',
    'c1-plate',
    'c1-beer',
    'c1-cocktailGlass2',
    'c1-oven',
  ],
  livingRoom: [
    'c1-rockingChair',
    'c1-tvSetup',
    'c1-tv1',
    'c1-tvSetup2',
    'c1-bookshelf',
    'c1-musicPlayer',
    'c1-couch',
    'c1-chair',
  ],
  bedRoom:[
    'c1-bunkBeds',
    'c1-bed',
    'c1-babyCarriage',
  ],
  office: [
    'c1-officeChair',
    'c1-desk',
    'c1-archive',
    'c1-computerDesk',
  ],
  garage: [
    'c1-car1',
    'c1-drill1',
    'c1-powerSaw',
    'c1-grinder',
    'c1-drill2',
  ],
  miscellaneous: [
    'c1-dude',
    'c1-dudette',
    'c1-people',
    'c1-pool',
    'c1-leaf',
  ]
};

export class SettingsRoomIconSelection extends Component {
  render() {
    const store   = this.props.store;
    const state   = store.getState();
    const selectedIcon = this.props.icon || state.spheres[this.props.sphereId].locations[this.props.locationId].config.icon;

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
                store.dispatch({type:'UPDATE_LOCATION_CONFIG', sphereId: this.props.sphereId, locationId: this.props.locationId, data:{icon: newIcon}});
                Actions.pop();
              }}
          />
        </ScrollView>
      </Background>
    );
  }
}
