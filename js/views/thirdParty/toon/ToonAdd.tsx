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
import {CancelButton} from "../../components/topbar/CancelButton";
import {TopbarButton} from "../../components/topbar/TopbarButton";
import {BackAction} from "../../../util/Back";
import {Background} from "../../components/Background";
import {ListEditableItems} from "../../components/ListEditableItems";
import {colors, OrangeLine, screenHeight, screenWidth, tabBarHeight} from "../../styles";
import {deviceStyles} from "../../deviceViews/DeviceOverview";
import {IconButton} from "../../components/IconButton";
import {toonConfig} from "../../../sensitiveData/toonConfig";
import {NativeBus} from "../../../native/libInterface/NativeBus";
import {CLOUD} from "../../../cloud/cloudAPI";
import {request} from "../../../cloud/cloudCore";


export class ToonAdd extends Component<any, any> {
  static navigationOptions = ({ navigation }) => {
    const { params } = navigation.state;
    return {
      title: "Toon Thermostat",
      headerLeft: <CancelButton onPress={BackAction} />,
      headerRight: <TopbarButton
        text={"Create"}
        onPress={() => {
          params.rightAction ? params.rightAction() : () => {}
        }}
      />
    }
  };


  unsubscribeNativeEvent : any;

  constructor(props) {
    super(props);

    this.state = {
      processing: false,
      failed:     false,
    }

    this.unsubscribeNativeEvent = NativeBus.on(NativeBus.topics.callbackUrlInvoked, (url) => {
      this.setState({processing: true});
      this.process(url);
    })

  }


  process(url) {
    let codeExtractRegex = /code=(.*?)&/gm;
    let result = codeExtractRegex.exec(url);
    if (!result || result.length != 2) { return this.setState({failed: true}); }

    let code = result[1];

    CLOUD.thirdParty.toon.getAccessToken(code)
      .then((data) => {
        console.log("Data",data)
      })
  }

  componentWillUnmount() {
    this.unsubscribeNativeEvent();
  }

  _getItems() {
    let items = [];
    return items;
  }

  _getIcon() {
    if (this.state.failed) {
      return (
        <IconButton
          name="c3-addRoundedBold"
          size={0.15*screenHeight}
          color="#fff"
          buttonStyle={{width: 0.2*screenHeight, height: 0.2*screenHeight, backgroundColor:colors.csOrange.hex, borderRadius: 0.03*screenHeight}}
          style={{position:'relative'}}
        />
      );
    }
    else if (this.state.processing) {
      return (
        <View style={{flex:1, alignItems:'center', justifyContent:'center'}}>
          <ActivityIndicator animating={true} size="large" />
        </View>
      );
    }
    else {
      return (
        <IconButton
          name="c3-addRoundedBold"
          size={0.15*screenHeight}
          color="#fff"
          buttonStyle={{width: 0.2*screenHeight, height: 0.2*screenHeight, backgroundColor:colors.csOrange.hex, borderRadius: 0.03*screenHeight}}
          style={{position:'relative'}}
        />
      );
    }
  }

  _getText() {
    if (this.state.failed) {
      return (
        <Text style={[deviceStyles.errorText,{color:colors.menuBackground.hex}]}>{
          "Failed to connect :("
        }</Text>
      )
    }
    else if (this.state.processing) {
      return (
        <Text style={[deviceStyles.errorText,{color:colors.menuBackground.hex}]}>{
          "Connecting to Toon... This shouldn't take long!"
        }</Text>
      )
    }
    else {
      return (
        <Text style={[deviceStyles.errorText,{color:colors.menuBackground.hex}]}>{
          "When you integrate your Toon with Crownstone, you can use the indoor localization together with your heating!\n\n" +
          "When your Toon is set to Away and you're still at home, Crownstone will set Toon's program to home as long as you're home.\n\n" +
          "Tap the button below to get started!"
        }</Text>
      )
    }
  }

  _getButton() {
    if (this.state.failed) {
      return null;
    }
    else if (this.state.processing) {
      return (
        <View style={{ width:0.7*screenWidth, height:50, borderRadius: 25, borderWidth:2, borderColor: colors.menuBackground.rgba(0.3), alignItems:'center', justifyContent:'center'}}>
          <Text style={{fontSize:18, color: colors.menuBackground.rgba(0.3), fontWeight: 'bold'}}>{"Working...."}</Text>
        </View>
      )
    }
    else {
      return (
        <TouchableOpacity onPress={() => {
          Linking.openURL('https://api.toon.eu/authorize?response_type=code&client_id=' + toonConfig.clientId).catch(() => {})
        }} style={{ width:0.7*screenWidth, height:50, borderRadius: 25, borderWidth:2, borderColor: colors.menuBackground.hex, alignItems:'center', justifyContent:'center'}}>
          <Text style={{fontSize:18, color: colors.menuBackground.hex, fontWeight: 'bold'}}>{"Connect to Toon!"}</Text>
        </TouchableOpacity>
      )
    }

  }


  render() {
    return (
      <Background image={this.props.backgrounds.menu} hasNavBar={false} safeView={true}>
        <OrangeLine/>
        <View style={{flex:1, alignItems:'center', padding: 20}}>
          <Text style={[deviceStyles.header,{color:colors.menuBackground.hex}]}>Integration with Toon</Text>
          <View style={{flex:1}} />
          { this._getIcon() }
          <View style={{flex:1}} />
          { this._getText() }
          <View style={{flex:1}} />
          { this._getButton() }
        </View>
      </Background>
    );
  }
}
