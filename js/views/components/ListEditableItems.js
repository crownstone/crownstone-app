import React, { Component } from 'react' 
import { EditableItem } from './EditableItem'
import { SeparatedItemList } from './SeparatedItemList'
import { getUUID } from '../../util/util'

export class ListEditableItems extends Component {
  constructor() {
    super();
    this.state = {activeElement:undefined};
    this.uuid = getUUID();
  }

  _renderer(item, index, itemId, textFieldRegistration, nextFunction, currentFocus) {
    return <EditableItem
      key={index}
      textFieldRegistration={textFieldRegistration}
      currentFocus={currentFocus}
      nextFunction={nextFunction}
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
        focusOnLoad={this.props.focusOnLoad}
      />
    );
  }
}
