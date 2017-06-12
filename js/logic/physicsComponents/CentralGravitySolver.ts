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
    let forces = this.physicsBody.forces;
    let center = this.options.center;

    for (let i = 0; i < nodeIndices.length; i++) {
      let nodeId = nodeIndices[i];
      node = nodes[nodeId];
      dx = center.x-node.x;
      dy = center.y-node.y;
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