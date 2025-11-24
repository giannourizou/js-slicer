const Identifier = require("./Identifier");
const Literal = require("./Literal");

class AssignmentStatement {
    constructor(left, right, operator) {
        this._left = left;
        this._right = right;
        this._operator = operator;
    }

    get left() {
        return this._left;
    }

    set left(value) {
        this._left = value;
    }

    get right() {
        return this._right;
    }

    set right(value) {
        this._right = value;
    }

    get operator() {
        return this._operator;
    }

    set operator(value) {
        this._operator = value;
    }

    getUsedVariableNames() {
        let varArray = [];
        
        if (this._right?.getUsedVariableNames) {
            varArray = varArray.concat(this._right.getUsedVariableNames());
        } else if (this._right?._name) {
            varArray.push(this._right._name);
        }

        let compoundOperators = ['+=', '-=', '*=', '/=', '%=', '**=', '&=', '|=', '^=', '<<=', '>>=', '>>>=', '&&=', '||=', '??='];
        if(compoundOperators.includes(this._operator)){
            if (this._left?.getUsedVariableNames) {
                varArray = varArray.concat(this._left.getUsedVariableNames());
            } else if (this._left?._name) {
                varArray.push(this._left._name);
            }
        }
        return varArray;
    }

    getDefinedVariable() {
        return [this._left];
    }

    accept(visitor) {
        visitor.visitAssignmentStatement(this);
    }

    asText() {
        return `${this._left.asText()} ${this._operator} ${this._right.asText()}`;
    }
}

module.exports = AssignmentStatement;
