class SpringSolver {
  physicsBody: any;
  options: any;

  constructor(physicsBody, options) {
    this.physicsBody = physicsBody;
    this.setOptions(options);
  }

  setOptions(options) {
    this.options = options;
  }

  /**
   * This function calculates the springforces on the nodes, accounting for the support nodes.
   *
   * @private
   */
  solve() {
    let edgeLength, edge;
    let edgeIndices = this.physicsBody.physicsEdgeIndices;
    let edges = this.physicsBody.edges;

    // forces caused by the edges, modelled as springs
    for (let i = 0; i < edgeIndices.length; i++) {
      edge = edges[edgeIndices[i]];
      if (edge.to !== edge.from) {
        // only calculate forces if nodes are in the same sector
        if (this.physicsBody.nodes[edge.to] !== undefined && this.physicsBody.nodes[edge.from] !== undefined) {
          // the * 1.5 is here so the edge looks as large as a smooth edge. It does not initially because the smooth edges use
          // the support nodes which exert a repulsive force on the to and from nodes, making the edge appear larger.
          edgeLength = edge.length === undefined ? this.options.springLength * 1.5: edge.length;
          this._calculateSpringForce(this.physicsBody.nodes[edge.from], this.physicsBody.nodes[edge.to], edgeLength);
        }
      }
    }
  }


  /**
   * This is the code actually performing the calculation for the function above.
   *
   * @param node1
   * @param node2
   * @param edgeLength
   * @private
   */
  _calculateSpringForce(node1, node2, edgeLength) {
    let dx = (node1.x - node2.x);
    let dy = (node1.y - node2.y);
    let distance = Math.max(Math.sqrt(dx * dx + dy * dy),0.01);

    // the 1/distance is so the fx and fy can be calculated without sine or cosine.
    let springForce = this.options.springConstant * (edgeLength - distance) / distance;

    let fx = dx * springForce;
    let fy = dy * springForce;

    // handle the case where one node is not part of the physics
    if (this.physicsBody.forces[node1.id] !== undefined) {
      this.physicsBody.forces[node1.id].x += fx;
      this.physicsBody.forces[node1.id].y += fy;
    }

    if (this.physicsBody.forces[node2.id] !== undefined) {
      this.physicsBody.forces[node2.id].x -= fx;
      this.physicsBody.forces[node2.id].y -= fy;
    }
  }
}

export default SpringSolver;