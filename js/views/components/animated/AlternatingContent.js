import React, { Component } from 'react'
import {
  Animated,
  View
} from 'react-native';
import { FadeInView } from './FadeInView'
import { LOG } from '../../../logging/Log'

export class AlternatingContent extends Component {
  constructor(props) {
    super();

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
        <FadeInView key={i + "_alternatingContent"} duration={this.props.fadeDuration || 400} visible={i === this.state.visibleIndex} style={[this.props.style, {position:'absolute', top:0}]}>
          {this.props.contentArray[i]}
        </FadeInView>
      );
    }
    return content;
  }

  render() {
    return (
      <View style={this.props.style}>
        {this.getContent()}
      </View>
    )
  }
}
