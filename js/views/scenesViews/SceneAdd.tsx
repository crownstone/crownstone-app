
import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("SceneAdd", key)(a,b,c,d,e);
}
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
import { executeScene, getScenePictureSource } from "./supportComponents/SceneItem";
import { BackButtonHandler } from "../../backgroundProcesses/BackButtonHandler";

const SCENE_ADD_CLASSNAME = "SceneAdd";

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

  componentDidMount(): void {
    BackButtonHandler.override(SCENE_ADD_CLASSNAME, () => {
      if (this._interview.back() === false) {
        NavigationUtil.dismissModal();
      }
    })
  }

  componentWillUnmount(): void {
    BackButtonHandler.clearOverride(SCENE_ADD_CLASSNAME);
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
      let locationName = lang("Not_in_a_room___");
      if (locationId) {
        let location = DataUtil.getLocation(sphereId, locationId);
        locationName = location.config.name;
      }
      sortData[stoneId] = locationName;
      stoneList.push({
        locationName: locationName,
        component:
          <StoneSwitchStateRow
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

    items.push(
      <View key={"testingButton"} style={{width: screenWidth, ...styles.centered, marginTop:20, marginBottom:30}}>
        <View style={{padding:3, borderRadius: 13, backgroundColor: colors.white.blend(colors.green, 0.2).hex }}>
          <TouchableOpacity
            style={{flexDirection:'row', width: screenWidth - 70, backgroundColor: colors.green.hex, ...styles.centered, borderRadius:10}}
            onPress={() => { executeScene(this.sceneData.data, sphereId); }}>
            <Icon name={'ios-play'} color={colors.white.hex} size={25} />
            <Text style={{color: colors.white.hex, fontWeight:'bold', fontSize:15, padding:15, fontStyle:'italic'}}>{lang("Preview_this_Scene_")}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
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
        header:lang("Lets_make_a_Scene_"),
        subHeader: lang("What_shall_we_call_it_"),
        hasTextInputField: true,
        textColor: colors.white.hex,
        placeholder: lang("My_new_scene"),
        options: [
          {
            label: lang("Next"),
            textAlign:'right',
            nextCard: showSphereSelection ? 'sphereSelection' : 'stoneSelection',
            // response: "Good choice!",
            onSelect: (result) => {
              let name = result.textfieldState;
              this.sceneData.name = name || lang("My_new_scene");
              return true;
            }}
        ]
      },
      sphereSelection: {
        header: lang("For_which_Sphere_"),
        subHeader: lang("Select_the_sphere_where_y"),
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
        header: lang("Whos_participating_"),
        subHeader: lang("Select_the_Crownstones_wh"),
        backgroundImage: require("../../images/backgrounds/plugBackgroundFade.png"),
        textColor: colors.white.hex,
        optionsHiddenIfNotOnTop: true,
        optionsAlwaysOnTop: Object.keys(this.sceneData.data).length > 0,
        explanation: lang("Crownstones_that_are_not_"),
        component:
          <View>
            { this.getStoneSelectionList(this.sceneData.sphereId) }
          </View>,
        options: [{label: lang("Next"), nextCard:'stateSelection', textAlign:'right', onSelect: (result) => {
            let stonesSelected = Object.keys(this.sceneData.data).length > 0;
            if (!stonesSelected) {
              Alert.alert(
lang("_Select_at_least_one______header"),
lang("_Select_at_least_one______body"),
[{text:lang("_Select_at_least_one______left")}]);
              return false;
            }
            return true;
        }}]
      },
      stateSelection: {
        header: lang("What_to_do_"),
        subHeader: lang("Choose_the_desired_state_"),
        textColor: colors.white.hex,
        component:
          <View>
            { this.getStoneSwitchStateList(this.sceneData.sphereId) }
          </View>,
        options: [
          {label: lang("Next"), nextCard:'picture', textAlign:'right', onSelect: (result) => { }},
        ]
      },
      picture: {
        header: lang("And_finally___"),
        subHeader: lang("Lets_pick_an_image__Somet"),
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
        options: [{label: lang("Create_Scene_"), textAlign:'right', onSelect: (result) => {
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
          left={Platform.OS === 'android' ? null : lang("Back")}
          leftAction={() => {
            if (this._interview.back() === false) {
              NavigationUtil.dismissModal();
            }}
          }
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
          <Text style={{fontSize: 13, fontStyle:"italic"}}>{ lang("Unlock_first___") }</Text>
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
  let [switchState, setSwitchState] = useState(Number(state));
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
          onValueChange={(value) => {
            if (value < 0.05) { value = 0 };
            if (value >= 0.05 && value < 0.1) { value = 0.1 };
            setStateCallback(value); setSwitchState(value); }}
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
    let locationName = lang("Not_in_a_room___")
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