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

    for (let sphere in state.spheres) {
      if (state.spheres.hasOwnProperty(sphere)) {
       state.spheres[sphere].locations.forEach((location) => {
         let picture = location.picture;
         if (picture.used == true) {
           this._preloadPicture(sphere, location.id, picture);
         }
         else {
           this._clearData(sphere, location.id);
         }
       })
      }
    }

    this.updateRequired = false;
  }

  _preloadPicture(sphere, location, uris) {
    if (this.images[sphere] === undefined)
      this.images[sphere] = {};

    if (this.images[sphere][location] === undefined)
      this.images[sphere][location] = {square:{}, bar:{}};


    if (this.images[sphere][location].square.uri !== uris.squareURI) {
      this.images[sphere][location].square.img = resolveAssetSource(require('./images/mediaRoom.png'));
      this.images[sphere][location].square.uri = uris.squareURI;
    }

    if (this.images[sphere][location].bar.uri !== uris.barURI) {
      this.images[sphere][location].bar.img = resolveAssetSource(require('./images/mediaRoom.png'));
      this.images[sphere][location].bar.uri = uris.barURI;
    }
  }

  _clearData(sphere,location) {
    if (this.images[sphere] && this.images[sphere][location]) {
      delete this.images[sphere][location];
    }
  }

}