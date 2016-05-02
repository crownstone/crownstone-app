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
import { Explanation } from '../components/editComponents/Explanation'
import { EditSpacer } from '../components/editComponents/EditSpacer'

import { styles, colors } from '../styles'


export class RoomEdit extends Component {
  componentDidMount() {
    this.unsubscribe = this.props.store.subscribe(() => {
      this.forceUpdate();
    })
  }

  componentWillUnmount() {
    this.unsubscribe();
  }

  _renderer(device, index, stoneId) {
    return (
      <TouchableHighlight
        key={stoneId + '_entry'}
        onPress={() => {Actions.deviceEdit({groupId:this.props.groupId, stoneId, locationId:this.props.locationId})}}
        style={{flex:1}}>
        <View style={styles.listView}>
          <DeviceEntry
            name={device.config.name}
            icon={device.config.icon}
            state={device.state.state}
            currentUsage={device.state.currentUsage}
            navigation={true}
            control={false}
          />
        </View>
      </TouchableHighlight>
    );
  }

  constructOptions(store, room) {
    let requiredData = {groupId: this.props.groupId, locationId: this.props.locationId};
    let items = [];
    // room Name:
    items.push({label:'Room Name', type: 'textEdit', value: room.config.name, callback: (newText) => {
      newText = (newText === '') ? 'Untitled Room' : newText;
      store.dispatch({...requiredData, ...{type:'UPDATE_LOCATION_CONFIG', data:{name:newText}}});
    }});
    items.push({label:'Icon', type: 'icon', value:'easel', callback: () => {}});
    //items.push({label:'Picture', type: 'picture', value:undefined, callback: () => {}});
    return items;
  }

  render() {
    const store   = this.props.store;
    const state   = store.getState();
    const room    = state.groups[this.props.groupId].locations[this.props.locationId];
    const devices = room.stones;

    let options = this.constructOptions(store, room);
    return (
      <Background>
        <ScrollView>
          <EditSpacer top={true} />
          <ListEditableItems items={options} separatorIndent={true}/>
          <Explanation text='DEVICES IN ROOM:' />
          <SeparatedItemList items={devices} renderer={this._renderer.bind(this)} separatorIndent={false} />
        </ScrollView>
      </Background>
    )
  }
}
