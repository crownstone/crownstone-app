import resolveAssetSource from 'react-native/Libraries/Image/resolveAssetSource';


export class ImageStore {
  constructor() {
    this.images = {};
    this.updateRequired = true;
  }

  update(state) {
    if (this.updateRequired === false) {
      return;
    }

    for (let group in state.groups) {
      if (state.groups.hasOwnProperty(group)) {
       state.groups[group].locations.forEach((location) => {
         let picture = location.picture;
         if (picture.used == true) {
           this._preloadPicture(group, location.id, picture);
         }
         else {
           this._clearData(group, location.id);
         }
       })
      }
    }

    this.updateRequired = false;
  }

  _preloadPicture(group, location, uris) {
    if (this.images[group] === undefined)
      this.images[group] = {};

    if (this.images[group][location] === undefined)
      this.images[group][location] = {square:{}, bar:{}};


    if (this.images[group][location].square.uri !== uris.squareURI) {
      this.images[group][location].square.img = resolveAssetSource(require('./images/mediaRoom.png'));
      this.images[group][location].square.uri = uris.squareURI;
    }

    if (this.images[group][location].bar.uri !== uris.barURI) {
      this.images[group][location].bar.img = resolveAssetSource(require('./images/mediaRoom.png'));
      this.images[group][location].bar.uri = uris.barURI;
    }
  }

  _clearData(group,location) {
    if (this.images[group] && this.images[group][location]) {
      delete this.images[group][location];
    }
  }

}