
import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("DiagnosticUtil", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  Alert,
  ActivityIndicator,
  TouchableHighlight,
  ScrollView,
  Switch,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import {diagnosticStyles} from "../SettingsDiagnostics";
import {FadeInView} from "../../components/animated/FadeInView";
import {colors, screenWidth} from "../../styles";
import {BackAction} from "../../../util/Back";
import {Actions} from "react-native-router-flux";
import {AppUtil} from "../../../util/AppUtil";
import {IconButton} from "../../components/IconButton";
import {Icon} from "../../components/Icon";
import {MapProvider} from "../../../backgroundProcesses/MapProvider";


class DiagResponseBase extends Component<{
  visible:          boolean,
  buttons:          any,
  explanation?:     string,
  subExplanation?:  string,
  header:           string
}, any> {
  render() {
    return (
      <View style={{flex:1}}>
        <View style={{flex:0.75}} />
        <FadeInView visible={this.props.visible}>
          <Text style={diagnosticStyles.headerStyle}>{this.props.header}</Text>
        </FadeInView>
        { this.props.subExplanation ? <FadeInView visible={this.props.visible} delay={200}>
          <Text style={[diagnosticStyles.explanationStyle, {color: colors.black.rgba(0.5)}]}>{this.props.subExplanation}</Text>
        </FadeInView> : undefined }
        { this.props.explanation ? <View style={{flex:0.25}} /> : undefined }
        { this.props.explanation ? <FadeInView visible={this.props.visible} delay={200}>
          <Text style={diagnosticStyles.explanationStyle}>{this.props.explanation}</Text>
        </FadeInView> : undefined }
        <View style={{flex:1}} />
        { this.props.buttons }
      </View>
    );
  }
}


export class DiagWaiting extends Component<{
  visible:          boolean,
  explanation?:     string,
  header:           string
}, any> {
  render() {
    return (
      <View style={{flex:1}}>
        <View style={{flex:1}} />
        <FadeInView visible={this.props.visible} style={{width:screenWidth}}>
          <Text style={diagnosticStyles.headerStyle}>{this.props.header}</Text>
        </FadeInView>
        { this.props.explanation ? <View style={{flex:0.25}} /> : undefined }
        { this.props.explanation ? <FadeInView visible={this.props.visible} delay={200}>
          <Text style={diagnosticStyles.explanationStyle}>{this.props.explanation}</Text>
        </FadeInView> : undefined }
        <View style={{flex:1}} />
      </View>
    );
  }
}



export class DiagSingleButton extends Component<{
  visible:      boolean,
  onPress():    void,
  label:        string,
  explanation?: string,
  subExplanation?: string,
  header:       string
}, any> {

  render() {
    return (
      <DiagResponseBase
        visible={this.props.visible}
        header={ this.props.header }
        explanation={ this.props.explanation }
        subExplanation={ this.props.subExplanation }
        buttons={
          <FadeInView visible={this.props.visible} delay={400} style={{width: screenWidth, alignItems:'center', justifyContent:'center'}}>
            <TouchableOpacity onPress={() => { this.props.onPress() }} style={diagnosticStyles.buttonStyle}>
              <Text style={diagnosticStyles.labelStyle}>{this.props.label}</Text>
            </TouchableOpacity>
          </FadeInView>
        }
      />
    )
  }
}


export class DiagYesNo extends Component<{
  visible:          boolean,
  onPressYes():     void,
  onPressNo():      void,
  explanation?:     string,
  subExplanation?:  string,
  header:           string
}, any> {

  render() {
    return (
      <DiagResponseBase
        visible={this.props.visible}
        header={ this.props.header }
        explanation={ this.props.explanation }
        subExplanation={ this.props.subExplanation }
        buttons={
          <FadeInView visible={this.props.visible} delay={400}>
            <View style={{flexDirection: 'row', width: screenWidth}}>
              <View style={{flex: 1}}/>
              <TouchableOpacity onPress={() => {this.props.onPressNo()}} style={diagnosticStyles.smallButtonStyle}>
                <Text style={diagnosticStyles.labelStyle}>{ lang("No") }</Text>
              </TouchableOpacity>
              <View style={{flex: 1}}/>
              <TouchableOpacity onPress={() => {this.props.onPressYes()}} style={diagnosticStyles.smallButtonStyle}>
                <Text style={diagnosticStyles.labelStyle}>{ lang("Yes") }</Text>
              </TouchableOpacity>
              <View style={{flex: 1}}/>
            </View>
          </FadeInView>
        }
      />
    )
  }
}


export class DiagOptions extends Component<{
  visible:          boolean,
  pressHandlers:    any[],
  labels:           string[],
  explanation?:     string,
  subExplanation?:  string,
  header:           string
}, any> {

  _generateOptions() {
    let options = [];
    let delay = 200;
    if (this.props.explanation || this.props.subExplanation) {
      delay = 300;
    }
    this.props.labels.forEach((label, index) => {
      options.push(
        <DiagOptionsItem
          key={label+index}
          visible={this.props.visible}
          label={label}
          onPress={this.props.pressHandlers[index]}
          delay={delay + index*100}
        />
      );
    });
    return (
      <View style={{marginBottom:30}}>
        { options }
      </View>
    )

  }

  render() {
    return (
      <DiagResponseBase
        visible={this.props.visible}
        header={ this.props.header }
        explanation={ this.props.explanation }
        subExplanation={ this.props.subExplanation }
        buttons={ this._generateOptions() }
      />
    )
  }
}


export class DiagOptionsItem extends Component<{visible: boolean, delay?: number, label: string, onPress(): void,}, any>{
  render() {
    return (
      <FadeInView visible={this.props.visible} delay={this.props.delay || 0}>
        <View style={{flexDirection: 'row', width: screenWidth}}>
          <View style={{flex: 1}}/>
          <TouchableOpacity onPress={() => {this.props.onPress()}} style={diagnosticStyles.optionStyle}>
            <Icon name={"md-arrow-dropright"} color={colors.csBlue.hex} size={15} style={{paddingRight:10}} />
            <Text style={diagnosticStyles.optionLabelStyle}>{this.props.label}</Text>
          </TouchableOpacity>
          <View style={{flex: 2}}/>
        </View>
      </FadeInView>
    )
  }
}


export class DiagSingleButtonMeshTopology extends Component<{
  visible:      boolean,
  explanation?: string,
  header:       string
}, any> {

  render() {
    return (
      <DiagSingleButton
        visible={this.props.visible}
        header={ this.props.header }
        explanation={ this.props.explanation }
        label={ lang("To_Mesh_Topology")}
        onPress={() => { Actions.settingsMeshTopology(); }}
      />
    );
  }
}



export class DiagSingleButtonGoBack extends Component<{
  visible:      boolean,
  explanation?: string,
  header:       string
}, any> {

  render() {
    return (
      <DiagSingleButton
        visible={this.props.visible}
        header={ this.props.header }
        explanation={ this.props.explanation }
        label={ lang("OK")}
        onPress={() => { BackAction(); }}
      />
    );
  }
}

export class DiagSingleButtonToOverview extends Component<{
  visible:      boolean,
  explanation?: string,
  header:       string
}, any> {

  render() {
    return (
      <DiagSingleButton
        visible={this.props.visible}
        header={ this.props.header }
        explanation={ this.props.explanation }
        label={ lang("Go_to_Overview")}
        onPress={() => { Actions.jump("overview") }}
      />
    );
  }
}


export class DiagSingleButtonQuit extends Component<{
  visible:      boolean,
  explanation?: string,
  header:       string
}, any> {

  render() {
    return (
      <DiagSingleButton
        visible={this.props.visible}
        header={ this.props.header }
        explanation={ this.props.explanation }
        label={ lang("Quit_app_now")}
        onPress={() => { AppUtil.quit(); }}
      />
    );
  }
}


export class DiagSingleBleTroubleshooter extends Component<{
  visible:      boolean,
  explanation?: string,
  header:       string
}, any> {

  render() {
    return (
      <DiagSingleButton
        visible={this.props.visible}
        header={ this.props.header }
        explanation={ this.props.explanation }
        label={ lang("Open_Troubleshooter")}
        onPress={() => { Actions.settingsBleTroubleshooting(); }}
      />
    );
  }
}

export class DiagSingleButtonHelp extends Component<{
  visible:      boolean,
  explanation?: string,
  header:       string
}, any> {

  render() {
    return (
      <DiagSingleButton
        visible={this.props.visible}
        header={ this.props.header }
        explanation={ this.props.explanation }
        label={ lang("To_Help_screen")}
        onPress={() => { Actions.settingsFAQ(); }}
      />
    );
  }
}


export class DiagListOfStones extends Component<{
  stones:any,
  visible: boolean,
  callback(summary): void
}, any> {

  render() {
    let labels : string[] = [];
    let pressHandlers : any = [];
    let summaries = [];
    Object.keys(this.props.stones).forEach((stoneId) => {
      summaries.push(MapProvider.stoneSummaryMap[stoneId]);
    });

    summaries.sort((a,b) => { return String(a.locationName) < String(b.locationName) ? -1 : 1 });

    summaries.forEach((summary) => {
      let name = nameFromSummary(summary);
      labels.push(name);
      pressHandlers.push(() => {
        this.props.callback(summary)
      });
    });

    return (
      <DiagOptions
        visible={this.props.visible}
        header={ lang("Which_Crownstone_is_givin")}
        subExplanation={ lang("Scroll_down_to_see_all_of")}
        labels={labels}
        pressHandlers={pressHandlers}
      />
    );
  }
}


export class TestResult extends Component<any, any> {
  render() {
    let testResult = {};
    return (
      <FadeInView
        visible={this.props.visble === undefined ? true : this.props.visible}
        style={{flexDirection: 'row', alignItems:'center', justifyContent:'flex-start', width: screenWidth - 30, padding:10, height: 45}}
      >
        <Text style={testResult}>{ lang("____",this.props.label,this.props.state,null) }</Text>
        <View style={{flex:1}} />
        { this.props.state === null  || this.props.state === undefined  ? <ActivityIndicator animating={true} size="small" /> : undefined }
        { this.props.state === true  ? <IconButton name="md-analytics" buttonSize={25} size={17} button={true} color="#fff" buttonStyle={{backgroundColor:colors.green.hex}} />: undefined }
        { this.props.state === false ? <IconButton name="md-analytics" buttonSize={25} size={17} button={true} color="#fff" buttonStyle={{backgroundColor:colors.gray.hex}}  />: undefined }
      </FadeInView>
    )
  }
}



export function nameFromSummary(summary) {
  let name = summary.name;
  if (summary.applianceName) { name =  summary.applianceName;         }
  if (summary.locationName ) { name +=  lang("_in_",summary.locationName); }
  return name;
}