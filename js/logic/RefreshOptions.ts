

export function refreshOptions(props) {
  if (props === null) { return; }

  let leftButtons = [];
  if (props.left) {
    leftButtons.push({
      id: props.left.id,
      component: {
        name: props.left.component,
        passProps: props.left.props
      },
    })
  }

  let rightButtons = [];
  if (props.right) {
    rightButtons.push({
      id: props.right.id,
      component: {
        name: props.right.component,
        passProps: props.right.props
      },
    })
  }

  return {
    topBar: {
      title: {text: props.title},
      leftButtons: leftButtons,
      rightButtons: rightButtons,
    }
  }
}