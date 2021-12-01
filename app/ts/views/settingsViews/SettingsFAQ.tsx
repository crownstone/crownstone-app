
import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("SettingsFAQ", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  Platform,
  Linking,
  ScrollView,
  Text,
  View
} from 'react-native';

import { BackgroundNoNotification } from '../components/BackgroundNoNotification'
import { ListEditableItems } from '../components/ListEditableItems'
import { background, colors } from "../styles";
import {IconButton} from "../components/IconButton";

import {NavigationBar} from "../components/editComponents/NavigationBar";
import { NavigationUtil } from "../../util/NavigationUtil";
import { TopBarUtil } from "../../util/TopBarUtil";

export class SettingsFAQ extends Component<any, any> {
  static options(props) {
    return TopBarUtil.getOptions({title: lang("FAQ")});
  }


  _getItems() {
    let items = [];

    let appStoreLabel =  lang("App_Store");
    if (Platform.OS === 'android') {
      appStoreLabel =  lang("Play_Store");
    }

    items.push({
      type:'largeExplanation',
      label: lang("Frequently_Asked_Question"),
    });

    items.push({
      type:'collapsable',
      label: lang("____add_a_Crownstone_"),
      content:lang("You_just_have_to_hold_it_"),
      contentHeight: 175
    });

    items.push({
      type:'collapsable',
      label: lang("____add_someone_to_my_Sph"),
      content:lang("If_youre_an_Admin_or_Memb"),
      contentHeight: 145
    });


    items.push({
      type:'collapsable',
      label: lang("____create_a_room_"),
      content: lang("You_need_to_be_an_admin_o"),
      contentHeight: 175
    });

    items.push({
      type:'collapsable',
      label: lang("____move_a_Crownstone_to_"),
      content: lang("Moving_the_Crownstone_is_"),
      contentHeight: 175
    });


    items.push({
      type:'collapsable',
      label: lang("____dim_with_my_Crownston"),
      content:lang("Make_sure_dimming_is_enab"),
      contentHeight: 200
    });

    items.push({
      type:'collapsable',
      label: lang("____use_indoor_localizati"),
      content:lang("Indoor_localization_on_ro"),
      contentHeight: 235
    });


    items.push({
      type:'largeExplanation',
      label: lang("What_to_do_if____"),
    });

    items.push({
      type:'collapsable',
      label: lang("____a_new_Crownstone_wont"),
      content:lang("Make_sure_the_Crownstone_"),
      contentHeight: 175
    });

    items.push({
      type:'collapsable',
      label: lang("____a_Crownstone_is_on_Se"),
      content: lang("Ensure_there_is_power_on_"),
      contentHeight: 155
    });

    items.push({
      type:'collapsable',
      label: lang("____I_want_to_have_a_clea"),
      contentItem:
        <View style={{flex:1}}>
          <Text style={{paddingLeft:25, paddingRight: 15, paddingTop: 10}}>{ lang("Sometimes_something_goes_") }</Text>
          <View style={{flex:1}} />
          <NavigationBar
            label={ lang("Revert_to_Cloud_Data")}
            icon={<IconButton name={'md-cloud-download'} size={22} color={colors.white.hex} buttonStyle={{backgroundColor: colors.red.hex }}/>}
            callback={() => {
              NavigationUtil.launchModal( "SettingsRedownloadFromCloud");
            }}
          />
          <View style={{flex:1}} />
        </View>,
      contentHeight: 200
    });

    items.push({
      type:'collapsable',
      label: lang("____my_Sphere_name_is_gon"),
      contentItem:
        <View style={{flex:1}}>
          <Text style={{paddingLeft:25, paddingRight: 15, paddingTop: 10}}>{ lang("Sometimes_something_goes_w") }</Text>
          <View style={{flex:1}} />
          <NavigationBar
            label={ lang("Revert_to_Cloud_Data")}
            icon={<IconButton name={'md-cloud-download'} size={22} color={colors.white.hex} buttonStyle={{backgroundColor: colors.red.hex }}/>}
            callback={() => {
              NavigationUtil.launchModal( "SettingsRedownloadFromCloud");
            }}
          />
          <View style={{flex:1}} />
        </View>,
      contentHeight: 200
    });

    items.push({
      type:'collapsable',
      label: lang("____it_always_says_No_Cro"),
      contentItem:
        <View style={{flex:1}}>
          <Text style={{paddingLeft:25, paddingRight: 15, paddingTop: 10}}>{ lang("It_could_be_that_youre_no") }</Text>
          <View style={{flex:1}} />
          <NavigationBar
            label={ lang("Revert_to_Cloud_Data")}
            icon={<IconButton name={'md-cloud-download'} size={22} color={colors.white.hex} buttonStyle={{backgroundColor: colors.red.hex }}/>}
            callback={() => {
              NavigationUtil.launchModal( "SettingsRedownloadFromCloud");
            }}
          />
          <View style={{flex:1}} />
        </View>,
      contentHeight: 275
    });

    let label =  lang("If_that_fails__quit_the_a");
    if (Platform.OS === 'android') {
      label =  lang("If_that_fails__quit_the_ap");
    }
    items.push({
      type:'collapsable',
      label: lang("____the_setup_process_fai"),
      content: lang("Retry_a_few_times___If_th",label, appStoreLabel),
      contentHeight: 245
    });

    items.push({
      type:'collapsable',
      label: lang("____a_Crownstone_toggles_"),
      content:lang("This_could_happen_due_to_"),
      contentHeight: 225
    });


    items.push({
      type:'collapsable',
      label: lang("____I_need_to_factory_res"),
      contentItem:
        <View style={{flex:1}}>
          <Text style={{paddingLeft:25, paddingRight: 15, paddingTop: 10}}>{ lang("Only_use_this_as_a_last_r") }</Text>
          <View style={{flex:1}} />
          <NavigationBar
            label={ lang("Reset_Crownstone")}
            icon={<IconButton name={'ios-build'} size={22} color={colors.white.hex} buttonStyle={{backgroundColor: colors.red.hex }}/>}
            callback={() => {
              NavigationUtil.launchModal( "SettingsFactoryResetStep1");
            }}
          />
          <View style={{flex:1}} />
        </View>,
      contentHeight: 175
    });

    items.push({
      type:'largeExplanation',
      label: lang("Solve_most_BLE_issues"),
    });

    items.push({
      id:'Troubleshooting',
      label: lang("BLE_Troubleshooting"),
      type:'navigation',
      icon: <IconButton name={'ios-bluetooth'} size={22} color={colors.white.hex} buttonStyle={{backgroundColor: colors.blue3.hex }}/>,
      callback: () => {
        NavigationUtil.launchModal( "SettingsBleTroubleshooting");
      }
    });
    items.push({
      type:'largeExplanation',
      label: lang("More_help_is_available_on"),
    });

    items.push({
      id:'Help',
      label: lang("Help"),
      type:'navigation',
      icon: <IconButton name={'ios-cloudy'} size={22} color={colors.white.hex} buttonStyle={{backgroundColor: colors.green.hex }}/>,
      callback: () => {
        Linking.openURL(Languages.activeLocale === 'nl_nl' ? 'https://crownstone.rocks/nl/app-help/' : 'https://crownstone.rocks/app-help/' ).catch(err => {});
      }
    });

    items.push({
      type:'spacer',
    });

    return items;
  }

  render() {
    return (
      <BackgroundNoNotification image={background.menu} >
        <ScrollView>
          <ListEditableItems items={this._getItems()} separatorIndent={false} />
        </ScrollView>
      </BackgroundNoNotification>
    );
  }
}
