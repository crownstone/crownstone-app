import React, {
  Alert,
  Component,
  Image,
  StyleSheet,
  ScrollView,
  TouchableHighlight,
  TouchableOpacity,
  TextInput,
  Text,
  View
} from 'react-native';
var Actions = require('react-native-router-flux').Actions;

import { CLOUD } from '../../cloud/cloudAPI'
import { TopBar } from '../components/Topbar';
import { Background } from '../components/Background'
import { setupStyle } from './SetupStyles'
import { TextEditInput } from '../components/editComponents/TextEditInput'
import { styles, colors, width, height } from './../styles'

var Icon = require('react-native-vector-icons/Ionicons');

export class SetupAddPlugInStep3 extends Component {
  constructor() {
    super();
    this.state = {selectedRoom:undefined, roomName:''}
  }

  componentDidMount() {
    const { store } = this.props;
    this.unsubscribe = store.subscribe(() => {
      this.forceUpdate();
    })
  }

  componentWillUnmount() {
    this.unsubscribe();
  }

  storeLocation(roomName) {
    this.props.eventBus.emit('showLoading', 'Creating room and syncing with the Cloud...');
    const { store } = this.props;
    const state = store.getState();
    let activeGroup = state.app.activeGroup;
    CLOUD.forGroup(activeGroup).createLocation(roomName)
      .then((reply) => {
        this.props.eventBus.emit('hideLoading');
        this.setState({roomName:''});
        store.dispatch({type:'ADD_LOCATION', groupId: activeGroup, locationId: reply.data.id, data:{name: roomName}})
      })
  }

  getAddRoomBar() {
    let onSubmitEditing = () => {Alert.alert(
      "Do you want add a room called '" + this.state.roomName + "'?",
      'You can rename and remove rooms after the setup phase.',
      [{text:'Cancel', onPress:() => {
        this.setState({roomName:''});
      }},{text:'Yes', onPress:() => {this.storeLocation(this.state.roomName);}}]
    )};

    return (
      <View style={setupStyle.roomBar}>
        <View style={setupStyle.roomBarInner}>
          {
            this.state.roomName.length === 0 ?
              <Icon name="ios-plus-outline" size={30} color="white" style={{position:'relative', top:2}}/> :
              <View style={{height:30}} />
          }
          <TextEditInput
            optimization={false}
            style={{flex:1, paddingLeft: this.state.roomName.length === 0 ? 10 : 0, color:'white'}}
            placeholder='Add Room'
            placeholderTextColor='#ddd'
            value={this.state.roomName}
            callback={(newValue) => {this.setState({roomName:newValue});}}
            onSubmitEditing={onSubmitEditing}
          />
          {
            this.state.roomName.length > 0 ?
              this.state.roomName.length > 1 ?
                (
                  <TouchableOpacity onPress={onSubmitEditing}>
                    <Icon name="ios-plus" size={30} color={colors.green.h} style={{position:'relative', top:2}}/>
                  </TouchableOpacity>
                ) :
                <Icon name="ios-plus-outline" size={30} color="white" style={{position:'relative', top:2}}/> :
              undefined
          }

        </View>
      </View>
    )
  }

  getRoomElements() {
    const { store } = this.props;
    const state = store.getState();
    let activeGroup = state.app.activeGroup;
    let rooms = state.groups[activeGroup].locations;

    let roomIds = Object.keys(rooms).sort();

    let roomElements = [];
    roomIds.forEach((id) => {
      let room = rooms[id];
      roomElements.push(
        <TouchableOpacity key={'roomBar_'+id} style={setupStyle.roomBar} onPress={() => {this.setState({selectedRoom:id, roomName:''})}}>
          <View style={setupStyle.roomBarInner}>
            {this.state.selectedRoom === id ? <Icon name="ios-checkmark" size={30} color={colors.green.h} style={{position:'relative', top:2}} /> : undefined}
            <Text style={[setupStyle.information, {paddingLeft: this.state.selectedRoom === id ? 10 : 0}]}>{room.config.name}</Text>
          </View>
        </TouchableOpacity>
      );
    });

    return roomElements;
  }

  getRoomOverview() {
    return (
      <View style={{padding:20, paddingRight:0}}>
        <Text style={[setupStyle.information, {paddingLeft:0, fontWeight:'500'}]}>My Rooms:</Text>
        <ScrollView style={{height:height-440}}>
          {this.getRoomElements()}
          {this.getAddRoomBar()}
        </ScrollView>
      </View>
    );
  }

  render() {
    return (
      <Background hideInterface={true} background={require('../../images/setupBackground.png')}>
        <View style={styles.shadedStatusBar} />
        <View style={{height:30}} />
        <View style={{flex:1, flexDirection:'column'}}>
          <Text style={[setupStyle.h1, {paddingTop:0}]}>Setting up your Crownstone</Text>
          <Text style={setupStyle.text}>Great! This Crownstone has been added to your Group!</Text>
          <View style={setupStyle.lineDistance} />
          <Text style={setupStyle.information}>Where is this Crownstone located?</Text>
          {this.getRoomOverview()}
          <View style={{flex:1}} />
          <TouchableOpacity onPress={() => {
            Alert.alert(
             "Are you sure?","You can always put Crownstones in rooms later through the Crownstone settings. " +
             "Crownstones that are not in rooms will not be used for the indoor localization, other from presence in the Group.",
             [{text:'No'},{text:'Yes, I\'m sure', onPress:()=>{Actions.tabBar()}}]
            );
          }} style={{position:'absolute', left:20, bottom:30}}>
            <View style={setupStyle.smallButton}><Text style={setupStyle.buttonText}>Cancel</Text></View>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => {
            Alert.alert(
              "Are you sure this Crownstone is not tied to a room?",
              "Crownstones that are not in a room cannot be used for localization.",
              [{text:'Cancel'}, {text:'OK'}]
            );
          }} style={{position:'absolute', right:20, bottom:30}}>
            <View style={setupStyle.smallButton}>
              <Text style={setupStyle.buttonText}>Next</Text>
            </View>
          </TouchableOpacity>
        </View>
      </Background>
    )
  }
}

