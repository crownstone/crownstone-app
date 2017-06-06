import * as React from 'react'; import { Component } from 'react';
import {
  Alert,
  Dimensions,
  TouchableHighlight,
  PixelRatio,
  ScrollView,
  Switch,
  Text,
  View
} from 'react-native';

import { TopBar } from '../components/Topbar'
import { Background } from '../components/Background'
import { IconCircle } from '../components/IconCircle'
import { ListEditableItems } from '../components/ListEditableItems'
import { getLocationNamesInSphere, getStonesAndAppliancesInLocation } from '../../util/DataUtil'
import { CLOUD } from '../../cloud/cloudAPI'
import { LOG } from '../../logging/Log'
const Actions = require('react-native-router-flux').Actions;
import { styles, colors, screenHeight, tabBarHeight, topBarHeight } from '../styles'



export class ApplianceAdd extends Component<any, any> {
  refName : string;

  constructor(props) {
    super();
    this.state = {name:'', icon: 'c1-bookshelf', selectedStones: {}};
    this.refName = "listItems";
  }

  _getItems() {
    let items = [];
    items.push({label:'NEW DEVICE', type:'explanation', below:false});
    items.push({label:'Device Name', type: 'textEdit', placeholder:'My device name', value: this.state.name, callback: (newText) => {
      this.setState({name:newText});
    }});
    items.push({label:'Icon', type: 'icon', value: this.state.icon,
      callback: () => {
        Actions.deviceIconSelection({
          icon: this.state.icon,
          sphereId: this.props.sphereId,
          selectCallback: (newIcon) => {Actions.pop(); this.setState({icon:newIcon});}
        }
      )}
    });

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
        'Device name must be at least 1 character long.',
        'Please change the name and try again.',
        [{text:'OK'}]
      )
    }
    else {
      this.props.eventBus.emit('showLoading', 'Creating new Device...');
      CLOUD.forSphere(this.props.sphereId).createAppliance(this.state.name, this.props.sphereId, this.state.icon)
        .then((reply) => {
          this.props.eventBus.emit('hideLoading');
          this.props.store.dispatch({type: 'ADD_APPLIANCE', sphereId: this.props.sphereId, applianceId: reply.id, data:{name: this.state.name, icon: this.state.icon}});
          this.props.callback(reply.id);
          Actions.pop({popNum:2});
        })
        .catch((err) => {
          let defaultAction = () => { this.props.eventBus.emit('hideLoading');};
          Alert.alert("Encountered Cloud Issue.",
            "We cannot create an Appliance in the Cloud. Please try again later.",
            [{ text:'OK', onPress: defaultAction }],
            { onDismiss: defaultAction }
          )
        });
    }
  }

  render() {
    let state = this.props.store.getState();
    let backgroundImage = this.props.getBackground('menu', this.props.viewingRemotely);

    if (this.props.sphereId === null) {
      Actions.pop();
      return <View />
    }

    let items = this._getItems();

    return (
      <Background hideInterface={true} image={backgroundImage} >
        <TopBar
          notBack={true}
          left={'Cancel'}
          leftStyle={{color:colors.white.hex, fontWeight: 'bold'}}
          leftAction={ Actions.pop }
          right={'Create'}
          rightStyle={{fontWeight: 'bold'}}
          rightAction={ () => { this.createDevice(); }}
          title="Create Device"/>
        <View>
            <ListEditableItems ref={this.refName} focusOnLoad={true} items={items} separatorIndent={true} />
        </View>
      </Background>
    );
  }
}
