import { LiveComponent }          from "../../LiveComponent";

import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("SettingsLogging", key)(a,b,c,d,e);
}
import * as React from 'react';
import {
  ScrollView} from 'react-native';

import { Background } from '../../components/Background'
import { ListEditableItems } from '../../components/ListEditableItems'
import { core } from "../../../core";
import { TopBarUtil } from "../../../util/TopBarUtil";

export class SettingsBroadcast extends LiveComponent<any, any> {
  static options(props) {
    return TopBarUtil.getOptions({title:  lang("Broadcast")});
  }

  unsubscribe;

  componentDidMount() {
    this.unsubscribe = core.eventBus.on("databaseChange", (data) => {
      let change = data.change;
      if  (change.changeDeveloperData) {
        this.forceUpdate();
      }
    });
  }

  componentWillUnmount() {
    this.unsubscribe();
  }


  _getItems() {
    let items = [];

    items.push({
      type:'explanation',
      label: lang("SET_LOGGING_LEVELS"),
    });

    items.push({ type:'spacer' });
    items.push({ type:'spacer' });
    items.push({ type:'spacer' });

    return items;
  }

  render() {
    return (
      <Background image={core.background.menu} >
                <ScrollView keyboardShouldPersistTaps="always">
          <ListEditableItems items={this._getItems()} separatorIndent={true} />
        </ScrollView>
      </Background>
    );
  }
}
