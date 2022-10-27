/**
 * Created by ludo on 25-1-16.
 */

export function DataStep(start, end, containerHeight, majorCharHeight) {
  this.majorSteps = [1, 2, 5, 10];
  this.minorSteps = [0.25, 0.5, 1, 2];

  this.containerHeight = containerHeight;
  this.majorCharHeight = majorCharHeight;
  this._start = start;
  this._end = end;

  this.scale = 1;
  this.minorStepIdx = -1;
  this.magnitudefactor = 1;
  this.determineScale();
}


DataStep.prototype.determineScale = function () {
  let range = this._end - this._start;
  this.scale = this.containerHeight / range;
  let minimumStepValue = this.majorCharHeight / this.scale;
  let orderOfMagnitude = (range > 0)
    ? Math.round(Math.log(range) / Math.LN10)
    : 0;

  this.minorStepIdx = -1;
  this.magnitudefactor = Math.pow(10, orderOfMagnitude);

  let start = 0;
  if (orderOfMagnitude < 0) {
    start = orderOfMagnitude;
  }

  let solutionFound = false;
  for (let l = start; Math.abs(l) <= Math.abs(orderOfMagnitude); l++) {
    this.magnitudefactor = Math.pow(10, l);
    for (let j = 0; j < this.minorSteps.length; j++) {
      let stepSize = this.magnitudefactor * this.minorSteps[j];
      if (stepSize >= minimumStepValue) {
        solutionFound = true;
        this.minorStepIdx = j;
        break;
      }
    }
    if (solutionFound === true) {
      break;
    }
  }
};

DataStep.prototype.isMajor = function (value) {
  return (value % (this.magnitudefactor * this.majorSteps[this.minorStepIdx]) === 0);
};

DataStep.prototype.getStep = function(){
  return this.magnitudefactor * this.minorSteps[this.minorStepIdx];
};

DataStep.prototype.getFirstMajor = function(){
  let majorStep = this.magnitudefactor * this.majorSteps[this.minorStepIdx];
  return this.convertValue(this._start + ((majorStep - (this._start % majorStep)) % majorStep));
};

DataStep.prototype.formatValue = function(current) {
  if (current < 100) {
    return current.toPrecision(2);
  }
  else if (current < 1000) {
    return current.toPrecision(3);
  }
  else {
    return current.toPrecision(4)
  }
};

DataStep.prototype.getLines = function () {
  let lines = [];
  let step = this.getStep();
  let bottomOffset = (step - (this._start % step)) % step;
  for (let i = (this._start + bottomOffset); this._end-i > 0.00001 - 0.5*step; i += step) {
    if (i != this._start) { //Skip the bottom line
      lines.push({major: this.isMajor(i), y: this.convertValue(i), val: this.formatValue(i)});
    }
  }
  return lines;
};

DataStep.prototype.convertValue = function (value) {
  return this.containerHeight - ((value - this._start) * this.scale);
};
