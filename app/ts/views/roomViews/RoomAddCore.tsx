import { LiveComponent }          from "../LiveComponent";

import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("RoomAddCore", key)(a,b,c,d,e);
}
import * as React from 'react';
import {
  Alert, TouchableOpacity,
  View
} from "react-native";

import { IconCircle } from '../components/IconCircle'
import { getLocationNamesInSphere} from '../../util/DataUtil'

import { availableModalHeight, colors, screenHeight, styles } from "../styles";
import { processImage, Util } from "../../util/Util";
import {MapProvider} from "../../backgroundProcesses/MapProvider";

import {getRandomRoomIcon} from "./RoomIconSelection";
import { xUtil } from "../../util/StandAloneUtil";
import { FileUtil } from "../../util/FileUtil";
import { core } from "../../Core";
import { NavigationUtil } from "../../util/navigation/NavigationUtil";
import { Interview } from "../components/Interview";
import { PictureCircle } from "../components/PictureCircle";
import { Get } from "../../util/GetUtil";
import { LocationTransferNext } from "../../cloud/sections/newSync/transferrers/LocationTransferNext";


export class RoomAddCore extends LiveComponent<any, any> {
  static options = {
    topBar: { visible: false, height: 0 }
  };

  removePictureQueue = [];
  _interview;
  newRoomData;

  constructor(props) {
    super(props);
    this.newRoomData =  {
      name:'',
      icon: getRandomRoomIcon(),
      picture: null
    };
  }

  navigationButtonPressed({buttonId}) {
    if (buttonId === 'cancel') {
      this.cancelEdit();
      if (this.props.isModal) {
        NavigationUtil.dismissModal();
      }
      else {
        NavigationUtil.back();
      }
    }
  }

  componentWillUnmount(): void {
    this.cancelEdit();
  }

  canGoBack() {
    return this._interview.back();
  }

  cancelEdit() {
    // clean up any pictures that were taken
    this._removeUnusedPictures();
    this._removePicture(this.newRoomData.picture);
  }

  _removeUnusedPictures() {
    this.removePictureQueue.forEach((pic) => {
      this._removePicture(pic);
    })
    this.removePictureQueue = [];
  }

  _removePicture(image) {
    if (image) {
      FileUtil.safeDeleteFile(image).catch(() => {});
    }
  }


  isRoomNameUnique(newName) {
    // check if the room name is unique.
    let existingLocations = getLocationNamesInSphere(core.store.getState(), this.props.sphereId);
    return existingLocations[newName] === undefined
  }

  getCards() : interviewCards {
    return {
      start: {
        header:lang("Lets_make_a_room_"),
        subHeader: lang("What_would_you_like_to_ca"),
        hasTextInputField: true,
        textInputTestID: 'RoomAdd_roomName',
        placeholder: lang("My_new_room"),
        options: [
          {
            label: lang("Next"),
            textAlign:'right',
            nextCard: 'icon',
            testID: 'RoomAdd_roomName_next',
            response: lang("Good_choice_"),
            onSelect: (result) => {
              let name = result.textfieldState;
              if (name == "") {
                Alert.alert(
                  lang("Room_name_must_be_at_least"),
                  lang("Please_change_the_name_an"),
                  [{text:'OK'}]
                );
                return false;
              }
              else if (!this.isRoomNameUnique(result.textfieldState)) {
                Alert.alert(
                  lang("This_room_already_exists_"),
                  lang("Please_pick_a_unique_name"),
                  [{text:'OK'}]
                );
                return false;
              }
              else {
                this.newRoomData.name = name;
              }
              return true
            }}
        ]
      },
      icon: {
        header: lang("Lets_pick_an_icon_"),
        subHeader: lang("You_can_give_your_room_an"),
        explanation: lang("You_can_always_change_thi"),
        testID: 'RoomAdd_icon',
        editableItem: (state, setState) => {
          return (
            <View style={{flex:1,flexDirection: Util.shortScreen() ? 'row' : 'column'}}>
              <View style={{flex:1}} />
              <TouchableOpacity style={styles.centered} onPress={() => {
                NavigationUtil.navigate( "RoomIconSelection",{
                  icon: state && state.icon || state,
                  callback: (newIcon) => {
                    let newState = {};
                    if (state !== "") {
                      newState = {...state};
                    }
                    newState["icon"] = newIcon;
                    setState(newState);
                  }
                });
              }} testID={'RoomAdd_IconSelection'}>
                <IconCircle
                  icon={state && state.icon || this.newRoomData.icon}
                  size={0.18*screenHeight}
                  color={colors.white.hex}
                  borderColor={colors.csOrange.hex}
                  backgroundColor={colors.csBlueDark.hex}
                  showEdit={true}
                />
              </TouchableOpacity>
              <View style={{flex:1}} />
              <PictureCircle
                value={state && state.picture || this.newRoomData.picture}
                callback={(pictureUrl) => {
                  this.newRoomData.picture = pictureUrl;

                  let newState = {};
                  if (state !== "") {
                    newState = {...state};
                  }
                  newState["picture"] = pictureUrl;
                  setState(newState);
                }}
                removePicture={() => {
                  this.removePictureQueue.push(this.newRoomData.picture);
                  this.newRoomData.picture = null;
                  let newState = {};
                  if (state !== "") {
                    newState = {...state};
                  }
                  newState["picture"] = null;
                  setState(newState);
                }}
                size={0.18*screenHeight} />
              <View style={{flex:1}} />
            </View>
          );
        },

        options: [
          {label: lang("Create_room"), textAlign:'right', testID:'RoomAdd_CreateRoom', onSelect: (result) => {
            let icon = result.customElementState.icon || this.newRoomData.icon;
            this.newRoomData.icon = icon;
            this.createRoom()
          }}
        ]
      },
    }
  }



  createRoom() {
    this._removeUnusedPictures();
    let localId = xUtil.getUUID();

    let sphere = core.store.getState().spheres[this.props.sphereId];
    let locations = sphere.locations;
    let locationIds = Object.keys(locations)


    let nextUID = 1;
    if (locationIds.length > 0) {
      locationIds.sort((a, b) => {
        return locations[b].config.uid - locations[a].config.uid
      });
      let latestUID = locations[locationIds[0]];

      let back = () => {
        if (this.props.isModal !== true) {
          NavigationUtil.back();
        }
        else {
          NavigationUtil.dismissModal();
        }
      }

      if (latestUID >= 64 && locationIds.length >= 64)  {
        Alert.alert(
lang("_Max_amount_of_rooms_reac_header"),
lang("_Max_amount_of_rooms_reac_body"),
[{text:lang("_Max_amount_of_rooms_reac_left"), onPress: back}], {cancelable: false})
        return
      }
      else if (latestUID >= 64) {
        for (let i = 1; i < 64; i++) {
          if (MapProvider.locationUIDMap[this.props.sphereId][i] === undefined) {
            nextUID = i;
            break;
          }
        }
      }
      else {
        nextUID = latestUID + 1;
      }
    }


    // create room.
    core.store.dispatch({type:'ADD_LOCATION', sphereId: this.props.sphereId, locationId: localId, data:{name: this.newRoomData.name, icon: this.newRoomData.icon, uid: nextUID}});

    // if we have a picture:
    if (this.newRoomData.picture !== null) {
      processImage(this.newRoomData.picture, localId + ".jpg", 1.0)
        .then((picture) => {
          core.store.dispatch({
            type:'UPDATE_LOCATION_CONFIG',
            sphereId: this.props.sphereId,
            locationId: localId,
            data: {
              picture: picture,
              pictureTaken: Date.now(),
              pictureId: null
            }});
        })
    }

    let location = Get.location(this.props.sphereId, localId);
    LocationTransferNext.createOnCloud(this.props.sphereId, location).catch((err) => {});

    if (this.props.isModal !== true) {
      NavigationUtil.back();
    }
    else {
      NavigationUtil.dismissAllModalsAndNavigate( "RoomOverview",{sphereId: this.props.sphereId, locationId: localId, title: this.newRoomData.name});
    }
  }


  render() {
    return (
      <Interview
        backButtonOverrideViewNameOrId={"roomAddCore"}
        ref={     (i) => { this._interview = i; }}
        getCards={ () => { return this.getCards();}}
        update={   () => { this.forceUpdate() }}
        height={ this.props.height || availableModalHeight }
      />
    );
  }
}
