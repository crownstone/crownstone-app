
import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("ApplianceAdd", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  Alert,
  Dimensions,
  Image,
  PixelRatio,
  ScrollView,
  Switch,
  Text,
  TouchableHighlight,
  View
} from 'react-native';

import { Background } from '../components/Background'
import { ListEditableItems } from '../components/ListEditableItems'
const Actions = require('react-native-router-flux').Actions;
import {tabBarHeight, screenWidth} from '../styles'
import {getRandomC1Name} from "../../fonts/customIcons";
import {transferAppliances} from "../../cloud/transferData/transferAppliances";
import {Util} from "../../util/Util";
import {MapProvider} from "../../backgroundProcesses/MapProvider";
import {BackAction} from "../../util/Back";
import {CancelButton} from "../components/topbar/CancelButton";
import {TopbarButton} from "../components/topbar/TopbarButton";



export class ApplianceAdd extends Component<any, any> {
  static navigationOptions = ({ navigation }) => {
    const { params } = navigation.state;
    return {
      title: lang("Add_Device_Type"),
      headerLeft: <CancelButton onPress={BackAction} />,
      headerRight: <TopbarButton
        text={ lang("Create")}
        onPress={() => {
          params.rightAction ? params.rightAction() : () => {}
        }}
      />
    }
  };

  refName : string;

  constructor(props) {
    super(props);
    this.state = {name:'', icon: getRandomC1Name(), selectedStones: {}};
    this.refName = "listItems";

    this.props.navigation.setParams({rightAction: () => { this.createDevice();}})
  }

  _getItems() {
    let items = [];
    items.push({label: lang("NEW_DEVICE"), type:'explanation', below:false});
    items.push({label: lang("Type_Name"), type: 'textEdit', placeholder:lang("My_device_name"), value: this.state.name, callback: (newText) => {
      this.setState({name:newText});
    }});
    items.push({label: lang("Icon"), type: 'icon', value: this.state.icon, callback: () => {
        Actions.deviceIconSelection({
          icon: this.state.icon,
          callback: (newIcon) => { this.setState({icon:newIcon}); }
        }
      )}
    });
    items.push({label: lang("The_properties_of_device_"), type:'largeExplanation', centered: true});

    return items;
  }


  createDevice() {
    // make sure all text fields are blurred
    this.props.eventBus.emit("inputComplete");
    setTimeout(() => { this._createDevice(); }, 20);
  }

  _createDevice() {
    if (this.state.name.length === 0) {
      Alert.alert(
lang("_Device_name_must_be_at_l_header"),
lang("_Device_name_must_be_at_l_body"),
[{text:lang("_Device_name_must_be_at_l_left")}]
      )
    }
    else {
      this.props.eventBus.emit('showLoading', 'Creating new Device Type...');
      let actions = [];
      let localId = Util.getUUID();
      // todo Move to create new location method once it is implemented in transferLocations
      actions.push({type: 'ADD_APPLIANCE', sphereId: this.props.sphereId, applianceId: localId, data:{name: this.state.name, icon: this.state.icon}});
      transferAppliances.createOnCloud(actions, {
        localId: localId,
        localData: {
          config: {
            name: this.state.name,
            icon: this.state.icon,
          },
        },
        localSphereId: this.props.sphereId,
        cloudSphereId: MapProvider.local2cloudMap.spheres[this.props.sphereId]
      })
        .then(() => {
          this.props.store.batchDispatch(actions);
          this.props.eventBus.emit('hideLoading');
          this.props.callback(localId);
          BackAction('deviceOverview');
        })
        .catch((err) => {
          let defaultAction = () => { this.props.eventBus.emit('hideLoading');};
          Alert.alert(
lang("_Encountered_Cloud_Issue__header"),
lang("_Encountered_Cloud_Issue__body"),
[{text:lang("_Encountered_Cloud_Issue__left"), onPress: defaultAction }],
            { onDismiss: defaultAction }
          )
        });
    }
  }

  render() {
    let backgroundImage = this.props.getBackground('menu', this.props.viewingRemotely);

    if (this.props.sphereId === null) {
      BackAction();
      return <View />
    }

    let items = this._getItems();
    let imageSize = 0.9;
    return (
      <Background hasNavBar={false} image={backgroundImage} >
        <View style={{flex:1}}>
            <ListEditableItems ref={this.refName} focusOnLoad={true} items={items} separatorIndent={true} />
            <View style={{flex:1, alignItems:'center', justifyContent:'center', paddingTop:10, paddingBottom: tabBarHeight + 20}}>
              <Image source={require('../../images/sharedProperties.png')} style={{width:imageSize*0.535*screenWidth, height: imageSize*0.512*screenWidth}} />
            </View>
        </View>
      </Background>
    );
  }
}
