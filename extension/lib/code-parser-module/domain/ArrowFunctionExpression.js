class ArrowFunctionExpression {
    constructor(params, body, isAsync) {
        this._params = params;
        this._body = body;
        this._isAsync = isAsync;
    }

    getUsedVariableNames(){
        varArray = [];
        paramNames = this._params.map(p => p._name);

        if (this._body && typeof this._body.getUsedVariableNames === 'function') {
            varArray = varArray.concat(this._body.getUsedVariableNames());
        } else if (this._body && this._body._name) {
            varArray.push(this._body._name);
        }
        
        varArray = varArray.filter(v => !paramNames.includes(v));   // keep only the external vars
        return varArray; 
    }

    asText() {
        let paramsStr = "";
        for (let param of this._params) {
            paramsStr = paramsStr.concat(param.asText(), ", ");
        }
        paramsStr = paramsStr.slice(0, -2);

        return `${this._isAsync ? "async " : ""}${`(${paramsStr})`}=>{...}`; //add body info?
    }
}

module.exports = ArrowFunctionExpression;
