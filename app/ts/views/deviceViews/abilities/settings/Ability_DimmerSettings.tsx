
import { Languages } from "../../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("Ability_DimmerSettings", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  ScrollView,
  Text, View
} from "react-native";


import { background, colors, screenHeight, screenWidth, styles } from "../../../styles";
import {Background} from "../../../components/Background";
import {IconButton} from "../../../components/IconButton";
import {ScaledImage} from "../../../components/ScaledImage";
import { core } from "../../../../Core";
import { TopBarUtil } from "../../../../util/TopBarUtil";
import { Separator } from "../../../components/Separator";
import { ButtonBar } from "../../../components/editComponents/ButtonBar";
import { NavigationUtil } from "../../../../util/NavigationUtil";
import { NavigationBar } from "../../../components/editComponents/NavigationBar";
import { SliderBar } from "../../../components/editComponents/SliderBar";
import { DataUtil } from "../../../../util/DataUtil";
import { SwitchBar } from "../../../components/editComponents/SwitchBar";
import { xUtil } from "../../../../util/StandAloneUtil";
import { ABILITY_PROPERTY_TYPE_ID, ABILITY_TYPE_ID } from "../../../../database/reducers/stoneSubReducers/abilities";


export class Ability_DimmerSettings extends Component<any, any> {
  static options(props) {
    return TopBarUtil.getOptions({title: lang("Dimmer_Settings")});
  }

  storeEventUnsubscriber = null;

  constructor(props) {
    super(props);
    let stone = DataUtil.getStone(this.props.sphereId, this.props.stoneId);
    this.state = {
      softOnSpeed: Number(stone.abilities.dimming.properties.softOnSpeed.valueTarget)
    }
  }


  componentDidMount(): void {
    this.storeEventUnsubscriber = core.eventBus.on("databaseChange", (data) => {
      let change = data.change;
      if (change.stoneChangeAbilities && change.stoneChangeAbilities.stoneIds[this.props.stoneId]) {
        return this.forceUpdate();
      }
    });

  }

  componentWillUnmount(): void {
    this.storeEventUnsubscriber();
  }


  disable() {
    core.store.dispatch({type:"UPDATE_ABILITY", sphereId: this.props.sphereId, stoneId: this.props.stoneId, abilityId: ABILITY_TYPE_ID.dimming, data: { enabledTarget: false }});
    NavigationUtil.back();
  }

  _getExplanation(speed) {
    if (speed > 18) {
      return lang("Really_fast_")
    }
    else if (speed > 15) {
      return lang("Fast_")
    }
    else if (speed > 11) {
      return lang("Quickly_")
    }
    else if (speed > 7) {
      return lang("Normally_")
    }
    else if (speed > 3) {
      return lang("Gently__")
    }
    else if (speed > 0) {
      return lang("Slowly___")
    }
  }

  _getSoftOn() {
    let stone = DataUtil.getStone(this.props.sphereId, this.props.stoneId);

    if (stone) {
      if (xUtil.versions.canIUse(stone.config.firmwareVersion, '5.1.0') === false) {
        return (
          <View style={{backgroundColor: colors.white.hex, height:80, ...styles.centered}}>
            <Text style={{fontSize: 16, textAlign:'center'}}>{lang("Update_Crownstone_to_use_")}</Text>
          </View>
        );
      }
      return (
        <React.Fragment>
          <SwitchBar
            largeIcon={<IconButton name="md-bulb" buttonSize={44} size={30} radius={10} color="#fff" buttonStyle={{backgroundColor: colors.blue.hex}} />}
            label={lang("Use_smoothing")}
            value={this.state.softOnSpeed !== 0 && this.state.softOnSpeed !== 100}
            callback={(value) => {
              let numericValue = 8;
              if (!value) {
                numericValue = 100;
              }
              core.store.dispatch({type:"UPDATE_ABILITY_PROPERTY", sphereId: this.props.sphereId, stoneId: this.props.stoneId, abilityId: ABILITY_TYPE_ID.dimming, propertyId: ABILITY_PROPERTY_TYPE_ID.softOnSpeed, data: { valueTarget: numericValue }})
              this.setState({softOnSpeed: numericValue})
            }}
          />
            { Number(stone.abilities.dimming.properties.softOnSpeed.valueTarget) !== 0 && Number(stone.abilities.dimming.properties.softOnSpeed.valueTarget) !== 100 && (
              <SliderBar
                centerAlignLabel={true}
                label={ lang("Should_I_fade_slowly_or_q") }
                callback={(value) => {
                  core.store.dispatch({type:"UPDATE_ABILITY_PROPERTY", sphereId: this.props.sphereId, stoneId: this.props.stoneId, abilityId: ABILITY_TYPE_ID.dimming, propertyId: ABILITY_PROPERTY_TYPE_ID.softOnSpeed, data: { valueTarget: value }})
                  this.setState({softOnSpeed: value})
                }}
                min={1}
                max={20}
                value={this.state.softOnSpeed}
                explanation={this._getExplanation(this.state.softOnSpeed)}
              />
            )}
        </React.Fragment>
      );
    }
    return <View/>
  }


  render() {
    return (
      <Background hasNavBar={false} image={background.lightBlurLighter}>
        <ScrollView >
          <View style={{flex:1, alignItems:'center', justifyContent:'center'}}>
            <View style={{height:40}} />
            <ScaledImage source={require('../../../../../assets/images/overlayCircles/dimmingCircleGreen.png')} sourceWidth={600} sourceHeight={600} targetWidth={0.2*screenHeight} />
            <View style={{height:40}} />
            <Text style={styles.boldExplanation}>{ lang("Dimming_allows_you_to_set") }</Text>
            <Text style={styles.explanation}>{ lang("It_is_up_to_you_to_determ") }</Text>
            <Text style={styles.explanation}>{ lang("The_Crownstones_can_safel") }</Text>
            <View style={{height:10}} />
            <View style={{width:screenWidth}}>
              <Separator fullLength={true} />
              <NavigationBar
                setActiveElement={()=>{ }}
                largeIcon={<IconButton name="md-information-circle" buttonSize={44} size={30} radius={10} color="#fff" buttonStyle={{backgroundColor: colors.green.hex}} />}
                label={ lang("Dimming_compatibility")}
                callback={() => { this.props.information(); }}
              />
              <Separator  />
              { this._getSoftOn() }
              <Separator  />
              <ButtonBar
                setActiveElement={()=>{ }}
                largeIcon={<IconButton name="md-remove-circle" buttonSize={44} size={30} radius={10} color="#fff" buttonStyle={{backgroundColor: colors.menuRed.hex}} />}
                label={ lang("Disable_dimming")}
                callback={() => { this.disable() }}
              />
              <Separator fullLength={true} />
            </View>
            <View style={{height:100}} />
          </View>
        </ScrollView>
      </Background>
    )
  }
}