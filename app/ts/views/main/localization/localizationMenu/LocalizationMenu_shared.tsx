import { Icon } from "../../../components/Icon";
import { colors } from "../../../styles";
import { Linking } from "react-native";
import * as React from "react";

export function getLearnAboutLocalizationItems(items: any[]) {
  items.push({
    label: "Learn about indoor localization",
    type: 'navigation',
    numberOfLines: 3,
    testID: 'ImproveLocalization',
    icon: <Icon name='md-book' size={25} color={colors.blueDark.hex}/>,
    callback: () => {
      openLocalizationHelpWebsite();
    }
  });
  items.push({label: "You need at least 4 Crownstones to enable indoor localization. Find out why this is, and what it can do for you!",  type:'explanation', below: true});
}

export function openLocalizationHelpWebsite() {
  Linking.openURL('https://crownstone.rocks/positioning-users/').catch(err => {})
}