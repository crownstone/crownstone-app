import * as React from 'react';
import {
  Text, TouchableOpacity, Image,
  View
} from "react-native";

import {screenWidth, deviceStyles, colors, styles} from "../styles";
import { LiveComponent }          from "../LiveComponent";
import { core } from "../../core";
import { NavigationUtil } from "../../util/NavigationUtil";
import { TopBarUtil } from "../../util/TopBarUtil";
import { Background } from "../components/Background";
import { useEffect, useState } from "react";
import { Icon } from "../components/Icon";
import { BackButtonHandler } from "../../backgroundProcesses/BackButtonHandler";
import { Permissions } from "../../backgroundProcesses/PermissionManager";
import { SlideSideFadeInView } from "../components/animated/SlideFadeInView";
import DraggableFlatList from 'react-native-draggable-flatlist'
import { EventBusClass } from "../../util/EventBus";


let className = "ScenesOverview";

export class ScenesOverview extends LiveComponent<any, any> {
  static options(props) {
    getTopBarProps(props, {});
    return TopBarUtil.getOptions(NAVBAR_PARAMS_CACHE);
  }
  _panResponder : any
  localEventBus : EventBusClass;

  constructor(props) {
    super(props);
    let listOfItems = [
      {key : 'hello_1', title:"1"},
      {key : 'hello_2', title:"2"},
      {key : 'hello_3', title:"3"},
      {key : 'hello_4', title:"4"},
      {key : 'hello_5', title:"5"},
    ]
    this.state = {
      editMode: false,
      data: listOfItems,
      invalidationkey:'test'
    }

    this.localEventBus = new EventBusClass();
  }

  renderItem(item, index, drag, isBeingDragged) {
    return <SceneItem roundness={10} title={item.title} stateEditMode={this.state.editMode} dragAction={drag} eventBus={this.localEventBus} isBeingDragged={isBeingDragged}/>
  }

  navigationButtonPressed({ buttonId }) {
    let updateTopBar = () => {
      getTopBarProps(this.props, this.state);
      TopBarUtil.replaceOptions(this.props.componentId, NAVBAR_PARAMS_CACHE)
    }
    if (buttonId === 'edit') {
      this.localEventBus.emit("ChangeInEditMode", true);
      this.setState({ editMode: true  }, updateTopBar);
      BackButtonHandler.override(className, () => {
        BackButtonHandler.clearOverride(className);

      })
    }
    if (buttonId === 'save') {
      this.localEventBus.emit("ChangeInEditMode", false);
      BackButtonHandler.clearOverride(className);
      this.setState({ editMode: false }, updateTopBar); }
  }



  componentWillUnmount() { }

  render() {
    let state = core.store.getState();
    let activeSphere = state.app.activeSphere;
    let roundness = 10;

    if (activeSphere && state.spheres[activeSphere]) {
      return (
        <View style={{backgroundColor: colors.csBlueDarker.hex, flex:1}}>
          <View style={{backgroundColor: colors.csOrange.hex, flex:1, borderRadius:roundness, overflow: 'hidden'}}>
            <View style={{height:2, width: screenWidth, backgroundColor: "transparent"}} />
            <View>
              <Background image={core.background.lightBlur} style={{borderTopRightRadius:roundness, borderTopLeftRadius:roundness, backgroundColor: colors.white.hex}} hideOrangeLine={true}>
                <View style={{ flexGrow: 1, alignItems:'center', paddingTop: 15 }}>
                  <DraggableFlatList
                    data={this.state.data}
                    renderItem={({ item, index, drag, isActive }) => { return this.renderItem( item, index, drag, isActive) } }
                    keyExtractor={(item : any, index) => `draggable-item-${item.key}`}
                    onDragEnd={({ data }) => { this.setState({ data })}}
                    activationDistance={1}
                  />
                </View>
               </Background>
            </View>
          </View>
        </View>
       );
     }
     else {
      return (
        <Background image={core.background.lightBlur}>
          <View style={{flex:1, justifyContent:'center', padding: 30}}>
            <View style={{flex:1}} />
            <TouchableOpacity onPress={() => { NavigationUtil.launchModal("AddSphereTutorial") }}>
              <Text style={deviceStyles.text}>{ "Add a sphere to use Scenes! Tap here and create one now!"}</Text>
            </TouchableOpacity>
            <View style={{flex:1}} />
          </View>
        </Background>
      );
    }
  }
}




function SceneItem({title, stateEditMode, roundness, dragAction, eventBus, isBeingDragged}) {
  let height = 80;
  let padding = 15;
  let buttonWidth = 30;

  const [editMode, setEditMode] = useState(stateEditMode);
  useEffect(() => {
    let cleaner = eventBus.on('ChangeInEditMode', (data) => {
      setEditMode((data) )})
      return () => { cleaner(); }
  })


  return (
    <View style={{
      flexDirection:'row', borderRadius: roundness, overflow:'hidden',
      backgroundColor: colors.white.rgba(isBeingDragged ? 0.4 : 1),
      width:screenWidth - 2*padding, height: height,
      alignItems:'center', marginBottom: 15
    }}>
        <TouchableOpacity
          style={{flexDirection:'row', height: height, flex:1, alignItems:'center'}}
          onLongPress={dragAction}
          onPress={() => {
          if (editMode) {
            dragAction();
          }
          else {
                            //   execute me!
          }
        }}>
        <View style={{width: height, height}}>
          <Image source={require('../../images/backgrounds/backgroundHD.png')} style={{width: height, height}} />
          <SlideSideFadeInView visible={editMode} width={height} style={{position:'absolute', top:0}}>
            <View style={{width:height, height:height, backgroundColor: colors.menuTextSelected.rgba(0.25), ...styles.centered}}>
              <Icon name="md-create" size={30} color={colors.white.hex} />
            </View>
          </SlideSideFadeInView>
        </View>
        <View style={{width:1, height, backgroundColor: colors.black.hex}} />
        <View style={{paddingLeft:10}}>
          <View style={{flex:4}} />
          <Text style={{fontSize:18, fontWeight:'bold'}}>{title}</Text>
          <View style={{flex:1}} />
          <Text style={{fontStyle:'italic'}}>Bedroom</Text>
          <View style={{flex:4}} />
        </View>
        <View style={{flex:1}} />
        </TouchableOpacity>
        <TouchableOpacity
          onPressIn={() => {
            if (editMode) {
              dragAction();
            }
          }}
          onPress={() => {
            //   execute me!
          }}
          >
          <View style={{width:buttonWidth+50, height:height, alignItems:'flex-end'}}>
            <SlideSideFadeInView visible={editMode} width={buttonWidth+20} style={{position:'absolute', top:0}}>
              <View style={{width:buttonWidth+20, height: height, padding:8, backgroundColor: colors.black.rgba(0.03), borderRadius: roundness, ...styles.centered}}>
                <View style={{flex:1}} />
                <Icon name="md-arrow-round-up"  size={18} color={'#888'} />
                <View style={{flex:2}} />
                <Icon name="md-arrow-round-down" size={18} color={'#888'} />
                <View style={{flex:1}} />
              </View>
            </SlideSideFadeInView>
            <SlideSideFadeInView visible={!editMode} width={buttonWidth + 10} style={{position:'absolute', top:0.5*(height-40)}}>
              <View style={{width:buttonWidth, height:40, padding:8, backgroundColor: colors.black.rgba(0.05), borderRadius: roundness, marginRight:10, ...styles.centered}}>
                <Icon name="ios-arrow-forward" size={18} color={'#888'} />
              </View>
            </SlideSideFadeInView>
          </View>
        </TouchableOpacity>
    </View>
  )
}



function getTopBarProps(props, viewState) {
  let state = core.store.getState();
  let activeSphere = state.app.activeSphere;

  let title = "Scenes";

  if (!activeSphere) {
    NAVBAR_PARAMS_CACHE = {
      title: title,
    };
    return NAVBAR_PARAMS_CACHE;
  }

  if (viewState.editMode !== true) {
    NAVBAR_PARAMS_CACHE = {
      title: title,

      edit: Permissions.inSphere(activeSphere).canChangeScenes,
    };
      return NAVBAR_PARAMS_CACHE;
  }
  else {
    NAVBAR_PARAMS_CACHE = {
      title: title,
      save:true
    };
  }

  return NAVBAR_PARAMS_CACHE;
}

let NAVBAR_PARAMS_CACHE : topbarOptions = null;