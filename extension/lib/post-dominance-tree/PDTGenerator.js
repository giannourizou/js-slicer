const CFG = require("../control-flow-graph/domain/CFG");
const PDTNode = require("../post-dominance-tree/domain/PDTNode");
const PDT = require("../post-dominance-tree/domain/PDT");

class PDTGenerator{

    static generatePDT(cfg){
        if(!cfg || !(cfg instanceof CFG)){
            throw new Error(`Missing required param.`)
        }

        let dominatorsMap = cfg.getNodesImmediateDominators();
        let fdtNodes = cfg._nodes.map((node) => {
            return new PDTNode(node._id, null, node._statement, cfg.getPDTNodeEdges(node, dominatorsMap))
        });
        return new PDT(fdtNodes);

    }
}

module.exports = PDTGenerator;