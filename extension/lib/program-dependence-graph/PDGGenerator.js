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
                return new PDGNode (node._id, null, node._statement, node._edges);
            }
            let ddgNode = ddg.getNodeById(node._id);

            if (ddgNode?._edges) {
                let pdgNodeEdges =  node._edges.concat(ddgNode._edges);
                return new PDGNode (node._id, null, node._statement, pdgNodeEdges);
            }

            return new PDGNode(node._id, null, node._statement, null);
        })
        
        return new PDG(PDGnodes)
    }

}

module.exports = PDGGenerator;