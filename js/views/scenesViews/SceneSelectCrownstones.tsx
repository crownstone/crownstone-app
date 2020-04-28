import { LiveComponent } from "../LiveComponent";
import { NavigationUtil } from "../../util/NavigationUtil";
import { DataUtil } from "../../util/DataUtil";
import { core } from "../../core";
import { Alert, Platform, View } from "react-native";
import { availableModalHeight, colors } from "../styles";
import { Interview } from "../components/Interview";
import * as React from "react";
import { TopbarImitation } from "../components/TopbarImitation";
import { AnimatedBackground } from "../components/animated/AnimatedBackground";
import { StoneRow } from "./SceneAdd";

export class SceneSelectCrownstones extends LiveComponent<any, any> {
  static options = {
    topBar: { visible: false, height: 0 }
  };

  _interview;
  sceneData;

  constructor(props) {
    super(props);

    this.sceneData =  {
      data: this.props.data,
    };
  }

  getStoneSelectionList(sphereId) {
    let state = core.store.getState();
    let stoneIds = Object.keys(state.spheres[sphereId].stones);

    let stoneList = [];
    let sortData = {};

    stoneIds.forEach((stoneId) => {
      let stone = state.spheres[sphereId].stones[stoneId];
      let locationId = stone.config.locationId;
      let stoneCID = stone.config.crownstoneId;
      let locationName = "Not in a room..."
      if (locationId) {
        let location = DataUtil.getLocation(sphereId, locationId);
        locationName = location.config.name;
      }
      sortData[stoneId] = locationName;
      stoneList.push(
        {locationName: locationName, component:
            <StoneRow
              key={stoneId}
              sphereId={sphereId}
              stoneId={stoneId}
              locationName={locationName}
              initialSelection={this.sceneData.data[stoneCID] !== undefined}
              selection={(selected) => {
                if (selected) {
                  this.sceneData.data[stoneCID] = {
                    selected: true,
                    switchState: this.sceneData.data[stoneCID]?.switchState || stone.state.state
                  }
                }
                else {
                  delete this.sceneData.data[stoneCID];
                }
              }}/>}
      )
    })

    stoneList.sort((a,b) => { return a.locationName > b.locationName ? 1 : -1 })

    let items = [];
    stoneList.forEach((item) => {
      items.push(item.component);
    })
    return items;
  }


  getCards() : interviewCards {
    return {
      start: {
        header: "Who's participating?",
        subHeader: "Select the Crownstones which will be part of this scene.",
        backgroundImage: require("../../images/backgrounds/plugBackgroundFade.png"),
        textColor: colors.white.hex,
        explanation: "Crownstones that are not selected will be left unchanged when this scene is activated.",
        component:
          <View>
            { this.getStoneSelectionList(this.props.sphereId) }
          </View>,
        options: [{label: "Select", textAlign:'right', onSelect: (result) => {
          let stonesSelected = Object.keys(this.sceneData.data).length > 0;
          if (!stonesSelected) {
            Alert.alert("Select at least one...","I don't know why you'd want to make a scene without any Crownstones...", [{text:"Right.."}]);
            return false;
          }

          this.props.callback(this.sceneData.data); NavigationUtil.dismissModal(); }}]
      },
    }
  }

  render() {
    let backgroundImage = require('../../images/backgrounds/plugBackgroundFade.png');
    let textColor = colors.white.hex;
    return (
      <AnimatedBackground fullScreen={true} image={backgroundImage} hideNotifications={true} dimStatusBar={true} hideOrangeLine={true}>
        <TopbarImitation
          leftStyle={{color: textColor}}
          left={Platform.OS === 'android' ? null : "Cancel"}
          leftAction={() => { if (this._interview.back() === false) {
            if (this.props.isModal !== false) {
              NavigationUtil.dismissModal();
            }
            else {
              NavigationUtil.back();
            }
          }}}
          leftButtonStyle={{width: 300}} style={{backgroundColor:'transparent', paddingTop:0}} />
        <Interview
          scrollEnabled={false}
          ref={     (i) => { this._interview = i; }}
          getCards={ () => { return this.getCards();}}
          update={   () => { this.forceUpdate() }}
          height={ this.props.height || availableModalHeight }
        />
      </AnimatedBackground>
    );
  }
}

