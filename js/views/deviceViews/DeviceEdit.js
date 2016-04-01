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
var Actions = require('react-native-router-flux').Actions;

import { stylesIOS, colors } from '../styles'
import { Background } from '../components/Background'
import { ListEditableItems } from '../components/ListEditableItems'
import { EditableItem } from '../components/EditableItem'
import { Explanation } from '../components/Explanation'
import { EditSpacer } from '../components/EditSpacer'
var Icon = require('react-native-vector-icons/Ionicons');

let styles = stylesIOS;

export class DeviceEdit extends Component {
  componentDidMount() {
    const { store } = this.props;
    this.unsubscribe = store.subscribe(() => {
      this.forceUpdate();
    })
  }

  componentWillUnmount() {
    this.unsubscribe();
  }


  constructOptions(state, store, device) {
    let toBehaviour = () => {Actions.deviceBehaviourEdit({deviceId: this.props.deviceId, roomId: this.props.roomId})};
    let toSchedule = () => {};
    let toLinkedDevices = () => {};

    let requiredData = {groupId: state.app.activeGroup, locationId: this.props.roomId, stoneId: this.props.deviceId};
    let items = [];
    // device Name:
    items.push({label:'Device Name', type: 'text', value:device.config.name, callback: (newText) => {
      newText = (newText === '') ? 'Untitled Room' : newText;
      store.dispatch({...requiredData, ...{type:'UPDATE_STONE_CONFIG', data:{name:newText}}});
    }});

    // icon picker
    items.push({label:'Icon', type: 'icon', value:'easel', callback: () => {}});

    // dimmable
    items.push({label:'Dimmable', type: 'switch', value:device.config.dimmable, callback: (newValue) => {
        store.dispatch({...requiredData, ...{type:'UPDATE_STONE_CONFIG', data:{dimmable:newValue}}});
    }});

    // spacer
    items.push({type: 'spacer'});

    // behaviour link
    items.push({label:'Behaviour', type: 'navigation', callback:toBehaviour});

    // behaviour explanation
    items.push({label:'Customize how Crownstone reacts to your presence.', type: 'explanation',  below:true});

    // schedule link
    items.push({label:'Schedule', type: 'navigation', callback:toSchedule});

    // schedule explanation
    items.push({label:'Schedule when Crownstone should turn your device on or off.' +
    ' You can choose if this schedule will overrule the behaviour based on your presence', type: 'explanation',  below:true});

    // linked devices link
    items.push({label:'Linked Devices', type: 'navigation', callback:toLinkedDevices});

    // linked devices explanation
    items.push({label:'Let other Crownstones react when this device turns on or off by manual input.' +
    ' Manual input here is either through the app or by turning the device physically off. ' +
    'Switching based on presence is not used for this.', type: 'explanation',  below:true});

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
          <ListEditableItems items={options.slice(0,3)} separatorIndent={true} />
          <ListEditableItems items={options.slice(3,options.length)}/>
        </ScrollView>
      </Background>
    )
  }
}
