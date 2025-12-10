class ObjectProperty {
    constructor(key, value) {
        this._key = key;
        this._value = value;
    }

    get key() {
        return this._key;
    }

    set key(value) {
        this._key = value;
    }

    get value() {
        return this._value;
    }

    set value(value) {
        this._value = value;
    }

    getUsedVariableNames() {
        let varArray = [];

        if (this._value.getUsedVariableNames) {
            varArray = varArray.concat(this._value.getUsedVariableNames());
        } else if (this._value._name) {
            varArray.push(this._value._name);
        }
        
        return varArray
    }

    asText() {
        return `${this._key.asText()}: ${this._value.asText()}`;
    }
}
module.exports = ObjectProperty;
