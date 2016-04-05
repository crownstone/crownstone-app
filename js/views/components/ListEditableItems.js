import React, { Component } from 'react-native';
import { EditableItem } from './EditableItem'
import { SeparatedItemList } from './SeparatedItemList'

export class ListEditableItems extends Component {
  constructor() {
    super();
    this.state = {activeElement:undefined};
  }

  _renderer(item, index) {
    return <EditableItem
      key={index}
      elementIndex={index}
      activeElement={this.state.activeElement}
      setActiveElement={() => {this.setState({activeElement: index})}}
      {...item}
    />
  }

  render() {
    let items = this.props.items;
    return (
      <SeparatedItemList
        items={items}
        separatorIndent={this.props.separatorIndent}
        renderer={this._renderer.bind(this)}
        hideOpeningSeparator={items && items.length > 0 ? items[0].type === 'explanation' : true}
        hideClosingSeparator={items && items.length > 0 ? items[items.length-1].type === 'explanation' : true}
      />
    );
  }
}
