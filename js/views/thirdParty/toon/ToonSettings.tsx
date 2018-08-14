import * as React from 'react'; import { Component } from 'react';
import {
  Alert,
  ActivityIndicator,
  Dimensions,
  Image,
  Linking,
  PixelRatio,
  ScrollView,
  Switch,
  Text,
  TouchableHighlight,
  TouchableOpacity,
  View
} from 'react-native';
import {BackAction} from "../../../util/Back";
import {Background} from "../../components/Background";
import {ListEditableItems} from "../../components/ListEditableItems";
import {colors, OrangeLine, screenHeight, screenWidth, tabBarHeight} from "../../styles";
import {IconButton} from "../../components/IconButton";
import {CLOUD} from "../../../cloud/cloudAPI";
import {ScaledImage} from "../../components/ScaledImage";
import {deviceStyles} from "../../deviceViews/DeviceOverview";


export class ToonSettings extends Component<any, any> {
  static navigationOptions = ({ navigation }) => {
    const { params } = navigation.state;
    return {
      title: "Toon"
    }
  };


  unsubscribe;
  deleting;

  constructor(props) {
    super(props);
  }

  componentDidMount() {
    this.unsubscribe = this.props.eventBus.on("databaseChange", (data) => {
      let change = data.change;
      if  (change.updatedToon && this.deleting !== true) {
        this.forceUpdate();
      }
    });
  }

  componentWillUnmount() {
    this.unsubscribe();
  }

  _getItems(sphere) {
    let items = [];

    items.push({
      label: "Use this phone",
      value: sphere.thirdParty.toons[this.props.toonId].enabled,
      type: 'switch',
      icon: <IconButton name="md-phone-portrait" size={22} button={true} color="#fff" buttonStyle={{backgroundColor: colors.csOrange.hex}}/>,
      callback: (newValue) => {
        this.props.store.dispatch({
          type: 'TOON_UPDATE_SETTINGS',
          sphereId: this.props.sphereId,
          toonId: this.props.toonId,
          data: { enabled: newValue}
        });
      }
    });

    items.push({type:'spacer'})

    if (Object.keys(sphere.thirdParty.toons).length === 1) {
      items.push({
        label: "Disconnect from Toon",
        type: 'button',
        icon: <IconButton name={'md-log-out'} size={22} color={colors.white.hex} buttonStyle={{backgroundColor: colors.menuRed.hex}}/>,
        callback: () => {
          Alert.alert("Are you sure", "You will have to add Toon again to undo this.", [{
            text: "Cancel",
            style: 'cancel'
          }, {
            text: "Yes", onPress: () => {
              this.props.eventBus.emit("showLoading", "Removing the integration with Toon...")
              this.deleting = true;
              CLOUD.forSphere(this.props.sphereId).thirdParty.toon.deleteToonsInCrownstoneCloud(false)
                .then(() => {
                  this.props.store.dispatch({
                    type: 'REMOVE_ALL_TOONS',
                    sphereId: this.props.sphereId,
                  });
                  BackAction('sphereIntegrations')
                  this.props.eventBus.emit("hideLoading")
                })
                .catch((err) => {
                  this.props.eventBus.emit("hideLoading")
                  Alert.alert("Whoops", "Something went wrong...", [{text:'OK'}])
                })
            }
          }])
        }
      });
      items.push({
        type: 'explanation',
        below: true,
        label: "This will remove the Toon integration for all users in your Sphere."
      })
      items.push({type: 'spacer'})

    }
    return items;
  }


  render() {
    let state = this.props.store.getState();
    let sphere = state.spheres[this.props.sphereId];
    let textStyle = {
      fontSize: 14,
      textAlign:'center',
      color:colors.menuBackground.hex,
      paddingLeft: 0.075*screenWidth, paddingRight:0.075*screenWidth
    };
    return (
      <Background image={this.props.backgrounds.menu} hasNavBar={false} safeView={true}>
        <OrangeLine/>
        <View style={{flex:1, alignItems:'center'}}>
          <View style={{flex:1}} />
          <ScaledImage source={require('../../../images/thirdParty/logo/toonLogo.png')} targetWidth={0.6*screenWidth} sourceWidth={1000} sourceHeight={237} />
          <View style={{flex:1}} />
          <Text style={[textStyle, {fontWeight: '600', fontSize: 16}]}>{"Crownstone and Toon are connected!"}</Text>
          <View style={{flex:1}} />
          <Text style={textStyle}>{"Sometimes, Toon is set to \"Away\" while you're still there..."}</Text>
          <View style={{flex:0.5}} />
          <Text style={textStyle}>{"...but Crownstone can set it to \"Home\" as long as you're home!"}</Text>
          <View style={{flex:1}} />
          <Text style={textStyle}>{"Should this phone tell Toon when it's home?"}</Text>
          <View style={{flex:0.2}} />
          <ListEditableItems items={this._getItems(sphere)} separatorIndent={true} />
          <View style={{flex:1}} />
        </View>
      </Background>
    );
  }
}
