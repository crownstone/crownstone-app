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


export class ToonSettings extends Component<any, any> {
  static navigationOptions = ({ navigation }) => {
    const { params } = navigation.state;
    return {
      title: "Toon"
    }
  };

  constructor(props) {
    super(props);
  }

  _getItems(sphere) {
    let items = [];

    items.push({
      type:'largeExplanation',
      label:  "Using Toon, you can use the indoor localization together with your heating!\n\n" +
        "When your Toon is set to \"Away\" and you're still at home, Crownstone will set Toon's program to \"Home\" as long as you're home."
    })

    items.push({type:'spacer'})

    items.push({
      label: "Use Toon",
      value: sphere.thirdParty.toon.enabled,
      type: 'switch',
      icon: <IconButton name="ios-thermometer" size={22} button={true} color="#fff" buttonStyle={{backgroundColor: colors.csOrange.hex}}/>,
      callback: (newValue) => {
        this.props.store.dispatch({
          type: 'TOON_UPDATE_SETTINGS',
          data: { enabled: newValue}
        });
      }
    });

    items.push({type:'spacer'})

    items.push({
      label: "Disconnect from Toon",
      type: 'button',
      icon: <IconButton name={'md-log-out'} size={22} color={colors.white.hex} buttonStyle={{backgroundColor:colors.menuRed.hex}}/>,
      callback: () => {
        Alert.alert("Are you sure", "You will have to add Toon again to undo this.",[{text:"Cancel", style:'cancel'},{text:"Yes", onPress:() => {
          this.props.store.dispatch({ type: 'TOON_DISABLE_TOON' })
          BackAction()
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
        <View style={{flex:1}}>
          <ListEditableItems items={this._getItems(sphere)} separatorIndent={true} />
        </View>
      </Background>
    );
  }
}
