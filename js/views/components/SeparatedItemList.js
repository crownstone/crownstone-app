import React, {
  Component,
  ScrollView,
  Text,
  View
} from 'react-native';

import { Separator } from '../components/Separator'


export class SeparatedItemList extends Component {
  render() {
    let items = this.props.items;
    let renderItems = [];

    if (this.props.hideOpeningSeparator !== true)
      renderItems.push(<Separator key="_StartSeparator" fullLength={true} />);


    if (Array.isArray(items)) {
      items.forEach((item, index) => {
        if (index > 0)
          renderItems.push(<Separator key={index + '_separator'} fullLength={!(this.props.separatorIndent === true)} />);
        renderItems.push(this.props.renderer(item, index));
      });
    }
    else if (typeof items === 'object') {
      Object.keys(items).sort().forEach((itemId, index) => {
        if (index > 0)
          renderItems.push(<Separator key={index + '_separator'} fullLength={!(this.props.separatorIndent === true)} />);
        renderItems.push(this.props.renderer(items[itemId], itemId, index));
      });
    }
    else {
      return <Text>UNKNOWN TYPE</Text>
    }


    if (this.props.hideClosingSeparator !== true)
      renderItems.push(<Separator key="_EndSeparator" fullLength={true} />);

    return <View>{renderItems}</View>
  }
}
