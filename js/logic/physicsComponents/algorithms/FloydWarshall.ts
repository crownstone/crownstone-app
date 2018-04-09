/**
 * Created by Alex on 10-Aug-15.
 */


class FloydWarshall {
  constructor(){}

  getDistances(edges, nodeIdArray) {
    let D_matrix = {};

    // prepare matrix with large numbers
    for (let i = 0; i < nodeIdArray.length; i++) {
      D_matrix[nodeIdArray[i]] = {};
      D_matrix[nodeIdArray[i]] = {};
      for (let j = 0; j < nodeIdArray.length; j++) {
        D_matrix[nodeIdArray[i]][nodeIdArray[j]] = (i == j ? 0 : 1e9);
        D_matrix[nodeIdArray[i]][nodeIdArray[j]] = (i == j ? 0 : 1e9);
      }
    }

    // put the weights for the edges in. This assumes unidirectionality.
    for (let i = 0; i < edges.length; i++) {
      let edge = edges[i];
      // edge has to be connected if it counts to the distances. If it is connected to inner clusters it will crash so we also check if it is in the D_matrix
      if (D_matrix[edge.from] !== undefined && D_matrix[edge.to] !== undefined) {
        D_matrix[edge.from][edge.to] = 1;
        D_matrix[edge.to][edge.from] = 1;
      }
    }

    let nodeCount = nodeIdArray.length;

    // Adapted FloydWarshall based on unidirectionality to greatly reduce complexity.
    for (let k = 0; k < nodeCount; k++) {
      for (let i = 0; i < nodeCount-1; i++) {
        for (let j = i+1; j < nodeCount; j++) {
          D_matrix[nodeIdArray[i]][nodeIdArray[j]] = Math.min(D_matrix[nodeIdArray[i]][nodeIdArray[j]],D_matrix[nodeIdArray[i]][nodeIdArray[k]] + D_matrix[nodeIdArray[k]][nodeIdArray[j]])
          D_matrix[nodeIdArray[j]][nodeIdArray[i]] = D_matrix[nodeIdArray[i]][nodeIdArray[j]];
        }
      }
    }

    return D_matrix;
  }
}

export default FloydWarshall;