import { Languages } from "../Languages";
import { Navigation } from "react-native-navigation";
import { NavigationUtil } from "./NavigationUtil";

interface topbarOptions {
  title?: string,
  left? : topbarComponent,
  right? : topbarComponent,

  // left button presets
  disableBack? : boolean,
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
  text: string,
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

    if (props.disableBack === true) {
      leftButtons.push({id: 'disableBack', component: { name: 'topbarEmptyButton' }});
    }
    if (props.closeModal !== undefined) {
      leftButtons.push(getLeftButtonCloseModal('closeModal', Languages.get("__UNIVERSAL", "Back")));
    }

    if (props.cancelModal !== undefined) {
      leftButtons.push(getLeftButtonCloseModal('cancelModal', Languages.get("__UNIVERSAL", "Cancel")));
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
    if (props.create) {
      rightButtons.push(getButtonComponent('create', Languages.get("__UNIVERSAL", "Create")()));
    }

    let results = { topBar: {} };
    if (!partialUpdate || props.title) { results.topBar["title"] = {text: props.title}; }
    if (!partialUpdate || leftButtons.length  > 0) { results.topBar["leftButtons"] = leftButtons; }
    if (!partialUpdate || rightButtons.length > 0) { results.topBar["rightButtons"] = rightButtons; }


    console.log("Setting Topbar Options", results)
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

function getButtonComponent(id, label) {
  return {
    id: id,
    text:label,
  }
}

