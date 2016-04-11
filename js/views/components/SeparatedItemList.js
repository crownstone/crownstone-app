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

    let indentSeparator = this.props.separatorIndent === true;
    let editableItem = (item) => {return !(item.type === 'spacer' || item.type === 'explanation')};
    let iterator = (prevItem, item, nextItem, index, itemId) => {
      if (prevItem !== undefined) {
        if (editableItem(prevItem) && editableItem(item) && indentSeparator) {
          renderItems.push(<Separator key={index + 'top_separator'} fullLength={false} />);
        }
        else if (editableItem(item) || editableItem(prevItem)) {
          renderItems.push(<Separator key={index + 'top_separator'} fullLength={true} />);
        }
      }

      renderItems.push(this.props.renderer(item, index, itemId));

      if (nextItem === undefined) {
        if (editableItem(item)) {
          renderItems.push(<Separator key={index + 'bottom_separator'} fullLength={true} />);
        }
      }
    };

    if (Array.isArray(items)) {
      items.forEach((item, index) => {
        iterator(
          (index === 0 ? undefined : items[index-1]),
          item,
          (index === items.length-1 ? undefined : items[index+1]),
          index
        )
      });
    }
    else if (typeof items === 'object') {
      let keys = Object.keys(items).sort();
      keys.forEach((itemId, index) => {
        iterator(
          (index === 0 ? undefined : items[keys[index-1]]),
          items[itemId],
          (index === items.length-1 ? undefined : items[keys[index+1]]),
          index,
          itemId
        )
      });
    }
    else {
      return <Text>UNKNOWN TYPE</Text>
    }


    return <View>{renderItems}</View>
  }
}
