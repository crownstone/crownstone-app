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
import { processImage } from "../../util/Util";
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
      id: props.sceneId || xUtil.getUUID(),
      name:'',
      sphereId: props.sphereId || core.store.getState()?.app?.activeSphere || null,
      data: {},
      pictureSource: null,
      picture: null,
      pictureURI: null
    };

    if (props.sphereId && props.sceneId) {
      let scene = core.store.getState()?.spheres[props.sphereId]?.scenes[props.sceneId] || null;
      if (scene) {
        this.sceneData = {...this.sceneData, ...scene};
        this.sceneData.pictureURI = getScenePictureSource(scene);
      }
    }
  }

  navigationButtonPressed({buttonId}) {
    if (buttonId === 'cancel') {
      if (this.props.isModal) {
        NavigationUtil.dismissModal();
      }
      else {
        NavigationUtil.back();
      }
    }
  }

  componentWillUnmount(): void {
    this._removePicture(this.sceneData.picture);
  }

  cancelEdit() {
    // clean up any pictures that were taken
    if (this.sceneData.pictureSource === PICTURE_GALLERY_TYPES.CUSTOM && this.sceneData.picture) {
      this._removePicture(this.sceneData.picture);
    }
  }

  _removePicture(image) {
    if (image) {
      FileUtil.safeDeleteFile(image).catch((e) => {console.log("ER",e)});
    }
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
            state={this.sceneData.data[stoneCID].switchState}
            setStateCallback={(switchState) => {
              this.sceneData.data[stoneCID] = {
                selected: true,
                switchState: switchState,
              }
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
        explanation: "Crownstones that are not selected will be left unchanged when this scene is activated.",
        component:
          <View>
            { this.getStoneSelectionList(this.sceneData.sphereId) }
          </View>,
        options: [{label: "Next", nextCard:'stateSelection', textAlign:'right', onSelect: (result) => { }}]
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
                  this.sceneData.pictureSource = source;
                  let newState = {};
                  if (state !== "") {
                    newState = {...state};
                  }
                  if (source === PICTURE_GALLERY_TYPES.CUSTOM) {
                    processImage(picture, this.sceneData.id + ".jpg")
                      .then((newPicturePath) => {
                         this.sceneData.pictureURI = { uri: newPicturePath };
                         this.sceneData.picture = newPicturePath;
                         this.sceneData.pictureURI = {uri: xUtil.preparePictureURI(newPicturePath)}
                         newState["picture"] = this.sceneData.pictureURI;

                         setState(newState);
                         this.forceUpdate();
                      })
                  }
                  else {
                    this.sceneData.picture = picture;
                    this.sceneData.pictureURI = SCENE_STOCK_PICTURE_LIST[picture];
                    newState["picture"] = this.sceneData.pictureURI;

                    setState(newState);
                    this.forceUpdate();
                  }
                }}
                removePicture={() => {
                  if (this.sceneData.pictureSource === PICTURE_GALLERY_TYPES.CUSTOM) {
                    this._removePicture(this.sceneData.picture);
                  }
                  this.sceneData.picture = null;
                  this.sceneData.pictureSource = null;
                  this.sceneData.pictureURI = null;
                  let newState = {};
                  if (state !== "") {
                    newState = { ...state };
                  }
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


function StoneRow({sphereId, stoneId, locationName, selection}) {
  let [selected, setSelected] = useState(false);
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


function StoneSwitchStateRow({sphereId, stoneId, locationName, state, setStateCallback}) {
  let [switchState, setSwitchState] = useState(state);
  let stone = DataUtil.getStone(sphereId, stoneId);

  let height  = 80;
  let padding = 10;


  let containerStyle : ViewStyle = {
    width:screenWidth-2*padding,
    height: height,
    padding:padding,
    paddingLeft:15,
    alignItems:'center',
    backgroundColor: colors.white.rgba( 0.9),
    marginBottom: 10,
    marginLeft:10,
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
          step={0.025}
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