class DDGEdge {
    constructor(source, target, dependantVariable, type = []) {
        this._source = source;
        this._target = target;
        this._dependantVariable = dependantVariable;
        this._type = type; // def-use, def-def, use-def
    }

    get dependantVariable() {
        return this._dependantVariable;
    }

    set dependantVariable(value) {
        this._dependantVariable = value;
    }

    get source() {
        return this._source;
    }

    set source(value) {
        this._source = value;
    }

    get target() {
        return this._target;
    }

    set target(value) {
        this._target = value;
    }

    get type() {
        return this._type;
    }

    set type(value) {
        this._type = value;
    }


}

module.exports = DDGEdge;