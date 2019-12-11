import { LiveComponent }          from "../../LiveComponent";

import * as React from 'react';
import { colors, screenWidth } from "../../styles";
import {Background} from "../../components/Background";
import { core } from "../../../core";
import MapView, { Marker } from "react-native-maps";
import { Util } from "../../../util/Util";
import { BehaviourSubmitButton } from "../../deviceViews/smartBehaviour/supportComponents/BehaviourSubmitButton";
import { ActivityIndicator, TouchableOpacity, View, ViewStyle } from "react-native";
import { NavigationUtil } from "../../../util/NavigationUtil";
import { Icon } from "../../components/Icon";
import { BluenetPromiseWrapper } from "../../../native/libInterface/BluenetPromise";
import { LOG, LOGe } from "../../../logging/Log";

export class SphereEditMap extends LiveComponent<any, any> {
  static options(props) {
    return {
      topBar: {
        title: {text: "Where shall I look?"},
      }
    }
  }

  map = null
  deleting : boolean;
  validationState : any;
  unsubscribeStoreEvents : any;

  constructor(props) {
    super(props);
    let coordinates = Util.getSphereLocation(this.props.sphereId);

    this.state = {
      gettingLocation: false,
      coordinates: {
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
      }};
  }

  componentDidMount() {
    this.unsubscribeStoreEvents = core.eventBus.on("databaseChange", (data) => {
      let change = data.change;
      if (
        change.changeSpheres      && change.changeSpheres.sphereIds[this.props.sphereId]      ||
        change.changeSphereConfig && change.changeSphereConfig.sphereIds[this.props.sphereId]
      ) {
        if (this.deleting === false)
          this.forceUpdate();
      }
    });
  }


  componentWillUnmount() {
    this.unsubscribeStoreEvents();
  }

  _getCurrentLocation() {
    this.setState({gettingLocation: true})
    BluenetPromiseWrapper.requestLocation()
      .then((location) => {
        if (location && location.latitude && location.longitude) {
          this.setState({gettingLocation: false, coordinates: {latitude: location.latitude, longitude: location.longitude}}, () => {
            this.map.animateToRegion({
              latitude: this.state.coordinates.latitude,
              longitude: this.state.coordinates.longitude,
              latitudeDelta: 0.0922,
              longitudeDelta: 0.0421,
            })
          });

        }
        else {
          this.setState({gettingLocation: false})
        }
      })
      .catch((err) => {
        this.setState({gettingLocation: false})
      });
  }

  render() {
    let outerRadius = 50;
    let viewStyle : ViewStyle = {
      width: outerRadius,
      height:outerRadius,
      borderRadius:0.5*outerRadius,
      backgroundColor: colors.white.rgba(0.5),
      alignItems:'center',
      justifyContent:'center',
    };


    return (
      <Background image={core.background.menu} hasNavBar={false} >
        <MapView
          ref={(r) => { this.map = r }}
          style={{flex:1}}
          onPress={(e) => { this.setState({coordinates: e.nativeEvent.coordinate}); }}
          initialRegion={{
            latitude: this.state.coordinates.latitude,
            longitude: this.state.coordinates.longitude,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          }}
        >
          <Marker
            coordinate={this.state.coordinates}
            pinColor={colors.red.hex}
            onSelect={    () => { }}
            onDrag={      () => { }}
            onDragStart={ () => { }}
            onDragEnd={   (e) => { this.setState({coordinates: e.nativeEvent.coordinate});  }}
            onPress={     () => { }}
            draggable
          />
        </MapView>
        <View style={{ position:'absolute', top: 5, right:5, width: outerRadius, height:outerRadius,  alignItems:'center', justifyContent:'center',}}>
          <TouchableOpacity onPress={() => { this._getCurrentLocation() }} style={viewStyle}>
            { this.state.gettingLocation ? <ActivityIndicator size={"small"} color={colors.csBlue.hex} /> : <Icon name="md-locate" size={ 40 } color={ colors.csBlue.hex } /> }
          </TouchableOpacity>
        </View>

        <View style={{ position:'absolute', bottom: 30, width: screenWidth, alignItems:'center', justifyContent:'center' }}>
          <BehaviourSubmitButton
            callback={() => {
              core.store.dispatch({type: 'SET_SPHERE_GPS_COORDINATES', sphereId: this.props.sphereId, data: {latitude: this.state.coordinates.latitude, longitude: this.state.coordinates.longitude}});
              NavigationUtil.back();
            }}
            label={"Use this location!"}
          />
        </View>
      </Background>
    );
  }
}
