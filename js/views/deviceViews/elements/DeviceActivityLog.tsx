import * as React from 'react'; import { Component } from 'react';
import {
  Animated,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  PixelRatio,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  Text,
  View
} from 'react-native';
const Actions = require('react-native-router-flux').Actions;

import { canUseIndoorLocalizationInSphere } from "../../../util/DataUtil";

import {colors, screenHeight, screenWidth} from '../../styles'
import { Util }                 from "../../../util/Util";
import { deviceStyles }         from "../DeviceOverview";
import { BEHAVIOUR_TYPES }      from "../../../router/store/reducers/stones";
import { ActivityLogItem }      from './activityLog/ActivityLogItem';
import { ActivityLogProcessor } from './activityLog/ActivityLogProcessor';
import {ActivityLogDayIndicator} from "./activityLog/ActivityLogDayIndicator";
import {ActivityLogSyncer} from "../../../cloud/sections/sync/modelSyncs/ActivityLogSyncer";
import {MapProvider} from "../../../backgroundProcesses/MapProvider";
import {getGlobalIdMap} from "../../../cloud/sections/sync/modelSyncs/SyncingBase";
import {Permissions} from "../../../backgroundProcesses/PermissionManager";
import {textStyle} from "./DeviceBehaviour";
import {ActivityLogStatusIndicator} from "./activityLog/ActivityLogStatusIndicator";


export class DeviceActivityLog extends Component<any, any> {
  unsubscribeStoreEvents;

  logProcessor;
  logs = [];

  constructor(props) {
    super(props);

    this.logProcessor = new ActivityLogProcessor();

    this.state = { updating: false, showMax: 25 };

    this.processLogs();
  }

  processLogs() {
    if (!Permissions.inSphere(this.props.sphereId).seeActivityLogs) { return; }

    const store = this.props.store;
    const state = store.getState();
    const sphere = state.spheres[this.props.sphereId];
    const stone = sphere.stones[this.props.stoneId];

    let showFullLogs = state.user.developer && state.development.show_full_activity_log;

    let element = Util.data.getElement(store, this.props.sphereId, this.props.stoneId, stone);

    let behaviourHomeExit = element.behaviour[BEHAVIOUR_TYPES.HOME_EXIT];
    let behaviourRoomExit = element.behaviour[BEHAVIOUR_TYPES.ROOM_EXIT];
    let behaviourAway     = element.behaviour[BEHAVIOUR_TYPES.AWAY];

    let useRoomLevel = canUseIndoorLocalizationInSphere(state, this.props.sphereId);
    let keepAliveType = "keepAliveSphere";
    if      (behaviourHomeExit.active === true)                   { keepAliveType = "keepAliveSphere"; }
    else if (behaviourRoomExit.active === true && useRoomLevel)   { keepAliveType = "keepAliveOther"; }
    else if (behaviourAway.active     === true && !useRoomLevel)  { keepAliveType = "keepAliveOther"; }

    this.logs = this.logProcessor.process(store, this.props.sphereId, this.props.stoneId, keepAliveType, showFullLogs)
  }


  _renderItems(logs, state, stone, showFullLogs) {
    let items = [];
    let itemHeight = 100;
    items.push(<View key={"topspacer"} style={{height:30}} />);
    items.push(<Text key={"title"}     style={deviceStyles.header}>{"Activity Log"}</Text>);
    items.push(<Text key={"explanation"}  style={[deviceStyles.text, {padding:20}]}>{"In this log you can see why the Crownstone is being switched. The newest entries are at the top. This data is stored for 24 hours."}</Text>);


    items.push(<View key={"longWhiteLine"} style={{position:'absolute', top: 186, left: 52, width:2, backgroundColor:colors.white.rgba(0.5), height: itemHeight*logs.length + 30}} />);
    items.push(<View key={"longWhiteLine_topCap"} style={{position:'absolute', top: 180, left: 50, width:6, backgroundColor:colors.white.rgba(0.5), height: 6, borderRadius:3}} />);
    items.push(<View key={"longWhiteLine_bottomCap_trailingDot"} style={{position:'absolute', top: 216 + itemHeight*logs.length + 20, left: 51, width:4, backgroundColor:colors.white.rgba(0.3), height: 4, borderRadius:2}} />);
    items.push(<View key={"longWhiteLine_bottomCap"} style={{position:'absolute', top: 216 + itemHeight*logs.length, left: 50, width:6, backgroundColor:colors.white.rgba(0.5), height: 6, borderRadius:3}} />);
    items.push(<View key={"itemSpacer"} style={{height:40}} />);

    if (logs.length === 0) {
      if (Permissions.inSphere(this.props.sphereId).seeActivityLogs) {
        items.push(<Text key={"titleNothing"} style={[deviceStyles.header, {fontSize: 22, marginTop:-6}]}>{"Nothing yet..."}</Text>);
      }
      else {
        items.push(<Text key={"titleNothing"} style={[deviceStyles.header, {fontSize: 22, marginTop:-6}]}>{"Only members and admins can see the activity logs..."}</Text>);
      }
    }


    for (let i = 0; i < logs.length && i < this.state.showMax; i++) {
      let log = logs[i];
      if (log.type === 'statusUpdate') {
        items.push(<ActivityLogStatusIndicator key={log.timestamp + "_Zindex:" + i} data={log} state={state} stone={stone} sphereId={this.props.sphereId} height={itemHeight} />);
      }
      else if (log.type === 'dayIndicator') {
        items.push(<ActivityLogDayIndicator key={log.timestamp + "_Zindex:" + i} data={log} state={state} stone={stone} sphereId={this.props.sphereId} height={itemHeight} />);
      }
      else {
        items.push(<ActivityLogItem key={log.timestamp + "_Zindex:" + i} data={log} state={state} stone={stone} sphereId={this.props.sphereId} height={itemHeight} showFullLogs={showFullLogs} />);
      }
    }

    items.push(<View key={"bottomspacer"} style={{height:120}} />);

    return items;
  }

  updateLogs() {
    this.setState({updating:true})
    const state = this.props.store.getState();
    const sphere = state.spheres[this.props.sphereId];
    const stone = sphere.stones[this.props.stoneId];
    let actions = [];

    let logSyncer = new ActivityLogSyncer(actions, [], this.props.sphereId, MapProvider.local2cloudMap[this.props.sphereId], this.props.stoneId, stone.config.cloudId, getGlobalIdMap())
    logSyncer.sync(this.props.store)
      .then(() => {
        if (actions.length > 0) {
          this.props.store.batchDispatch(actions);
          this.processLogs()
        }
        this.setState({updating:false});
      })
      .catch((err) => {
        this.setState({updating:false})
      })
  }


  render() {
    const store = this.props.store;
    const state = store.getState();
    const sphere = state.spheres[this.props.sphereId];
    const stone = sphere.stones[this.props.stoneId];
    let showFullLogs = state.user.developer && state.development.show_full_activity_log;

    return (
      <View style={{flex:1}}>
        <ScrollView
          scrollEventThrottle={100}
          onScroll={(event) => {
            if (this.logs.length > this.state.showMax) {
              if (event.nativeEvent.contentSize.height - event.nativeEvent.contentOffset.y < screenHeight) {
                this.setState({showMax: this.state.showMax + 25})
              }
            }
          }}>
          <RefreshControl
            refreshing={false}
            onRefresh={() => { this.updateLogs() }}
            title={"Syncing with the other users..."}
            titleColor={colors.white.hex}
            colors={[colors.white.hex]}
            tintColor={colors.white.hex}
          />
          {this._renderItems(this.logs, state, stone, showFullLogs)}
        </ScrollView>
      </View>
    )
  }
}
