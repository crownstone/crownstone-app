
import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("SphereEdit", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  Alert, Button,
  RefreshControl,
  ScrollView
} from "react-native";

import { Background }        from '../components/Background'
import { ListEditableItems } from '../components/ListEditableItems'
import { IconButton }        from '../components/IconButton'
import { colors }            from './../styles';
import { Permissions }       from "../../backgroundProcesses/PermissionManager";
import { OrangeLine }        from "../styles";
import { eventBus }          from "../../util/EventBus";
import { CLOUD }             from "../../cloud/cloudAPI";
import { createNewSphere }   from "../../util/CreateSphere";
import { core }              from "../../core";
import { TopbarBackButton }  from "../components/topbar/TopbarButton";
import { NavigationUtil } from "../../util/NavigationUtil";

export class SphereEdit extends Component<any, any> {
  static navigationOptions = ({ navigation }) => {
    const { params } = navigation.state;
    let state = core.store.getState();
    if (params.sphereId) {
      let sphere = state.spheres[params.sphereId];
      if (sphere) {
        return {
          title: sphere.config.name,
          headerLeft: <TopbarBackButton text={lang("Back")} onPress={() => { navigation.goBack(null) }} />
        }
      }
    }

    return {
      title: lang("Welcome_"),
      headerLeft: <TopbarBackButton text={lang("Back")} onPress={() => { navigation.goBack(null) }} />
    }
  };

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
    let radius = 12;

    if (!this.props.sphereId || !state.spheres[this.props.sphereId]) {
      if (amountOfSpheres === 0) {

        items.push({
          label: lang("Create_Sphere"),
          type: 'navigation',
          largeIcon: <IconButton name='c1-sphere' buttonSize={55} size={40} radius={radius} button={true} color="#fff"
                                 buttonStyle={{ backgroundColor: colors.green.hex }}/>,
          callback: () => {
            createNewSphere(state.user.firstName + "'s Sphere")
              .then((sphereId) => {
                setTimeout(() => {
                  NavigationUtil.navigate("AiStart");
                }, 100)
              })
              .catch((err) => {
                Alert.alert(lang("Whoops!"), lang("Something_went_wrong_with"), [{ text: lang("OK") }])
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
          largeIcon: <IconButton plusSize={25} addIcon={true} name="c1-sphere" buttonSize={55} size={40} radius={radius} color="#fff" buttonStyle={{backgroundColor: colors.csBlueLight.hex}} />,
          type: 'navigation',
          callback: () => {
            NavigationUtil.navigate("AddSphereTutorial");
          }
        });
        items.push({label: lang("Careful_a_sphere_is_not"),    type:'explanation', below: true});
        items.push({label: lang("More_items_are_available_"),  type:'explanation', below: false});
        return items;
      }
    }

    let spherePermissions = Permissions.inSphere(this.props.sphereId);

    items.push({
      label: lang("Rooms"),
      type: 'navigation',
      largeIcon: <IconButton name='md-cube' buttonSize={55} size={40} radius={radius} button={true} color="#fff" buttonStyle={{backgroundColor: colors.green.hex}}/>,
      callback: () => {
        console.log("HERE LA PROPOS", this.props)
        NavigationUtil.navigate("SphereRoomOverview", {sphereId: this.props.sphereId});
      }
    });


    items.push({
      label: lang("Crownstones"),
      type: 'navigation',
      largeIcon: <IconButton name='c2-pluginFilled' buttonSize={55} size={40} radius={radius} button={true} color="#fff" buttonStyle={{backgroundColor: colors.purple.hex}}/>,
      callback: () => {
        NavigationUtil.navigate("SphereCrownstoneOverview", {sphereId: this.props.sphereId});
      }
    });

    items.push({
      label: lang("Users"),
      type: 'navigation',
      fieldId: 'sphereEdit_users',
      largeIcon: <IconButton name='c1-people' buttonSize={55} size={40} radius={radius} button={true} color="#fff" buttonStyle={{backgroundColor: colors.menuTextSelected.hex}}/>,
      callback: () => {
        NavigationUtil.navigate("SphereUserOverview", {sphereId: this.props.sphereId});
      }
    });

    if (spherePermissions.editSphere) {
      items.push({
        label: lang("Behaviour"),
        type: 'navigation',
        largeIcon: <IconButton name='c1-brain' buttonSize={55} size={40} radius={radius} button={true} color="#fff" buttonStyle={{backgroundColor: colors.csBlue.hex, marginLeft: 3, marginRight: 7}}/>,
        callback: () => {
          NavigationUtil.navigate("SphereBehaviour", {sphereId: this.props.sphereId});
        }
      });
    }

    items.push({
      label: lang("Integrations"),
      type: 'navigation',
      largeIcon: <IconButton name='ios-link' buttonSize={55} size={40} radius={radius} button={true} color="#fff" buttonStyle={{backgroundColor: colors.darkBackground.hex}}/>,
      callback: () => {
        NavigationUtil.navigate("SphereIntegrations", {sphereId: this.props.sphereId});
      }
    });

    items.push({label: lang("SPHERE_SETTINGS"),  type:'explanation'});
    items.push({
      label: lang("Settings"),
      largeIcon: <IconButton name="ios-cog" buttonSize={55} size={40} radius={radius} color="#fff" buttonStyle={{backgroundColor: colors.menuRed.hex}} />,
      type: 'navigation',
      callback: () => {
        NavigationUtil.navigate("SphereEditSettings", {sphereId: this.props.sphereId});
      }
    });

    items.push({label: lang("Sphere_Creation"),  type:'explanation'});
    items.push({
      label: lang("Create_a_new_Sphere"),
      largeIcon: <IconButton plusSize={25} addIcon={true} name="c1-sphere" buttonSize={55} size={40} radius={radius} color="#fff" buttonStyle={{backgroundColor: colors.csBlueLight.hex}} />,
      type: 'navigation',
      callback: () => {
        NavigationUtil.navigate("AddSphereTutorial", {sphereId: this.props.sphereId});
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
      <Background image={core.background.menu} hasNavBar={false} >
        <OrangeLine/>
        <ScrollView>
          <RefreshControl
            refreshing={this.state.syncing}
            onRefresh={() => { this.setState({syncing: true}); CLOUD.sync(core.store, true) }}
            title={ lang("Syncing_with_the_Cloud___")}
            titleColor={colors.darkGray.hex}
            colors={[colors.csBlue.hex]}
            tintColor={colors.csBlue.hex}
          />
          <ListEditableItems items={this._getItems()} />
        </ScrollView>
      </Background>
    );
  }
}
