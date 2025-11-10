const FDT = require("../forward-dominance-tree/domain/FDT");
const CFG = require("../control-flow-graph/domain/CFG");
const CDG = require("./domain/CDG");
const CDGNode = require("./domain/CDGNode");
const CDGNodeNames = require("./constants/CDGNodeNames");
const {getCDGNodeEdges, getCDGEntryNodeEdges, fixForLoopIncrements} = require("./helpers/cdgNodesHelper");
const _ = require("lodash")

class CDGGenerator {
    
    static generateCDG(cfg) {
        if (!cfg || !(cfg instanceof CFG)) {
            throw new Error(`Missing required param.`);
        }

        let immediateDomMap = cfg.getNodesImmediateDominators(); // fdt
        let entryNode = new CDGNode(CDGNodeNames.ENTRY, null, []);
        let CDGNodes = [entryNode];

        cfg._nodes.forEach(node => {
            CDGNodes.push(new CDGNode(node._id, node._statement, getCDGNodeEdges(cfg, node, immediateDomMap)));
        });
        
        entryNode._edges = getCDGEntryNodeEdges(cfg, CDGNodes);

        return new CDG(CDGNodes);
    }
}

module.exports = CDGGenerator;