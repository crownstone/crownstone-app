import { LiveComponent }          from "../../LiveComponent";

import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("ToonOverview", key)(a,b,c,d,e);
}
import * as React from 'react';
import {
  Alert,
  Text,
  View
} from 'react-native';
import {Background} from "../../components/Background";
import {ListEditableItems} from "../../components/ListEditableItems";
import { background, colors, deviceStyles, screenWidth } from "../../styles";
import {IconButton} from "../../components/IconButton";
import {CLOUD} from "../../../cloud/cloudAPI";

import {ScaledImage} from "../../components/ScaledImage";
import { core } from "../../../Core";
import { NavigationUtil } from "../../../util/NavigationUtil";
import { TopBarUtil } from "../../../util/TopBarUtil";


export class ToonOverview extends LiveComponent<any, any> {
  static options(props) {
    return TopBarUtil.getOptions({title:  lang('Toon')});
  }


  unsubscribe;
  deleting;

  constructor(props) {
    super(props);
  }

  componentDidMount() {
    this.unsubscribe = core.eventBus.on("databaseChange", (data) => {
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
          NavigationUtil.navigate( "ToonSettings",{ sphereId: this.props.sphereId, toonId: toonId })
        }
      });
    });


    items.push({type:'spacer'});

    items.push({
      label: lang("Disconnect_from_Toon"),
      type: 'button',
      icon: <IconButton name={'md-log-out'} size={22} color={colors.white.hex} buttonStyle={{backgroundColor:colors.menuRed.hex}}/>,
      callback: () => {
        Alert.alert(
lang("_Are_you_sure__You_will_h_header"),
lang("_Are_you_sure__You_will_h_body"),
[{text:lang("_Are_you_sure__You_will_h_left"), style:'cancel'},{
text:lang("_Are_you_sure__You_will_h_right"), onPress:() => {
            core.eventBus.emit("showLoading","Removing the integration with Toon...");
            this.deleting = true;
            CLOUD.forSphere(this.props.sphereId).thirdParty.toon.deleteToonsInCrownstoneCloud()
              .then(() => {
                core.store.dispatch({
                  type: 'REMOVE_ALL_TOONS',
                  sphereId: this.props.sphereId,
                });
                NavigationUtil.back();
                core.eventBus.emit("hideLoading")
              })
              .catch((err) => {
                core.eventBus.emit("hideLoading")
              })
          }}])
      }
    });
    items.push({
      type:'explanation',
      below: true,
      label: lang("This_will_remove_the_Toon")});
    items.push({type:'spacer'});

    return items;
  }


  render() {
    let state = core.store.getState();
    let sphere = state.spheres[this.props.sphereId];

    return (
      <Background image={background.menu} hasNavBar={false}>
                <View style={{flex:1, alignItems:'center'}}>
          <View style={{flex:1}} />
          <ScaledImage source={require('../../../../assets/images/thirdParty/logo/Works-with-Toon.png')} targetWidth={0.6*screenWidth} sourceWidth={535} sourceHeight={140} />
          <View style={{flex:1}} />
          <Text style={[deviceStyles.errorText,{color:colors.menuBackground.hex, paddingLeft: 15, paddingRight:15}]}>{ lang("There_are_multiple_Toons_") }</Text>
          <View style={{flex:1}} />
          <ListEditableItems items={this._getItems(sphere)} separatorIndent={true} />
          <View style={{flex:1}} />
        </View>
      </Background>
    );
  }
}
