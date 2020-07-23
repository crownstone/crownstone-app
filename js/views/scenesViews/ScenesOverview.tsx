import { Languages } from "../../Languages";

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("ScenesOverview", key)(a,b,c,d,e);
}
import * as React                 from 'react';
import { Platform, Text, View, Image, Alert, ScrollView } from "react-native";
import { screenWidth, colors}     from "../styles";
import { LiveComponent }          from "../LiveComponent";
import { core }                   from "../../core";
import { TopBarUtil }             from "../../util/TopBarUtil";
import { Background }             from "../components/Background";
import { BackButtonHandler }      from "../../backgroundProcesses/BackButtonHandler";
import { Permissions }            from "../../backgroundProcesses/PermissionManager";
import { SlideFadeInView }        from "../components/animated/SlideFadeInView";
import { EventBusClass }          from "../../util/EventBus";
import { SceneConstants }         from "./constants/SceneConstants";
import { SceneCreateNewItem }     from "./supportComponents/SceneCreateNewItem";
import { SceneIntroduction,
         ScenesWithoutSpheres }   from "./supportComponents/SceneIntroduction";
import { SceneItem }              from "./supportComponents/SceneItem";
import { NavigationUtil } from "../../util/NavigationUtil";
import { SortedList, SortingManager } from "../../logic/SortingManager";
import { Navigation } from "react-native-navigation";
import { ScaledImage } from "../components/ScaledImage";
import { RoundedBackground } from "../components/RoundedBackground";
const className = "ScenesOverview";
const HINT_THRESHOLD = 3;

export class ScenesOverview extends LiveComponent<any, any> {
  static options(props) {
    getTopBarProps(props, {});
    return TopBarUtil.getOptions(NAVBAR_PARAMS_CACHE);
  }
  _panResponder : any
  localEventBus : EventBusClass;
  unsubscribeStoreEvents = null;
  sortedList : SortedList = null;

  constructor(props) {
    super(props);

    let state = core.store.getState();
    let activeSphere = state.app.activeSphere;
    let data = this.initializeSortedList(activeSphere, state);
    if (data.length > 0) {
      // core.store.dispatch({type:"REMOVE_ALL_SCENES", sphereId: activeSphere})
      getTopBarProps(props, {});
      TopBarUtil.replaceOptions(this.props.componentId, NAVBAR_PARAMS_CACHE)
    }

    this.state = {
      editMode: false,
      data: data,
      invalidationkey:'ImHereForTheDraggable'
    }

    this.localEventBus = new EventBusClass();
  }

  initializeSortedList(activeSphereId, state) {
    let data = [];
    if (activeSphereId) {
      let sceneIds = Object.keys(state.spheres[activeSphereId].scenes);
      this.sortedList = SortingManager.getList(activeSphereId, className, "Overview", sceneIds);
      data = this.sortedList.getDraggableList();
    }
    return data;
  }

  renderItem(scene, sphereId, sceneId) {
    return (
      <SceneItem
        key={sceneId}
        scene={scene}
        sceneId={sceneId}
        sphereId={sphereId}
        stateEditMode={this.state.editMode}
        // dragAction={drag}
        eventBus={this.localEventBus}
        // isBeingDragged={isBeingDragged}
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
      let activeSphereId = state.app.activeSphere;
      if (Permissions.inSphere(activeSphereId).canCreateScenes == false) {
        Alert.alert(lang("You_do_not_have_permissio"),lang("Ask_an_admin_in_your_Sphe"), [{text:lang("OK")}]);
        return;
      }

      this.localEventBus.emit("ChangeInEditMode", true);
      this.setState({ editMode: true  }, updateTopBar);
      BackButtonHandler.override(className, () => {
        BackButtonHandler.clearOverride(className);
        this.localEventBus.emit("ChangeInEditMode", false);
        this.setState({ editMode: false  }, updateTopBar);
      })
    }
    if (buttonId === 'done') {
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
        change.updateScene        ||
        change.changeScenes
      ) {
        let state = core.store.getState();
        let activeSphere = state.app.activeSphere;

        getTopBarProps(this.props, this.state);
        TopBarUtil.replaceOptions(this.props.componentId, NAVBAR_PARAMS_CACHE)

        if (activeSphere) {
          let sceneIds = Object.keys(state.spheres[activeSphere].scenes);
          if (this.sortedList) {
            this.initializeSortedList(activeSphere, state);
            this.sortedList.mustContain(sceneIds);
            this.setState({ data: this.sortedList.getDraggableList() })
          }
        }
        this.forceUpdate();
      }
    });
  }


  componentWillUnmount() {
    this.unsubscribeStoreEvents();
    this.localEventBus.clearAllEvents();
  }

  getScenes(scenes, sphereId) {
    let sceneContent = [];
    let idList = this.sortedList.getDraggableList();
    for (let i = 0; i < idList.length; i++) {
      let sceneId = idList[i];
      sceneContent.push(this.renderItem(scenes[sceneId], sphereId, sceneId))
    }
    return sceneContent;
  }

  render() {
    let state = core.store.getState();
    let activeSphereId = state.app.activeSphere;

    let content;

    if (activeSphereId && state.spheres[activeSphereId]) {
      let scenes = state.spheres[activeSphereId].scenes;
      let sceneIds = Object.keys(scenes);
      if (sceneIds.length === 0 && this.state.editMode === false) {
        content = <SceneIntroduction sphereId={activeSphereId} />
      }
      else {
        let showHint = sceneIds.length < HINT_THRESHOLD && Permissions.inSphere(activeSphereId).canCreateScenes === true;
        let scenesComponents = this.getScenes(scenes, activeSphereId);
        // Permissions.inSphere(activeSphereId).canCreateScenes
        content = (
          <View style={{ flexGrow: 1, alignItems:'center' }}>
            <ScrollView contentContainerStyle={{flexGrow:1}}>
              <View style={{flexGrow: 1, paddingVertical: 15, width: screenWidth, alignItems:'center'}}>
                <SlideFadeInView visible={this.state.editMode && Permissions.inSphere(activeSphereId).canCreateScenes} height={95}>
                  <SceneCreateNewItem callback={()=>{ NavigationUtil.launchModal("SceneAdd", { sphereId: activeSphereId }) }} isFirst={false} />
                </SlideFadeInView>
                <SlideFadeInView visible={!this.state.editMode && showHint} height={50}>
                  <View style={{flexDirection:"row", alignItems:'flex-end', width: screenWidth}}>
                    <View style={{flex:1}} />
                    <Text style={{paddingRight:5, paddingTop:15, fontStyle:"italic", color: colors.black.rgba(0.5)}}>{lang("Add_more_scenes_by_tappin")}</Text>
                    <ScaledImage source={require("../../images/lineDrawings/arrow.png")} sourceHeight={195} sourceWidth={500} targetHeight={27} style={{marginRight:30}} tintColor={colors.black.rgba(0.5)} />
                  </View>
                </SlideFadeInView>
                {scenesComponents}
              </View>
            </ScrollView>
            {/*<DraggableFlatList*/}
            {/*  showsVerticalScrollIndicator={false}*/}
            {/*  data={["add", ...this.state.data, "spacer"]}*/}
            {/*  onRelease={() => { this.localEventBus.emit("END_DRAG" );}}*/}
            {/*  renderItem={({ item, index, drag, isActive }) => { return this.renderItem( scenes[item as string], activeSphere, item, index, drag, isActive ); }}*/}
            {/*  keyExtractor={(item : any, index) => `draggable-item-${item}`}*/}
            {/*  onDragEnd={({ data }) => {*/}
            {/*    let dataToUse = [];*/}
            {/*    for (let i = 0; i < data.length; i++) {*/}
            {/*      if (scenes[data[i]] !== undefined) {*/}
            {/*        dataToUse.push(data[i]);*/}
            {/*      }*/}
            {/*    }*/}
            {/*    this.setState({ data: dataToUse }); this.sortedList.update(dataToUse as string[])}}*/}
            {/*  activationDistance={10}*/}
            {/*  style={{paddingTop: hintShown ? 10 : 20}}*/}
            {/*/>*/}
          </View>
         );
       }
     }
     else {
      content = <ScenesWithoutSpheres />;
    }

    return (
      <RoundedBackground image={core.background.lightBlur} style={{borderTopRightRadius:SceneConstants.roundness, borderTopLeftRadius:SceneConstants.roundness, backgroundColor: colors.white.hex}} hideOrangeLine={true} hideNotifications={true}>
        {content}
      </RoundedBackground>
    );
  }
}




function getTopBarProps(props, viewState) {
  let state = core.store.getState();
  let activeSphereId = state.app.activeSphere;
  let activeSphere = state.spheres[activeSphereId];
  let scenesAvailable = false;
  if (activeSphereId) {
    scenesAvailable = Object.keys(state.spheres[activeSphereId].scenes).length > 0;
  }
  let title = "Scenes";

  if (!activeSphereId) {
    NAVBAR_PARAMS_CACHE = { title: title };
    return NAVBAR_PARAMS_CACHE;
  }
  else if (activeSphere) {
    title += " in " + activeSphere.config.name;
  }


  if (scenesAvailable) {
    if (viewState.editMode !== true) {
      NAVBAR_PARAMS_CACHE = { title: title, edit: true };
    }
    else {
      NAVBAR_PARAMS_CACHE = { title: title, done: true };
    }
  }
  else {
    if (viewState.editMode === true) {
      NAVBAR_PARAMS_CACHE = { title: title, done: true };
    }
    else {
      NAVBAR_PARAMS_CACHE = { title: title };
    }
  }

  return NAVBAR_PARAMS_CACHE;
}

let NAVBAR_PARAMS_CACHE : topbarOptions = null;