// distance finding algorithm
import FloydWarshall from "./algorithms/FloydWarshall.js"


/**
 * KamadaKawai positions the nodes initially based on
 *
 * "AN ALGORITHM FOR DRAWING GENERAL UNDIRECTED GRAPHS"
 * -- Tomihisa KAMADA and Satoru KAWAI in 1989
 *
 * Possible optimizations in the distance calculation can be implemented.
 */
class KamadaKawai {

  springLength;
  springConstant;
  distanceSolver;
  nodes;
  edges;

  K_matrix;
  L_matrix;

  constructor(nodes, edgesArray, edgeLength, edgeStrength) {
    this.nodes = nodes;
    this.edges = edgesArray;
    this.springLength = edgeLength;
    this.springConstant = edgeStrength;
    this.distanceSolver = new FloydWarshall();
  }

  /**
   * Position the system
   * @param nodesArray
   * @param edgesArray
   */
  solve() {
    let nodes = this.nodes;
    let nodeIdArray = Object.keys(nodes);

    // get distance matrix
    let D_matrix = this.distanceSolver.getDistances(this.edges, nodeIdArray); // distance matrix


    // get the L Matrix
    this._createL_matrix(D_matrix, nodeIdArray);

    // get the K Matrix
    this._createK_matrix(D_matrix, nodeIdArray);

    // calculate positions
    let threshold = 0.5;
    let innerThreshold = 0.1;
    let iterations = 0;
    let maxIterations = Math.max(1000,Math.min(10*nodeIdArray.length,6000));
    let maxInnerIterations = 5;

    let maxEnergy = 1e9;
    let highE_nodeId = 0, dE_dx = 0, dE_dy = 0, delta_m = 0, subIterations = 0;

    let result = [0,0,0];
    let totalSub = 0;
    while (maxEnergy > threshold && iterations < maxIterations) {
      iterations += 1;
      [highE_nodeId, maxEnergy, dE_dx, dE_dy] = this._getHighestEnergyNode(nodes, nodeIdArray);
      delta_m = maxEnergy;
      subIterations = 0;
      console.log("DeltaM", delta_m);
      while(delta_m > innerThreshold && subIterations < maxInnerIterations) {
        subIterations += 1;
        this._moveNode(highE_nodeId, dE_dx, dE_dy, nodes, nodeIdArray);
        result = this._getEnergy(highE_nodeId, nodes, nodeIdArray);
        delta_m = result[0];
        dE_dx = result[1];
        dE_dy = result[2];
        totalSub++;
      }
    }

    console.log("FINISHED IN ", iterations, totalSub)
  }

  /**
   * get the node with the highest energy
   * @returns {*[]}
   * @private
   */
  _getHighestEnergyNode(nodes, nodeIdArray) {
    let maxEnergy = 0;
    let maxEnergyNodeId = nodeIdArray[0];
    let dE_dx_max = 0, dE_dy_max = 0;

    for (let nodeIdx = 0; nodeIdx < nodeIdArray.length; nodeIdx++) {
      let m = nodeIdArray[nodeIdx];
      let [delta_m,dE_dx,dE_dy] = this._getEnergy(m, nodes, nodeIdArray);
      if (maxEnergy < delta_m) {
        maxEnergy = delta_m;
        maxEnergyNodeId = m;
        dE_dx_max = dE_dx;
        dE_dy_max = dE_dy;
      }
    }

    return [maxEnergyNodeId, maxEnergy, dE_dx_max, dE_dy_max];
  }

  /**
   * calculate the energy of a single node
   * @param m
   * @returns {*[]}
   * @private
   */
  _getEnergy(m, nodes, nodeIdArray) {
    let x_m = nodes[m].x;
    let y_m = nodes[m].y;
    let dE_dx = 0;
    let dE_dy = 0;

    for (let iIdx = 0; iIdx < nodeIdArray.length; iIdx++) {
      let i = nodeIdArray[iIdx];
      if (i !== m) {
        let x_i = nodes[i].x;
        let y_i = nodes[i].y;
        let denominator = 1.0 / Math.sqrt(Math.pow(x_m - x_i, 2) + Math.pow(y_m - y_i, 2));
        // console.log(x_m,y_m,x_i,y_i,dE_dx,dE_dy,denominator)
        dE_dx += this.K_matrix[m][i] * ((x_m - x_i) - this.L_matrix[m][i] * (x_m - x_i) * denominator);
        dE_dy += this.K_matrix[m][i] * ((y_m - y_i) - this.L_matrix[m][i] * (y_m - y_i) * denominator);
      }
    }

    let delta_m = Math.sqrt(Math.pow(dE_dx, 2) + Math.pow(dE_dy, 2));

    return [delta_m, dE_dx, dE_dy];
  }

  /**
   * move the node based on it's energy
   * the dx and dy are calculated from the linear system proposed by Kamada and Kawai
   * @param m
   * @param dE_dx
   * @param dE_dy
   * @private
   */
  _moveNode(m, dE_dx, dE_dy, nodes, nodeIdArray) {
    let d2E_dx2 = 0;
    let d2E_dxdy = 0;
    let d2E_dy2 = 0;

    let x_m = nodes[m].x;
    let y_m = nodes[m].y;
    for (let iIdx = 0; iIdx < nodeIdArray.length; iIdx++) {
      let i = nodeIdArray[iIdx];
      if (i !== m) {
        let x_i = nodes[i].x;
        let y_i = nodes[i].y;
        let denominator = 1.0 / Math.pow(Math.pow(x_m - x_i, 2) + Math.pow(y_m - y_i, 2), 1.5);
        d2E_dx2 += this.K_matrix[m][i] * (1 - this.L_matrix[m][i] * Math.pow(y_m - y_i, 2) * denominator);
        d2E_dxdy += this.K_matrix[m][i] * (this.L_matrix[m][i] * (x_m - x_i) * (y_m - y_i) * denominator);
        d2E_dy2 += this.K_matrix[m][i] * (1 - this.L_matrix[m][i] * Math.pow(x_m - x_i, 2) * denominator);
      }
    }
    // make the variable names easier to make the solving of the linear system easier to read
    let A = d2E_dx2, B = d2E_dxdy, C = dE_dx, D = d2E_dy2, E = dE_dy;

    // solve the linear system for dx and dy
    let dy = (C / A + E / B) / (B / A - D / B);
    let dx = -(B * dy + C) / A;

    // move the node
    nodes[m].x += dx;
    nodes[m].y += dy;
  }


  /**
   * Create the L matrix: edge length times shortest path
   * @param D_matrix
   * @private
   */
  _createL_matrix(D_matrix, nodeIdArray) {
    let edgeLength = this.springLength;

    let lmat = [];
    for (let i = 0; i < nodeIdArray.length; i++) {
      lmat[nodeIdArray[i]] = {};
      for (let j = 0; j < nodeIdArray.length; j++) {
        lmat[nodeIdArray[i]][nodeIdArray[j]] = edgeLength * D_matrix[nodeIdArray[i]][nodeIdArray[j]];
      }
    }
    this.L_matrix = lmat;
  }


  /**
   * Create the K matrix: spring constants times shortest path
   * @param D_matrix
   * @private
   */
  _createK_matrix(D_matrix, nodeIdArray) {
    let edgeStrength = this.springConstant;

    let kmat = [];
    for (let i = 0; i < nodeIdArray.length; i++) {
      kmat[nodeIdArray[i]] = {};
      for (let j = 0; j < nodeIdArray.length; j++) {
        kmat[nodeIdArray[i]][nodeIdArray[j]] = edgeStrength * Math.pow(D_matrix[nodeIdArray[i]][nodeIdArray[j]], -2);
      }
    }
    this.K_matrix = kmat;
  }



}

export default KamadaKawai;