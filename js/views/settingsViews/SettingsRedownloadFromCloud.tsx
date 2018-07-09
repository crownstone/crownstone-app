import * as React from 'react'; import { Component } from 'react';
import {
  Alert,
  TouchableHighlight,
  ScrollView,
  Switch,
  Text,
  View,
  TouchableOpacity
} from 'react-native';

import { Background } from '../components/Background'
import {colors, screenHeight, screenWidth} from "../styles";
import {IconButton} from "../components/IconButton";
import {deviceStyles} from "../deviceViews/DeviceOverview";
import {CLOUD} from "../../cloud/cloudAPI";
import {Bluenet} from "../../native/libInterface/Bluenet";
import {StoreManager} from "../../router/store/storeManager";


export class SettingsRedownloadFromCloud extends Component<any, any> {
  static navigationOptions = ({ navigation }) => {
    return {
      title: "Reset from Cloud",
    }
  };

  _resetDatabase() {
    this.props.eventBus.emit("showLoading", "Preparing for download...")
    let clearDB = () => {
      this.props.eventBus.emit("showLoading", "Clearing database...")

      let state = this.props.store.getState();
      let sphereIds = Object.keys(state.spheres);
      let actions = [];

      sphereIds.forEach((sphereId) => {
        actions.push({__purelyLocal: true, __noEvents: true, type:"REMOVE_SPHERE", sphereId: sphereId});
      })

      actions.push({__purelyLocal: true, __noEvents: true, type:'RESET_APP_SETTINGS'})

      this.props.store.batchDispatch(actions);
      this.props.eventBus.emit("showLoading", "Getting new data...")
      CLOUD.__syncTriggerDatabaseEvents = false;
      CLOUD.sync(this.props.store, )
        .then(() => {
          this.props.eventBus.emit("showLoading", "Finalizing...");
          return new Promise((resolve, reject) => {
            setTimeout(() => { this.props.eventBus.emit("showLoading", "App will close in 5 seconds.\n\nReopen the app to finalize the process."); }, 1000)
            setTimeout(() => { this.props.eventBus.emit("showLoading", "App will close in 4 seconds.\n\nReopen the app to finalize the process."); }, 2000)
            setTimeout(() => { this.props.eventBus.emit("showLoading", "App will close in 3 seconds.\n\nReopen the app to finalize the process."); }, 3000)
            setTimeout(() => { this.props.eventBus.emit("showLoading", "App will close in 2 seconds.\n\nReopen the app to finalize the process."); }, 4000)
            setTimeout(() => { this.props.eventBus.emit("showLoading", "App will close in 1 second. \n\nReopen the app to finalize the process."); }, 5000)
            setTimeout(() => { Bluenet.quitApp(); resolve(true); }, 6000)
          })
        })
        .catch((err) => {
          this.props.eventBus.emit("showLoading", "Falling back to full clean...");
          return StoreManager.destroyActiveUser()
        })
        .then((success) => {
          if (!success) {
            setTimeout(() => { this.props.eventBus.emit("showLoading", "App will close in 5 seconds.\n\nLog in again to finalize the process."); }, 1000)
            setTimeout(() => { this.props.eventBus.emit("showLoading", "App will close in 4 seconds.\n\nLog in again to finalize the process."); }, 2000)
            setTimeout(() => { this.props.eventBus.emit("showLoading", "App will close in 3 seconds.\n\nLog in again to finalize the process."); }, 3000)
            setTimeout(() => { this.props.eventBus.emit("showLoading", "App will close in 2 seconds.\n\nLog in again to finalize the process."); }, 4000)
            setTimeout(() => { this.props.eventBus.emit("showLoading", "App will close in 1 second. \n\nLog in again to finalize the process."); }, 5000)
            setTimeout(() => { Bluenet.quitApp(); }, 6000)
          }
        })
        .catch((err) => {
          Alert.alert("Data reset failed...", "Something went wrong in the data reset process. The best way to solve this is to remove the app from your phone, reinstall it and log into you account",[{text:"OK"}])
        })
    }

    if (CLOUD.__currentlySyncing) {
      let unsub = this.props.eventBus.on('CloudSyncComplete', () => {
        clearDB();
        unsub();
      })
    }
    else {
      clearDB();
    }
  }


  
  render() {
    return (
      <Background image={this.props.backgrounds.menu}  hasNavBar={false} safeView={true}>
        <View style={{flex:1, alignItems:'center', padding: 20}}>
          <Text style={[deviceStyles.header,{color:colors.menuBackground.hex}]}>Replace local data with Cloud data</Text>
          <View style={{flex:1}} />
          <IconButton
            name="md-cloud-download"
            size={0.15*screenHeight}
            color="#fff"
            buttonStyle={{width: 0.2*screenHeight, height: 0.2*screenHeight, backgroundColor:colors.red.hex, borderRadius: 0.03*screenHeight}}
            style={{position:'relative'}}
          />
          <View style={{flex:1}} />
          <Text style={[deviceStyles.errorText,{color:colors.menuBackground.hex}]}>{"To restore your local data with the Cloud data, press the button below. If you don't want to do this, just go back to the help menu.\n\n" +
          "Replacing the local data with the 'fresh' Cloud data might solve some issues you experience in your app."}</Text>
          <View style={{flex:1}} />
          <TouchableOpacity onPress={() => { this._resetDatabase() }} style={{ width:0.7*screenWidth, height:50, borderRadius: 25, borderWidth:2, borderColor: colors.menuBackground.hex, alignItems:'center', justifyContent:'center'}}>
            <Text style={{fontSize:18, color: colors.menuBackground.hex, fontWeight: 'bold'}}>{"I'm sure, do it!"}</Text>
          </TouchableOpacity>
        </View>
      </Background>
    );
  }
}
