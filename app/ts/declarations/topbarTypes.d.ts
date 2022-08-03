
interface topbarOptions {
  title?: string,

  // left button presets
  leftText?: {id: string, text:string},
  disableBack? : boolean,
  cancelModal? : boolean,
  cancelBack? : boolean,
  backModal? : boolean,
  closeModal? : boolean,
  cancel? : boolean,
  leftNav?: topbarNavComponent,
  leftIcon? : {
    id: string,
    icon: any,
    iconSize: {
      width: number,
      height:number,
    },
    onPress: any,
  }

  // right button presets
  rightLoading?: boolean,
  nav?: topbarNavComponent,
  help?: () => void,
  edit? : boolean,
  clear? : boolean,
  save? : boolean,
  done? : boolean,
  next? : boolean,
  create? : boolean,
  update? : boolean,

  darkBackground?: boolean,
}

interface topbarNavComponent {
  id: string,
  text: string,
}
