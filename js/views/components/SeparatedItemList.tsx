
import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("SeparatedItemList", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  
  Text,
  View
} from 'react-native';

import { Separator } from '../components/Separator'


export class SeparatedItemList extends Component<any, any> {
  textFields : any;
  textFieldMap : any;
  index : any;
  focusTimeout : any;

  constructor(props) {
    super(props);
    this.textFields = [];
    this.textFieldMap = {};
    this.index = 0;
    this.focusTimeout = undefined;
  }


  _getItems() {
    let items = this.props.items;
    let renderItems = [];

    let separatorIndent = this.props.separatorIndent === true;
    let isEditableItem = (item) => {
      return !(item.type === 'spacer' || item.type === 'explanation' || item.type === 'lightExplanation' || item.type === 'largeExplanation' || item.type === 'largeLightExplanation')};

    // this function parses the input item.
    let iterator = (prevItem, item, nextItem, index, itemId) => {
      let isItemEditable = isEditableItem(item);
      if (prevItem !== undefined) {
        if (isEditableItem(prevItem) && isItemEditable && separatorIndent) {
          renderItems.push(<Separator key={index + 'top_separator'} fullLength={false} />);
        }
        else if (isItemEditable || isEditableItem(prevItem)) {
          renderItems.push(<Separator key={index + 'top_separator'} fullLength={true} />);
        }
      }
      else if (isItemEditable == true && this.props.topSeparator !== false && this.props.boundingSeparators !== false) {
        renderItems.push(<Separator key={index + 'top_separator'} fullLength={true} opacity={this.props.boundingOpacity || this.props.topOpacity} />);
      }

      renderItems.push(this.props.renderer(item, index, itemId));

      if (nextItem === undefined) {
        if (isItemEditable) {
          if (this.props.bottomSeparator !== false && this.props.boundingSeparators !== false) {
            renderItems.push(<Separator key={index + 'bottom_separator'} fullLength={true}  opacity={this.props.boundingOpacity || this.props.bottomOpacity} />);
          }
        }
      }
    };


    if (Array.isArray(items)) {
      if (items.length == 0 && this.props.topSeparator !== false && this.props.boundingSeparators !== false) {
        renderItems.push(<Separator key={0 + 'top_separator'} fullLength={true} opacity={this.props.boundingOpacity || this.props.topOpacity}/>);
      }

      items.forEach((item, index) => {
        iterator(
          (index === 0 ? undefined : items[index-1]),
          item,
          (index === items.length-1 ? undefined : items[index+1]),
          index,
          this.props.ids !== undefined ? this.props.ids[index] : undefined
        )
      });
    }
    else if (typeof items === 'object') {
      let keys = Object.keys(items).sort();
      if (keys.length == 0 && this.props.topSeparator !== false && this.props.boundingSeparators !== false) {
        renderItems.push(<Separator key={0 + 'top_separator'} fullLength={true} opacity={this.props.boundingOpacity || this.props.topOpacity} />);
      }
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
      return <Text>{ lang("UNKNOWN_TYPE") }</Text>
    }

    return renderItems;
  }

  render() {
    return <View style={this.props.style}>{this._getItems()}</View>
  }
}
