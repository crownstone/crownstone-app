import React, {
  Component,
  Dimensions,
  Image,
  PixelRatio,
  TouchableHighlight,
  ScrollView,
  Text,
  View
} from 'react-native';

import { Background } from '../components/Background'
import { DeviceEntry } from '../components/DeviceEntry'
import { SeparatedItemList } from '../components/SeparatedItemList'

var Icon = require('react-native-vector-icons/Ionicons');

import {stylesIOS, colors} from '../styles'
let styles = stylesIOS;

export class RoomOverview extends Component {
  _renderer(device,deviceId) {
    const { store } = this.props;
    const state = store.getState();
    return (
      <View key={deviceId + '_entry'}>
        <View style={styles.listView}>
          <DeviceEntry
            name={device.config.name}
            icon={device.config.icon}
            state={device.state.state}
            currentUsage={device.state.currentUsage}
            navigation={false}
            control={true}
            onChange={(newValue) => {
              let data = {state:newValue};
              if (newValue === 0)
                data.currentUsage = 0;

              store.dispatch({
                type: 'UPDATE_STONE_STATE',
                groupId: state.app.activeGroup,
                locationId: this.props.roomId,
                stoneId: deviceId,
                data: data
              })
            }}
          />
        </View>
      </View>
    );
  }

  componentDidMount() {
    const { store } = this.props;
    this.unsubscribe = store.subscribe(() => {
      this.forceUpdate();
    })
  }

  componentWillUnmount() {
    this.unsubscribe();
  }

  render() {
    const { store } = this.props;
    const state = store.getState();
    let room = state.groups[state.app.activeGroup].locations[this.props.roomId];
    this.props.navigationState.title = room.config.name;

    let {width} = Dimensions.get('window');
    let pxRatio = PixelRatio.get();
    let height = 50*pxRatio;

    let devices = room.stones;

    return (
      <Background>
        <Image source={room.picture.squareURI ? require(room.picture.squareURI) : require('../../images/roomPlaceholderGreen.png')} width={width} height={height} >
          <View style={{flexDirection:'row'}}>
            <View style={[styles.roomImageContents,{height:height}]}><Text style={styles.roomImageText}>Nobody Present</Text></View>
            <View style={{flex:1}} />
            <View style={[styles.roomImageContents,{height:height}]}><Text style={styles.roomImageText}>512 W</Text></View>
          </View>
        </Image>
        <ScrollView>
          <SeparatedItemList items={devices} renderer={this._renderer.bind(this)} separatorIndent={false} />
        </ScrollView>
      </Background>
    )
  }
}
