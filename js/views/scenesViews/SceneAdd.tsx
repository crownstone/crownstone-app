import { LiveComponent } from "../LiveComponent";
import { NavigationUtil } from "../../util/NavigationUtil";
import { DataUtil } from "../../util/DataUtil";
import { core } from "../../core";
import { Alert, Platform, Switch, Text, TouchableOpacity, View, ViewStyle } from "react-native";
import { availableModalHeight, colors, screenHeight, screenWidth, styles } from "../styles";
import { Interview } from "../components/Interview";
import * as React from "react";
import { TopbarImitation } from "../components/TopbarImitation";
import { AnimatedBackground } from "../components/animated/AnimatedBackground";
import { Icon } from "../components/Icon";
import { useState } from "react";
import { Circle } from "../components/Circle";
import { SlideFadeInView, SlideSideFadeInView } from "../components/animated/SlideFadeInView";
import Slider from "@react-native-community/slider";
import { FileUtil } from "../../util/FileUtil";
import { PictureGallerySelector } from "../components/PictureGallerySelector";
import { PICTURE_GALLERY_TYPES, SCENE_STOCK_PICTURE_LIST } from "./ScenePictureGallery";
import { xUtil } from "../../util/StandAloneUtil";
import { processImage, processStockCustomImage, removeStockCustomImage } from "../../util/Util";
import { getScenePictureSource } from "./supportComponents/SceneItem";


export class SceneAdd extends LiveComponent<any, any> {
  static options = {
    topBar: { visible: false, height: 0 }
  };

  _interview;
  sceneData;

  constructor(props) {
    super(props);

    this.sceneData =  {
      id: xUtil.getUUID(),
      name:'',
      sphereId: props.sphereId || core.store.getState()?.app?.activeSphere || null,
      data: {},
      pictureSource: null,
      picture: null,
      pictureURI: null
    };
  }

  navigationButtonPressed({buttonId}) {
    if (buttonId === 'cancel') {
      this._removePicture(this.sceneData.picture, this.sceneData.pictureSource);
      if (this.props.isModal) {
        NavigationUtil.dismissModal();
      } else {
        NavigationUtil.back();
      }
    }
  }

  _removePicture(image, source) {
    if (image && source === PICTURE_GALLERY_TYPES.CUSTOM) {
      FileUtil.safeDeleteFile(image).catch((e) => {console.log("ER",e)});
    }
  }

  getStoneSelectionList(sphereId) {
    return getStoneSelectionList(sphereId, this.sceneData, () => { this.forceUpdate(); });
  }


  getStoneSwitchStateList(sphereId) {
    let state = core.store.getState();
    let stoneIds = Object.keys(state.spheres[sphereId].stones);

    let stoneList = [];
    let sortData = {};

    stoneIds.forEach((stoneId) => {
      let stone = state.spheres[sphereId].stones[stoneId];
      let stoneCID = stone.config.crownstoneId;
      if (this.sceneData.data[stoneCID] === undefined) { return; }

      let locationId = stone.config.locationId;
      let locationName = "Not in a room...";
      if (locationId) {
        let location = DataUtil.getLocation(sphereId, locationId);
        locationName = location.config.name;
      }
      sortData[stoneId] = locationName;
      stoneList.push({
        locationName: locationName,
        component: <StoneSwitchStateRow
            key={stoneId}
            sphereId={sphereId}
            stoneId={stoneId}
            locationName={locationName}
            state={this.sceneData.data[stoneCID]}
            margins={true}
            setStateCallback={(switchState) => {
              this.sceneData.data[stoneCID] = switchState;
            }}/>
      });
    })

    stoneList.sort((a,b) => { return a.locationName > b.locationName ? 1 : -1 })

    let items = [];
    stoneList.forEach((item) => {
      items.push(item.component);
    })
    return items;
  }




  getCards() : interviewCards {
    let state = core.store.getState();
    let sphereCount = Object.keys(state.spheres).length;
    let showSphereSelection = sphereCount > 1 && state.app.activeSphere && state.spheres[state.app.activeSphere].state.present == false;
    let sphereOptions = [];
    Object.keys(state.spheres).forEach((sphereId) => {
      sphereOptions.push({
        label: state.spheres[sphereId].config.name,
        nextCard:'stoneSelection',
        onSelect: (result) => {
          this.sceneData.sphereId = sphereId;
        }}
      );
    });

    return {
      start: {
        header:"Let's make a Scene!",
        subHeader: "What shall we call it?",
        hasTextInputField: true,
        textColor: colors.white.hex,
        placeholder: "My new scene",
        options: [
          {
            label: "Next",
            textAlign:'right',
            nextCard: showSphereSelection ? 'sphereSelection' : 'stoneSelection',
            // response: "Good choice!",
            onSelect: (result) => {
              let name = result.textfieldState;
              this.sceneData.name = name || "My new scene";
              return true;
            }}
        ]
      },
      sphereSelection: {
        header: "For which Sphere?",
        subHeader: "Select the sphere where you will use this scene.",
        backgroundImage: require("../../images/backgrounds/sphereBackgroundDark.png"),
        textColor: colors.white.hex,
        component:
          <View style={{flex:1, ...styles.centered}}>
            <Icon
              name={"c1-sphere"}
              size={0.18*screenHeight}
              color={colors.white.hex}
            />
          </View>
        ,
        options: sphereOptions
      },
      stoneSelection: {
        header: "Who's participating?",
        subHeader: "Select the Crownstones which will be part of this scene.",
        backgroundImage: require("../../images/backgrounds/plugBackgroundFade.png"),
        textColor: colors.white.hex,
        optionsHiddenIfNotOnTop: true,
        optionsAlwaysOnTop: Object.keys(this.sceneData.data).length > 0,
        explanation: "Crownstones that are not selected will be left unchanged when this scene is activated.",
        component:
          <View>
            { this.getStoneSelectionList(this.sceneData.sphereId) }
          </View>,
        options: [{label: "Next", nextCard:'stateSelection', textAlign:'right', onSelect: (result) => {
            let stonesSelected = Object.keys(this.sceneData.data).length > 0;
            if (!stonesSelected) {
              Alert.alert("Select at least one...","I don't know why you'd want to make a scene without any Crownstones...", [{text:"Right.."}]);
              return false;
            }
            return true;
        }}]
      },
      stateSelection: {
        header: "What to do?",
        subHeader: "Choose the desired state for your Crownstones!",
        textColor: colors.white.hex,
        component:
          <View>
            { this.getStoneSwitchStateList(this.sceneData.sphereId) }
          </View>,
        options: [{label: "Next", nextCard:'picture', textAlign:'right', onSelect: (result) => { }}]
      },
      picture: {
        header: "And finally...",
        subHeader: "Let's pick an image! Something to quickly remember it by.",
        backgroundImage: require("../../images/backgrounds/plugBackgroundFade.png"),
        textColor: colors.white.hex,
        editableItem: (state, setState) => {
          return (
            <View style={{...styles.centered, flex:1}}>
              <PictureGallerySelector
                isSquare={true}
                value={state && state.picture || this.sceneData.pictureURI }
                callback={(picture, source) => {
                  let newState = {};
                  if (state !== "") { newState = {...state}; }
                  processStockCustomImage(this.sceneData.id, picture, source)
                    .then((pictureResult) => {
                      this.sceneData.pictureSource = pictureResult.source;
                      this.sceneData.picture       = pictureResult.picture;
                      this.sceneData.pictureURI    = pictureResult.pictureURI;
                      newState["picture"] = this.sceneData.pictureURI;
                      setState(newState);
                      this.forceUpdate();
                    })
                }}
                removePicture={() => {
                  removeStockCustomImage(this.sceneData.picture, this.sceneData.pictureSource)
                  this.sceneData.picture = null;
                  this.sceneData.pictureSource = null;
                  this.sceneData.pictureURI = null;
                  let newState = {};
                  if (state !== "") { newState = { ...state }; }
                  newState["picture"] = null;
                  setState(newState);
                  this.forceUpdate();
                }}
                size={0.22*screenHeight}
              />
            </View>
          )
        },
        options: [{label: "Create Scene!", textAlign:'right', onSelect: (result) => {
          if (this.sceneData.picture === null) {
            this.sceneData.pictureSource = PICTURE_GALLERY_TYPES.STOCK;
            let allImages = Object.keys(SCENE_STOCK_PICTURE_LIST);
            let randomImage = allImages[Math.floor(Math.random()*allImages.length)];
            this.sceneData.picture = randomImage;
          }

          core.store.dispatch({
            type:"ADD_SCENE",
            sphereId: this.sceneData.sphereId,
            sceneId: this.sceneData.id,
            data: {
              picture: this.sceneData.picture,
              pictureSource: this.sceneData.pictureSource,
              data: this.sceneData.data,
              name: this.sceneData.name,
            }
          });

          NavigationUtil.dismissModal();
        }}]
      },
    }
  }

  render() {
    let backgroundImage = require('../../images/backgrounds/plugBackgroundFade.png');
    let textColor = colors.white.hex;
    if (this._interview) {
      backgroundImage = this._interview.getBackgroundFromCard() || backgroundImage;
      textColor       = this._interview.getTextColorFromCard()  || textColor;
    }

    return (
      <AnimatedBackground fullScreen={true} image={backgroundImage} hideNotifications={true} dimStatusBar={true} hideOrangeLine={true}>
        <TopbarImitation
          leftStyle={{color: textColor}}
          left={Platform.OS === 'android' ? null : "Back"}
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


export function StoneRow({sphereId, stoneId, locationName, selection, initialSelection}) {
  let [selected, setSelected] = useState(initialSelection || false);
  let [showExplanation, setShowExplanation] = useState(false);
  let stone = DataUtil.getStone(sphereId, stoneId);

  let height  = 80;
  let padding = 10;

  let containerStyle : ViewStyle = {
    width:screenWidth-2*padding,
    height: height,
    padding:padding,
    paddingLeft:15,
    flexDirection:'row',
    alignItems:'center',
    backgroundColor: selected ? colors.white.rgba( 0.9) : colors.white.rgba(0.5),
    marginBottom: 10,
    marginLeft:10,
    borderRadius: 10,
  };
  let textWidth = screenWidth - 2*padding - (height-2*padding) -15-50;

  let circleBackgroundColor = selected ? colors.green.hex : colors.black.rgba(0.2);

  let content = (
    <React.Fragment>
      <Circle size={height-2*padding} color={circleBackgroundColor}>
        <Icon name={stone.config.icon} size={35} color={'#ffffff'} />
      </Circle>
      <View style={{justifyContent:'center', height: height-2*padding, flex:1, paddingLeft:15, width:textWidth}}>
        <Text style={{fontSize: 16, fontWeight:'bold'}}>{stone.config.name}</Text>
        <Text style={{fontSize: 13}}>{locationName}</Text>
        <SlideFadeInView height={20} visible={showExplanation}>
          <Text style={{fontSize: 13, fontStyle:"italic"}}>{"Unlock first..."}</Text>
        </SlideFadeInView>
      </View>
    </React.Fragment>
  );

  if (stone.config.locked) {
    return (
      <TouchableOpacity
        style={containerStyle}
        onPress={() => { setShowExplanation(true); setTimeout(() => { setShowExplanation(false); }, 2000) }}
      >
        { content }
        <SlideSideFadeInView width={50} visible={stone.config.locked}>
          <View style={{width:50, alignItems:'flex-end'}}>
            <Icon name={"md-unlock"} color={colors.black.rgba(0.5)} size={26} />
          </View>
        </SlideSideFadeInView>
      </TouchableOpacity>
    );
  }
  else {
    return (
      <TouchableOpacity
        style={containerStyle}
        onPress={() => { selection(!selected); setSelected(!selected); }}
      >
        { content }
        <SlideSideFadeInView width={50} visible={!selected}></SlideSideFadeInView>
        <SlideSideFadeInView width={50} visible={selected}>
          <View style={{width:50, alignItems:'flex-end'}}>
            <Icon name={'ios-checkmark-circle'} color={colors.green.hex} size={26} />
          </View>
        </SlideSideFadeInView>
      </TouchableOpacity>
    );
  }
}


export function StoneSwitchStateRow({sphereId, stoneId, locationName, state, setStateCallback, margins}) {
  let [switchState, setSwitchState] = useState(state);
  let stone = DataUtil.getStone(sphereId, stoneId);

  let height  = 80;
  let padding = 10;


  let containerStyle : ViewStyle = {
    width: margins ? screenWidth-2*padding : screenWidth,
    height: height,
    padding: padding,
    paddingLeft: margins ? 1.5*padding : padding,
    alignItems:'center',
    backgroundColor: colors.white.rgba( 0.9),
    marginBottom: margins ? 10 : 0,
    marginLeft: margins ? 10 : 0,
    borderRadius: 10,
  };

  let circleBackgroundColor = switchState > 0 ? colors.green.hex : colors.csBlueDark.hex;
  let name = stone.config.name;
  if (stone.abilities.dimming.enabledTarget) {
    name += " (" + Math.round(100*switchState) + "%)"
  }

  let content = (
    <React.Fragment>
      <Circle size={height-2*padding} color={circleBackgroundColor}>
        <Icon name={stone.config.icon} size={35} color={'#ffffff'} />
      </Circle>
      <View style={{justifyContent:'center', height: height-2*padding, flex:1, paddingLeft:15}}>
        <Text style={{fontSize: 16, fontWeight:'bold'}}>{name}</Text>
        <Text style={{fontSize: 13}}>{locationName}</Text>
      </View>
    </React.Fragment>
  );

  if (stone.abilities.dimming.enabledTarget) {
    return (
      <View style={{...containerStyle, height: height+60}}>
      <View style={{flexDirection:'row'}}>
        { content }
      </View>
        <Slider
          style={{ width: screenWidth-70, height: 60}}
          minimumValue={0}
          maximumValue={1}
          step={0.01}
          value={switchState}
          minimumTrackTintColor={colors.gray.hex}
          maximumTrackTintColor={colors.gray.hex}
          onValueChange={(value) => { setStateCallback(value); setSwitchState(value); }}
        />
      </View>
    )
  }
  else {
    return (
      <View style={{...containerStyle, flexDirection:'row'}}>
        { content }
        <View style={{width:60, alignItems:'flex-end', overflow:"hidden"}}>
          <Switch value={switchState === 1} onValueChange={() => {
            let newValue = switchState === 1 ? 0 : 1;
            setStateCallback(newValue)
            setSwitchState(newValue)
          }}/>
        </View>
      </View>
    )
  }
}

export function getStoneSelectionList(sphereId, sceneData, forceUpdate) {
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
            initialSelection={sceneData.data[stoneCID] !== undefined}
            locationName={locationName}
            selection={(selected) => {
              if (selected) {
                let amountOfItems = Object.keys(sceneData.data).length;
                sceneData.data[stoneCID] = sceneData.data[stoneCID] || stone.state.state;

                if (amountOfItems == 0) {
                  // we will add an item where there were none before --> redraw to show the always on top button
                  forceUpdate();
                }

              }
              else {
                delete sceneData.data[stoneCID];
                if (Object.keys(sceneData.data).length == 0) {
                  // we will remove the last item, remove the always on top button.
                  forceUpdate();
                }
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