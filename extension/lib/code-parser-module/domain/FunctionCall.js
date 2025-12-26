class FunctionCall {
    constructor(name, args) {
        this._name = name;
        this._args = args;
    }

    get name() {
        return this._name;
    }

    set name(value) {
        this._name = value;
    }

    get args() {
        return this._args;
    }

    set args(value) {
        this._args = value;
    }

    getUsedVariableNames() {
        let varArray = [];

        if (this._name.getUsedVariableNames()) {
            varArray = varArray.concat(this._name.getUsedVariableNames());
        }

        for (let i in this._args) {
            let arg = this._args[i];
            if (arg.getUsedVariableNames) {
                varArray = varArray.concat(arg.getUsedVariableNames());
            } else if (arg._name) {
                varArray.push(arg._name);
            }
        }
        
        let builtInObjects = ['Object', 'Function', 'Boolean', 'Symbol', 'console', 'window', 'Math', 'Object', 'Array', 'String', 'RegExp', 'Number', 'Temporal', 'Map', 'Set', 'Date', 'JSON'];
        varArray.filter( v => !builtInObjects.includes(v));

        return varArray;
    }  


    getDefinedVariable() {
        // Handling mutating methods of arrays
        if (this._name) {
            let mutatingMethods = ['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'fill', 'unshift', 'copyWithin']
            if (mutatingMethods.includes(this._name._property._name)) {
                return [this._name._object._name]; 
            }
        }
        return [];
    }

    accept(visitor) {
        visitor.visitFunctionCall(this);
    }

    asText() {
        let str = "";
        for (let arg of this._args) {
            str = str.concat(arg.asText(), ", ");
        }
        str = str.slice(0, -2);
        return `${this._name.asText()}(${str})`;
    }
}

module.exports = FunctionCall;
