import React from "react";
import {Text} from "react-native";

export default class ResponsiveText extends React.Component<any,any> {
  /*
    This is an extension of text that handles implements the adjustsFontSizeToFit for android. The bug that it's
    patching is documented here:

    https://github.com/facebook/react-native/issues/20906

   */


  state = {
    _style: {
      fontSize: 5,
      width: null,
    },
    _adjusted: false
  }

  onLayout = (event) => {
    const { adjustsFontSizeToFit, style, children, numberOfLines } = this.props;
    if (adjustsFontSizeToFit && style.width && typeof children === 'string') {
      if (!this.state._adjusted) {
        const {width} = event.nativeEvent.layout

        this.setState({
          _style: {
            fontSize: Math.min(style.fontSize, Math.floor(5 * style.width / width * numberOfLines)),
            width: style.width,
          },
          _adjusted: true,
        })
      }
    }
    else {
      this.setState({
        _style: {
          fontSize: this.props.style.fontSize,
          width: this.props.style.width,
        },
        _adjusted: true,
      })
    }
  }

  render() {
    // if (Platform.OS === 'ios') {
    return <Text {...this.props}/>;
    // }
    // else {
    //   return <Text onLayout={this.onLayout} {...this.props} style={[this.props.style, this.state._style]}/>
    // }
  }
}