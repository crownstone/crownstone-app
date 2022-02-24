const path = require("path");
const fs   = require("fs");

class ScreenshotPathBuilder {

  constructor({ rootDir }) {
    this._rootDir = rootDir;
    let exists = fs.existsSync(this._rootDir);
    if (exists) {
      fs.rmdirSync(this._rootDir, {recursive: true, force: true})
    }
  }

  buildPathForTestArtifact(artifactName, testSummary) {
    /* ... use this._rootDir ... */
    let filename = artifactName.replace(".png",'') + testSummary.fullName.toLowerCase().replace(/ /g,'_') + '.png';
    return path.join(this._rootDir, filename);
  }
}

module.exports = ScreenshotPathBuilder;