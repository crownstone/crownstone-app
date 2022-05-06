
import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("SphereEdit", key)(a,b,c,d,e);
}
import * as React from 'react';
import {
  Alert, RefreshControl,
  ScrollView
} from "react-native";

import { ListEditableItems } from '../components/ListEditableItems'
import { IconButton }        from '../components/IconButton'
import { background, colors } from "./../styles";
import { CLOUD }             from "../../cloud/cloudAPI";
import { createNewSphere }   from "../../util/CreateSphere";
import { core }              from "../../Core";
import { NavigationUtil }    from "../../util/navigation/NavigationUtil";
import { TopBarUtil }        from "../../util/TopBarUtil";
import { LiveComponent }     from "../LiveComponent";
import { BackgroundNoNotification } from "../components/BackgroundNoNotification";
import {Stacks} from "../Stacks";
import {Icon} from "../components/Icon";
import {SettingsBackground} from "../components/SettingsBackground";

export class SphereEdit extends LiveComponent<any, any> {
  static options(props) {
    let state = core.store.getState();
    if (props.sphereId) {
      let sphere = state.spheres[props.sphereId];
      if (sphere) {
        return TopBarUtil.getOptions({title: sphere.config.name, closeModal: true})
      }
    }

    return TopBarUtil.getOptions({title:  lang("Welcome_"), closeModal: true})
  }


  unsubscribe = [];

  constructor(props) {
    super(props);
    this.state = {syncing: false};
  }

  componentDidMount() {
    this.unsubscribe.push(core.eventBus.on("CloudSyncComplete", () => {
      if (this.state.syncing) {
        this.setState({syncing: false})
      }
    }));
  }

  componentWillUnmount() {
    this.unsubscribe.forEach((unsub) => { unsub(); });
  }

  _getItems() {
    let items = [];
    let state = core.store.getState();
    let amountOfSpheres = Object.keys(state.spheres).length;
    items.push({ label: lang("What_can_I_help_you_with_"), type: 'largeExplanation' });

    if (!this.props.sphereId || !state.spheres[this.props.sphereId]) {
      if (amountOfSpheres === 0) {
        items.push({
          label: lang("Create_Sphere"),
          type: 'navigation',
          testID: "SphereEdit_createOnlySphere",
          icon: <Icon name='c1-sphere' size={25} color={colors.green.hex} buttonStyle={{ backgroundColor: colors.green.hex }}/>,
          callback: () => {
            createNewSphere(state.user.firstName + "'s Sphere")
              .then((localSphereId) => {
                setTimeout(() => {
                  NavigationUtil.setRoot(Stacks.loggedIn());
                }, 100)
              })
              .catch((err) => {
                Alert.alert(lang("Whoops"), lang("Something_went_wrong_with"), [{ text: lang("OK") }])
              });
          }
        });
        items.push({ label: lang("A_Sphere_contains_your_Cr"), type: 'explanation', below: true });
        return items;
      }
      else {
        items.push({label: lang("Sphere_Creation"),  type:'explanation'});
        items.push({
          label: lang("Create_a_new_Sphere"),
          icon: <Icon name="c1-sphere" size={25} color={colors.csBlueLight.hex}/>,
          type: 'navigation',
          callback: () => {
            NavigationUtil.navigate( "AddSphereTutorial");
          }
        });
        items.push({label: lang("Careful_a_sphere_is_not"),    type:'explanation', below: true});
        items.push({label: lang("More_items_are_available_"),  type:'explanation', below: false});
        return items;
      }
    }

    items.push({
      label: lang("Rooms"),
      type: 'navigation',
      testID: 'SphereEdit_rooms',
      icon: <Icon name='md-cube' size={30}  color={colors.green.hex}/>,
      callback: () => {
        NavigationUtil.navigate( "SphereRoomOverview", {sphereId: this.props.sphereId});
      }
    });


    items.push({
      label: lang("Crownstones"),
      type: 'navigation',
      testID: 'SphereEdit_crownstones',
      icon: <Icon name='c2-crownstone' size={30}  color={colors.black.hex}/>,
      callback: () => {
        NavigationUtil.navigate( "SphereCrownstoneOverview", {sphereId: this.props.sphereId});
      }
    });

    items.push({
      label: lang("Hubs"),
      type: 'navigation',
      testID: 'SphereEdit_hubs',
      icon: <Icon name='c1-router' size={30}  color={colors.darkerPurple.hex}/>,
      callback: () => {
        NavigationUtil.navigate( "SphereHubOverview", {sphereId: this.props.sphereId});
      }
    });

    items.push({
      label: lang("Users"),
      type: 'navigation',
      fieldId: 'sphereEdit_users',
      testID: 'SphereEdit_users',
      icon: <Icon name='c1-people' size={30}  color={colors.blue.hex}/>,
      callback: () => {
        NavigationUtil.navigate( "SphereUserOverview", {sphereId: this.props.sphereId});
      }
    });


    items.push({
      label: lang("Integrations"),
      type: 'navigation',
      testID: 'SphereEdit_integrations',
      icon: <Icon name='ios-link' size={30}  color={colors.csBlueDark.hex}/>,
      callback: () => {
        NavigationUtil.navigate( "SphereIntegrations", {sphereId: this.props.sphereId});
      }
    });

    items.push({label: lang("SPHERE_SETTINGS"),  type:'explanation'});
    items.push({
      label: lang("Settings"),
      icon: <Icon name="ios-cog" size={30} color={colors.csBlue.hex}/>,
      type: 'navigation',
      testID: 'SphereEdit_settings',
      callback: () => {
        NavigationUtil.navigate( "SphereEditSettings", {sphereId: this.props.sphereId});
      }
    });

    items.push({label: lang("Sphere_Creation"),  type:'explanation'});
    items.push({
      label: lang("Create_a_new_Sphere"),
      icon: <Icon name="c1-sphere" size={25} color={colors.csBlueLight.hex}/>,
      type: 'navigation',
      testID: 'SphereEdit_createSphere',
      callback: () => {
        NavigationUtil.launchModal( "AddSphereTutorial", {sphereId: this.props.sphereId});
      }
    });
    items.push({label: lang("Careful_a_sphere_is_not"),  type:'explanation', below: true});

    items.push({type:'spacer'});
    items.push({type:'spacer'});
    items.push({type:'spacer'});

    return items;
  }



  render() {
    return (
      <SettingsBackground testID={'SphereEdit'}>
        <ScrollView testID={"SphereEditScrollView"}>
          <RefreshControl
            refreshing={this.state.syncing}
            onRefresh={() => { this.setState({syncing: true}); CLOUD.sync(core.store, true) }}
            title={ lang("Syncing_with_the_Cloud___")}
            titleColor={colors.black.hex}
            colors={[colors.black.hex]}
            tintColor={colors.black.hex}
            progressViewOffset={-70}
          />
          <ListEditableItems items={this._getItems()} />
        </ScrollView>
      </SettingsBackground>
    );
  }
}
