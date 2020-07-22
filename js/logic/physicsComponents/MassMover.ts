class MassMover {
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
    let dx, dy, node;
    let nodes = this.physicsBody.nodes;
    let nodeIndices = this.physicsBody.physicsNodeIndices;
    let center = this.options.center;


    // get bounding box
    let minX = 1e20;
    let maxX = -1e20;
    let minY = 1e20;
    let maxY = -1e20;

    for (let i = 0; i < nodeIndices.length; i++) {
      let nodeId = nodeIndices[i];
      node = nodes[nodeId];
      minX = Math.min(minX, node.x);
      maxX = Math.max(maxX, node.x);
      minY = Math.min(minY, node.y);
      maxY = Math.max(maxY, node.y);
    }

    let nodesCenter = {x: (maxX + minX) * 0.5, y: (maxY + minY) * 0.5};
    dx = center.x - nodesCenter.x;
    dy = center.y - nodesCenter.y; // inverse so we can just add x and y to node x and y

    // move all nodes to center frame
    for (let i = 0; i < nodeIndices.length; i++) {
      let nodeId = nodeIndices[i];
      node = nodes[nodeId];
      node.x += 0.1*dx;
      node.y += 0.1*dy;
    }
  }

}


export default MassMover;