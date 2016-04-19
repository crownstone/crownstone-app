import React, {
  Component,
  TouchableOpacity,
  PixelRatio,
  ScrollView,
  Switch,
  TextInput,
  Text,
  View
} from 'react-native';
import { stylesIOS, colors } from '../styles'
import { Background } from '../components/Background'
import { ListEditableItems } from '../components/ListEditableItems'
import { EditableItem } from '../components/EditableItem'
import { Explanation } from '../components/editComponents/Explanation'
import { EditSpacer } from '../components/editComponents/EditSpacer'

var Actions = require('react-native-router-flux').Actions;
var Icon = require('react-native-vector-icons/Ionicons');

let styles = stylesIOS;

export class DeviceBehaviourEdit extends Component {
  componentDidMount() {
    const { store } = this.props;
    this.unsubscribe = store.subscribe(() => {
      this.forceUpdate();
    })
  }

  componentWillUnmount() {
    this.unsubscribe();
  }

  _getStateLabel(device, event) {
    if (device.behaviour[event].active === false) {
      return 'No Change';
    }
    else if (device.behaviour[event].state < 1 && device.behaviour[event].state > 0) {
      return 'On (' + Math.round(100 * device.behaviour[event].state) + '%)'
    }
    else if (device.behaviour[event].state === 1) {
      return 'On'
    }

    return 'Off'
  }

  _getDelayLabel(device, event) {
    if (device.behaviour[event].delay === undefined || device.behaviour[event].delay == 0)
      return '';

    return 'after ' + Math.floor(device.behaviour[event].delay/60) + ' minutes';
  }

  _getTitle(eventName) {
    switch (eventName) {
      case 'onHomeEnter':
        return 'When Entering The House';
      case 'onHomeExit':
        return 'When Leaving The House';
      case 'onRoomEnter':
        return 'When Entering The Room';
      case 'onRoomExit':
        return 'When Leaving The Room';
      default:
        return '--- invalid event: ' + this.props.eventName;
    }
  }

  constructOptions(store, device) {
    let requiredData = {groupId: this.props.groupId, locationId: this.props.locationId, stoneId: this.props.stoneId};
    let items = [];

    let toDeviceStateSetup = (eventName) => {Actions.deviceStateEdit({eventName, title:this._getTitle(eventName), ...requiredData})};

    // Behaviour for onHomeEnter event
    let eventLabel = 'onHomeEnter';
    items.push({label:'WHEN YOU COME HOME', type: 'explanation', style: styles.topExplanation, below:false});
    items.push({label:this._getStateLabel(device, eventLabel), value: this._getDelayLabel(device, eventLabel), type: 'navigation', valueStyle:{color:'#888'}, callback:toDeviceStateSetup.bind(this,eventLabel)});

    // Behaviour for onHomeExit event
    eventLabel = 'onHomeExit';
    items.push({label:'WHEN YOU LEAVE YOUR HOME', type: 'explanation',  below:false});
    items.push({label:this._getStateLabel(device, eventLabel), value: this._getDelayLabel(device, eventLabel), type: 'navigation', valueStyle:{color:'#888'}, callback:toDeviceStateSetup.bind(this,eventLabel)});

    // Behaviour for onRoomEnter event
    eventLabel = 'onRoomEnter';
    items.push({label:'WHEN YOU ENTER THE ROOM', type: 'explanation',  below:false});
    items.push({label:this._getStateLabel(device, eventLabel), value: this._getDelayLabel(device, eventLabel), type: 'navigation', valueStyle:{color:'#888'}, callback:toDeviceStateSetup.bind(this,eventLabel)});

    // Behaviour for onRoomExit event
    eventLabel = 'onRoomExit';
    items.push({label:'WHEN YOU LEAVE THE ROOM', type: 'explanation',  below:false});
    items.push({label:this._getStateLabel(device, eventLabel), value: this._getDelayLabel(device, eventLabel), type: 'navigation', valueStyle:{color:'#888'}, callback:toDeviceStateSetup.bind(this,eventLabel)});
    items.push({label:'If there are still people (from your group) left in the room, this will not be triggered.', type: 'explanation',  below:true});

    // Special behaviour cases
    items.push({label:'SPECIAL CASES', type: 'explanation', style:{paddingTop:0}, below:false});
    items.push({label:'Only On After Dusk', value: device.behaviour.config.onlyOnAfterDusk , type: 'switch', valueStyle:{color:'#bababa'}, callback:(newValue) => {
      store.dispatch({
        ...requiredData,
        type: 'UPDATE_BEHAVIOUR_CONFIG',
        data: {onlyOnAfterDusk: newValue}
      });
    }});
    items.push({label:'Enable if you want the device to only turn on when it\'s getting dark outside.', type: 'explanation',  below:true});

    return items;
  }

  render() {
    const store   = this.props.store;
    const state   = store.getState();
    const room    = state.groups[this.props.groupId].locations[this.props.locationId];
    const device  = room.stones[this.props.stoneId];

    let options = this.constructOptions(store, device);
    return (
      <Background>
        <ScrollView>
          <ListEditableItems items={options.slice(0,9)}/>
          <ListEditableItems items={options.slice(9)}/>
        </ScrollView>
      </Background>
    )
  }
}
