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
        let vars = [];
        this._elements.forEach((e) => {
            if (e && e.getUsedVariableNames) {
                vars = vars.concat(e.getUsedVariableNames());
            } else if (e && e._name) {
                vars.push(e._name);
            }
        });
        return vars;
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
