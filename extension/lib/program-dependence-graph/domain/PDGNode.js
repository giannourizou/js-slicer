class PDGNode {

    constructor(id, executionCondition, statement, edges, controlEdges, dataEdges) {
        this._id = id;
        this._executionCondition = executionCondition
        this._statement = statement;
        this._edges = edges;
        this._controlEdges = controlEdges;
        this._dataEdges = dataEdges;
    }


    get id() {
        return this._id;
    }

    set id(value) {
        this._id = value;
    }

    get executionCondition() {
        return this._executionCondition;
    }

    set executionCondition(value) {
        this._executionCondition = value;
    }

    get statement() {
        return this._statement;
    }

    set statement(value) {
        this._statement = value;
    }

    get edges() {
        return this._edges;
    }

    set edges(value) {
        this._edges = value;
    }

    get controlEdges() {
        return this._controlEdges;
    }

    set controlEdges(value) {
        this._controlEdges = value;
    }

    get dataEdges() {
        return this._dataEdges;
    }

    set dataEdges(value) {
        this._dataEdges = value;
    }

    hasControlEdgeTo(targetNodeId) {
        let result = this.controlEdges.filter((e) => e.target === targetNodeId);
        if (result && result.length > 0) {
            return true;
        }
        return false;
    }

    hasDataEdgeTo(targetNodeId) {
        let result = this.dataEdges.filter((e) => e.target === targetNodeId);
        if (result && result.length > 0) {
            return true;
        }
        return false;
    }

}
module.exports = PDGNode;