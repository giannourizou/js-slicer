const DDG = require("../data-dependence-graph/domain/DDG");
const CDG = require("../control-dependency-graph/domain/CDG");
const PDG = require("../program-dependence-graph/domain/PDG");
const PDGNode = require("./domain/PDGNode");
const CDGNodeNames = require("../control-dependency-graph/constants/CDGNodeNames");

class PDGGenerator{

    static generatePDG(cdg,ddg){
        if(!cdg || !(cdg instanceof CDG) || !ddg || !(ddg instanceof DDG)){
            throw new Error(`Missing required param.`)
        }

        let PDGnodes =  cdg._nodes.map(node =>{
            if(node._id === CDGNodeNames.ENTRY){
                return new PDGNode (node._id, null, node._statement, node._edges, node._edges, []);
            }
            let ddgNode = ddg.getNodeById(node._id);
            let dataEdges = ddgNode?._edges;
            let controlEdges = node._edges;
            let allEdges =  controlEdges.concat(dataEdges);
            
            let pdgNode = new PDGNode (node._id, null, node._statement, allEdges, controlEdges, dataEdges);
            return pdgNode;
        })
        
        return new PDG(PDGnodes)
    }

}

module.exports = PDGGenerator;