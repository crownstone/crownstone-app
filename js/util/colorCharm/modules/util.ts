
export const util = {
  boundColor: function(color, colorSpace?) {
    switch (colorSpace) {
      case "RGB":
        return color;
      case "HSV":
      case "HSL":
      case "HCL":
      default: {
        let hue = (color[0]) % 360;
        if (hue < 0) {
          hue += 360
        }
        return {0: hue, 1: color[1], 2: color[2]};
      }
    }
  }
};
