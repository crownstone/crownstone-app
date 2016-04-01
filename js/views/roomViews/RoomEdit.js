import React, {
  Component,
  TouchableHighlight,
  PixelRatio,
  ScrollView,
  Switch,
  TextInput,
  Text,
  View
} from 'react-native';
var Actions = require('react-native-router-flux').Actions;

import { Background } from '../components/Background'
import { ListEditableItems } from '../components/ListEditableItems'
import { DeviceEntry } from '../components/DeviceEntry'
import { SeparatedItemList } from '../components/SeparatedItemList'
import { Explanation } from '../components/Explanation'

import { stylesIOS, colors } from '../styles'
let styles = stylesIOS;

export class RoomEdit extends Component {
  componentDidMount() {
    const { store } = this.props;
    this.unsubscribe = store.subscribe(() => {
      this.forceUpdate();
    })
  }

  componentWillUnmount() {
    this.unsubscribe();
  }

  _renderer(device,deviceId) {
    return (
      <View key={deviceId + '_entry'}>
        <View style={styles.listView}>
          <DeviceEntry
            name={device.config.name}
            icon={device.config.icon}
            state={device.state.state}
            currentUsage={device.state.currentUsage}
            navigation={true}
            control={false}
            onNavigation={() => {
              Actions.deviceEdit({deviceId, roomId:this.props.roomId})
            }}
          />
        </View>
      </View>
    );
  }

  constructOptions(state, store, room) {
    let requiredData = {groupId: state.app.activeGroup, locationId: this.props.roomId};
    let items = [];
    // room Name:
    items.push({label:'Room Name', type: 'text', value:room.config.name, callback: (newText) => {
      newText = (newText === '') ? 'Untitled Room' : newText;
      store.dispatch({...requiredData, ...{type:'UPDATE_LOCATION_CONFIG', data:{name:newText}}});
    }});
    items.push({label:'Icon', type: 'icon', value:'easel', callback: () => {}});
    items.push({label:'Picture', type: 'picture', value:undefined, callback: () => {}});
    return items;
  }

  render() {
    const { store } = this.props;
    let state = store.getState();
    let room = state.groups[state.app.activeGroup].locations[this.props.roomId];
    let devices = room.stones;

    let options = this.constructOptions(state, store, room);
    return (
      <Background>
        <ScrollView>
          <ListEditableItems items={options} separatorIndent={true}/>
          <Explanation text='DEVICES IN ROOM:' />
          <SeparatedItemList items={devices} renderer={this._renderer.bind(this)} separatorIndent={false} />
        </ScrollView>
      </Background>
    )
  }
}
