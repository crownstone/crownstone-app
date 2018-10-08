import { Languages } from "../../Languages"
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
const Actions = require('react-native-router-flux').Actions;


let categories = [
  {key: 'hallway', label: Languages.label("RoomIconSelection", "Hallway")()},
  {key: 'livingRoom', label: Languages.label("RoomIconSelection", "Living_Room")()},
  {key: 'kitchen', label: Languages.label("RoomIconSelection", "Kitchen")()},
  {key: 'bathroom', label: Languages.label("RoomIconSelection", "Bathroom")()},
  {key: 'office', label: Languages.label("RoomIconSelection", "Office")()},
  {key: 'bedRoom', label: Languages.label("RoomIconSelection", "Bedroom")()},
  {key: 'garage', label: Languages.label("RoomIconSelection", "Garage")()},
  {key: 'play', label: Languages.label("RoomIconSelection", "Play_Room")()},
  {key: 'music', label: Languages.label("RoomIconSelection", "Music_Room")()},
  {key: 'nature', label: Languages.label("RoomIconSelection", "Nature___Outside")()},
  {key: 'miscellaneous', label: Languages.label("RoomIconSelection", "Miscellaneous")()},
];

let listOfIcons = {
  play: [
    'c1-dvd',
    'c1-console',
    'c1-controller2',
    'c1-controller3',
    'c1-lab',
    'c1-microscope',
    'c1-robot',
    'c1-movieCamera',
    'c1-theaterLight',
    'c1-weight',
    'c1-projector',
  ],
  nature: [
    'c1-plant',
    'c1-tree',
    'c1-tree-pot',
  ],
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
    'c1-medicine',
    'c1-testtube',
    'c1-wcsign',
    'c1-medicine-bottle',
    "c1-manWomanSign",
    "c1-womanSign",
    "c1-hairDryer",
    "c1-toothbrush",
    "c1-toilet1",
    "c1-toilet2",
    'c1-rain1',
  ],
  kitchen:[
    'c1-foodWine',
    'c1-cutlery',
    'c1-forkKnife',
    'c1-blender3',
    'c1-cocktailGlass1',
    'c1-cocktailGlass2',
    'c1-drink',
    'c1-boiler',
    'c1-droplet',
    'c1-soup',
    'c1-blender4',
    'c1-dinnerbulb',
    'c1-coffee2',
    'c1-coffee3',
    'c1-coffee1',
    'c1-cupboard',
    'c1-plate',
    'c1-plate2',
    'c1-beer',
    'c1-microwave',
    'c1-oven',
    'c1-oven2',
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
    'c1-bookshelf2',
    'c1-bookshelf2-lines',
    'c1-clock',
    'c1-fireplace',
    'c1-curtains',
    'c1-tv',
    'c1-tv2',
  ],
  bedRoom:[
    'c1-bunkBeds',
    'c1-bed',
    'c1-babyCarriage',
    'c1-bed-couch',
    'c1-bedpost',
    'c1-massage',
    'c1-baby',
    'c1-makeupTable',
    'c1-mannequin',
    'c1-closet1',
    'c1-closet2',
    'c1-closet3',
    'c1-closet4',
    'c1-closet5',
    'c1-closet6',
    'c1-shirt2',
    'c1-shirt3',
  ],
  office: [
    'c1-officeChair',
    'c1-desk',
    'c1-archive',
    'c1-computerDesk',
    'c1-laptop',
  ],
  garage: [
    'c1-car1',
    'c1-drill1',
    'c1-powerSaw',
    'c1-grinder',
    'c1-drill2',
    'c1-garage',
    'c1-weights',
    'c1-circular-saw',
    'c1-hammer',
    'c1-motorbike',
    'c1-bike',
  ],
  miscellaneous: [
    'c1-iron1',
    'c1-dude',
    'c1-dudette',
    'c1-wheel-chair',
    'c1-wheelchair',
    'c1-people',
    'c1-pool',
    'c1-leaf',
    'c1-stars',
    'c1-swimming',
    'c1-chess-horse',
    'c1-arrow-target',
    'c1-meditation',
    'c1-swimming-circle',
    'c1-court',
    'c1-cinema',
    'c1-chatBubbles',
    'c1-house',
    'c1-alarmClock',
    'c1-brain',
    'c1-xmastree',
    'c1-cat',
    'c1-skull',
    'c1-nuclear-circle',
    'c1-fence',
  ],
  hallway: [
    'c1-door-plant',
    'c1-tree-thing',
    'c1-stairs',
    'c1-door-plant-lines',
    'c1-signpost',
  ],
  music: [
    'c1-rec',
    'c1-speakers1',
    'c1-speaker2',
    'c1-speakers3',
    'c1-band',
    'c1-drums',
    'c1-musicalNotes',
    'c1-musicNote',
    'c1-musicCompose',
    'c1-dance2',
  ]
};

export const getRandomRoomIcon = () => {
  let allKeys = Object.keys(listOfIcons);
  let key = allKeys[Math.floor(Math.random()*allKeys.length)]
  return listOfIcons[key][Math.floor(Math.random()*listOfIcons[key].length)]
}

export class RoomIconSelection extends Component<{callback(icon: string) : void, icon: string, backgrounds: any}, any> {
  static navigationOptions = ({ navigation }) => {
    return {
      title: Languages.title("RoomIconSelection", "Pick_an_Icon")(),
    }
  };

  constructor(props) {
    super(props)
  }

  render() {
    return (
      <Background hasNavBar={false} image={this.props.backgrounds.detailsDark}>
        <View style={{backgroundColor: colors.csOrange.hex, height:2, width:screenWidth}} />
        <ScrollView>
          <IconSelection
            categories={categories}
            icons={listOfIcons}
            selectedIcon={this.props.icon}
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
