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
    let artifactCorrectedName = artifactName.replace(".png",'');
    let name = testSummary.fullName.replace(/ /g,'_')
    name = name.replace(/:/g,'')
    let filename = artifactCorrectedName + name + '.png';
    return path.join(this._rootDir, filename.toLowerCase());
  }
}

module.exports = ScreenshotPathBuilder;