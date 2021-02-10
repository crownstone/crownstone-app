
import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("ListEditableItems", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import { EditableItem } from './EditableItem'
import { SeparatedItemList } from './SeparatedItemList'

export class ListEditableItems extends Component<any, any> {
  _renderer(item, index,) {
    return (
      <EditableItem
        key={ index }
        elementIndex={ index }
        setActiveElement={() => { this.setState({activeElement: index})}}
        {...item}
      />
    );
  }

  render() {
    let items = this.props.items;
    return (
      <SeparatedItemList
        items={ items }
        separatorIndent={ this.props.separatorIndent }
        renderer={ this._renderer.bind(this) }
        focusOnLoad={ this.props.focusOnLoad }
        style={ this.props.style }
      />
    );
  }
}
