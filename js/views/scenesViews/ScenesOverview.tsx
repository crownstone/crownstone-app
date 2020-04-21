import * as React from 'react';
import {
  Text, TouchableOpacity, Image,
  View, ViewStyle
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
import { SlideFadeInView, SlideSideFadeInView } from "../components/animated/SlideFadeInView";
import DraggableFlatList from 'react-native-draggable-flatlist'
import { EventBusClass } from "../../util/EventBus";
import { AlternatingContent } from "../components/animated/AlternatingContent";
import { IconCircle } from "../components/IconCircle";


let className = "ScenesOverview";

export class ScenesOverview extends LiveComponent<any, any> {
  static options(props) {
    getTopBarProps(props, {});
    return TopBarUtil.getOptions(NAVBAR_PARAMS_CACHE);
  }
  _panResponder : any
  localEventBus : EventBusClass;
  unsubscribeStoreEvents = null;

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
      editMode: true,
      data: listOfItems,
      invalidationkey:'ImHereForTheDraggable'
    }

    this.localEventBus = new EventBusClass();
  }

  renderItem(item, index, drag, isBeingDragged) {
    return (
      <SceneItem
        roundness={10}
        title={item.title}
        stateEditMode={this.state.editMode}
        dragAction={drag}
        eventBus={this.localEventBus}
        isBeingDragged={isBeingDragged}
      />
    );
  }

  navigationButtonPressed({ buttonId }) {
    let updateTopBar = () => {
      getTopBarProps(this.props, this.state);
      TopBarUtil.replaceOptions(this.props.componentId, NAVBAR_PARAMS_CACHE)
    }
    if (buttonId === 'edit') {
      let state = core.store.getState();
      let activeSphere = state.app.activeSphere;
      // NavigationUtil.launchModal("ScenesEdit", {sphereId: activeSphere})
      this.localEventBus.emit("ChangeInEditMode", true);
      this.setState({ editMode: true  }, updateTopBar);
      BackButtonHandler.override(className, () => {
        BackButtonHandler.clearOverride(className);

      })
    }
    if (buttonId === 'Save') {
      this.localEventBus.emit("ChangeInEditMode", false);
      BackButtonHandler.clearOverride(className);
      this.setState({ editMode: false }, updateTopBar); }
  }

  componentDidMount(): void {
    // tell the component exactly when it should redraw
    this.unsubscribeStoreEvents = core.eventBus.on("databaseChange", (data) => {
      let change = data.change;
      if (
        change.updateActiveSphere ||
        change.changeSpheres      ||
        change.changeScenes
      ) {
        this.forceUpdate();
      }
    });
  }


  componentWillUnmount() {
    this.unsubscribeStoreEvents();
    this.localEventBus.clearAllEvents()
  }

  render() {
    let state = core.store.getState();
    let activeSphere = state.app.activeSphere;
    let roundness = 10;
    let content;


    if (activeSphere && state.spheres[activeSphere]) {
      let createCallback = () => {
        NavigationUtil.launchModal("SceneCreate", {sphereId: activeSphere})
      }
      let sceneIds = Object.keys(state.spheres[activeSphere].scenes);
      if (sceneIds.length === 0) {
        let addIconStyle : ViewStyle = {width:40, height:40, borderRadius:20, overflow:"hidden", backgroundColor:"#fff", alignItems:'center', justifyContent:'center', position:'absolute', top:0,right:0}
        content = (
          <View style={{ flexGrow: 1, alignItems:'center', padding: 30 }}>
            <View style={{flex:1}} />
            <TouchableOpacity style={styles.centered} onPress={() => { createCallback() }}>
              <View style={{width: 0.5*screenWidth+36, height:0.5*0.75*screenWidth+18, overflow:'hidden', marginBottom:30}}>
                <Image source={require('../../images/scenes/cooking/cooking_8.jpg')} style={{width: 0.5*screenWidth, height:0.5*0.75*screenWidth, borderRadius: 20, marginLeft:18, marginTop:18}} />
                <View style={addIconStyle}><Icon name={'md-add-circle'} size={42} color={colors.green.hex}/></View>
              </View>
              <Text style={deviceStyles.header}>{ "Let's make a Scene!" }</Text>
              <View style={{flex:0.2}} />
              <Text style={deviceStyles.text}>{ "Scenes allow you to quickly set the mood by switching multiple Crownstones with just a single touch!\n\nTap the picture to get started!"}</Text>
            </TouchableOpacity>
            <View style={{flex:2}} />
          </View>
        );
      }
      else {
        content = (
          <View style={{ flexGrow: 1, alignItems:'center', paddingTop: 20 }}>
            <SlideFadeInView visible={this.state.editMode} height={100}>
              <CreateNewItem callback={()=>{}} isFirst={false} />
            </SlideFadeInView>
            <DraggableFlatList
              data={this.state.data}
              onRelease={() => { this.localEventBus.emit("END_DRAG" );}}
              renderItem={({ item, index, drag, isActive }) => { return this.renderItem( item, index, drag, isActive) } }
              keyExtractor={(item : any, index) => `draggable-item-${item.key}`}
              onDragEnd={({ data }) => { this.setState({ data })}}
              activationDistance={1}
            />
            <SlideFadeInView visible={this.state.editMode} height={30} style={{position:'absolute', bottom:0}}>
              <Text style={{fontSize:13, color: colors.black.rgba(0.5)}}>Touch and drag the arrow icons to reorder the scenes</Text>
            </SlideFadeInView>
          </View>
         );
       }
     }
     else {
      content = (
          <View style={{flex:1, padding: 30, ...styles.centered}}>
            <View style={{flex:1}} />
            <TouchableOpacity style={styles.centered} onPress={() => { NavigationUtil.launchModal("AddSphereTutorial") }}>
              <Image source={require('../../images/scenes/cooking/cooking_8.jpg')} style={{width: 0.5*screenWidth, height:0.5*0.75*screenWidth, borderRadius: 20, marginBottom:30}} />
              <Text style={deviceStyles.text}>{ "Add a sphere to use Scenes! Tap here and create one now!"}</Text>
            </TouchableOpacity>
            <View style={{flex:2}} />
          </View>
      );
    }


    return (
      <View style={{backgroundColor: colors.csBlueDarker.hex, flex:1}}>
        <View style={{backgroundColor: colors.csOrange.hex, flex:1, borderRadius:roundness, overflow: 'hidden'}}>
          <View style={{height:2, width: screenWidth, backgroundColor: "transparent"}} />
          <View>
            <Background image={core.background.lightBlur} style={{borderTopRightRadius:roundness, borderTopLeftRadius:roundness, backgroundColor: colors.white.hex}} hideOrangeLine={true} hideNotifications={true}>
              {content}
            </Background>
          </View>
        </View>
      </View>
    );
  }
}




function SceneItem({title, stateEditMode, roundness, dragAction, eventBus, isBeingDragged}) {
  let height = 80;
  let padding = 15;
  let buttonWidth = 30;
  let textWidth = screenWidth - 2*padding - height - (buttonWidth+50) - 10;

  const [editMode, setEditMode] = useState(stateEditMode);
  const [drag, setDrag] = useState(isBeingDragged);

  useEffect(() => { let cleaner = eventBus.on('ChangeInEditMode', (data) => { setEditMode((data) ); }); return () => { cleaner(); } });
  useEffect(() => { let cleaner = eventBus.on('END_DRAG',         ()     => { setDrag(false); }); return () => { cleaner(); } });



  let color = drag ? colors.menuTextSelected.rgba(0.5) : colors.white.hex
  let subtext = <Text style={{fontStyle:'italic'}}>{ "Bedroom" }</Text>;
  if (editMode) {
    subtext = <AlternatingContent style={{width: textWidth, alignItems:'flex-start', height: 0.4*height}} switchDuration={3000} contentArray={[
      <View style={{flexDirection:'row', width: textWidth, justifyContent:'flex-start'}}>
        <Icon name={"md-arrow-round-back"} color={colors.black.hex} size={15} />
        <Text style={{ fontStyle: 'italic' }}>{ "  Edit" }</Text>
      </View>,
      <View style={{flexDirection:'row', width: textWidth, justifyContent: 'flex-end'}}>
        <Text style={{ fontStyle: 'italic' }}>{ "Hold to change order  " }</Text>
        <Icon name={"md-arrow-round-forward"} color={colors.black.hex} size={15} />
      </View>
    ]} />
  }
  if (drag)     { subtext = <Text style={{ fontStyle: 'italic' }}>{ "Drag me up or down" }</Text>; }


  return (
    <View style={{
      flexDirection:'row', borderRadius: roundness, overflow:'hidden',
      backgroundColor: "transparent",
      width:screenWidth - 2*padding, height: height,
      alignItems:'center', marginBottom: 15
    }}>
        <SlideSideFadeInView visible={drag} width={40} />
        <TouchableOpacity
          activeOpacity={1}
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
          <Image source={require('../../images/backgrounds/backgroundHD.png')} style={{width: height, height, borderTopLeftRadius: 10, borderBottomLeftRadius: 10}} />
          <SlideSideFadeInView visible={editMode} width={height} style={{position:'absolute', top:0}}>
            <View style={{width:height, height:height, backgroundColor: colors.menuTextSelected.rgba(0.25), ...styles.centered}}>
              <Icon name="md-create" size={30} color={colors.white.hex} />
            </View>
          </SlideSideFadeInView>
        </View>
        <View style={{flexDirection:'row', backgroundColor: color, flex:1, height: height, alignItems:'center'}}>
        <View style={{width:1, height, backgroundColor: colors.black.hex}} />
        <View style={{paddingLeft:10}}>
          <View style={{flex:4}} />
          <Text style={{fontSize:18, fontWeight:'bold'}}>{title}</Text>
          <View style={{flex:1}} />
          { subtext }
          <View style={{flex:4}} />
        </View>
        <View style={{flex:1}} />
        </View>
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
          <View style={{width:buttonWidth+50, height:height, alignItems:'flex-end', backgroundColor: color}}>
            <SlideSideFadeInView visible={editMode} width={buttonWidth+30} style={{position:'absolute', top:0}}>
              <View style={{width:buttonWidth+30, height: height, backgroundColor: colors.black.rgba(0.05), borderRadius: roundness}}>
                <View style={{width:buttonWidth+30, height: height, padding:8, ...styles.centered, position:'absolute', top:0}}>
                <View style={{flex:0.5}} />
                <Icon name="md-arrow-round-up"  size={18} color={colors.black.rgba(0.3)} />
                <View style={{flex:5}} />
                <Icon name="md-arrow-round-down" size={18} color={colors.black.rgba(0.3)} />
                <View style={{flex:0.5}} />
              </View>
              <View style={{width:buttonWidth+30, height: height, padding: 8, ...styles.centered, position:'absolute', top:0}}>
                <View style={{flex:1}} />
                <Icon name="c1-tap-fat" size={18} color={colors.black.rgba(0.7)} />
                <View style={{flex:1}} />
              </View>
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


function CreateNewItem({callback, isFirst}) {
  let height = 80;
  let padding = 15;

  let color = colors.white.rgba(0.75);

  return (
    <View style={{
      flexDirection:'row', borderRadius: 10, overflow:'hidden',
      backgroundColor: "transparent",
      width:screenWidth - 2*padding, height: height,
      alignItems:'center', marginBottom: 15
    }}>
      <TouchableOpacity
        activeOpacity={1}
        style={{flexDirection:'row', height: height, flex:1, alignItems:'center'}}
        onPress={() => {
          callback()
        }}>
        <View style={{width: height, height}}>
          <View style={{width:height, height:height, backgroundColor: colors.green.hex, ...styles.centered}}>
            <Icon name="c3-addRounded" size={50} color={colors.white.hex} />
          </View>
        </View>
        <View style={{flexDirection:'row', backgroundColor: color, flex:1, height: height, alignItems:'center'}}>
          <View style={{width:1, height, backgroundColor: colors.black.rgba(0.4)}} />
          <View style={{paddingLeft:10}}>
            <View style={{flex:4}} />
            <Text style={{fontSize:18, fontWeight:'bold'}}>{"Create new Scene"}</Text>
            <View style={{flex:1}} />
            <Text style={{fontStyle:'italic'}}>{ isFirst ? "Tap me to get started!" : "Tap me to create more Scenes!" }</Text>
            <View style={{flex:4}} />
          </View>
          <View style={{flex:1}} />
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
      done: true
    };
  }

  return NAVBAR_PARAMS_CACHE;
}

let NAVBAR_PARAMS_CACHE : topbarOptions = null;