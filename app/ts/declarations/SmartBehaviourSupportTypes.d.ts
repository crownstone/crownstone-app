interface selectableAicoreBehaviourChunk {
  label: string,
  clickable: boolean,
  type: string,
  data: any,
  hidden: boolean,
}

interface behaviourListElement {
  isSelected: () => boolean,
  onSelect: () => void,
  label: string,
  subLabel?: string
}