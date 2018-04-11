/**
 * Created by Alex on 1/16/2015.
 */

import * as convert from '../ColorConverters';
import { interpolation } from './modules/interpolation';

export class Mixer {
  colorSpace : any;
  colorList : any;
  generalizedColor : any;

  constructor() {}

  linear(colors, amountOfSegments, interpolationSpace = 'rgb') {
    return this._interpolate(colors, amountOfSegments, interpolationSpace.toUpperCase(), 'linear');
  };


  bezier(colors, amountOfSegments, interpolationSpace) {
    return this._interpolate(colors, amountOfSegments, interpolationSpace.toUpperCase(), 'bezier');
  };

  toRGB() {
    let generalizedColorList = this._generalize(this.colorList);
    let resultList = generalizedColorList.map((generalizedColor) => {
      let rgbColor;
      if (this.colorSpace == "HSV") {
        rgbColor = convert.hsv2rgb(generalizedColor[0], generalizedColor[1], generalizedColor[2]);
      }
      else if (this.colorSpace == "HSL") {
        rgbColor = convert.hsl2rgb(generalizedColor[0], generalizedColor[1], generalizedColor[2]);
      }
      else if (this.colorSpace == "RGB") {
        rgbColor = {
          r: Math.round(generalizedColor[0]),
          g: Math.round(generalizedColor[1]),
          b: Math.round(generalizedColor[2])
        };
      }
      else { // HCL
        rgbColor = convert.hcl2rgb(generalizedColor[0], generalizedColor[1], generalizedColor[2]);
      }
      return rgbColor;
    });
    return resultList;
  };

  toHex() {
    let rgb = this.toRGB();
    let resultList = rgb.map((rgb) => {
      return convert.rgb2hex(rgb)
    });
    return resultList;
  };


  generalize() {
    return this._generalize(this.colorList);
  };

  return() {
    return this.colorList;
  };

  /**
   * @param colorArray
   * @returns {Array}
   * @private
   */
  _generalize(colorArray) {
    let generalizedColorArray = [];
    for (let i = 0; i < colorArray.length; i++) {
      let generalizedObject = {};
      let counter = 0;
      for (let key in colorArray[i]) {
        generalizedObject[counter] = colorArray[i][key];
        counter++;
      }
      generalizedColorArray.push(generalizedObject);
    }
    return generalizedColorArray;
  };

  /**
   *
   * @param generalizedColorArray
   * @returns {Array}
   * @private
   */
  _degeneralize(generalizedColorArray, colorSpace) {
    let colorArray = [];
    for (let i = 0; i < generalizedColorArray.length; i++) {
      let colorObject;

      let generalizedColor = generalizedColorArray[i];
      if (colorSpace == "HSV") {
        colorObject = {h: generalizedColor[0], s: generalizedColor[1], v: generalizedColor[2]};
      }
      else if (colorSpace == "HSL") {
        colorObject = {h: generalizedColor[0], s: generalizedColor[1], l: generalizedColor[2]};
      }
      else if (colorSpace == "RGB") {
        colorObject = {r: generalizedColor[0], g: generalizedColor[1], b: generalizedColor[2]};
      }
      else { // HCL
        colorObject = {h: generalizedColor[0], c: generalizedColor[1], l: generalizedColor[2]};
      }
      colorArray.push(colorObject);
    }
    return colorArray;
  };

  /**
   *
   * @param [Array] colors | in HEX
   * @param colorSpace
   * @returns {Array}
   * @private
   */
  _getPoints(colors, colorSpace) {
    let points = [];
    colors.map(function (colorArray) {
      for (let i = 0; i < colorArray.length - 1; i++) {
        let fromRGB = convert.hex2rgb(colorArray[i]);
        let toRGB = convert.hex2rgb(colorArray[i + 1]);

        let fromConverted;
        let toConverted;

        if (colorSpace == "HCL" || colorSpace === undefined) {
          fromConverted = convert.rgb2hcl(fromRGB);
          toConverted = convert.rgb2hcl(toRGB);

          // avoid problems with the -1 in h for stepping
          if (fromConverted.h < 0) {
            fromConverted.h = toConverted.h;
          }
          if (toConverted.h < 0) {
            toConverted.h = fromConverted.h;
          }
        }
        else if (colorSpace == "HSV") {
          fromConverted = convert.rgb2hsv(fromRGB);
          toConverted = convert.rgb2hsv(toRGB);
        }
        else if (colorSpace == "HSL") {
          fromConverted = convert.rgb2hsl(fromRGB);
          toConverted = convert.rgb2hsl(toRGB);
        }
        else if (colorSpace == "RGB") {
          fromConverted = fromRGB;
          toConverted = toRGB;
        }

        // get points
        if (i == 0) {
          points.push(fromConverted);
        }
        points.push(toConverted);
      }
    });
    return points;
  };

  _preparePoints(points, colorSpace) {
    switch (colorSpace) {
      case "RGB":
        return points;
      case "HSV":
      case "HSL":
      case "HCL":
      default:
      {
        let preparedPoints = [];
        preparedPoints.push(points[0]);
        let b = points[0][0];
        for (let i = 0; i < points.length - 1; i++) {
          let a = b;
          b = points[i + 1][0];
          let diff = a - b;
          if (diff > 180.0) {
            b += 360;
          }
          else if (diff < -180) {
            b -= 360;
          }
          preparedPoints.push({0: b, 1: points[i + 1][1], 2: points[i + 1][2]});
        }
        return preparedPoints;
      }
    }
  };



  _interpolate(colors, amountOfSegments, colorSpace, method) {
    let points = this._getPoints(colors, colorSpace);

    let generalizedPoints = this._generalize(points);
    let preparedPoints = this._preparePoints(generalizedPoints, colorSpace);

    let generalizedColorList = [];
    if (method == "linear" || preparedPoints.length == 2) {
      generalizedColorList = interpolation.linear.call(this, preparedPoints, amountOfSegments, colorSpace);
    }
    else { // bezier
      generalizedColorList = interpolation.bezier.call(this, preparedPoints, amountOfSegments, colorSpace);
    }
    this.colorList = this._degeneralize(generalizedColorList, colorSpace);
    this.colorSpace = colorSpace;
    return this;
  };

  _revertToRGB(generalizedColorArray, colorSpace) {
    let rgbColor;
    if (colorSpace == "HSV") {
      rgbColor = convert.hsv2rgb(generalizedColorArray[0], generalizedColorArray[1], generalizedColorArray[2]);
    }
    else if (colorSpace == "HSL") {
      rgbColor = convert.hsl2rgb(generalizedColorArray[0], generalizedColorArray[1], generalizedColorArray[2]);
    }
    else if (colorSpace == "RGB") {
      rgbColor = {
        r: Math.round(generalizedColorArray[0]),
        g: Math.round(generalizedColorArray[1]),
        b: Math.round(generalizedColorArray[2])
      };
    }
    else { // HCL
      rgbColor = convert.hcl2rgb(generalizedColorArray[0], generalizedColorArray[1], generalizedColorArray[2]);
    }

    return rgbColor;
  };
}




