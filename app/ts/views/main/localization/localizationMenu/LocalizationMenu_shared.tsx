
import { Languages } from "../../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("LocalizationMenu_shared", key)(a,b,c,d,e);
}
import { Icon } from "../../../components/Icon";
import { colors } from "../../../styles";
import { Linking } from "react-native";
import * as React from "react";

export function getLearnAboutLocalizationItems(items: any[]) {
  items.push({
    label: lang("Learn_about_indoor_locali"),
    type: 'navigation',
    numberOfLines: 3,
    testID: 'ImproveLocalization',
    icon: <Icon name='md-book' size={25} color={colors.blueDark.hex}/>,
    callback: () => {
      openLocalizationHelpWebsite();
    }
  });
  items.push({label: lang("You_need_at_least___Crown"),  type:'explanation', below: true});
}

export function openLocalizationHelpWebsite() {
  Linking.openURL('https://crownstone.rocks/positioning-users/').catch(err => {})
}