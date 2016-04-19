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
      <View key={stoneId + '_entry'}>
        <View style={styles.listView}>
          <DeviceEntry
            name={device.config.name}
            icon={device.config.icon}
            state={device.state.state}
            currentUsage={device.state.currentUsage}
            navigation={false}
            control={true}
            dimmable={device.config.dimmable}
            onChange={(newValue) => {
              let data = {state:newValue};
              if (newValue === 0)
                data.currentUsage = 0;

              this.props.store.dispatch({
                type: 'UPDATE_STONE_STATE',
                groupId: this.props.groupId,
                locationId: this.props.locationId,
                stoneId: stoneId,
                data: data
              })
            }}
          />
        </View>
      </View>
    );
  }

  render() {
    const store   = this.props.store;
    const state   = store.getState();
    const room    = state.groups[this.props.groupId].locations[this.props.locationId];
    const devices = room.stones;

    // update the title in case the editing has changed it
    this.props.navigationState.title = room.config.name;

    let {width} = Dimensions.get('window');
    let pxRatio = PixelRatio.get();
    let height = 50 * pxRatio;

    return (
      <Background background={require('../../images/mainBackground.png')}>
        <Image
          source={room.picture.squareURI ? require(room.picture.squareURI) : require('../../images/roomPlaceholderGreen.png')}
          width={width} height={height}>
          <View style={{flexDirection:'row'}}>
            <View style={[styles.roomImageContents,{height:height}]}><Text style={styles.roomImageText}>Nobody
              Present</Text></View>
            <View style={{flex:1}}/>
            <View style={[styles.roomImageContents,{height:height}]}><Text style={styles.roomImageText}>512
              W</Text></View>
          </View>
        </Image>
        <ScrollView>
          <SeparatedItemList items={devices} renderer={this._renderer.bind(this)} separatorIndent={false}/>
        </ScrollView>
      </Background>
    );
  }
}
