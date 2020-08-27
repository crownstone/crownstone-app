
import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("SphereIntegrations", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  Alert,
  ScrollView,
  View
} from 'react-native';
import { Background } from '../../components/Background'
import { ListEditableItems } from '../../components/ListEditableItems'

import {ScaledImage} from "../../components/ScaledImage";
import { core } from "../../../core";
import { NavigationUtil } from "../../../util/NavigationUtil";
import { TopBarUtil } from "../../../util/TopBarUtil";
import { LiveComponent } from "../../LiveComponent";

export class SphereIntegrations extends LiveComponent<any, any> {
  static options(props) {
    return TopBarUtil.getOptions({title: lang("Integrations"), closeModal: props.isModal ? true : undefined })
  }


  _getItemsAlternative() {
    let items = [];

    items.push({label: lang("Here_you_can_integrate_wi"),  type:'largeExplanation'});

    items.push({label: lang("Thermostats_"),  type:'largeExplanation'});
    items.push({
      label: lang("Toon"),
      type: 'navigation',
      largeIcon: <ScaledImage source={require('../../../images/thirdParty/logo/toonLogo.png')} targetWidth={65} targetHeight={45} sourceWidth={1000} sourceHeight={237}/>,
      callback: () => {
        let state = core.store.getState();
        let sphere = state.spheres[this.props.sphereId];
        let toonIds = Object.keys(sphere.thirdParty.toons);
        if (toonIds.length === 1) {
          NavigationUtil.navigate( "ToonSettings",{sphereId: this.props.sphereId, toonId: toonIds[0]});
        }
        else if (toonIds.length > 1) {
          NavigationUtil.navigate( "ToonOverview",{sphereId: this.props.sphereId});
        }
        else {
          NavigationUtil.launchModal( "ToonAdd",{sphereId: this.props.sphereId});
        }
      }
    });

    items.push({label: lang("Smart_assistants"),  type:'largeExplanation'});
    items.push({
      label: lang("Amazon_Alexa"),
      type: 'navigation',
      largeIcon: <ScaledImage source={require('../../../images/thirdParty/logo/amazonAlexa.png')} targetWidth={52} targetHeight={52} sourceWidth={264} sourceHeight={265}/>,
      callback: () => {
       NavigationUtil.navigate( "AlexaOverview",{sphereId: this.props.sphereId});
      }
    });
    items.push({
      label: "Google Assistant",
      type: 'navigation',
      largeIcon: <ScaledImage source={require('../../../images/thirdParty/logo/googleAssistant_vertical_crop.png')} targetWidth={60} targetHeight={60} sourceWidth={842} sourceHeight={794}/>,
      callback: () => {
        NavigationUtil.navigate( "GoogleAssistantOverview",{sphereId: this.props.sphereId});
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
      <Background image={core.background.menu} hasNavBar={false} >
                <ScrollView>
          <ListEditableItems items={this._getItemsAlternative()} />
        </ScrollView>
      </Background>
    );
  }
}
