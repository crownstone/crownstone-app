import { Languages } from "../Languages";
import { Navigation } from "react-native-navigation";
import { NavigationUtil } from "./NavigationUtil";

interface topbarOptions {
  title?: string,
  left? : topbarComponent,
  right? : topbarComponent,

  // left button presets
  cancelModal? : boolean,
  closeModal? : boolean,
  cancel? : () => void,

  // right button presets
  nav?: topbarNavComponent,
  edit? : () => void,
  save? : () => void,
  next? : () => void,
  create? : () => void,
}

interface topbarNavComponent {
  id: string,
  label: string,
  callback : () => void
}
interface topbarComponent {
  id: string,
  component: string,
  props? : {}
}

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
    if (props.left) {
      leftButtons.push({
        id: props.left.id,
        component: {
          name: props.left.component,
          passProps: props.left.props || {}
        },
      })
    }

    if (props.closeModal !== undefined) {
      leftButtons.push(getLeftButtonCloseModal('back', Languages.get("__UNIVERSAL", "Back")));
    }

    if (props.cancelModal !== undefined) {
      leftButtons.push(getLeftButtonCloseModal('cancel', Languages.get("__UNIVERSAL", "Cancel")));
    }

    if (props.cancel && typeof props.cancel === "function") {
      leftButtons.push(getLeftButton('cancel', Languages.get("__UNIVERSAL", "Cancel"), props.cancel));
    }

    let rightButtons = [];
    if (props.right) {
      rightButtons.push({
        id: props.right.id,
        component: {
          name: props.right.component,
          passProps: props.right.props || {}
        },
      })
    }
    if (props.nav) {
      rightButtons.push(getButtonComponent(props.nav.id, props.nav.label, props.nav.callback ));
    }

    if (props.edit && typeof props.edit === "function") {
      rightButtons.push(getEditComponent(props.edit));
    }
    if (props.next && typeof props.next === "function") {
      rightButtons.push(getButtonComponent('next', Languages.get("__UNIVERSAL", "Next"), props.next));
    }
    if (props.save && typeof props.save === "function") {
      rightButtons.push(getButtonComponent('save', Languages.get("__UNIVERSAL", "Save"), props.save));
    }
    if (props.create && typeof props.create === "function") {
      rightButtons.push(getButtonComponent('create', Languages.get("__UNIVERSAL", "Create"), props.create));
    }

    let results = { topBar: {} };
    if (!partialUpdate || props.title) { results.topBar["title"] = {text: props.title}; }
    if (!partialUpdate || leftButtons.length  > 0) { results.topBar["leftButtons"] = leftButtons; }
    if (!partialUpdate || rightButtons.length > 0) { results.topBar["rightButtons"] = rightButtons; }

    return results;
  },
}


function getLeftButton(id,label,callback) {
  return {
    id: id,
    component: {
      name: id === 'cancel' ? 'topbarCancelButton' : 'topbarLeftButton',
      passProps: {
        text: label, onPress: callback
      }
    }
  }
}

function getLeftButtonCloseModal(id, label) {
  return getLeftButton(id,label,() => { NavigationUtil.dismissModal(); })
}

function getButtonComponent(id, label, callback) {
  return {
    id: id,
    component: {
      name: 'topbarButton',
      passProps: { text: label, onPress: callback },
    },
  }
}


function getEditComponent(callback) {
  return {
    id: 'edit',
    component: {
      name: 'topbarRightMoreButton',
      passProps: { onPress: callback }
    },
    // systemItem: 'edit'
  }
}

