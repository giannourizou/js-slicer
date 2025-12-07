const FDTNode = require("../../forward-dominance-tree/domain/FDTNode");
const FDTEdge = require("../../forward-dominance-tree/domain/FDTEdge");
const FDT = require("../../forward-dominance-tree/domain/FDT");
const Graph = require("../../utils/graphUtils");
const VariableDeclaration = require("../../code-parser-module/domain/VariableDeclaration");
const DDGEdge = require("../../data-dependence-graph/domain/DDGEdge");
const _ = require("lodash");


class CFG {
    constructor(nodes) {
        if (nodes) {
            this._nodes = nodes;
        } else {
            this._nodes = [];
        }
    }

    print() {
        let lines = [];
        for (let node of this.nodes) {
            let targets = node.edges.map((e) => e.targetNode.id);
            lines.push(`Node: ${node.id} -> ${targets.join(", ")}`);
        }
        return lines.join("\n");
    }

    hasEdge(from, to) {
        let fromNode = this.getNodeById(from);
        if (!fromNode) {
            return false;
        }
        return fromNode.hasEdgeTo(to);
    }

    isJumpTargetNode(node) {
        return this.findIncomingEdges(node).length >= 2 || node.edges.length == 0 || node.parents.some((parentNode) => parentNode.isJumpNode());
    }

    findIncomingEdges(node) {
        let incomingEdges = [];
        for (let n of this._nodes) {
            if (n.hasEdgeTo(node.id)) {
                incomingEdges.push(n);
            }
        }
        return incomingEdges;
    }

    hasExitNode(nodeId) {
        let node = this.getNodeById(nodeId);
        if (!node) {
            throw new Error("Invalid node Id");
        }
        return node.isExitNode();
    }

    getExitNode() {
        return this._nodes.find(node => node.isExitNode());
    }


    getNodeById(id) {
        let result = this.nodes.filter((n) => n.id === id);
        if (result) {
            return result[0];
        } else {
            return null;
        }
    }

    addNode(node) {
        // Do not add the same node twice
        if (this._nodes.includes(node)) {
            return;
        }
        this.nodes.push(node);
    }

    get nodes() {
        return this._nodes;
    }

    set nodes(value) {
        this._nodes = value;
    }

    getForwardDominanceTree() { 
        let dominatorsMap = this.getNodesImmediateDominators();      
        let fdtNodes = this._nodes.map((node) => {
        return new FDTNode(node._id, null, node._statement, this.getFDTNodeEdges(node, dominatorsMap))});
        return new FDT(fdtNodes);
    }


    getNodesImmediateDominators() {
        let immediateDomMap = {};
        this._nodes.forEach((node) => {
            let exitNode = this.getExitNode();
            pathsToExit = this.FDTgetPathsToNode(node._id, exitNode._id);

            // Node X dominates node Y, if every path from Y to EXIT passes through X
            let nodeDominants = [];
            let rest = this._nodes.filter((n) => n._id !== node._id);
            rest.forEach((node) => {
                if (pathsToExit.every(path => path.includes(node._id))) {
                    nodeDominants.push(node);
                }
            });

            // For each dominator (dom), 
            // Check if all the rest dominators (rdom) appear after (>) dom on every path
            let immediateDomNode = nodeDominants.find((dom) => {
                let restDoms = nodeDominants.filter((n) => n._id !== dom._id);
                return restDoms.every((rdom) => {
                    return pathsToExit.every(path => {
                        return path.indexOf(rdom._id) > path.indexOf(dom._id);
                    });
                });
            });

            immediateDomMap[node._id] = immediateDomNode ? immediateDomNode._id : 0;
        });

        return immediateDomMap;
    }

    getFDTNodeEdges(cfgNode, dominatorsMap) {
        let fdtEdges = [];
        for (const key in dominatorsMap) {
            if (dominatorsMap[key] === cfgNode._id) {
                fdtEdges.push(new FDTEdge(cfgNode.id, parseInt(key)));
            }
        }
        return fdtEdges;
    }

    getAllEdges() {
        return this._nodes.flatMap((node) => {
            return node._edges;
        });
    }

    getAllCFGPaths() {
        return new Graph(this._nodes.length).getCFGPaths(this);
    }
    
    getNodeById(id) {
        return this._nodes.find((node) => node._id === id);
    }

    // Temporary solution
    // condition visited.size > 0 creates infinite loop for cdg generation
    FDTgetPathsToNode(startID, exitID, visited = new Set()){
        if (startID === exitID) return [[exitID]];
        if (visited.has(startID)) return [];

        let allPathsToNode = [];
        let startNode = this.getNodeById(startID);
        visited.add(startID);

        startNode._edges.forEach((e) => {
            let pathsToExit = this.getPathsToNode(e._targetId, exitID, new Set(visited));
            pathsToExit.map((path) => {
                allPathsToNode.push([startID].concat(path))
            });
        })
        return allPathsToNode;
    }

    getPathsToNode(startID, exitID, visited = new Set()){
        if (startID === exitID && visited.size > 0) return [[exitID]];
        if (visited.has(startID)) return [];

        let allPathsToNode = [];
        let startNode = this.getNodeById(startID);
        visited.add(startID);

        startNode._edges.forEach((e) => {
            let pathsToExit = this.getPathsToNode(e._targetId, exitID, new Set(visited));
            pathsToExit.map((path) => {
                allPathsToNode.push([startID].concat(path))
            });
        })
        return allPathsToNode;
    }
    
    getTopologies() {
        return this._nodes.flatMap((source) => 
            this._nodes
                .filter((target) => {
                    if (target._id === source._id) {
                        let paths = this.getPathsToNode(source._id, target._id);
                        return paths.some((path) => path.length > 1);   // self loop
                    }
                    return true;
                })
                .map((target) => {
                    let paths = this.getPathsToNode(source._id, target._id);
                    return {
                        _source: source._id,
                        _target: target._id,
                        _paths: paths   
                    };
                })
        );
    }

    getDataDependencyEdgesForNode(fromNode) {
        let ddgEdges = [];
        this.getTopologies()
            .filter((topology) => topology._source === fromNode._id)
            .forEach((topology) => {       
                let toNode = this.getNodeById(topology._target);
                if (fromNode._id === toNode._id && fromNode._statement instanceof VariableDeclaration) {
                    return;
                }         
                this.getVariableDependency(fromNode, this.getNodeById(topology._target), topology._paths).forEach((vd) => {
                    //Add DDGEdge if it does not exist already
                    if (
                        !ddgEdges.some(
                            (edge) => edge._source === fromNode._id && edge._target === topology._target && vd === edge._dependantVariable
                        )
                    ) {
                        //console.log(`Creating edge from node ${fromNode._id} to node ${toNode._id}`);
                        ddgEdges.push(new DDGEdge(fromNode._id, topology._target, vd));
                    }
                });
            });
        return ddgEdges;
    }

    getVariableDependency(fromNode, toNode, paths) {
        if (fromNode._statement == null || toNode._statement == null) return [];

        //console.log(`Apo ${fromNode._id} Se ${toNode._id}`);
        let sourceNodeUsedVars = fromNode._statement.getUsedVariableNames();
        let destNodeUsedVars = toNode._statement.getUsedVariableNames();

        let sourceNodeDeclaredVar = typeof fromNode._statement.getDefinedVariable === "function" ?
            fromNode._statement.getDefinedVariable() : undefined;
        let destNodeDeclaredVar = typeof toNode._statement.getDefinedVariable === "function" ?
            toNode._statement.getDefinedVariable() : undefined;

        sourceNodeDeclaredVar = sourceNodeDeclaredVar ? sourceNodeDeclaredVar.flatMap(this.extractVarNames) : [];
        destNodeDeclaredVar = destNodeDeclaredVar ? destNodeDeclaredVar.flatMap(this.extractVarNames) : [];
        sourceNodeUsedVars = sourceNodeUsedVars ? sourceNodeUsedVars.flatMap(this.extractVarNames) : [];
        destNodeUsedVars = destNodeUsedVars ? destNodeUsedVars.flatMap(this.extractVarNames) : [];
        
        let allVars = _.uniq(sourceNodeUsedVars.concat(destNodeUsedVars));
        if (sourceNodeDeclaredVar) allVars = allVars.concat(sourceNodeDeclaredVar);
        if (destNodeDeclaredVar) allVars = allVars.concat(destNodeDeclaredVar);
        allVars = _.uniq(allVars);
        //console.log(allVars);

        let variableDependencyList = [];
        /*
            //     * Formal Definition
            //     – Let X and Y be nodes in a CFG. There is a data
            //     dependence from X to Y with respect to a
            //     variable v iff there is a non-null path p from X
            //     to Y with no intervening definition of v and
            //     either:
            //     • X contains a definition of v and Y a use of v;
            //     • X contains a use of v and Y a definition of v; or
            //     • X contains a definition of v and Y a definition of v.
            //                 
        */
       
        for (let i in allVars) {
            let variable = allVars[i];

            if (toNode._statement instanceof VariableDeclaration) {
                if (destNodeDeclaredVar.includes(variable)) continue;
            }

            let nodesAreDataDependent = paths.some((path) => {
                let remainingNodes = path
                    .filter((nodeId) => nodeId !== fromNode._id && nodeId !== toNode._id)
                    .map((nodeId) => this.getNodeById(nodeId));
                let hasInterveningDefinition = remainingNodes.some((rNode) => {
                    let rNodeDeclaredVar = typeof rNode._statement.getDefinedVariable === "function" ?
                        rNode._statement.getDefinedVariable() : undefined;
                    rNodeDeclaredVar = rNodeDeclaredVar ? rNodeDeclaredVar.flatMap(this.extractVarNames) : [];
                    //console.log(`Node ${rNode._id} declares ${rNodeDeclaredVar}
 
                    return rNodeDeclaredVar && rNodeDeclaredVar.includes(variable);
                });

                //console.log(`\nChecking ${fromNode._id} → ${toNode._id} for variable '${variable}'`);

                let def_use = sourceNodeDeclaredVar && sourceNodeDeclaredVar.includes(variable) && destNodeUsedVars.includes(variable);
                let use_def = sourceNodeUsedVars.includes(variable) && destNodeDeclaredVar && destNodeDeclaredVar.includes(variable);
                let def_def = sourceNodeDeclaredVar && sourceNodeDeclaredVar.includes(variable) && destNodeDeclaredVar && destNodeDeclaredVar.includes(variable);

                //console.log(`def_use: ${def_use}, use_def: ${use_def}, def_def: ${def_def}`);

                return !hasInterveningDefinition && (def_use || use_def || def_def);
            });
            if (nodesAreDataDependent) variableDependencyList.push(variable);
        }

        return variableDependencyList.length ? variableDependencyList : [];
    }

    extractVarNames = (item) => {
        if (!item) return [];
        if (typeof item === 'string') return [item];

        names = [];
        if (item?.getUsedVariableNames) {names = names.concat(item.getUsedVariableNames().flatMap(this.extractVarNames));}
        return names;
    }
}

module.exports = CFG;
