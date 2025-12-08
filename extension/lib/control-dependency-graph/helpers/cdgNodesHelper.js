const CDGEdge = require("../domain/CDGEdge");
const CDGNodeNames = require("../constants/CDGNodeNames");

// Checks if node Y post dominates node X by traversing up the FDT 
const postDominates = (yID, xID, immediateDomMap) => {
    if (xID === yID) return true; 
    
    let cID = xID;
    while (cID !== 0) { 
        cID = immediateDomMap[cID];  
        if (cID === yID) return true;   
    }
    return false;
};

// Formal Definition of Control Dependence from X to Y:
// There's a non null path from X to Y, such that Y post dominates every node strictly between X and Y
// and Y does not post dominate X
const findCDNodes = (cfg, xID, yID, immediateDomMap, condition) => {
    let CDNodes = [];
    let visited = new Set();
    let toVisit = [yID];

    while (toVisit.length > 0) {
        let cID = toVisit.shift();

        if (cID === xID) continue;
        visited.add(cID);

        let cNode = cfg._nodes.find(n => n._id === cID);
        if (!cNode) continue;

        if (cNode._edges.length === 1) { // Sequential node
            cNode._edges.forEach(edge => {
                let successorID = edge._targetId;
                if (visited.has(successorID) || successorID === xID) return;
                if (successorID < xID) return; // Skip back edge
                
                if (!postDominates(successorID, xID, immediateDomMap)) {
                    CDNodes.push({nodeId: successorID, condition: condition});
                    toVisit.push(successorID);
                }
            });

        } else if (cNode._edges.length > 1) {   // Branch node
            let imDomID = immediateDomMap[cID]; // All branch edges meet at the immediate dominator
            if (!imDomID || imDomID === 0) return;
            
            if (!postDominates(imDomID, xID, immediateDomMap)) {
                if (imDomID < xID) return; // Skip back edge

                CDNodes.push({nodeId: imDomID, condition: condition});
                toVisit.push(imDomID);
            }
        }
    }

    return CDNodes;
};

const getCDGNodeEdges = (cfg, nodeX, immediateDomMap) => {
    let edges = [];

    nodeX._edges.forEach(edge => {
        let yID = edge._targetId;
        if (!postDominates(yID, nodeX._id, immediateDomMap)) {
            if (!edges.some((edge) => edge._source === nodeX._id && edge._target === yID)){
                edges.push(new CDGEdge(nodeX._id, yID, edge._condition));
            }

            // Find further control dependent nodes
            let CDNodes = findCDNodes(cfg, nodeX._id, yID, immediateDomMap, edge._condition);
            CDNodes.forEach((dep) => {
                if (!edges.some((edge) => edge.source === nodeX._id && edge._target === dep.nodeId)){
                    edges.push(new CDGEdge(nodeX._id, dep.nodeId, dep.condition));
                }
            });
        }
    });
    return edges;
};

// Connects ENTRY node to nodes without control dependencies
const getCDGEntryNodeEdges = (cfg, cdgNodes) => {
    let entryNodeEdges = [];
    let CDNodes = new Set();
    
    cdgNodes.forEach(node => {
        if (node._id !== CDGNodeNames.ENTRY){
            node._edges.forEach(edge => CDNodes.add(edge._target));
        }
    });

    cfg._nodes.forEach(node => {
        if (!CDNodes.has(node._id)) {
            entryNodeEdges.push(new CDGEdge(CDGNodeNames.ENTRY, node._id, null));
        }
    });
    return entryNodeEdges;
};

module.exports = {
    getCDGNodeEdges,
    getCDGEntryNodeEdges,
};
