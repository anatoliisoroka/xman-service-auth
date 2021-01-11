const { getScopeList } = require('./constants');

exports.convertJsonToUrlEncoded = (req, res, next) => {
    if (req.is('json')) {
        req.headers['content-type'] = 'application/x-www-form-urlencoded'
    }

    return next();
}

exports.convertBinaryScopeToString = (scopeBinary) => {
    var scopeString = [];

    if(!scopeBinary) {
        return scopeString
    }

    scopeBinary.split('').filter(
        (bit, index, arr) => bit === '1' && scopeString.push(index >= 0 && index < getScopeList.length  && getScopeList[index])
    )
    return scopeString.join(',');
}

exports.convertBinaryScopeToArray = (scopeBinary) => {
    var scopeArray = [];

    if(!scopeBinary) {
        return scopeArray;
    }

    scopeBinary.split('').filter(
        (bit, index, arr) => bit === '1' && scopeArray.push(index >= 0 && index < getScopeList.length  && getScopeList[index])
    )
    return scopeArray;
}

exports.convertArrayScopeToBinary = (scopeArray) => {

    if (!Array.isArray(scopeArray)) {
        return '';
    }

    const scopes = getScopeList.map(
        s => scopeArray.indexOf(s) >= 0 ? 1 : 0
    );
    return scopes.join('')
}

exports.convertToUniqueArray = (arrayList) => {
    var arr = [];

    if (!Array.isArray(arrayList)) {
        return arr;
    }

    arrayList.map(
        value => {
            if (Array.isArray(value)) {
                value.map(
                    val => {
                        arr.push(val);
                    }
                )
            } else {
                arr.push(value);
            }
        }
    )

    return Array.from(new Set(arr));
}

exports.convertToFormattedNumber = (number) =>{
    return '+'.concat(`${number}`.replace (/[^0-9]/g, ''))
}