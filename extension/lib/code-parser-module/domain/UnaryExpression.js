class UnaryExpression {
    constructor(argument, operator) {
        this._argument = argument;
        this._operator = operator;
    }

    get argument() {
        return this._argument;
    }

    set argument(value) {
        this._argument = value;
    }

    get operator() {
        return this._operator;
    }

    set operator(value) {
        this._operator = value;
    }

    getUsedVariableNames() {
        let varArray = [];
        
        if (this._argument?.getUsedVariableNames) {
            varArray = varArray.concat(this.argument.getUsedVariableNames());
        } else if (this._argument._name) {
            varArray.push(this._argument._name)
        }

        return varArray;
    }

    accept(visitor) {
        visitor.visitUnaryExpression(this);
    }

    asText() {
        return `${this._operator}${this._argument.asText()}`;
    }
}

module.exports = UnaryExpression;
