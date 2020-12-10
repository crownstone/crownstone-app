interface SyncEvent {
  id: string,
  localId: string,
  sphereId: string,
  stoneId: string,
  cloudId: string,
  specialType: string,
}

interface SortedListData {
  id: string,
  viewKey: string,
  referenceId: string,
  sortedList: string[],
  cloudId: string,
  updatedAt: number,
}

interface SceneData {
  id:            string,
  name:          string,
  picture:       string,
  pictureId:     string,
  pictureSource: "STOCK" | "CUSTOM", // PICTURE_GALLERY_TYPES
  cloudId:       string | null,
  data:          { [key: number] : number }, // stoneUID: switchState
  updatedAt:     number
};