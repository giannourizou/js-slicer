const FDTNode = require("../../forward-dominance-tree/domain/FDTNode");
const FDTEdge = require("../../forward-dominance-tree/domain/FDTEdge");
const FDT = require("../../forward-dominance-tree/domain/FDT");
const Graph = require("../../utils/graphUtils");
const AssignmentStatement = require("../../code-parser-module/domain/AssignmentStatement");
const VariableDeclaration = require("../../code-parser-module/domain/VariableDeclaration");
const DDGEdge = require("../../data-dependence-graph/domain/DDGEdge");
const _ = require("lodash");
const Identifier = require("../../code-parser-module/domain/Identifier");

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
            pathsToExit = this.getPathsToNode(node._id, exitNode._id);

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
    
    getPathsToNode(startID, exitID, visited = new Set()){
        if (startID === exitID) return [[exitID]];
        if (visited.has(startID)) return [];

        let allPathsToExit = [];
        let startNode = this.getNodeById(startID);
        visited.add(startID);

        startNode._edges.forEach((e) => {
            let pathsToExit = this.getPathsToNode(e._targetId, exitID, new Set(visited));
            pathsToExit.map((path) => {
                allPathsToExit.push([startID].concat(path))
            });
        })
        return allPathsToExit;
    }

    getNodeById(id) {
        return this._nodes.find((node) => node._id === id);
    }
    
    getTopologies() {
        return this._nodes.flatMap((source) => 
            this._nodes
                .filter((target) => target._id !== source._id)
                .map((target) => {
                    let paths = this.getPathsToNode(source._id, target._id);
                    return {
                        _source: source._id,
                        _target: target._id,
                        _paths: paths   
                    };
                })
                .filter((topology) => topology._paths.length > 0)
        );
    }

    getDataDependencyEdgesForNode(fromNode) {
        let ddgEdges = [];
        this.getTopologies()
            .filter((topology) => topology._source === fromNode._id)
            .forEach((topology) => {                
                this.getVariableDependency(fromNode, this.getNodeById(topology._target), topology._paths).forEach((vd) => {
                    //Add DDGEdge if it does not exist already
                    if (
                        !ddgEdges.some(
                            (edge) => edge._source === fromNode._id && edge._target === topology._target && vd === edge._dependantVariable
                        )
                    ) {
                        ddgEdges.push(new DDGEdge(fromNode._id, topology._target, vd));
                    }
                });
            });
        return ddgEdges;
    }

    getVariableDependency(fromNode, toNode, paths) {
        if (fromNode._statement == null || toNode._statement == null) return [];

        let sourceNodeUsedVars = fromNode._statement.getUsedVariableNames();
        let destNodeUsedVars = toNode._statement.getUsedVariableNames();

        let sourceNodeDeclaredVar =
            fromNode._statement instanceof AssignmentStatement || fromNode._statement instanceof VariableDeclaration
                ? fromNode._statement.getDefinedVariable()
                : undefined;
        let destNodeDeclaredVar =
            toNode._statement instanceof AssignmentStatement || toNode._statement instanceof VariableDeclaration
                ? toNode._statement.getDefinedVariable()
                : undefined;

        sourceNodeDeclaredVar = sourceNodeDeclaredVar ? sourceNodeDeclaredVar.flatMap(this.extractVarNames) : [];
        destNodeDeclaredVar = destNodeDeclaredVar ? destNodeDeclaredVar.flatMap(this.extractVarNames) : [];
        sourceNodeUsedVars = sourceNodeUsedVars ? sourceNodeUsedVars.flatMap(this.extractVarNames) : [];
        destNodeUsedVars = destNodeUsedVars ? destNodeUsedVars.flatMap(this.extractVarNames) : [];
        
        let allVars = _.uniq(sourceNodeUsedVars.concat(destNodeUsedVars));
        if (sourceNodeDeclaredVar) allVars = allVars.concat(sourceNodeDeclaredVar);
        if (destNodeDeclaredVar) allVars = allVars.concat(destNodeDeclaredVar);
        allVars = _.uniq(allVars);
        console.log(`All vars:`, allVars);

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
            let nodesAreDataDependent = paths.some((path) => {
                //console.log(`Path:`, path);
                let remainingNodes = path
                    .filter((nodeId) => nodeId !== fromNode._id && nodeId !== toNode._id)
                    .map((nodeId) => this.getNodeById(nodeId));
                let hasInterveningDefinition = remainingNodes.some((rNode) => {
                    let rNodeDeclaredVar =
                        rNode._statement instanceof AssignmentStatement || rNode._statement instanceof VariableDeclaration
                            ? rNode._statement.getDefinedVariable()
                            : undefined;
                    if (rNodeDeclaredVar) rNodeDeclaredVar = rNodeDeclaredVar.filter(v => v).map( v => v._name);
                    return rNodeDeclaredVar && rNodeDeclaredVar.includes(variable);
                });

                
                console.log(`\nChecking ${fromNode._id} → ${toNode._id} for variable '${variable}'`);
                //console.log(`All vars`, allVars);
                //console.log(`sourceNodeDeclaredVar:`, sourceNodeDeclaredVar);
                //console.log(`destNodeDeclaredVar:`, destNodeDeclaredVar);
                //console.log(`sourceNodeUsedVars:`, sourceNodeUsedVars);
                //console.log(`destNodeUsedVars:`, destNodeUsedVars);
                

                let def_use = sourceNodeDeclaredVar && sourceNodeDeclaredVar.includes(variable) && destNodeUsedVars.includes(variable);
                let use_def = sourceNodeUsedVars.includes(variable) && destNodeDeclaredVar && destNodeDeclaredVar.includes(variable);
                let def_def = sourceNodeDeclaredVar && sourceNodeDeclaredVar.includes(variable) && destNodeDeclaredVar && destNodeDeclaredVar.includes(variable);

                console.log(`def_use: ${def_use}, use_def: ${use_def}, def_def: ${def_def}`);
                //console.log(`hasInterveningDefinition: ${hasInterveningDefinition}`);

                return !hasInterveningDefinition && (def_use || use_def || def_def);
            });

            //console.log(`Data dependent? ${nodesAreDataDependent}`);

            if (nodesAreDataDependent) variableDependencyList.push(variable);
        }

        return variableDependencyList.length ? variableDependencyList : [];
    }


    extractVarNames = (item) => {
        if (!item) return [];
        if (typeof item === 'string') return [item];
        if (item instanceof Identifier) return [item._name];

        // Binary Expression
        names = [];
        if (item._left) names = names.concat(this.extractVarNames(item._left));
        if (item._right) names = names.concat(this.extractVarNames(item._right));
        return names;
    }
}

module.exports = CFG;
