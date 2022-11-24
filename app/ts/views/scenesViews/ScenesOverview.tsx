import { Languages } from "../../Languages";

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("ScenesOverview", key)(a,b,c,d,e);
}
import * as React                 from 'react';
import {Text, View, Alert } from "react-native";
import {
  screenWidth,
  colors,
  styles,
  tabBarHeight,
  availableScreenHeight, viewPaddingTop
} from "../styles";
import { LiveComponent }          from "../LiveComponent";
import { core }                   from "../../Core";
import { BackButtonHandler }      from "../../backgroundProcesses/BackButtonHandler";
import { Permissions }            from "../../backgroundProcesses/PermissionManager";
import { SlideFadeInView }        from "../components/animated/SlideFadeInView";
import { EventBusClass }          from "../../util/EventBus";
import { SceneCreateNewItem }     from "./supportComponents/SceneCreateNewItem";
import { SceneIntroduction }   from "./supportComponents/SceneIntroduction";
import { SceneItem }              from "./supportComponents/SceneItem";
import { NavigationUtil } from "../../util/navigation/NavigationUtil";
import { SortedList, SortingManager } from "../../logic/SortingManager";
import { ScaledImage } from "../components/ScaledImage";
import { BackgroundCustomTopBarNavbar } from "../components/Background";
import { Get } from "../../util/GetUtil";
import { TopBarBlur } from "../components/NavBarBlur";
import { NestableDraggableFlatList, NestableScrollContainer } from "react-native-draggable-flatlist";
import { EditDone, EditIcon } from "../components/EditIcon";
import {ContentNoSphere} from "../energyUsage/components/ContentNoSphere";
import { MapProvider } from "../../backgroundProcesses/MapProvider";

const CLASS_NAME = "ScenesOverview";
const HINT_THRESHOLD = 3;

export class ScenesOverview extends LiveComponent<any, any> {
  localEventBus : EventBusClass;
  unsubscribeStoreEvents = null;
  sortedList : SortedList = null;

  parentRef
  childRef

  constructor(props) {
    super(props);

    let state = core.store.getState();
    let activeSphere = state.app.activeSphere;
    let data = this.initializeSortedList(activeSphere);

    this.state = {
      editMode: false,
      dragging: false,
      data: data
    }
    this.parentRef = React.createRef();
    this.childRef  = React.createRef();
    this.localEventBus = new EventBusClass('localScenesOverview');
  }

  initializeSortedList(activeSphereId) {
    let data = [];
    if (activeSphereId) {
      let activeSphere = Get.activeSphere();
      let sceneIds = Object.keys(activeSphere.scenes).map((id) => { return activeSphere.scenes[id].cloudId });
      this.sortedList = SortingManager.getList(activeSphereId, CLASS_NAME, "Overview", sceneIds);
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

        if (activeSphere) {
          let sceneIds = Object.keys(activeSphere.scenes).map((id) => { return activeSphere.scenes[id].cloudId });
          this.initializeSortedList(activeSphereId);
          if (this.sortedList) {
            this.sortedList.mustContain(sceneIds);
          }
          this.setState({ data: this.sortedList.getDraggableList() });
          return;
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
    BackButtonHandler.override(CLASS_NAME, () => {
      BackButtonHandler.clearOverride(CLASS_NAME);
      this.localEventBus.emit("ChangeInEditMode", false);
      this.setState({ editMode: false  });
    })
  }

  endEditMode = () => {
    this.localEventBus.emit("ChangeInEditMode", false);
    BackButtonHandler.clearOverride(CLASS_NAME);
    this.setState({ editMode: false });
  }


  renderDraggableItem = (cloudId: string, index: number, drag: () => void, isActive: boolean) => {
    let state = core.store.getState();
    let activeSphereId = state.app.activeSphere;
    let scene = Get.scene(activeSphereId, MapProvider.cloud2localMap.scenes[cloudId]);
    if (!scene) { return <View/> }
    return (
      <SceneItem
        key={cloudId}
        scene={scene}
        sceneCloudId={cloudId}
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

    if (activeSphereId && sphere) {
      let scenes = sphere.scenes;
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
                  if (!this.state.dragging) { return; }

                  let dataToUse = [];

                  let sceneIds = {};
                  Object.keys(sphere.scenes).map((id) => { sceneIds[sphere.scenes[id].cloudId] = true; });

                  for (let i = 0; i < data.length; i++) {
                    if (sceneIds[data[i]] !== undefined) {
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



