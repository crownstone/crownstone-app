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
import { Explanation } from '../components/Explanation'
import { EditSpacer } from '../components/EditSpacer'
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
    if (device.behaviour[event].state === undefined) {
      return 'No Change';
    }
    else if (device.behaviour[event].state < 1) {
      return 'On (' + Math.round(100 * device.behaviour[event].state) + '%)'
    }
    else if (device.behaviour[event].state === 1) {
      return 'On'
    }

    return 'Off'
  }

  _getTimeoutLabel(device, event) {
    if (device.behaviour[event].timeout === undefined || device.behaviour[event].timeout == 0)
      return '';

    return 'after ' + device.behaviour[event].timeout + ' minutes';
  }


  constructOptions(state, store, device) {
    let requiredData = {groupId: state.app.activeGroup, locationId: this.props.roomId, stoneId: this.props.deviceId};
    let items = [];

    let toDeviceStateSetup = () => {};
    // behaviour explanation
    items.push({label:'WHEN YOU COME HOME', type: 'explanation', style:{paddingTop:10}, below:false});
    items.push({label:this._getStateLabel(device,'onHomeEnter'), value: this._getTimeoutLabel(device,'onHomeEnter'), type: 'navigationValue', valueStyle:{color:'#bababa'}, callback:toDeviceStateSetup});

    // behaviour explanation
    items.push({label:'WHEN YOU LEAVE YOUR HOME', type: 'explanation',  below:false});
    items.push({label:this._getStateLabel(device,'onHomeEnter'), value: this._getTimeoutLabel(device,'onHomeEnter'), type: 'navigationValue', valueStyle:{color:'#bababa'}, callback:toDeviceStateSetup});

    // behaviour explanation
    items.push({label:'WHEN YOU ENTER THE ROOM', type: 'explanation',  below:false});
    items.push({label:this._getStateLabel(device,'onHomeEnter'), value: this._getTimeoutLabel(device,'onHomeEnter'), type: 'navigationValue', valueStyle:{color:'#bababa'}, callback:toDeviceStateSetup});

    // behaviour explanation
    items.push({label:'WHEN YOU LEAVE THE ROOM', type: 'explanation',  below:false});
    items.push({label:this._getStateLabel(device,'onHomeEnter'), value: this._getTimeoutLabel(device,'onHomeEnter'), type: 'navigationValue', valueStyle:{color:'#bababa'}, callback:toDeviceStateSetup});
    items.push({label:'If there are still people (from your group) left in the room, this will not be triggered.', type: 'explanation',  below:true});

    // behaviour explanation
    items.push({label:'SPECIAL CASES', type: 'explanation', style:{paddingTop:0}, below:false});
    items.push({label:'Only On After Dusk', value: device.behaviour.config.onlyOnAfterDusk , type: 'switch', valueStyle:{color:'#bababa'}, callback:(newValue) => {
      store.dispatch({
        type: 'UPDATE_BEHAVIOUR_CONFIG',
        groupId: state.app.activeGroup,
        locationId: this.props.roomId,
        stoneId: this.props.deviceId,
        data: {onlyOnAfterDusk: newValue}
      })
    }});
    items.push({label:'Enable if you want the device to only turn on when it\'s getting dark outside.', type: 'explanation',  below:true});

    return items;
  }

  render() {
    const { store } = this.props;
    let state = store.getState();
    let room = state.groups[state.app.activeGroup].locations[this.props.roomId];
    let device = room.stones[this.props.deviceId];

    let options = this.constructOptions(state, store, device);
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
