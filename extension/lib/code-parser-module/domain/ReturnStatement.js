class ReturnStatement {
    constructor(value) {
        this._value = value;
    }

    get value() {
        return this._value;
    }

    set value(value) {
        this._value = value;
    }

    getUsedVariableNames() {
        varArray = []

        if (this._value.getUsedVariableNames){
            varArray = varArray.concat(this._value.getUsedVariableNames())
        } else if (this._value._name){
            varArray.push(this._value._name)
        }
    
        return varArray;
    }

    accept(visitor) {
        visitor.visitReturnStatement(this);
    }

    asText() {
        return `return ${this._value ? this._value.asText() : ""}`;
    }
}
module.exports = ReturnStatement;
