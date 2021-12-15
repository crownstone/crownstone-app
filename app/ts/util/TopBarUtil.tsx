import {Languages} from "../Languages";
import {Navigation} from "react-native-navigation";
import {Platform} from "react-native";
import {LoadingTopBarButton} from "../views/components/topbar/LoadingTopBarButton";
import {ScaledImage} from "../views/components/ScaledImage";
import * as React from "react";
import {statusBarHeight, topBarHeight} from "../views/styles";

export const TopBarUtil = {

  updateOptions: function(componentId, props: topbarOptions) {
    Navigation.mergeOptions(componentId, TopBarUtil.getOptions(props, true));
  },

  replaceOptions: function(componentId, props: topbarOptions) {
    Navigation.mergeOptions(componentId, TopBarUtil.getOptions(props, false));
  },

  getOptions: function(props : topbarOptions, partialUpdate = false) {
    if (props === null) { return; }

    let leftButtons = [];
    // if (props.left) {
    //   leftButtons.push({
    //     id: props.left.id,
    //     component: {
    //       name: props.left.component,
    //       passProps: props.left.props || {}
    //     },
    //   })
    // }

    if (props.leftText !== undefined) {
      leftButtons.push(getLeftButton(props.leftText.id, props.leftText.text));
    }
    if (props.disableBack === true && Platform.OS === 'ios') {
      leftButtons.push({id: 'disableBack', component: { name: 'topbarEmptyButton' }});
    }
    if (props.closeModal !== undefined) {
      leftButtons.push(getLeftButton('closeModal', Languages.get("__UNIVERSAL", "Back")()));
    }

    if (props.cancelModal !== undefined) {
      leftButtons.push(getLeftButton('cancelModal', Languages.get("__UNIVERSAL", "Cancel")()));
    }

    if (props.cancel) {
      leftButtons.push(getLeftButton('cancel', Languages.get("__UNIVERSAL", "Cancel")()));
    }
    if (props.leftNav) {
      leftButtons.push(getLeftButton(props.leftNav.id, props.leftNav.text));
    }


    if (props.leftIcon) {
      if (Platform.OS === 'android') {
        leftButtons.push({
          id: props.leftIcon.id,
          icon: props.leftIcon.icon,
          showAsAction: 'always',
        })
      }
      else {
        leftButtons.push({
          id: props.leftIcon.id,
          component: {
            name:'topbarLeftButton',
            passProps: {
              onPress: props.leftIcon.onPress,
              item: <ScaledImage
                      source={props.leftIcon.icon}
                      sourceWidth={props.leftIcon.iconSize.width}
                      sourceHeight={props.leftIcon.iconSize.height}
                      targetHeight={0.7*(topBarHeight - statusBarHeight)}
                    />
              },
          },
        })
      }
    }

    let rightButtons = [];

    if (props.nav) {
      rightButtons.push(getButtonComponent(props.nav.id, props.nav.text));
    }
    if (props.edit) {
      rightButtons.push(getButtonComponent('edit', Languages.get("__UNIVERSAL", "Edit")()));
    }
    if (props.next) {
      rightButtons.push(getButtonComponent('next', Languages.get("__UNIVERSAL", "Next")()));
    }
    if (props.save) {
      rightButtons.push(getButtonComponent('save', Languages.get("__UNIVERSAL", "Save")()));
    }
    if (props.done) {
      rightButtons.push(getButtonComponent('done', Languages.get("__UNIVERSAL", "Done")()));
    }
    if (props.clear) {
      rightButtons.push(getButtonComponent('clear', Languages.get("__UNIVERSAL", "Clear")()));
    }
    if (props.create) {
      rightButtons.push(getButtonComponent('create', Languages.get("__UNIVERSAL", "Create")()));
    }
    if (props.update) {
      rightButtons.push(getButtonComponent('update', Languages.get("__UNIVERSAL", "Update")()));
    }
    if (props.rightLoading && Platform.OS === 'ios') {
      rightButtons.push({
        id: 'loading',
        component: {
          name: 'topbarButton',
          passProps: {
            item: LoadingTopBarButton,
          }
        },
      });
    }

    let results = { topBar: {} }
    if (!partialUpdate || props.title) { results.topBar["title"] = {text: props.title}; }
    if (!partialUpdate || rightButtons.length > 0) { results.topBar["rightButtons"] = rightButtons; }
    if (!partialUpdate || leftButtons.length  > 0) {
      // this is here so it wont interfere with the back button.
      if (Platform.OS === 'android' && (leftButtons.length !== 0 || props.disableBack)) {
        results.topBar["leftButtons"] = leftButtons;
        // results.topBar.
      }
      else if (Platform.OS === 'ios') {
        results.topBar["leftButtons"] = leftButtons;
      }
    }


    // console.log("Setting Topbar Options", results)
    return results;
  },
}


function getLeftButton(id, label) {
  if (Platform.OS === 'android') {
    return {
      id: id,
      icon: require('../../assets/images/icons/backArrow.png'),
      showAsAction: 'always',
    }
  }
  else {
    return {
      id: id,
      testID:id,
      text: label,
    }
  }
}

function getButtonComponent(id, label) {
  if (Platform.OS === 'android') {
    label = label.toUpperCase();
  }

  return {
    id: id,
    testID:id,
    text:label,
  }
}

