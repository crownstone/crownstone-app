class CentralGravitySolver {
  physicsBody:any;
  options:any;

  constructor(physicsBody, options) {
    this.physicsBody = physicsBody;
    this.setOptions(options);
  }

  setOptions(options) {
    this.options = options;
  }

  solve() {
    let dx, dy, distance, node;
    let nodes = this.physicsBody.nodes;
    let nodeIndices = this.physicsBody.physicsNodeIndices;
    let amountOfNodes = nodeIndices.length;
    let forces = this.physicsBody.forces;
    let center = this.options.center;

    let verticalThreshold   = 0;
    let horizontalThreshold = 0;


    if (this.options.useLinearAttractors) {
      // if width / height === 1, we have a point width
      // if width / height < 1 we have a vertical line attractor
      // if width / height > 1 we have a horizontal line attractor
      let ratio = this.physicsBody.width / this.physicsBody.height;
      let factor = Math.min(0.6, 0.1 + amountOfNodes*0.1);
      if (ratio < 1) {
        let diff = this.physicsBody.height - this.physicsBody.width;
        verticalThreshold = factor * diff;
      }
    }

    let minY = center.y - verticalThreshold;
    let maxY = center.y + verticalThreshold;

    let minX = center.x - horizontalThreshold;
    let maxX = center.x + horizontalThreshold;

    for (let i = 0; i < nodeIndices.length; i++) {
      let nodeId = nodeIndices[i];
      node = nodes[nodeId];

      if (node.y < minY)      { dy = minY-node.y; }
      else if (node.y > maxY) { dy = maxY-node.y; }
      else                    { dy = 0; }

      if (node.x < minX)      { dx = minX-node.x; }
      else if (node.x > maxX) { dx = maxX-node.x; }
      else                    { dx = 0; }

      distance = Math.sqrt(dx * dx + dy * dy);

      this._calculateForces(distance, dx, dy, forces, node);
    }
  }

  /**
   * Calculate the forces based on the distance.
   * @private
   */
  _calculateForces(distance, dx, dy, forces, node) {
    let gravityForce = (distance === 0) ? 0 : (this.options.centralGravity / distance);
    forces[node.id].x = dx * gravityForce;
    forces[node.id].y = dy * gravityForce;
  }
}


export default CentralGravitySolver;