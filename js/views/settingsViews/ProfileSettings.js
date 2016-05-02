import React, {
  Alert,
  Component,
  Dimensions,
  TouchableHighlight,
  PixelRatio,
  ScrollView,
  Switch,
  Text,
  View
} from 'react-native';

import { Background } from './../components/Background'
import { ListEditableItems } from './../components/ListEditableItems'
var Actions = require('react-native-router-flux').Actions;
import { styles, colors } from './../styles'


export class ProfileSettings extends Component {
  componentDidMount() {
    this.unsubscribe = this.props.store.subscribe(() => {
      this.forceUpdate();
    })
  }

  componentWillUnmount() {
    this.unsubscribe();
  }

  _getItems() {
    let requiredData = {groupId: this.props.groupId, locationId: this.props.locationId};
    let items = [];
    // room Name:
    items.push({label:'Picture', type: 'picture', value:undefined, callback: () => {}});
    items.push({label:'Email', type: 'textEdit', value: room.config.name, callback: (newText) => {}});
    items.push({label:'First Name', type: 'textEdit', value: room.config.name, callback: (newText) => {}});
    items.push({label:'Last Name', type: 'textEdit', value: room.config.name, callback: (newText) => {}});
    items.push({label:'Change Password', type: 'navigation', callback: () => {}});

    return items;
  }

  render() {
    return (
      <Background>
        <ScrollView>
          <ListEditableItems items={this._getItems()} />
        </ScrollView>
      </Background>
    );
  }
}
