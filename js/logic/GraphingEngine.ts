
export let defaultOptions = {
  yAxisOrientation: 'left',
  defaultGroup: 'default',
  sort: true,
  sampling: true,
  stack: false,
  graphHeight: '400px',
  shaded: {
    enabled: false,
    orientation: 'bottom' // top, bottom, zero
  },
  style: 'line', // line, bar
  barChart: {
    width: 50,
    sideBySide: false,
    align: 'center' // left, center, right
  },
  interpolation: {
    enabled: true,
    parametrization: 'centripetal', // uniform (alpha = 0.0), chordal (alpha = 1.0), centripetal (alpha = 0.5)
    alpha: 0.5
  }
};



export const GraphingEngine = {

  /**
   * @param dataset
   * @param options
   * @param minValue
   * @param maxValue
   * @returns {number}
   */
  transformYToFit(dataset, options, minValue = 0, maxValue = 40) {
    let minYval = minValue;
    let maxYval = maxValue || dataset[0].y;
    for (let i = 0; i < dataset.length; i++) {
      // minYval = Math.min(dataset[i].y, minYval);
      maxYval = Math.max(dataset[i].y, maxYval);
    }

    let mappingFactor = 0;
    if (maxYval !== minYval) {
      mappingFactor = (options.height - options.padding - options.paddingBottom)/(maxYval - minYval);
    }
    let lowerLimit = options.height - options.paddingBottom;
    for (let i = 0; i < dataset.length; i++) {
      // large Y means 0, small y is max so this inverts the values.
      dataset[i].y = lowerLimit - dataset[i].y*mappingFactor;
    }

    return maxYval;
  },

  calcPath(dataset, options : any) {
    if (dataset != null) {
      if (dataset.length > 0) {

        let d = [];

        // construct path from dataset
        if (options.interpolation.enabled == true) {
          d = this._catmullRom(dataset, options);
        }
        else {
          d = this._r(dataset);
        }
        return d;
      }
    }
  },


  getShadingPath(pathArray, options) {

    let type = "L";
    if (options.interpolation.enabled == true){
      type = "C";
    }

    // append shading to the path
    let dFill;
    let zero = 0;
    if (options.shaded.orientation == 'top') {
      zero = options.padding;
    }
    else {
      zero = options.height - options.paddingBottom;
    }


    dFill = 'M' + pathArray[0][0] + "," + pathArray[0][1] + " " + this.serializePath(pathArray, type, false) + 'V' + zero + ' H'+ pathArray[0][0] + " Z";

    return dFill;
},


  serializePath(pathArray, type, inverse) {
    if (pathArray.length < 2) {
      //Too little data to create a path.
      return "";
    }
    let d = type;
    if (inverse) {
      for (let i = pathArray.length - 2; i > 0; i--) {
        d += pathArray[i][0] + "," + pathArray[i][1] + " ";
      }
    }
    else {
      for (let i = 1; i < pathArray.length; i++) {
        d += pathArray[i][0] + "," + pathArray[i][1] + " ";
      }
    }
    return d;
  },

  /**
   * This uses an uniform parametrization of the interpolation algorithm:
   * 'On the Parameterization of Catmull-Rom Curves' by Cem Yuksel et al.
   * @param data
   * @returns {string}
   * @private
   */
  _catmullRomUniform(data) {
    // catmull rom
    let p0, p1, p2, p3, bp1, bp2;
    let d = [];
    d.push([Math.round(data[0].x), Math.round(data[0].y)]);
    let normalization = 1 / 6;
    let length = data.length;
    for (let i = 0; i < length - 1; i++) {

      p0 = (i == 0) ? data[0] : data[i - 1];
      p1 = data[i];
      p2 = data[i + 1];
      p3 = (i + 2 < length) ? data[i + 2] : p2;


      // Catmull-Rom to Cubic Bezier conversion matrix
      //    0       1       0       0
      //  -1/6      1      1/6      0
      //    0      1/6      1     -1/6
      //    0       0       1       0

      //    bp0 = { x: p1.x,                               y: p1.y };
      bp1 = {
        x: ((-p0.x + 6 * p1.x + p2.x) * normalization),
        y: ((-p0.y + 6 * p1.y + p2.y) * normalization)
      };
      bp2 = {
        x: (( p1.x + 6 * p2.x - p3.x) * normalization),
        y: (( p1.y + 6 * p2.y - p3.y) * normalization)
      };
      //    bp0 = { x: p2.x,                               y: p2.y };

      d.push([bp1.x, bp1.y]);
      d.push([bp2.x, bp2.y]);
      d.push([p2.x, p2.y]);
    }

    return d;
  },

  /**
   * This uses either the chordal or centripetal parameterization of the catmull-rom algorithm.
   * By default, the centripetal parameterization is used because this gives the nicest results.
   * These parameterizations are relatively heavy because the distance between 4 points have to be calculated.
   *
   * One optimization can be used to reuse distances since this is a sliding window approach.
   * @param data
   * @param group
   * @returns {string}
   * @private
   */
  _catmullRom(data, options) {
    let alpha = options.interpolation.alpha;
    if (alpha == 0 || alpha === undefined) {
      return this._catmullRomUniform(data);
    }
    else {
      let p0, p1, p2, p3, bp1, bp2, d1, d2, d3, A, B, N, M;
      let d3powA, d2powA, d3pow2A, d2pow2A, d1pow2A, d1powA;
      let d = [];
      d.push([Math.round(data[0].x), Math.round(data[0].y)]);
      let length = data.length;
      for (let i = 0; i < length - 1; i++) {

        p0 = (i == 0) ? data[0] : data[i - 1];
        p1 = data[i];
        p2 = data[i + 1];
        p3 = (i + 2 < length) ? data[i + 2] : p2;

        d1 = Math.sqrt(Math.pow(p0.x - p1.x, 2) + Math.pow(p0.y - p1.y, 2));
        d2 = Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
        d3 = Math.sqrt(Math.pow(p2.x - p3.x, 2) + Math.pow(p2.y - p3.y, 2));

        // Catmull-Rom to Cubic Bezier conversion matrix

        // A = 2d1^2a + 3d1^a * d2^a + d3^2a
        // B = 2d3^2a + 3d3^a * d2^a + d2^2a

        // [   0             1            0          0          ]
        // [   -d2^2a /N     A/N          d1^2a /N   0          ]
        // [   0             d3^2a /M     B/M        -d2^2a /M  ]
        // [   0             0            1          0          ]

        d3powA = Math.pow(d3, alpha);
        d3pow2A = Math.pow(d3, 2 * alpha);
        d2powA = Math.pow(d2, alpha);
        d2pow2A = Math.pow(d2, 2 * alpha);
        d1powA = Math.pow(d1, alpha);
        d1pow2A = Math.pow(d1, 2 * alpha);

        A = 2 * d1pow2A + 3 * d1powA * d2powA + d2pow2A;
        B = 2 * d3pow2A + 3 * d3powA * d2powA + d2pow2A;
        N = 3 * d1powA * (d1powA + d2powA);
        if (N > 0) {
          N = 1 / N;
        }
        M = 3 * d3powA * (d3powA + d2powA);
        if (M > 0) {
          M = 1 / M;
        }

        bp1 = {
          x: ((-d2pow2A * p0.x + A * p1.x + d1pow2A * p2.x) * N),
          y: ((-d2pow2A * p0.y + A * p1.y + d1pow2A * p2.y) * N)
        };

        bp2 = {
          x: (( d3pow2A * p1.x + B * p2.x - d2pow2A * p3.x) * M),
          y: (( d3pow2A * p1.y + B * p2.y - d2pow2A * p3.y) * M)
        };

        if (bp1.x == 0 && bp1.y == 0) {
          bp1 = p1;
        }
        if (bp2.x == 0 && bp2.y == 0) {
          bp2 = p2;
        }
        d.push([bp1.x, bp1.y]);
        d.push([bp2.x, bp2.y]);
        d.push([p2.x, p2.y]);
      }

      return d;
    }
  },

  /**
   * this generates the SVG path for a r drawing between datapoints.
   * @param data
   * @returns {string}
   * @private
   */
  _r(data) {
    // r
    let d = [];
    for (let i = 0; i < data.length; i++) {
      d.push([data[i].x, data[i].y]);
    }
    return d;
  }
};