class BreakStatement {
    constructor(label) {
        this._label = label;
    }

    get label() {
        return this._label;
    }

    set label(value) {
        this._label = value;
    }

    accept(visitor) {
        visitor.visitBreakStatement(this);
    }

    getUsedVariableNames() {
        return [];  
    }

    getDefinedVariable() {
        return []; 
    }
    
    asText() {
        return "break";
    }
}
module.exports = BreakStatement;
