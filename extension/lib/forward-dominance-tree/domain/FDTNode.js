class FDTNode {

    constructor(id,executionCondition,statement,edges) {
        this._id = id;
        this._executionCondition = executionCondition
        this._statement = statement;
        this._edges = edges;
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

    hasEdgeTo(targetNodeId) {
         let result = this.edges.filter((e) => e.target === targetNodeId);
        if (result && result.length > 0) {
            return true;
        }
        return false;
    }

}
module.exports = FDTNode;