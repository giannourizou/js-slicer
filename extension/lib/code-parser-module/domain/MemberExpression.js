class MemberExpression {
    constructor(object, property, computed) {
        this._object = object;
        this._property = property;
        this._computed = computed;
    }

    get object() {
        return this._object;
    }

    set object(value) {
        this._object = value;
    }

    get property() {
        return this._property;
    }

    set property(value) {
        this._property = value;
    }

    get computed() {
        return this._computed;
    }

    getUsedVariableNames() {
        let varArray = [];

        if (this._object.getUsedVariableNames) {
            varArray = varArray.concat(this._object.getUsedVariableNames());
        } else if (this._object._name) {
            varArray.push(this._object._name);
        }

        if (this._computed && this._property.getUsedVariableNames) {
            varArray = varArray.concat(this._property.getUsedVariableNames());
        } else if (this._computed && this._property._name) {
            varArray.push(this._property._name);
        }

        return varArray;
    }

    accept(visitor) {
        visitor.visitMemberExpression(this);
    }

    asText() {
        return `${this._object.asText()}${this._computed ? `[${this._property.asText()}]` : `.${this._property.asText()}`}`;
    }
}
module.exports = MemberExpression;
