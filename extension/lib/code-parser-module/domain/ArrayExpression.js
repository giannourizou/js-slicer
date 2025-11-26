class ArrayExpression {
    constructor(elements) {
        this._elements = elements;
    }

    get elements() {
        return this._elements;
    }

    set elements(value) {
        this._elements = value;
    }

    accept(visitor) {
        visitor.visitArrayExpression(this);
    }

    getUsedVariableNames() {
        let varArray = [];
        this._elements?.forEach((e) => {
            if (e?.getUsedVariableNames) {
                varArray = varArray.concat(e.getUsedVariableNames());
            } else if (e?._name) {
                varArray.push(e._name);
            }
        });
        return varArray;
    }

    getDefinedVariable() {
        return []; 
    }


    asText() {
        let str = "";
        for (let elem of this._elements) {
            str = str.concat(elem.asText(), ", ");
        }
        str = str.slice(0, -2);
        return `[${str}]`;
    }
}

module.exports = ArrayExpression;
