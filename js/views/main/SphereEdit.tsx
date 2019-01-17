
import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("SphereEdit", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  Alert,
  Dimensions,
  TouchableHighlight,
  PixelRatio,
  RefreshControl,
  ScrollView,
  Switch,
  Text,
  View
} from 'react-native';
const Actions = require('react-native-router-flux').Actions;
import { Background }        from '../components/Background'
import { ListEditableItems } from '../components/ListEditableItems'
import { IconButton }        from '../components/IconButton'
import { colors }            from './../styles';
import {Permissions}         from "../../backgroundProcesses/PermissionManager";
import {OrangeLine}          from "../styles";
import {eventBus}            from "../../util/EventBus";
import {CLOUD}               from "../../cloud/cloudAPI";
import {createNewSphere} from "../../util/CreateSphere";

export class SphereEdit extends Component<any, any> {
  static navigationOptions = ({ navigation }) => {
    const { params } = navigation.state;
    let state = params.store.getState();
    if (params.sphereId) {
      let sphere = state.spheres[params.sphereId];
      if (sphere) {
        return {
          title: sphere.config.name,
          headerTruncatedBackTitle: lang("Back"),
        }
      }
    }

    return {
      title: lang("Welcome_"),
      headerTruncatedBackTitle: lang("Back"),
    }
  };

  unsubscribe = []

  constructor(props) {
    super(props);

    this.state = {syncing: false}
  }

  componentDidMount() {
    this.unsubscribe.push(eventBus.on("CloudSyncComplete", () => {
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
    let state = this.props.store.getState();

    if (!this.props.sphereId || !state.spheres[this.props.sphereId]) {
      items.push({label: lang("What_can_I_help_you_with_"),  type:'largeExplanation'});

      let radius = 12;

      items.push({
        label: lang("Create_Sphere"),
        type: 'navigation',
        largeIcon: <IconButton name='c1-sphere' buttonSize={55} size={40} radius={radius} button={true} color="#fff" buttonStyle={{backgroundColor: colors.green.hex}}/>,
        callback: () => {
          createNewSphere(eventBus, this.props.store, state.user.firstName+"'s Sphere")
            .then((sphereId) => {
              Actions.refresh({sphereId:sphereId})
              setTimeout(() => {Actions.aiStart()}, 100)
            })
            .catch((err) => {
              Alert("Whoops!", "Something went wrong with the creation of your Sphere.", [{text:"OK"}])
            });
        }
      });
      items.push({label: lang("A_Sphere_contains_your_Cr"),  type:'explanation', below: true});
      return items;
    }

    let spherePermissions = Permissions.inSphere(this.props.sphereId);

    items.push({label: lang("What_can_I_help_you_with_"),  type:'largeExplanation'});

    let radius = 12;

    items.push({
      label: lang("Rooms"),
      type: 'navigation',
      largeIcon: <IconButton name='md-cube' buttonSize={55} size={40} radius={radius} button={true} color="#fff" buttonStyle={{backgroundColor: colors.green.hex}}/>,
      callback: () => {
        Actions.sphereRoomOverview({sphereId: this.props.sphereId});
      }
    });


    items.push({
      label: lang("Crownstones"),
      type: 'navigation',
      largeIcon: <IconButton name='c2-pluginFilled' buttonSize={55} size={40} radius={radius} button={true} color="#fff" buttonStyle={{backgroundColor: colors.purple.hex}}/>,
      callback: () => {
        Actions.sphereCrownstoneOverview({sphereId: this.props.sphereId});
      }
    });



    items.push({
      label: lang("Users"),
      type: 'navigation',
      fieldId: 'sphereEdit_users',
      largeIcon: <IconButton name='c1-people' buttonSize={55} size={40} radius={radius} button={true} color="#fff" buttonStyle={{backgroundColor: colors.menuTextSelected.hex}}/>,
      callback: () => {
        Actions.sphereUserOverview({sphereId: this.props.sphereId});
      }
    });

    if (spherePermissions.editSphere) {
      items.push({
        label: lang("Behaviour"),
        type: 'navigation',
        largeIcon: <IconButton name='c1-brain' buttonSize={55} size={40} radius={radius} button={true} color="#fff" buttonStyle={{backgroundColor: colors.csBlue.hex, marginLeft: 3, marginRight: 7}}/>,
        callback: () => {
          Actions.sphereBehaviour({sphereId: this.props.sphereId});
        }
      });
    }

    items.push({
      label: lang("Integrations"),
      type: 'navigation',
      largeIcon: <IconButton name='ios-link' buttonSize={55} size={40} radius={radius} button={true} color="#fff" buttonStyle={{backgroundColor: colors.darkBackground.hex}}/>,
      callback: () => {
        Actions.sphereIntegrations({sphereId: this.props.sphereId});
      }
    });

    items.push({type:'spacer'});
    items.push({
      label: lang("Settings"),
      largeIcon: <IconButton name="ios-cog" buttonSize={55} size={40} radius={radius} color="#fff" buttonStyle={{backgroundColor: colors.menuRed.hex}} />,
      type: 'navigation',
      callback: () => {
        Actions.sphereEditSettings({sphereId: this.props.sphereId});
      }
    });

    items.push({
      label: lang("Create_Sphere"),
      largeIcon: <IconButton plusSize={25} addIcon={true} name="c1-sphere" buttonSize={55} size={40} radius={radius} color="#fff" buttonStyle={{backgroundColor: colors.csBlueLight.hex}} />,
      type: 'navigation',
      callback: () => {
        Actions.sphereEditSettings({sphereId: this.props.sphereId});
      }
    });

    items.push({type:'spacer'});
    items.push({type:'spacer'});
    items.push({type:'spacer'});

    return items;
  }



  render() {
    return (
      <Background image={this.props.backgrounds.menu} hasNavBar={false} >
        <OrangeLine/>
        <ScrollView>
          <RefreshControl
            refreshing={this.state.syncing}
            onRefresh={() => { this.setState({syncing: true}); CLOUD.sync(this.props.store, true) }}
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
