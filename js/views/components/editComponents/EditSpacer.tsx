import { Component } from 'react'
import {
  View
} from 'react-native';

export class EditSpacer extends Component<any, any> {
  render() {
    let height = (this.props.top ? 30 : 40);

    return <View style={{backgroundColor: this.props.color || 'transparent', height: this.props.height || height}} />
  }
}
