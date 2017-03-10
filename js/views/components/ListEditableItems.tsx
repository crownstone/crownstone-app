import * as React from 'react'; import { Component } from 'react';
import { EditableItem } from './EditableItem'
import { SeparatedItemList } from './SeparatedItemList'
import { Util } from '../../util/Util'

export class ListEditableItems extends Component<any, any> {
  uuid : string;

  constructor() {
    super();
    this.state = {activeElement:undefined};
    this.uuid = Util.getUUID();
  }

  _renderer(item, index, itemId, textFieldRegistration, nextFunction, currentFocus) {
    return <EditableItem
      key={ index}
      textFieldRegistration={ textFieldRegistration}
      currentFocus={ currentFocus}
      nextFunction={ nextFunction}
      elementIndex={ index}
      activeElement={ this.state.activeElement}
      setActiveElement={() => { this.setState({activeElement: index})}}
      {...item}
    />
  }

  render() {
    let items = this.props.items;
    return (
      <SeparatedItemList
        items={ items }
        separatorIndent={ this.props.separatorIndent }
        renderer={ this._renderer.bind(this) }
        focusOnLoad={ this.props.focusOnLoad }
      />
    );
  }
}
