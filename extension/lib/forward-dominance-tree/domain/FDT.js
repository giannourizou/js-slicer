class FDT {

    constructor(nodes) {
        this._nodes = nodes;
    }

    get nodes() {
        return this._nodes;
    }

    set nodes(value) {
        this._nodes = value;
    }

    hasEdge(from, to) {
        let fromNode = this.getNodeById(from);
        if (!fromNode) {
            return false;
        }
        return fromNode.hasEdgeTo(to);
    }

    getNodeById(id) {
        let result = this.nodes.filter((n) => n._id === id);
        if (result) {
            return result[0];
        } else {
            return null;
        }
    }

    getImmediateDominantId(nodeId){
        let fdtEdges = this.getAllEdges();
        let foundEdge = fdtEdges.find(edge => edge._target === nodeId)
        if(!foundEdge) return ;
        return foundEdge._source;
    }
    getAllEdges(){
        return this._nodes.flatMap(node => {
            return node._edges;
        })
    }

}
module.exports = FDT;