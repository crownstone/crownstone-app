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
import { styles, colors } from '../styles'
import { Background } from '../components/Background'
import { ListEditableItems } from '../components/ListEditableItems'
import { EditableItem } from '../components/EditableItem'
import { Explanation } from '../components/editComponents/Explanation'
import { EditSpacer } from '../components/editComponents/EditSpacer'

var Actions = require('react-native-router-flux').Actions;



export class DeviceScheduleAdd extends Component {
  componentDidMount() {
    const { store } = this.props;
    this.unsubscribe = store.subscribe(() => {
      this.forceUpdate();
    })
  }
  componentWillUnmount() {
    this.unsubscribe();
  }

  constructScheduleItems(store, scheduleItems) {
    let requiredData = {groupId: this.props.groupId, locationId: this.props.locationId, stoneId: this.props.stoneId};
    let items = [];

    //let data = {
    //  enabled: true,
    //  range: true,
    //  startTime: 0,
    //  onStart: {
    //  state:1,
    //    fade:10
    //  },
    //  endTime: 0,
    //    onEnd: {
    //  state:1,
    //    fade:0
    //  },
    //  onDays:{Monday:0, Tuesday:0, Wednesday:0, Thursday:0, Friday:0, Saturday:0, Sunday:0},
    //  overruleBehaviour: true
    //};

    items.push({label: 'Enabled',            value: true,   type: 'switch',     callback:(newValue) => {}});
    items.push({label: 'Start Time',         value: '8:00', type: 'navigation', valueStyle: styles.rightNavigationValue, callback:() => {}});
    items.push({label: 'Set State on Start', value: 'On',   type: 'navigation', valueStyle: styles.rightNavigationValue, callback:() => {}});
    items.push({label: 'End Time',           value: '8:00', type: 'navigation', valueStyle: styles.rightNavigationValue, callback:() => {}});
    items.push({label: 'Set State on End',   value: 'Off',  type: 'navigation', valueStyle: styles.rightNavigationValue, callback:() => {}});
    items.push({label: 'Override Behaviour', value: true,   type: 'switch',     callback:(newValue) => {}});
    items.push({label: 'Days',               value: true,   type: 'dayList',    callback:(newValue) => {}});
    items.push({label: 'Delete',             type:'button', callback: (newValue) => {}});

    return items;
  }

  render() {
    const store   = this.props.store;
    const state   = store.getState();
    const room    = state.groups[this.props.groupId].locations[this.props.locationId];
    const device  = room.stones[this.props.stoneId];
    let scheduleItems = device.schedule;

    let options = this.constructScheduleItems(store, scheduleItems);
    return (
      <Background image={this.props.backgrounds.menu} >
        <ScrollView>
          <ListEditableItems items={options.slice(0,9)}/>
          <ListEditableItems items={options.slice(9)}/>
        </ScrollView>
      </Background>
    )
  }
}
