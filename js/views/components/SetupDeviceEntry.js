import React, { Component } from 'react' 
import {
  Alert,
  Animated,
  ActivityIndicator,
  Dimensions,
  Image,
  PixelRatio,
  Switch,
  TouchableOpacity,
  TouchableHighlight,
  Text,
  View
} from 'react-native';

import { stoneTypes } from '../../router/store/reducers/stones'
import { Icon } from './Icon';
import { styles, colors, screenWidth } from '../styles'
import { CLOUD } from '../../cloud/cloudAPI'
import { NativeBus } from '../../native/Proxy'
import { BLEutil, SetupCrownstone } from '../../native/BLEutil'
import { LOG, LOGDebug, LOGError } from '../../logging/Log'


export class SetupDeviceEntry extends Component {
  constructor(props) {
    super();

    this.baseHeight = props.height || 80;
    this.unsubscribe = () => {};

    this.state = {
      progressWidth: new Animated.Value(0),
      name: 'New Crownstone',
      explanation:'',
      subtext: 'Click here to add it to this Sphere!',
      claimingInProgress: false
    };

    this.currentLoadingWidth = 0;
    this.disabled = props.disabled || false;
    this.stoneIdDuringSetup = undefined;
  }

  componentDidMount() {
    if (this.props.disabled === true) {
      this.setProgress(-1);
      this.disabled = true;
    }
  }

  componentWillUpdate(nextProps) {
    LOG("will update", nextProps.disabled, this.disabled);
    if (nextProps.disabled === true && this.disabled === false) {
      this.setProgress(-1);
      this.disabled = true;
    }
    else if (nextProps.disabled === false && this.disabled === true) {
      this.setProgress(0);
      this.disabled = false;
    }
  }

  componentWillUnmount() { // cleanup
    this.unsubscribe();
  }

  _getActivityIndicator() {
    if (this.state.claimingInProgress) {
      return (
        <View style={{height: this.baseHeight, width: 60, alignItems: 'flex-end', justifyContent: 'center'}}>
          <ActivityIndicator animating={true} size="large"/>
        </View>
      );
    }
  }


  _getIcon() {
    let color = colors.blinkColor1.hex;
    if (this.disabled === true)
      color = colors.gray.hex;
    else if (this.state.claimingInProgress === true)
       color = colors.blinkColor2.hex;

    let typedIcon = this._getTypedIcon();

    return (
      <View style={[{
        width:60,
        height:60,
        borderRadius:30,
        backgroundColor: color,
        }, styles.centered]}>
        <Icon name={typedIcon} size={35} color={'#ffffff'} style={{position:'relative', top:2, backgroundColor:'transparent'}} />
      </View>
    );
  }

  recoverFromError() {
    setTimeout(() => {this.props.eventBus.emit("setupCancelled", this.props.handle);},10);
    if (this.stoneIdDuringSetup !== undefined) {
      this.props.store.dispatch({
        type: "REMOVE_STONE",
        sphereId: this.props.sphereId,
        stoneId: this.stoneIdDuringSetup,
      });
      this.stoneIdDuringSetup = undefined;
    }
    this.setProgress(0);
  }

  setProgress(value = 0) {
    // console.log("SETUP PROGRESS:", value);
    switch(value) {
      case -1:
        this.setState({explanation:'Another Crownstone is already pairing.', subtext:'Pairing in progress...', claimingInProgress:false});
        break;
      case 0:
        this.setState({explanation:'', subtext:'Click here to add it to this Sphere!', claimingInProgress:false});
        break;
      case 1:
        this.props.eventBus.emit("setupInProgress", this.props.handle);
        this.setState({subtext:"Claiming... Please stay close to it!", claimingInProgress:true});
        break;
      case 3:
        this.setState({explanation:"Registering in the Cloud..."});
        break;
      case 4:
        this.setState({explanation:"Registered. Setting up Crownstone..."});
        break;
      case 19:
        this.setState({subtext:"Finalizing setup...", explanation:"Rebooting Crownstone..."});
        setTimeout(() => {this.props.eventBus.emit("setupComplete", this.props.handle);}, 4000); // give some time for reboot
        break;
    }

    let max = 19;
    let loadingWidth = screenWidth * (Math.max(0,value)/max);
    if (this.currentLoadingWidth !== loadingWidth) {
      this.currentLoadingWidth = loadingWidth;
      Animated.timing(this.state.progressWidth, {toValue: loadingWidth, duration: 100}).start();
    }
  }

  render() {
    let loadingHeight = 5;
    return (
      <View style={{flexDirection: 'column', height: this.baseHeight, flex: 1}}>
        <View style={{flexDirection: 'row', height: this.baseHeight, paddingRight: 0, paddingLeft: 0, flex: 1}}>
          <TouchableOpacity style={{paddingRight: 20, height: this.baseHeight, justifyContent: 'center'}} onPress={() => {this.claim();}}>
            {this._getIcon()}
          </TouchableOpacity>
          <TouchableOpacity style={{flex: 1, height: this.baseHeight, justifyContent: 'center'}} onPress={() => {this.claim();}}>
            <View style={{flexDirection: 'column'}}>
              <Text style={{fontSize: 17, fontWeight: '100'}}>{this.state.name}</Text>
              <Text style={{fontSize: 12}}>{this.state.subtext}</Text>
              <Text style={{fontSize: 10}}>{this.state.explanation}</Text>
            </View>
          </TouchableOpacity>
          {this._getActivityIndicator()}
        </View>
        <Animated.View style={{position:'relative', left:-15, top:-loadingHeight, width: this.state.progressWidth, height:loadingHeight, backgroundColor:colors.green2.hex}} />
      </View>
    );
  }

  claim() {
    if (this.props.disabled === false) {
      let setupStone = new SetupCrownstone(this.props.handle);
      this.interrogateStone(setupStone);
    }
  }

  interrogateStone(crownstone) {
    this.setProgress(1);
    return crownstone.connect()
      .then(() => {
        this.setProgress(2);
        return crownstone.getMACAddress();
      })
      .then((MACAddress) => {
        this.setProgress(3);
        this.registerStone(crownstone, MACAddress);
      })
      .catch((err) => {
        this.recoverFromError();
        crownstone.disconnect();
      })
  }

  _getTypedName() {
    let name = 'New stone';
    if (this.props.item.isCrownstonePlug)         { name = 'Crownstone Plug'; }
    else if (this.props.item.isCrownstoneBulitin) { name = 'Crownstone Builtin'; }
    else if (this.props.item.isGuidestone)        { name = 'Guidestone'; }
    return name;
  }

  _getTypedIcon() {
    let typedIcon = 'ios-help-circle';
    if (this.props.item.isCrownstonePlug) {
      typedIcon = 'c2-pluginFilled';
    }
    else if (this.props.item.isCrownstoneBulitin) {
      typedIcon = 'c2-crownstone';
    }
    else if (this.props.item.isGuidestone) {
      typedIcon = 'c2-crownstone';
    }
    return typedIcon;
  }

  _getType() {
    if (this.props.item.isCrownstonePlug)         { return stoneTypes.plug; }
    else if (this.props.item.isCrownstoneBuiltin) { return stoneTypes.builtin; }
    else if (this.props.item.isGuidestone)        { return stoneTypes.guidestone; }
    else {
      LOGError("UNKNOWN DEVICE in setup procedure", this.props.item);
    }
  }

  registerStone(crownstone, MACAddress) {
    const {store} = this.props;
    const processSuccess = (cloudResponse) => {
      this.setProgress(4);
      LOG("received from cloud:",cloudResponse);
      this.stoneIdDuringSetup = cloudResponse.id;

      store.dispatch({
        type:           "ADD_STONE",
        sphereId:       this.props.sphereId,
        stoneId:        cloudResponse.id,
        data: {
          name:           this._getTypedName(),
          type:           this._getType(),
          icon:           this._getTypedIcon(),
          touchToToggle:  this.props.item.isGuidestone == false,
          crownstoneId:   cloudResponse.uid,
          handle:         crownstone.getHandle(),
          macAddress:     MACAddress,
          iBeaconMajor:   cloudResponse.major,
          iBeaconMinor:   cloudResponse.minor,
        }
      });
      this.claimStone(crownstone, cloudResponse.id);
    };

    const processFailure = () => {
      Alert.alert("Whoops!", "Something went wrong in the Cloud. Please try again later.",[{text:"OK", onPress:() => {
        crownstone.disconnect();
        this.recoverFromError();
      }}]);
    };
    CLOUD.forSphere(this.props.sphereId).createStone(this.props.sphereId, MACAddress, this._getType())
      .then(processSuccess)
      .catch((err) => {
        if (err.status === 422) {
          CLOUD.forSphere(this.props.sphereId).findStone(MACAddress)
            .then((foundCrownstones) => {
              if (foundCrownstones.length === 1) {
                processSuccess(foundCrownstones[0]);
              }
              else {
                processFailure();
              }
            })
            .catch((err) => {
              LOGError("CONNECTION ERROR:",err);
              processFailure();
            })
        }
        else {
          LOGError("CONNECTION ERROR:",err);
          processFailure();
        }
      });
  }

  claimStone(crownstone, stoneId) {
    const {store} = this.props;
    const state = store.getState();
    let sphereId = this.props.sphereId;
    let sphereData = state.spheres[sphereId].config;
    let stoneData = state.spheres[sphereId].stones[stoneId].config;

    let data = {};
    data.crownstoneId      = stoneData.crownstoneId;
    data.adminKey          = sphereData.adminKey;
    data.memberKey         = sphereData.memberKey;
    data.guestKey          = sphereData.guestKey;
    data.meshAccessAddress = sphereData.meshAccessAddress || 2789430350;
    data.ibeaconUUID       = sphereData.iBeaconUUID;
    data.ibeaconMajor      = stoneData.iBeaconMajor;
    data.ibeaconMinor      = stoneData.iBeaconMinor;

    NativeBus.on(NativeBus.topics.setupProgress, (progress) => {
      this.setProgress(progress + 4);
    });

    crownstone.connect()
      .then(() => { return crownstone.setup(data); })
      .then(() => {
        this.setProgress(18);
        setTimeout(() => { this.setProgress(19); }, 300);
        setTimeout(() => { /* todo: finalize */ }, 1800);
      })
      .catch((err) => {
        LOGError("Could not setup the Crownstone:", err);
        if (err == "INVALID_SESSION_DATA") {
          Alert.alert("Encryption might be off","Error: INVALID_SESSION_DATA, which usually means encryption in this Crownstone is turned off. This app requires encryption to be on.",[{text:'OK'}]);
        }
        crownstone.disconnect().catch();
        this.cleanupFailedAttempt(stoneId);
        this.recoverFromError();
      })

  }

  cleanupFailedAttempt(stoneId) {
    CLOUD.forSphere(this.props.sphereId).deleteStone(stoneId).catch((err) => {LOGError("COULD NOT CLEAN UP AFTER SETUP", err)})
  }
}