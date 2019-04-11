interface behaviourChunk {
  label: string,
  clickable: boolean,
  type: string,
  value: any,
  hidden: boolean,
  changeAction: (any) => void,
}

interface behaviourListElement {
  isSelected: () => boolean,
  selectionCallback: () => void,
  label: string,
  subLabel?: string
}