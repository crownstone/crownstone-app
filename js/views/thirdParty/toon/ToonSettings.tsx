import { Languages } from "../../../Languages"
import * as React from 'react'; import { Component } from 'react';
import {
  Alert,
  ActivityIndicator,
  Dimensions,
  Image,
  Linking,
  PixelRatio,
  ScrollView,
  Switch,
  Text,
  TouchableHighlight,
  TouchableOpacity,
  View
} from 'react-native';
import {BackAction} from "../../../util/Back";
import {Background} from "../../components/Background";
import {ListEditableItems} from "../../components/ListEditableItems";
import {colors, OrangeLine, screenHeight, screenWidth} from "../../styles";
import {IconButton} from "../../components/IconButton";
import {CLOUD} from "../../../cloud/cloudAPI";
import {ScaledImage} from "../../components/ScaledImage";
import {Util} from "../../../util/Util";
import {getActiveToonProgram} from "../../../backgroundProcesses/thirdParty/ToonIntegration";


export class ToonSettings extends Component<any, any> {
  static navigationOptions = ({ navigation }) => {
    const { params } = navigation.state;
    return {
      title: Languages.title("ToonSettings", "Toon")()
    }
  };

  unsubscribe;
  deleting;

  constructor(props) {
    super(props);
  }

  componentDidMount() {
    this.unsubscribe = this.props.eventBus.on("databaseChange", (data) => {
      let change = data.change;
      if  (change.updatedToon && this.deleting !== true) {
        this.forceUpdate();
      }
    });
  }

  componentWillUnmount() {
    this.unsubscribe();
  }



  _getItems(sphere) {
    let items = [];
    let toon = sphere.thirdParty.toons[this.props.toonId];
    items.push({
      label: Languages.label("ToonSettings", "Use_this_phone")(),
      value: toon.enabled,
      type: 'switch',
      icon: <IconButton name="md-phone-portrait" size={22} button={true} color="#fff" buttonStyle={{backgroundColor: colors.csOrange.hex}}/>,
      callback: (newValue) => {
        this.props.store.dispatch({
          type: 'TOON_UPDATE_SETTINGS',
          sphereId: this.props.sphereId,
          toonId: this.props.toonId,
          data: { enabled: newValue}
        });
      }
    });

    let updatedAt = toon.updatedScheduleTime ? Util.getDateTimeFormat(toon.updatedScheduleTime) : "NEVER"
    items.push({
      type: 'explanation',
      label: Languages.label("ToonSettings", "LAST_SCHEDULE_UPDATE__")(updatedAt),
    });
    items.push({
      __item: <ToonSchedule toon={toon} />
    });

    items.push({
      type: 'explanation',
      label: Languages.label("ToonSettings", "MANUAL_UPDATE")()});

    items.push({
      label: Languages.label("ToonSettings", "Update_Schedule")(),
      type: 'button',
      style: {color: colors.black.hex},
      icon: <IconButton name={'md-calendar'} size={22} color={colors.white.hex} buttonStyle={{backgroundColor: colors.green2.hex}}/>,
      callback: () => {
        this.props.eventBus.emit("showLoading", "Refreshing Toon Schedule...")
          CLOUD.forToon(this.props.toonId).thirdParty.toon.updateToonSchedule(false)
            .then((toon) => {
              this.props.store.dispatch({
                type: 'TOON_UPDATE_SCHEDULE',
                sphereId: this.props.sphereId,
                toonId:   this.props.toonId,
                data: {
                  schedule:            toon.schedule,
                  updatedScheduleTime: toon.updatedScheduleTime,
                }
              });
              this.props.eventBus.emit("hideLoading")
            })
            .catch((err) => {
              this.props.eventBus.emit("hideLoading")
              Alert.alert(
Languages.alert("ToonSettings", "_Whoops__Something_went_w_header")(),
Languages.alert("ToonSettings", "_Whoops__Something_went_w_body")(),
[{text:Languages.alert("ToonSettings", "_Whoops__Something_went_w_left")()}])
            })
      }
    });
    items.push({
      type: 'explanation',
      below: true,
      label: Languages.label("ToonSettings", "We_automatically_update_t")()});



    if (Object.keys(sphere.thirdParty.toons).length === 1) {
      items.push({
        label: Languages.label("ToonSettings", "Disconnect_from_Toon")(),
        type: 'button',
        icon: <IconButton name={'md-log-out'} size={22} color={colors.white.hex} buttonStyle={{backgroundColor: colors.menuRed.hex}}/>,
        callback: () => {
          Alert.alert(
            Languages.alert("ToonSettings", "_Are_you_sure__You_will_h_header")(),
            Languages.alert("ToonSettings", "_Are_you_sure__You_will_h_body")(),
            [
              {text: Languages.alert("ToonSettings", "_Are_you_sure__You_will_h_left")(), style: 'cancel'},
              {text: Languages.alert("ToonSettings", "_Are_you_sure__You_will_h_right")(), onPress: () => {
                this.props.eventBus.emit("showLoading", "Removing the integration with Toon...")
                this.deleting = true;
                CLOUD.forSphere(this.props.sphereId).thirdParty.toon.deleteToonsInCrownstoneCloud(false)
                  .then(() => {
                    this.props.store.dispatch({
                      type: 'REMOVE_ALL_TOONS',
                      sphereId: this.props.sphereId,
                    });
                    BackAction('sphereIntegrations')
                    this.props.eventBus.emit("hideLoading")
                  })
                  .catch((err) => {
                    this.props.eventBus.emit("hideLoading")
                    Alert.alert("Whoops", "Something went wrong...", [{text:'OK'}])
                  })
              }}
            ])
        }
      });
      items.push({
        type: 'explanation',
        below: true,
        label: Languages.label("ToonSettings", "This_will_remove_the_Toon")()});
    }
    return items;
  }


  render() {
    let state = this.props.store.getState();
    let sphere = state.spheres[this.props.sphereId];
    let textStyle = {
      fontSize: 14,
      textAlign:'center',
      color:colors.menuBackground.hex,
      paddingLeft: 0.075*screenWidth, paddingRight:0.075*screenWidth
    };

    return (
      <Background image={this.props.backgrounds.menu} hasNavBar={false} safeView={false}>
        <OrangeLine/>
        <ScrollView style={{flex:1}}>
          <View style={{flex:1, width: screenWidth, minHeight: screenHeight, alignItems:'center' }}>
            <View style={{height:375, alignItems:'center'}}>
              <View style={{flex:1}} />
              <ScaledImage source={require('../../../images/thirdParty/logo/Works-with-Toon.png')} targetWidth={0.6*screenWidth} sourceWidth={535} sourceHeight={140} />
              <View style={{flex:1}} />
              <Text style={[textStyle, {fontWeight: '600', fontSize: 16}]}>{ Languages.text("ToonSettings", "Crownstone_and_Toon_are_c")() }</Text>
              <View style={{flex:1}} />
              <Text style={textStyle}>{ Languages.text("ToonSettings", "Sometimes__Toon_is_set_to")() }</Text>
              <View style={{flex:0.5}} />
              <Text style={textStyle}>{ Languages.text("ToonSettings", "___but_Crownstone_can_set")() }</Text>
              <View style={{flex:1}} />
              <Text style={textStyle}>{ Languages.text("ToonSettings", "Should_this_phone_tell_To")() }</Text>
              <View style={{flex:0.2}} />
            </View>
            <ListEditableItems items={this._getItems(sphere)} separatorIndent={true} />
            <Text style={{
              textAlign: 'center',
              fontSize: 12,
              color: colors.black.rgba(0.6),
              padding:5
            }}>{ Languages.text("ToonSettings", "This_application_uses_the")() }</Text>
            <View style={{flex:1, minHeight:40}} />
          </View>
        </ScrollView>
      </Background>
    );
  }
}

class ToonSchedule extends Component<any, any> {

  padding = 20;
  availableWidth = screenWidth - 2*this.padding;

  getDay(dayNumber) {
    let days = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"]
    let day = days[dayNumber];
    let schedule = JSON.parse(this.props.toon.schedule);
    let dayData = schedule[day];
    let amountOfEntries = dayData.length;

    let entries = [];
    let programColors = {
      sleep: colors.csBlue.hex,
      away: colors.orange.hex,
      home: colors.green.hex,
      comfort: colors.menuTextSelected.hex
    };
    let labels = {
      sun: "Sunday",
      mon: "Monday",
      tue: "Tuesday",
      wed: "Wednesday",
      thu: "Thursday",
      fri: "Friday",
      sat: "Saturday",
    };

    let currentDate = new Date();
    let currentDay  = currentDate.getDay(); // 0 for Sunday, ... 6 Saturday
    let isToday = currentDay === dayNumber;
    let minutesToday = currentDate.getHours()*60 + currentDate.getMinutes();
    let activeProgram = getActiveToonProgram(this.props.toon.schedule)

    let radius = 4;
    for ( let i = 0; i < amountOfEntries; i++ ) {
      let entry = dayData[i];
      let duration = (entry.end.hour*60 + entry.end.minute) - (entry.start.hour*60 + entry.start.minute);
      let factor = duration / (24*60);
      entries.push(
        <View key={day + "_" + i} style={{height:20}}>
          <View
            style={{
              backgroundColor: programColors[entry.program],
              height:10,
              width: this.availableWidth * factor,
              borderTopLeftRadius:     i === 0 ? radius : 0,
              borderBottomLeftRadius:  i === 0 ? radius : 0,
              borderTopRightRadius:    i === (amountOfEntries-1) ? radius : 0,
              borderBottomRightRadius: i === (amountOfEntries-1) ? radius : 0,
            }} />

          { duration > 3*60 ? <View style={{alignSelf:'flex-end'}}>
            <Text style={{fontSize:10, height:10}}>{entry.end.hour+ ":" + Util.pad(entry.end.minute)}</Text>
          </View> : undefined }
        </View>
      )
    }

    return (
      <View style={{width: screenWidth, height:44}}>
        <View style={{paddingBottom:3, paddingTop:5, height:24, paddingLeft:0.5*this.padding}}>
          <Text style={{fontSize:12, fontWeight:'400', color: colors.black.rgba(0.8)}}>{labels[day]}</Text>
        </View>
        <View style={{flexDirection:"row", width: this.availableWidth, height:30, paddingLeft: this.padding}}>
          { entries }
        </View>
        { isToday ?
          <View style={{
            position:'absolute', top: 20, left: this.padding + this.availableWidth * (minutesToday/(24*60)) - 6,
            height:17, width: 9,
            borderRadius:4, borderWidth:2, borderColor: colors.white.hex,
            backgroundColor: programColors[activeProgram.program]}}
          /> : undefined }
      </View>
    )
  }

  render() {
    return (
      <View style={{
        width: screenWidth,
        height: 7*44 + this.padding,
        paddingLeft:0,
        padding: 0.4*this.padding,
        backgroundColor: colors.white.hex,
      }}>
        { this.getDay(1) }
        { this.getDay(2) }
        { this.getDay(3) }
        { this.getDay(4) }
        { this.getDay(5) }
        { this.getDay(6) }
        { this.getDay(0) }
      </View>
    )
  }
}
