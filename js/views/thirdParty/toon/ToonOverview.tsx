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
import {Actions} from "react-native-router-flux";
import {ScaledImage} from "../../components/ScaledImage";
import {deviceStyles} from "../../deviceViews/DeviceOverview";


export class ToonOverview extends Component<any, any> {
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

    let toonIds = Object.keys(sphere.thirdParty.toons);
    toonIds.forEach((toonId) => {
      items.push({
        label: sphere.thirdParty.toons[toonId].toonAddress,
        type: 'navigation',
        callback: () => {
          Actions.toonSettings({ sphereId: this.props.sphereId, toonId: toonId })
        }
      });
    })


    items.push({type:'spacer'})

    items.push({
      label: "Disconnect from Toon",
      type: 'button',
      icon: <IconButton name={'md-log-out'} size={22} color={colors.white.hex} buttonStyle={{backgroundColor:colors.menuRed.hex}}/>,
      callback: () => {
        Alert.alert("Are you sure", "You will have to add Toon again to undo this.",[{text:"Cancel", style:'cancel'},{text:"Yes", onPress:() => {
            this.props.eventBus.emit("showLoading","Removing the integration with Toon...")
            this.deleting = true;
            CLOUD.forSphere(this.props.sphereId).thirdParty.toon.deleteToonsInCrownstoneCloud()
              .then(() => {
                this.props.store.dispatch({
                  type: 'REMOVE_ALL_TOONS',
                  sphereId: this.props.sphereId,
                });
                BackAction()
                this.props.eventBus.emit("hideLoading")
              })
              .catch((err) => {
                this.props.eventBus.emit("hideLoading")
              })
          }}])
      }
    });
    items.push({
      type:'explanation',
      below: true,
      label: "This will remove the Toon integration for all users in your Sphere."
    })
    items.push({type:'spacer'})

    return items;
  }


  render() {
    let state = this.props.store.getState();
    let sphere = state.spheres[this.props.sphereId];

    return (
      <Background image={this.props.backgrounds.menu} hasNavBar={false} safeView={true}>
        <OrangeLine/>
        <View style={{flex:1, alignItems:'center'}}>
          <View style={{flex:1}} />
          <ScaledImage source={require('../../../images/thirdParty/logo/Works-with-Toon.png')} targetWidth={0.6*screenWidth} sourceWidth={535} sourceHeight={140} />
          <View style={{flex:1}} />
          <Text style={[deviceStyles.errorText,{color:colors.menuBackground.hex, paddingLeft: 15, paddingRight:15}]}>{"There are multiple Toon's on your account.\n\nPick one to configure it!"}</Text>
          <View style={{flex:1}} />
          <ListEditableItems items={this._getItems(sphere)} separatorIndent={true} />
          <View style={{flex:1}} />
        </View>
      </Background>
    );
  }
}
