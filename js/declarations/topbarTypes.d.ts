
interface topbarOptions {
  title?: string,

  // left button presets
  disableBack? : boolean,
  cancelModal? : boolean,
  closeModal? : boolean,
  cancel? : boolean,
  leftIcon? : {
    id: string,
    icon: any,
    iconSize: {
      width: number,
      height:number,
    }
  }

  // right button presets
  rightLoading?: boolean,
  nav?: topbarNavComponent,
  edit? : boolean,
  save? : boolean,
  next? : boolean,
  create? : boolean,
}

interface topbarNavComponent {
  id: string,
  text: string,
}
