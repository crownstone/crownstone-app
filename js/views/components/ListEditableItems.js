import React, { Component } from 'react-native';
import { EditableItem } from './EditableItem'
import { SeparatedItemList } from './SeparatedItemList'

export class ListEditableItems extends Component {
  _renderer(item, index) {
    return <EditableItem
      key={index}
      style={item.style}
      type={item.type}
      label={item.label}
      value={item.value}
      below={item.below}
      valueStyle={item.valueStyle}
      callback={item.callback}
    />
  }

  render() {
    return (
      <SeparatedItemList
        items={this.props.items}
        separatorIndent={this.props.separatorIndent}
        renderer={this._renderer}
        hideOpeningSeparator={this.props.items[0].type === 'explanation'}
        hideClosingSeparator={this.props.items[this.props.items.length-1].type === 'explanation'}
      />
    );
  }
}
