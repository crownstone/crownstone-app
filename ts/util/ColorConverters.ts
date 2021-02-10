
/**
 * Convert HSV to RGB
 * http://www.javascripter.net/faq/rgb2hsv.htm
 *
 * @param h   [0..360] || object {h:[0..360],s:[0..1],v:[0..1]}
 * @param s   [0..1]
 * @param v   [0..1]
 * @returns {{r: [0..255], g: [0..255], b: [0..255]}}
 * @constructor
 */
export const hsv2rgb = function(h, s, v) {
  if (typeof h == "object") {
    v = h.v;
    s = h.s;
    h = h.h;
  }

  h = h / 360;

  let r, g, b;

  let i = Math.floor(h * 6);
  let f = h * 6 - i;
  let p = v * (1 - s);
  let q = v * (1 - f * s);
  let t = v * (1 - (1 - f) * s);

  switch (i % 6) {
    case 0: r = v; g = t; b = p; break;
    case 1: r = q; g = v; b = p; break;
    case 2: r = p; g = v; b = t; break;
    case 3: r = p; g = q; b = v; break;
    case 4: r = t; g = p; b = v; break;
    case 5: r = v; g = p; b = q; break;
  }

  return {r:Math.floor(r * 255), g:Math.floor(g * 255), b:Math.floor(b * 255) };
};


/**
 * http://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb
 *
 * @param {String} hex
 * @returns {{r: [0..255], g: [0..255], b: [0..255]}}
 */
export const hex2rgb = function(hex) {
  // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
  let shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  hex = hex.replace(shorthandRegex, function(m, r, g, b) {
    return r + r + g + g + b + b;
  });
  let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
};

/**
 *
 * @param r       [0..255] || object {r:[0..255],g:[0..255],b:[0..255]}
 * @param g       [0..255]
 * @param b       [0..255]
 * @returns {string}
 * @constructor
 */
export const rgb2hex = function(r,g?,b?) {
  if (typeof r == "object") {
    b = r.b;
    g = r.g;
    r = r.r;
  }
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
};


/**
 * Convert RGB to Hue Choma Luma
 *
 * @param r      [0..255] || object {r:[0..255],g:[0..255],b:[0..255]}
 * @param g      [0..255]
 * @param b      [0..255]
 * @returns {{h: [0..360], -1 as undefined, c: [0..1], l: [0..1]}}
 * @constructor
 */
export const rgb2hcl = function(r,g?,b?) {
  if (typeof r == "object") {
    b = r.b;
    g = r.g;
    r = r.r;
  }

  let maxRGB = Math.max(r,b,g);
  let minRGB = Math.min(r,b,g);

  let chroma = (maxRGB - minRGB) / 255;
  let luma = (0.3*r + 0.59*g + 0.11*b) / 255;

  //let lightness = 0.5 * (maxVal - minVal);
  let d = (r==minRGB) ? g-b : ((b==minRGB) ? r-g : b-r);
  let h = (r==minRGB) ? 3 : ((b==minRGB) ? 1 : 5);
  let hue;
  if (maxRGB == minRGB) {
    hue = -1;
  }
  else {
    hue = 60*(h - d/(maxRGB - minRGB));
  }

  return {h:hue, c:chroma, l:luma};
};


/**
 * Convert Hue Choma Luma to RGB, some values are out of gamut and are collaped to RGB space
 *
 * @param hue       [0..360], -1 as undefined
 * @param chroma    [0..1]
 * @param luma      [0..1]
 * @returns {{r: [0..255], g: [0..255], b: [0..255]}}
 * @constructor
 */
export const hcl2rgb = function(hue,chroma,luma) {
  if (typeof hue == "object") {
    luma = hue.l;
    chroma = hue.c;
    hue = hue.h;
  }

  let r, g, b;

  if (hue < 0) {
    r = 0; g = 0; b = 0;
  }
  else {
    let dHue = hue/60;
    let C = chroma;
    let X = C * (1 - Math.abs((dHue % 2) - 1));

    if (dHue < 1) {r = C; g = X; b = 0;}
    else if (dHue < 2) {r = X; g = C; b = 0;}
    else if (dHue < 3) {r = 0; g = C; b = X;}
    else if (dHue < 4) {r = 0; g = X; b = C;}
    else if (dHue < 5) {r = X; g = 0; b = C;}
    else if (dHue < 6) {r = C; g = 0; b = X;}
  }
  let m = luma - (0.3*r + 0.59*g + 0.11*b);

  r += m;
  g += m;
  b += m;

  // some values are outside of GAMUT
  r = Math.max(0,Math.min(255,Math.round(255*r)));
  g = Math.max(0,Math.min(255,Math.round(255*g)));
  b = Math.max(0,Math.min(255,Math.round(255*b)));

  return {r:r, g:g, b:b};
};

/**
 * http://axonflux.com/handy-rgb-to-hsl-and-rgb-to-hsv-color-model-c
 * Converts an HSL color value to RGB. Conversion formula
 * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
 * Assumes h, s, and l are contained in the set [0, 1] and
 * returns r, g, and b in the set [0, 255].
 *
 * @param h
 * @param s
 * @param l
 */
export const hsl2rgb = function(h, s, l){
  if (typeof h == "object") {
    l = h.l;
    s = h.s;
    h = h.h;
  }
  let r, g, b;
  h = h / 360;

  if(s == 0){
    r = g = b = l; // achromatic
  }
  else {
    let hue2rgb = function(p, q, t) {
      if(t < 0) t += 1;
      if(t > 1) t -= 1;
      if(t < 1/6) return p + (q - p) * 6 * t;
      if(t < 1/2) return q;
      if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };

    let q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    let p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }

  return {r:Math.round(r * 255), g: Math.round(g * 255), b : Math.round(b * 255)};
};


/**
 * http://axonflux.com/handy-rgb-to-hsl-and-rgb-to-hsv-color-model-c
 * Converts an RGB color value to HSL. Conversion formula
 * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
 * Assumes r, g, and b are contained in the set [0, 255] and
 * returns h, s, and l in the set [0, 1].
 *
 * @param r
 * @param g
 * @param b
 */
export const rgb2hsl = function(r, g?, b?){
  if (typeof r == "object") {
    b = r.b;
    g = r.g;
    r = r.r;
  }

  r /= 255, g /= 255, b /= 255;
  let max = Math.max(r, g, b);
  let min = Math.min(r, g, b);
  let h = (max + min) / 2;
  let s = (max + min) / 2;
  let l = (max + min) / 2;

  if(max == min){
    h = s = 0; // achromatic
  }else{
    let d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch(max){
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  h *= 360;
  return {h:h, s:s, l:l};
};


/**
 * Convert RGB to HSV
 * https://gist.github.com/mjijackson/5311256
 *
 * @param r    [0..255] || object {r:[0..255],g:[0..255],b:[0..255]}
 * @param g    [0..255]
 * @param b    [0..255]
 * @returns {{h: [0..360], s: [0..1], v: [0..1]}}
 * @constructor
 */
export const rgb2hsv = function(r,g?,b?) {
  if (typeof r == "object") {
    b = r.b;
    g = r.g;
    r = r.r;
  }
  r=r/255; g=g/255; b=b/255;
  let minRGB = Math.min(r,Math.min(g,b));
  let maxRGB = Math.max(r,Math.max(g,b));

  // Black-gray-white
  if (minRGB == maxRGB) {
    return {h:0,s:0,v:minRGB};
  }

  // Colors other than black-gray-white:
  let d = (r==minRGB) ? g-b : ((b==minRGB) ? r-g : b-r);
  let h = (r==minRGB) ? 3 : ((b==minRGB) ? 1 : 5);
  let hue = 60*(h - d/(maxRGB - minRGB));
  let saturation = (maxRGB - minRGB)/maxRGB;
  return {h:hue,s:saturation,v:maxRGB};
};



/**
 * Convert HSV to hex
 *
 * @param h   [0..360] || object {h:[0..360],s:[0..1],v:[0..1]}
 * @param s   [0..1]
 * @param v   [0..1]
 * @constructor
 */
export const hsv2hex = function(h, s, v) {
  let rgb = hsv2rgb(h,s,v);

  return rgb2hex(rgb)
};