import { LiveComponent } from "../LiveComponent";
import { core } from "../../core";
import * as React from "react";
import { Background } from "../components/Background";
import { TopBarUtil } from "../../util/TopBarUtil";
import { FileUtil } from "../../util/FileUtil";
import { processStockCustomImage, removeStockCustomImage, Util } from "../../util/Util";
import { NavigationUtil } from "../../util/NavigationUtil";
import { ScrollView } from "react-native";
import { ListEditableItems } from "../components/ListEditableItems";
import { xUtil } from "../../util/StandAloneUtil";
import { getScenePictureSource } from "./supportComponents/SceneItem";
import { DataUtil } from "../../util/DataUtil";
import { StoneSwitchStateRow } from "./SceneAdd";
import { IconButton } from "../components/IconButton";
import { colors } from "../styles";
import { PICTURE_GALLERY_TYPES } from "./ScenePictureGallery";
import { BackgroundNoNotification } from "../components/BackgroundNoNotification";

export class SceneEdit extends LiveComponent<{sphereId: string, sceneId: string}, any> {
  static options(props) {
    return TopBarUtil.getOptions({title:  "Edit Scene", cancelModal: true, save: true});
  }

  changed = false;
  newPicture = false;
  originalPicture = null;
  removePictureQueue = [];


  constructor(props) {
    super(props);

    let sceneData =  {
      id: props.sceneId || xUtil.getUUID(),
      name:'',
      sphereId: props.sphereId || core.store.getState()?.app?.activeSphere || null,
      data: {},
      pictureSource: null,
      picture: null,
      pictureURI: null
    };

    let scene = core.store.getState()?.spheres[props.sphereId]?.scenes[props.sceneId] || null;
    if (scene) {
      sceneData = {...sceneData, ...scene};
      this.originalPicture = scene.picture;
      sceneData.pictureURI = getScenePictureSource(scene);
    }

    this.state = sceneData;
  }

  navigationButtonPressed({ buttonId }) {
    if (buttonId === 'save') { this._updateScene(); }
    if (buttonId === 'cancel') {
      this._removeUnusedPictures(true);
      NavigationUtil.dismissModal()
    }
  }

  _removeUnusedPictures(cancel: boolean) {
    this.removePictureQueue.forEach((removePictureData) => {
      if (cancel === true && removePictureData.picture !== this.originalPicture) {
        this._removePicture(removePictureData.picture, removePictureData.source);
      }
    })
  }

  _removePicture(image, source) {
    if (image && source == PICTURE_GALLERY_TYPES.CUSTOM) {
      FileUtil.safeDeleteFile(image).catch(() => {});
    }
  }

  _getItems() {
    let items = [];

    items.push({label: "SCENE SETTINGS",  type:'explanation', below:false});
    items.push({
      label: "Name",
      type: 'textEdit',
      value: this.state.name,
      callback: (newText) => {
        this.changed = true;
        this.setState({name: newText});
      },
      endCallback: (newText) => {
        this.changed = true;
        newText = (newText === '') ? 'Untitled scene' : newText;
        this.setState({name: newText});
      }
    });
    items.push({
      label: "Picture",
      type:  'picture',
      stock: this.state.pictureSource === PICTURE_GALLERY_TYPES.STOCK,
      customPictureSelector: () => { NavigationUtil.launchModal("ScenePictureGallery", {callback:
        (picture, source) => {
          this.changed = true;
          processStockCustomImage(this.props.sceneId, picture, source)
            .then((pictureData) => {
              this.setState({pictureURI: pictureData.pictureURI, picture: pictureData.picture, pictureSource: pictureData.source})
            })
        }}); },
      imageURI: this.state.pictureURI,
      removePicture:() => {
        this.changed = true;
        this.removePictureQueue.push({picture:this.state.picture, source: this.state.pictureSource});
        this.setState({picture: null, pictureSource: null, pictureURI: null});
      }
    });

    items.push({type:"explanation", label:"CHOOSE DESIRED STATES"})

    let state = core.store.getState();
    let stoneIds = Object.keys(state.spheres[this.props.sphereId].stones);

    let stoneList = [];
    let sortData = {};

    stoneIds.forEach((stoneId) => {
      let stone = state.spheres[this.props.sphereId].stones[stoneId];
      let stoneCID = stone.config.crownstoneId;
      if (this.state.data[stoneCID] === undefined) { return; }

      let locationId = stone.config.locationId;
      let locationName = "Not in a room...";
      if (locationId) {
        let location = DataUtil.getLocation(this.props.sphereId, locationId);
        locationName = location.config.name;
      }
      sortData[stoneId] = locationName;
      stoneList.push({
        locationName: locationName,
        component: {__item:
          <StoneSwitchStateRow
            key={stoneId}
            sphereId={this.props.sphereId}
            stoneId={stoneId}
            locationName={locationName}
            margins={false}
            state={this.state.data[stoneCID].switchState}
            setStateCallback={(switchState) => {
              this.changed = true;
              let data = {...this.state.data};
              data[stoneCID] = {
                selected: true,
                switchState: switchState,
              }
              this.setState({data: data});
            }}
          />
        }
      });
    })

    stoneList.sort((a,b) => { return a.locationName > b.locationName ? 1 : -1 })
    stoneList.forEach((item) => {
      items.push(item.component);
    })

    items.push({type:"explanation", label:"PARTICIPATING CROWNSTONES"});

    items.push({
      type:'navigation',
      label: 'Select Crownstones',
      icon: <IconButton name='c2-pluginFilled' buttonSize={35} size={23} radius={8}  color="#fff" buttonStyle={{backgroundColor: colors.menuTextSelected.hex}}/>,
      callback: () => {
        NavigationUtil.launchModal("SceneSelectCrownstones", {sphereId: this.props.sphereId, data: this.state.data, callback: (selectedData) => {
          let existingData = {...this.state.data};
          Object.keys(selectedData).forEach((selectedStoneCID) => {
            if (existingData[selectedStoneCID] === undefined) {
              existingData[selectedStoneCID] = selectedData[selectedStoneCID];
              this.changed = true;
            }
          })

          Object.keys(existingData).forEach((existingStoneCID) => {
            if (selectedData[existingStoneCID] === undefined) {
              delete existingData[existingStoneCID];
              this.changed = true;
            }
          })

          this.setState({data: existingData});
        }})
      }
    });
    items.push({type:"spacer"})
    items.push({type:"spacer"})

    return items;
  }

  _updateScene() {
    if (this.changed) {
      this._removeUnusedPictures(false);

      core.store.dispatch({
        type: "UPDATE_SCENE",
        sphereId: this.props.sphereId,
        sceneId: this.props.sceneId,
        data: {
          name: this.state.name,
          picture: this.state.picture,
          pictureSource: this.state.pictureSource,
          data: this.state.data
        }
      })
    }
    NavigationUtil.dismissModal();
  }


  render() {
    let backgroundImage = core.background.menu;
    return (
      <BackgroundNoNotification hasNavBar={false} image={backgroundImage}>
        <ScrollView>
          <ListEditableItems items={this._getItems()} />
        </ScrollView>
      </BackgroundNoNotification>
    );
  }
}