import React, {
  Component,
  TouchableOpacity,
  PixelRatio,
  ScrollView,
  Switch,
  TextInput,
  Text,
  View
} from 'react-native';
var Actions = require('react-native-router-flux').Actions;
import { Background }        from '../components/Background'
import { ListEditableItems } from '../components/ListEditableItems'
import { EditSpacer }        from '../components/editComponents/EditSpacer'


export class DelaySelection extends Component {
  componentDidMount() {
    this.unsubscribe = this.props.store.subscribe(() => {
      this.forceUpdate();
    })
  }

  componentWillUnmount() {
    this.unsubscribe();
  }

  constructOptions(optionState) {
    let items = [];

    // behaviour link
    items.push({label:'None',       type: 'checkbar', value: optionState === 0,    callback:() => {this.props.callback(0);}});
    items.push({label:'1 Minute',   type: 'checkbar', value: optionState === 60,   callback:() => {this.props.callback(60);}});
    items.push({label:'2 Minutes',  type: 'checkbar', value: optionState === 120,  callback:() => {this.props.callback(120);}});
    items.push({label:'5 Minutes',  type: 'checkbar', value: optionState === 300,  callback:() => {this.props.callback(300);}});
    items.push({label:'10 Minutes', type: 'checkbar', value: optionState === 600,  callback:() => {this.props.callback(600);}});
    items.push({label:'15 Minutes', type: 'checkbar', value: optionState === 900,  callback:() => {this.props.callback(900);}});
    items.push({label:'30 Minutes', type: 'checkbar', value: optionState === 1800, callback:() => {this.props.callback(1800);}});

    return items;
  }

  render() {
    const store   = this.props.store;
    const state   = store.getState();
    const room    = state.groups[this.props.groupId].locations[this.props.locationId];
    const device  = room.stones[this.props.stoneId];

    let optionState = this.props.extractionMethod(device);
    console.log(optionState)

    let options = this.constructOptions(optionState);
    return (
      <Background>
        <ScrollView>
          <EditSpacer top={true} />
          <ListEditableItems items={options} separatorIndent={true} />
        </ScrollView>
      </Background>
    )
  }
}
