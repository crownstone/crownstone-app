import React, { Component } from 'react-native';
import { EditableItem } from './EditableItem'
import { SeparatedItemList } from './SeparatedItemList'

export class ListEditableItems extends Component {
  _renderer(item, index) {
    return <EditableItem key={index} {...item} />
  }

  render() {
    let items = this.props.items;
    return (
      <SeparatedItemList
        items={items}
        separatorIndent={this.props.separatorIndent}
        renderer={this._renderer}
        hideOpeningSeparator={items && items.length > 0 ? items[0].type === 'explanation' : true}
        hideClosingSeparator={items && items.length > 0 ? items[items.length-1].type === 'explanation' : true}
      />
    );
  }
}
