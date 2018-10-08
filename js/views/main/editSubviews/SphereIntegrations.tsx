import { Languages } from "../../../Languages"
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
      title: Languages.title("SphereIntegrations", "Integrations")(),
    }
  };


  _getItemsAlternative() {
    let items = [];

    items.push({label: Languages.label("SphereIntegrations", "Here_you_can_integrate_wi")(),  type:'largeExplanation'});

    items.push({label: Languages.label("SphereIntegrations", "Thermostats_")(),  type:'largeExplanation'});
    items.push({
      label: Languages.label("SphereIntegrations", "Toon")(),
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

    items.push({label: Languages.label("SphereIntegrations", "Coming_Soon_")(),  type:'largeExplanation'});


    items.push({
      label: Languages.label("SphereIntegrations", "Philips_Hue")(),
      type: 'navigation',
      largeIcon:
        <View style={{width:55, height:55, borderRadius:12, alignItems:"center", justifyContent:"center", overflow:'hidden'}}>
          <ScaledImage source={require("../../../images/thirdParty/logo/philipsHue.png")} targetWidth={55} targetHeight={55} sourceWidth={600} sourceHeight={600} />
        </View>,
      callback: () => {
        Alert.alert(
Languages.alert("SphereIntegrations", "_Working_on_it___Support__header")(),
Languages.alert("SphereIntegrations", "_Working_on_it___Support__body")(),
[{text:Languages.alert("SphereIntegrations", "_Working_on_it___Support__left")()}])
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
