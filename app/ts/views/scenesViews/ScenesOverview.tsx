import { Languages } from "../../Languages";

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("ScenesOverview", key)(a,b,c,d,e);
}
import * as React                 from 'react';
import {Text, View, Alert, ScrollView, TouchableOpacity} from "react-native";
import {
  screenWidth,
  colors,
  background,
  styles,
  tabBarHeight,
  topBarHeight,
  statusBarHeight,
  availableScreenHeight, viewPaddingTop
} from "../styles";
import { LiveComponent }          from "../LiveComponent";
import { core }                   from "../../Core";
import { TopBarUtil }             from "../../util/TopBarUtil";
import { BackButtonHandler }      from "../../backgroundProcesses/BackButtonHandler";
import { Permissions }            from "../../backgroundProcesses/PermissionManager";
import { SlideFadeInView }        from "../components/animated/SlideFadeInView";
import { EventBusClass }          from "../../util/EventBus";
import { SceneConstants }         from "./constants/SceneConstants";
import { SceneCreateNewItem }     from "./supportComponents/SceneCreateNewItem";
import { SceneIntroduction,
         ScenesWithoutSpheres }   from "./supportComponents/SceneIntroduction";
import { SceneItem }              from "./supportComponents/SceneItem";
import { NavigationUtil } from "../../util/navigation/NavigationUtil";
import { SortedList, SortingManager } from "../../logic/SortingManager";
import { ScaledImage } from "../components/ScaledImage";
import { Background, BackgroundCustomTopBarNavbar } from "../components/Background";
import { Icon } from "../components/Icon";
import { Get } from "../../util/GetUtil";
import { NavBarBlur, TopBarBlur } from "../components/NavBarBlur";
import DraggableFlatList, { NestableDraggableFlatList, NestableScrollContainer } from "react-native-draggable-flatlist";
import { EditDone, EditIcon } from "../components/EditIcon";
import {ContentNoSphere} from "../energyUsage/components/ContentNoSphere";
import { MapProvider } from "../../backgroundProcesses/MapProvider";

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

  parentRef
  childRef

  constructor(props) {
    super(props);

    let state = core.store.getState();
    let activeSphere = state.app.activeSphere;
    let data = this.initializeSortedList(activeSphere, state);

    this.state = {
      editMode: false,
      dragging: false,
      data: data
    }
    this.parentRef = React.createRef();
    this.childRef  = React.createRef();
    this.localEventBus = new EventBusClass('localScenesOverview');
  }

  initializeSortedList(activeSphereId, state) {
    let data = [];
    if (activeSphereId) {
      let activeSphere = Get.activeSphere();
      let sceneIds = Object.keys(activeSphere.scenes).map((id) => { return activeSphere.scenes[id].cloudId });
      this.sortedList = SortingManager.getList(activeSphereId, className, "Overview", sceneIds);
      data = this.sortedList.getDraggableList();
    }
    return data;
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
        let activeSphereId = state.app.activeSphere;
        let activeSphere = Get.activeSphere();

        getTopBarProps(this.props, this.state);
        TopBarUtil.replaceOptions(this.props.componentId, NAVBAR_PARAMS_CACHE)

        if (activeSphere) {
          let sceneIds = Object.keys(activeSphere.scenes).map((id) => { return activeSphere.scenes[id].cloudId });
          if (this.sortedList) {
            this.initializeSortedList(activeSphereId, state);
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

  setEditMode = () => {
    let state = core.store.getState();
    let activeSphereId = state.app.activeSphere;
    if (Permissions.inSphere(activeSphereId).canCreateScenes == false) {
      Alert.alert(lang("You_do_not_have_permissio"),lang("Ask_an_admin_in_your_Sphe"), [{text:lang("OK")}]);
      return;
    }

    this.localEventBus.emit("ChangeInEditMode", true);
    this.setState({ editMode: true  });
    BackButtonHandler.override(className, () => {
      BackButtonHandler.clearOverride(className);
      this.localEventBus.emit("ChangeInEditMode", false);
      this.setState({ editMode: false  });
    })
  }

  endEditMode = () => {
    this.localEventBus.emit("ChangeInEditMode", false);
    BackButtonHandler.clearOverride(className);
    this.setState({ editMode: false });
  }


  renderDraggableItem = (id: string, index: number, drag: () => void, isActive: boolean) => {
    let state = core.store.getState();
    let activeSphereId = state.app.activeSphere;
    let scene = Get.scene(activeSphereId, MapProvider.cloud2localMap.scenes[id]);
    if (!scene) { return <View/> }
    return (
      <SceneItem
        key={id}
        scene={scene}
        sceneId={id}
        sphereId={activeSphereId}
        stateEditMode={this.state.editMode}
        dragAction={drag}
        eventBus={this.localEventBus}
        isBeingDragged={isActive}
      />
    );
  }


  render() {
    let state = core.store.getState();
    let activeSphereId = state.app.activeSphere;
    let sphere = Get.sphere(activeSphereId);

    let content;
    let hintShown = false

    if (activeSphereId && state.spheres[activeSphereId]) {
      let scenes = state.spheres[activeSphereId].scenes;
      let sceneIds = Object.keys(scenes);
      if (sceneIds.length === 0 && this.state.editMode === false) {
        content = <SceneIntroduction sphereId={activeSphereId} />
      }
      else {
        let showHint = sceneIds.length < HINT_THRESHOLD && Permissions.inSphere(activeSphereId).canCreateScenes === true;

        let data = [...this.state.data];

        content = (
          <React.Fragment>
            <NestableScrollContainer
              showsVerticalScrollIndicator={false}
              contentInsetAdjustmentBehavior={'never'}
              contentContainerStyle={{paddingTop: viewPaddingTop, paddingBottom: 2*tabBarHeight}}
            >
              <SlideFadeInView visible={!this.state.editMode && showHint} height={50}>
                <AddHint />
              </SlideFadeInView>
              <SlideFadeInView visible={this.state.editMode && Permissions.inSphere(activeSphereId).canCreateScenes} height={95}>
                <SceneCreateNewItem callback={()=>{ NavigationUtil.launchModal("SceneAdd", { sphereId: activeSphereId }) }} isFirst={false} />
              </SlideFadeInView>
              <NestableDraggableFlatList
                containerStyle={{minHeight: availableScreenHeight}}
                activationDistance={this.state.dragging ? 5 : 120}
                data={data}
                onDragBegin={() => { this.setState({dragging: true}); }}
                onRelease={() => {
                  this.localEventBus.emit("END_DRAG" );
                }}
                renderItem={({ item, index, drag, isActive }) => { return this.renderDraggableItem( item, index, drag, isActive ); }}
                keyExtractor={(item : any, index) => `draggable-item-${item}`}
                onDragEnd={({ data }) => {
                  let dataToUse = [];
                  for (let i = 0; i < data.length; i++) {
                    if (scenes[data[i]] !== undefined) {
                      dataToUse.push(data[i]);
                    }
                  }
                  this.setState({ data: dataToUse, dragging:false }); this.sortedList.update(dataToUse as string[]);
                }}
              />
            </NestableScrollContainer>
          </React.Fragment>
        );
      }
    }
    else {
      return  <BackgroundCustomTopBarNavbar><ContentNoSphere /></BackgroundCustomTopBarNavbar>;
    }



    return (
      <BackgroundCustomTopBarNavbar testID={'ScenesOverview'}>
        {content}
        <TopBarBlur xlight>
          <SceneHeader editMode={this.state.editMode} setEditMode={this.setEditMode} endEditMode={this.endEditMode} />
        </TopBarBlur>
        <NavBarBlur xlight/>
      </BackgroundCustomTopBarNavbar>
    );
  }
}

function SceneHeader({editMode, setEditMode, endEditMode}) {
  return (
    <View style={{flexDirection:'row', paddingLeft: 15, alignItems:'center'}}>
      <Text style={styles.viewHeader}>{ lang("Scenes") }</Text>
      <View style={{flex:1}} />
      {editMode ?
        <EditDone onPress={endEditMode} />
        :
        <EditIcon onPress={setEditMode} />
      }
    </View>
  );
}


function AddHint(props) {
  return (
    <View style={{flexDirection:"row", alignItems:'flex-end', width: screenWidth, paddingBottom: 15}}>
      <View style={{flex:1}} />
      <Text style={{paddingRight:5, paddingTop:15, fontStyle:"italic", color: colors.black.rgba(0.5)}}>{lang("Add_more_scenes_by_tappin")}</Text>
      <ScaledImage
        source={require("../../../assets/images/lineDrawings/arrow.png")}
        sourceHeight={195} sourceWidth={500} targetHeight={27} style={{marginRight:30}}
        tintColor={colors.black.rgba(0.5)}
      />
    </View>
  );
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
