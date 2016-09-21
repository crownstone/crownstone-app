import React, { Component } from 'react'
import {
  
  TouchableOpacity,
  PixelRatio,
  ScrollView,
  Switch,
  TextInput,
  Text,
  View
} from 'react-native';
var Actions = require('react-native-router-flux').Actions;
import { Background }        from '../components/Background'
import { ListEditableItems } from '../components/ListEditableItems'
import { EditSpacer }        from '../components/editComponents/EditSpacer'


export class DaySelection extends Component {

  constructOptions(optionState) {
    let items = [];

    // behaviour link
    items.push({label:'Monday',    type: 'checkbar', value: optionState[0] === 0, callback:() => {this.props.callback(0,optionState[0] === 0 ? 1 : 0);}});
    items.push({label:'Tuesday',   type: 'checkbar', value: optionState[1] === 1, callback:() => {this.props.callback(0,optionState[1] === 0 ? 1 : 0);}});
    items.push({label:'Wednesday', type: 'checkbar', value: optionState[2] === 2, callback:() => {this.props.callback(0,optionState[2] === 0 ? 1 : 0);}});
    items.push({label:'Thursday',  type: 'checkbar', value: optionState[3] === 3, callback:() => {this.props.callback(0,optionState[3] === 0 ? 1 : 0);}});
    items.push({label:'Friday',    type: 'checkbar', value: optionState[4] === 4, callback:() => {this.props.callback(0,optionState[4] === 0 ? 1 : 0);}});
    items.push({label:'Saturday',  type: 'checkbar', value: optionState[5] === 5, callback:() => {this.props.callback(0,optionState[5] === 0 ? 1 : 0);}});
    items.push({label:'Sunday',    type: 'checkbar', value: optionState[6] === 6, callback:() => {this.props.callback(0,optionState[6] === 0 ? 1 : 0);}});

    return items;
  }

  render() {
    const store   = this.props.store;
    const state   = store.getState();
    const room    = state.spheres[this.props.sphereId].locations[this.props.locationId];
    const device  = room.stones[this.props.stoneId];

    let optionState = this.props.extractionMethod(device);

    let options = this.constructOptions(optionState);
    return (
      <Background image={this.props.backgrounds.menu} >
        <ScrollView>
          <EditSpacer top={true} />
          <ListEditableItems items={options} separatorIndent={true} />
        </ScrollView>
      </Background>
    )
  }
}
