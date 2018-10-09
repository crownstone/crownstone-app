
import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("SphereIntegrations", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  Alert,
  Dimensions,
  TouchableHighlight,
  PixelRatio,
  ScrollView,
  Switch,
  Text,
  View
} from 'react-native';
import { Background } from '../../components/Background'
import { ListEditableItems } from '../../components/ListEditableItems'
import { IconButton } from '../../components/IconButton'
const Actions = require('react-native-router-flux').Actions;
import { colors } from '../../styles';
import {Permissions} from "../../../backgroundProcesses/PermissionManager";
import {OrangeLine} from "../../styles";
import {ScaledImage} from "../../components/ScaledImage";

export class SphereIntegrations extends Component<any, any> {
  static navigationOptions = ({ navigation }) => {
    return {
      title: lang("Integrations"),
    }
  };


  _getItemsAlternative() {
    let items = [];

    items.push({label: lang("Here_you_can_integrate_wi"),  type:'largeExplanation'});

    items.push({label: lang("Thermostats_"),  type:'largeExplanation'});
    items.push({
      label: lang("Toon"),
      type: 'navigation',
      largeIcon: <ScaledImage source={require('../../../images/thirdParty/logo/toonLogo.png')} targetWidth={65} targetHeight={45} sourceWidth={1000} sourceHeight={237}/>,
      callback: () => {
        let state = this.props.store.getState();
        let sphere = state.spheres[this.props.sphereId];
        let toonIds = Object.keys(sphere.thirdParty.toons)
        if (toonIds.length === 1) {
          Actions.toonSettings({sphereId: this.props.sphereId, toonId: toonIds[0]});
        }
        else if (toonIds.length > 1) {
          Actions.toonOverview({sphereId: this.props.sphereId});
        }
        else {
          Actions.toonAdd({sphereId: this.props.sphereId});
        }
      }
    });

    items.push({label: lang("Coming_Soon_"),  type:'largeExplanation'});


    items.push({
      label: lang("Philips_Hue"),
      type: 'navigation',
      largeIcon:
        <View style={{width:55, height:55, borderRadius:12, alignItems:"center", justifyContent:"center", overflow:'hidden'}}>
          <ScaledImage source={require("../../../images/thirdParty/logo/philipsHue.png")} targetWidth={55} targetHeight={55} sourceWidth={600} sourceHeight={600} />
        </View>,
      callback: () => {
        Alert.alert(
lang("_Working_on_it___Support__header"),
lang("_Working_on_it___Support__body"),
[{text:lang("_Working_on_it___Support__left")}])
      }
    });


    items.push({type:'spacer'});
    items.push({type:'spacer'});
    items.push({type:'spacer'});

    return items;
  }




  render() {
    return (
      <Background image={this.props.backgrounds.menu} hasNavBar={false} >
        <OrangeLine/>
        <ScrollView>
          <ListEditableItems items={this._getItemsAlternative()} />
        </ScrollView>
      </Background>
    );
  }
}
