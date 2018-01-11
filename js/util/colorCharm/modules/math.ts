
export const math = {
  /**
   * This is the generalized equation for bezier curves.
   * @param t
   * @param points     an array of points or an array of objects, field is used to get value
   * @param field
   * @returns {number}
   */
  generalBezier: function(t,points,field) {
    let result = 0;
    let n = points.length - 1;
    let orderFac = math.factorial(n);
    for (let i = 0; i < points.length; i++) {
      let factorials = (math.factorial(i)*math.factorial(n-i));
      let binomialCo = factorials == 0 ? 1 : orderFac / factorials;

      let powerCo = Math.pow(1 - t,n - i);

      if (field !== undefined) {
        result += binomialCo * powerCo * Math.pow(t,i) * points[i][field];
      }
      else {
        result += binomialCo * powerCo * Math.pow(t,i) * points[i];
      }

    }
    return result;
  },

  /**
   * Calculating a factorial like: 5! = 120
   * @param value
   * @returns {number}
   */
  factorial: function(value) {
    value = Math.floor(value);
    let baseValue = value;
    for (let i = value - 1; i > 0; i--) {
      baseValue *= i;
    }
    return baseValue;
  }
};
