import * as React                 from 'react';
import { Text, View }             from "react-native";
import { screenWidth, colors}     from "../styles";
import { LiveComponent }          from "../LiveComponent";
import { core }                   from "../../core";
import { TopBarUtil }             from "../../util/TopBarUtil";
import { Background }             from "../components/Background";
import { BackButtonHandler }      from "../../backgroundProcesses/BackButtonHandler";
import { Permissions }            from "../../backgroundProcesses/PermissionManager";
import { SlideFadeInView }        from "../components/animated/SlideFadeInView";
import DraggableFlatList          from 'react-native-draggable-flatlist'
import { EventBusClass }          from "../../util/EventBus";
import { SceneConstants }         from "./constants/SceneConstants";
import { SceneCreateNewItem }     from "./supportComponents/SceneCreateNewItem";
import { SceneIntroduction,
         ScenesWithoutSpheres }   from "./supportComponents/SceneIntroduction";
import { SceneItem }              from "./supportComponents/SceneItem";
import { NavigationUtil } from "../../util/NavigationUtil";
import { SortedList, SortingManager } from "../../logic/SortingManager";


let className = "ScenesOverview";

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
    let data = [];
    if (activeSphere) {
      let sceneIds = Object.keys(state.spheres[activeSphere].scenes);
      this.sortedList = SortingManager.getList(activeSphere, className, "Overview", sceneIds);
      data = this.sortedList.sortedList;
    }

    this.state = {
      editMode: true,
      data: data,
      invalidationkey:'ImHereForTheDraggable'
    }

    this.localEventBus = new EventBusClass();
  }

  renderItem(scene, sphereId, item, index, drag, isBeingDragged) {
    return (
      <SceneItem
        scene={scene}
        sphereId={sphereId}
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
      this.localEventBus.emit("ChangeInEditMode", true);
      this.setState({ editMode: true  }, updateTopBar);
      BackButtonHandler.override(className, () => {
        BackButtonHandler.clearOverride(className);

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

    let content;
    if (activeSphere && state.spheres[activeSphere]) {
      let scenes = state.spheres[activeSphere].scenes;
      let sceneIds = Object.keys(scenes);
      if (sceneIds.length === 0) {
        content = <SceneIntroduction sphereId={activeSphere} />
      }
      else {
        content = (
          <View style={{ flexGrow: 1, alignItems:'center', paddingTop: 20 }}>
            <SlideFadeInView visible={this.state.editMode} height={100}>
              <SceneCreateNewItem callback={()=>{ NavigationUtil.launchModal("SceneAdd", { sphereId: activeSphere }) }} isFirst={false} />
            </SlideFadeInView>
            <DraggableFlatList
              data={this.state.data}
              onRelease={() => { this.localEventBus.emit("END_DRAG" );}}
              renderItem={({ item, index, drag, isActive }) => { return this.renderItem( scenes[item as string], activeSphere, item, index, drag, isActive ); }}
              keyExtractor={(item : any, index) => `draggable-item-${item.key}`}
              onDragEnd={({ data }) => { this.setState({ data }); this.sortedList.update(data as string[])}}
              activationDistance={1}
            />
          </View>
         );
       }
     }
     else {
      content = <ScenesWithoutSpheres />;
    }

    return (
      <View style={{backgroundColor: colors.csBlueDarker.hex, flex:1}}>
        <View style={{backgroundColor: colors.csOrange.hex, flex:1, borderRadius: SceneConstants.roundness, overflow: 'hidden'}}>
          <View style={{height:2, width: screenWidth, backgroundColor: "transparent"}} />
          <View>
            <Background image={core.background.lightBlur} style={{borderTopRightRadius:SceneConstants.roundness, borderTopLeftRadius:SceneConstants.roundness, backgroundColor: colors.white.hex}} hideOrangeLine={true} hideNotifications={true}>
              {content}
            </Background>
          </View>
        </View>
      </View>
    );
  }
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