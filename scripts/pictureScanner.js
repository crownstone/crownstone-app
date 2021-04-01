const fs = require("fs")

let basePath = './js/images/scenes'
let categories = fs.readdirSync(basePath)

let obj = {};
let seed = Math.floor(Math.random()*1e7).toString(36)
categories.forEach((cat) => {
  if (cat[0] !== '.' && cat !== 'pictureLicenses.txt') {
    // obj[cat] = {};
    let pictures = fs.readdirSync(basePath + '/' + cat)
    pictures.forEach((pic, index) => {
      if (pic[0] !== '.') {
        let extension = pic.split(".")[1] || "jpg";
        let picPath = basePath + '/' + cat + '/' + pic;

        let newPictureName = seed + cat + "_" + index + "." + extension;


        let newPicPath = basePath + '/' + cat + '/' + newPictureName;
        if (fs.existsSync(newPicPath)) {
          console.log("EXISTS")
        }

        let size = fs.statSync(picPath)["size"];
        if (size < 10000) {
          console.log("ERROR WITH IMAGE", picPath, size)
        }

        console.log("RENAME", pic, newPictureName, size)

        fs.renameSync( picPath,  newPicPath)
        // obj[cat][newPictureName] = "require(\"" + newPicPath + "\")"
      }
    })
  }
})

categories.forEach((cat) => {
  if (cat[0] !== '.' && cat !== 'pictureLicenses.txt') {
    obj[cat] = {};
    let pictures = fs.readdirSync(basePath + '/' + cat)
    pictures.forEach((pic, index) => {
      if (pic[0] !== '.') {
        let extension = pic.split(".")[1] || "jpg";
        let picPath = basePath + '/' + cat + '/' + pic;

        let newPictureName = cat + "_" + index + "." + extension;


        let newPicPath = basePath + '/' + cat + '/' + newPictureName;
        if (fs.existsSync(newPicPath)) {
          console.log("EXISTS")
        }

        // console.log("RENAME", pic, newPictureName, fs.statSync(picPath)["size"])

        fs.renameSync( picPath,  newPicPath)
        obj[cat][newPictureName] = "require(\"" + newPicPath + "\")"
      }
    })
  }
})

console.log(obj)
