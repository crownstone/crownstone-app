/**
 * Created by Alex on 09-Jan-16.
 */
import { math } from './math'
import { util } from './util'


/**
 * returns an array of RGB colors, linear interpolated
 */
export const interpolation = {
  linear: function (points, colorSegments, colorSpace) {
    let amountOfColors = points.length;

    // we show amountOfColors-1 (last one is added at the end, pure color) in colorSegments-1 steps (last step is the last color)
    let timeSteps = (amountOfColors - 1) / (colorSegments - 1);
    let colors = [];
    let t = 0;
    for (let i = 0; i < colorSegments - 1; i++) {
      t = i * timeSteps;
      let from = points[Math.floor(t)];
      let to = points[Math.floor(t) + 1];
      let dx = {0: to[0] - from[0], 1: to[1] - from[1], 2: to[2] - from[2]};

      let generalizedColor = {0: from[0] + dx[0] * (t % 1), 1: from[1] + dx[1] * (t % 1), 2: from[2] + dx[2] * (t % 1)};
      generalizedColor = util.boundColor(generalizedColor, colorSpace);
      colors.push(generalizedColor);
    }
    //last color, here because to is the +1 color
    colors.push(util.boundColor(points[points.length - 1]));
    return colors;
  },


  bezier: function (points, colorSegments, colorSpace) {
    let colors = [];
    for (let i = 0; i < colorSegments; i++) {
      let generalizedColor = {
        0: math.generalBezier(i / (colorSegments - 1), points, "0"),
        1: math.generalBezier(i / (colorSegments - 1), points, "1"),
        2: math.generalBezier(i / (colorSegments - 1), points, "2")
      };
      colors.push(util.boundColor(generalizedColor, colorSpace));
    }
    return colors;
  }
};
