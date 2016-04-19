import React, {
  Component,
  PixelRatio,
  View
} from 'react-native';

export class EditSpacer extends Component {
  render() {
    let pxRatio = PixelRatio.get();
    let height = (this.props.top ? 15 : 20) * pxRatio;

    return <View style={{backgroundColor: this.props.color || 'transparent', height:height}} />
  }
}
