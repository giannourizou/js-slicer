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

        let sourceNodeUsedVars = typeof fromNode._statement.getUsedVariableNames === "function" ? 
            fromNode._statement.getUsedVariableNames() : [];
        let destNodeUsedVars = typeof toNode._statement.getUsedVariableNames === "function" ?
            toNode._statement.getUsedVariableNames() : [];

        let sourceNodeDeclaredVar = typeof fromNode._statement.getDefinedVariable === "function" ?
            fromNode._statement.getDefinedVariable() : [];
        let destNodeDeclaredVar = typeof toNode._statement.getDefinedVariable === "function" ?
            toNode._statement.getDefinedVariable() : [];

        //sourceNodeUsedVars = sourceNodeUsedVars ? sourceNodeUsedVars.flatMap(this.extractUsedVarNames) : [];
        //destNodeUsedVars = destNodeUsedVars ? destNodeUsedVars.flatMap(this.extractUsedVarNames) : [];

        let allVars = _.uniq(sourceNodeUsedVars.concat(destNodeUsedVars));
        if (sourceNodeDeclaredVar) allVars = allVars.concat(sourceNodeDeclaredVar);
        if (destNodeDeclaredVar) allVars = allVars.concat(destNodeDeclaredVar);
        allVars = _.uniq(allVars);

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

            if (toNode._statement instanceof VariableDeclaration){
                if (destNodeDeclaredVar.includes(variable)) continue;
            }

            let nodesAreDataDependent = paths.some((path) => {
                let remainingNodes = path
                    .filter((nodeId) => nodeId !== fromNode._id && nodeId !== toNode._id)
                    .map((nodeId) => this.getNodeById(nodeId));
                let hasInterveningDefinition = remainingNodes.some((rNode) => {
                    let rNodeDeclaredVar = typeof rNode._statement.getDefinedVariable === "function" ? rNode._statement.getDefinedVariable() : undefined;
                    if (rNodeDeclaredVar && rNodeDeclaredVar.includes(variable)) {
                        return !(rNode._statement instanceof VariableDeclaration); 
                    }
                    return false;
                });

                let def_use = false;
                if (sourceNodeDeclaredVar && sourceNodeDeclaredVar.includes(variable) && destNodeUsedVars.includes(variable)){
                    if (fromNode._nesting !== toNode._nesting) {   
                        if (fromNode._nesting > toNode._nesting && fromNode._statement instanceof VariableDeclaration) { 
                            // Inner def shouldn't reach outer use
                            def_use = false;
                        }else {
                            // Check if there exists a node:
                            // In a scope between fromNode and toNode
                            // That shadows the fromNode definition
                            def_use = !(this._nodes.some((n) =>
                            n._scope > Math.min(fromNode._scope, toNode._scope) &&
                            n._scope <= Math.max(fromNode._scope, toNode._scope) &&
                            n._statement instanceof VariableDeclaration &&
                            n._statement.getDefinedVariable().includes(variable)));
                        }
                    }else if (fromNode._scope !== toNode._scope) {
                        // Same nesting, check scope access
                        def_use = this.hasAccessToNode(toNode, fromNode._scope, toNode._scope); 
                    }else {
                        def_use = true;
                    }
                }
                
                /* Optional Data Dependencies - Needs scope analysis to be accurate
                let use_def = sourceNodeUsedVars.includes(variable) && destNodeDeclaredVar && destNodeDeclaredVar.includes(variable);
                let def_def = sourceNodeDeclaredVar && sourceNodeDeclaredVar.includes(variable) && destNodeDeclaredVar && destNodeDeclaredVar.includes(variable);
                */

                return !hasInterveningDefinition && def_use;
            });
            if (nodesAreDataDependent) variableDependencyList.push(variable);
        }
        return variableDependencyList.length ? variableDependencyList : [];
    }


    // Check if node X's variables are accessible from node Y
    // Based on scope value, by traversing up the scope chain
    hasAccessToNode(toNode, fromScope, toScope) {
        let visited = new Set();
        let curNode = toNode;
        let curScope = toScope;

        while (curScope !== 0 && !visited.has(curNode._id)) {
            if (curScope === fromScope) return true;
            visited.add(curNode._id);
            curScope = Math.min(...curNode._parents.map(p => p._scope));
            if (curNode._parents.length > 0) {
                curNode = curNode._parents.find(p => p._scope === curScope)
            } else {
                return false;
            }
        }
        return false;
    }
}

module.exports = CFG;
