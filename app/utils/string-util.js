export function hash(str) {
    var hashStr = 0, i, chr, len;

    if (str.length === 0) {
        return hashStr;
    }

    for (i = 0, len = str.length; i < len; i++) {
        chr   = str.charCodeAt(i);
        hashStr  = ((hashStr << 5) - hashStr) + chr;
        hashStr |= 0; // Convert to 32bit integer
    }

    return hashStr;
}

export function guid() {
    var guidStr = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0,
        v = c === 'x' ? r : r & 0x3 | 0x8;
        return v.toString(16);
    });

    return guidStr;
}

export function ab2str(buf) {
    return String.fromCharCode.apply(null, new Uint16Array(buf));
}

/**
 * Performs comparison of two given strings according to natural ordering, so "String 9" < "String 10"
 *
 * Function definition courtesy of Chris West
 * (http://cwestblog.com/2013/04/10/javascript-comparing-and-sorting-strings-with-numbers)
 */
export function cmpStringsWithNumbers(_a, _b) {
    // Regular expression to separate the digit string from the non-digit strings.
    const reParts = /\d+|\D+/g;
    // Regular expression to test if the string has a digit.
    const reDigit = /\d/;

    // Get rid of casing issues.
    const a = _a.toUpperCase();
    const b = _b.toUpperCase();

    // Separates the strings into substrings that have only digits and those
    // that have no digits.
    const aParts = a.match(reParts);
    const bParts = b.match(reParts);

    // Used to determine if aPart and bPart are digits.
    let isDigitPart;

    // If `a` and `b` are strings with substring parts that match...
    if (!aParts || !bParts || (isDigitPart = reDigit.test(aParts[0])) !== reDigit.test(bParts[0])) {
        return compare();
    }

    // Loop through each substring part to compare the overall strings.
    const len = Math.min(aParts.length, bParts.length);
    for (let i = 0; i < len; ++i) {
        let aPart = aParts[i];
        let bPart = bParts[i];

        // If comparing digits, convert them to numbers (assuming base 10).
        if (isDigitPart) {
            aPart = parseInt(aPart, 10);
            bPart = parseInt(bPart, 10);
        }

        // If the substrings aren't equal, return either -1 or 1.
        if (aPart !== bPart) {
            return aPart < bPart ? -1 : 1;
        }

        // Toggle the value of isDigitPart since the parts will alternate.
        isDigitPart = !isDigitPart;
    }

    // Use normal comparison.
    return compare();

    ////

    function compare() {
        return (a >= b) - (a <= b);
    }
}


