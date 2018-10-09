
import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("AlternatingContent", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  Animated,
  TouchableOpacity,
  View
} from 'react-native';
import { HiddenFadeInView } from './FadeInView'

export class AlternatingContent extends Component<any, any> {
  interval : any;
  visible : any;

  constructor(props) {
    super(props);

    this.state = {visibleIndex: 0};
    this.visible = props.visible || false;
  }

  componentDidMount() {
    let amountOfItems = this.props.contentArray.length;
    this.interval = setInterval(() => {
      this.setState({visibleIndex: (this.state.visibleIndex + 1) % amountOfItems})
    }, this.props.switchDuration || 1500)
  }

  componentWillUnmount() {
    clearInterval(this.interval)
  }

  componentWillUpdate(nextProps) { }

  getContent() {
    let content = [];
    for (let i = 0; i < this.props.contentArray.length; i++) {
      content.push(
        <HiddenFadeInView key={i + "_alternatingContent"} duration={this.props.fadeDuration || 400} visible={i === this.state.visibleIndex} style={[{position:'absolute', top:0,  justifyContent:'center', alignItems:'center'}, this.props.style]}>
          {this.props.contentArray[i]}
        </HiddenFadeInView>
      );
    }
    return content;
  }

  render() {
    if (this.props.onPress) {
      return (
        <TouchableOpacity style={this.props.style} onPress={this.props.onPress}>
          {this.getContent()}
        </TouchableOpacity>
      );
    }
    else {
      return (
        <View style={this.props.style}>
          {this.getContent()}
        </View>
      );
    }
  }
}
