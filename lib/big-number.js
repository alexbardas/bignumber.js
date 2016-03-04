/*!
 * big-number.js -> Arithmetic operations on big integers
 * Pure javascript implementation, no external libraries needed
 * Copyright(c) 2012-2016 Alex Bardas <alex.bardas@gmail.com>
 * MIT Licensed
 * It supports the following operations:
 *      addition, subtraction, multiplication, division, power, absolute value
 * It works with both positive and negative integers
 */

!(function() {
    'use strict';

    // The higher the base the more efficient this library
    // Note that we cannot have a base greater than the square root of the maximum safe integer size
    // because we can natively square a "digit" during multiplication
    var maxsafeinteger=Number.MAX_SAFE_INTEGER || Math.pow(2,50);
    var log10base=Math.floor(Math.log(Math.sqrt(maxsafeinteger))/Math.log(10));
    // The base to which we store the number.
    var base=Math.round(Math.pow(10,log10base));

    // Helper function which tests if a given character is a digit
    var testDigit = function(digit) {
        return (/^\d$/.test(digit));
    };

    // Helper function which returns the absolute value of a given number
    var abs = function(number) {
        var bigNumber;
        if (typeof number === 'undefined') {
            return;
        }
        bigNumber = BigNumber(number);
        bigNumber.sign = 1;
        return bigNumber;
    };

    // Check if argument is valid array
    var isArray = function(arg) {
        return Object.prototype.toString.call(arg) === '[object Array]';
    };

    var errors = {
        "invalid": "Invalid Number",
        "division by zero": "Invalid Number - Division By Zero"
    };

    // Constructor function which creates a new BigNumber object
    // from an integer, a string, an array or other BigNumber object
    function BigNumber(initialNumber) {
        var index;
        var position=0;

        // Method removed from public API and made local within this context
        function addDigit(digit,number) {
            if (testDigit(digit)) {
                if (position%log10base==0) number.push(0);
                number[number.length-1]+=(digit*Math.pow(10,position%log10base));
                position++;
                return true;
            }
            return false;
        }

        if (!(this instanceof BigNumber)) {
            return new BigNumber(initialNumber);
        }

        this.number = [];
        this.sign = 1;
        this.rest = 0;

        if (!initialNumber) {
            this.number = [0];
            return;
        }

        // The initial number can be an array or object
        // e.g. array     : [3,2,1], ['+',3,2,1], ['-',3,2,1]
        //      number    : 312
        //      string    : '321', '+321', -321'
        //      BigNumber : BigNumber(321)
        // Every character except the first must be a digit

        if (isArray(initialNumber)) {
            if (initialNumber.length && initialNumber[0] === '-' || initialNumber[0] === '+') {
                this.sign = initialNumber[0] === '+' ? 1 : -1;
                initialNumber.shift(0);
            }
            for (index = initialNumber.length - 1; index >= 0; index--) {
                if (!addDigit(initialNumber[index],this.number)) {
                    this.number = errors['invalid'];
                    return;
                }
            }
        } else {
            initialNumber = initialNumber.toString();
            if (initialNumber.charAt(0) === '-' || initialNumber.charAt(0) === '+') {
                this.sign = initialNumber.charAt(0) === '+' ? 1 : -1;
                initialNumber = initialNumber.substring(1);
            }

            for (index = initialNumber.length - 1; index >= 0; index--) {
                if (!addDigit(parseInt(initialNumber.charAt(index), 10),this.number)) {
                    this.number = errors['invalid'];
                    return;
                }
            }
        }
    }

    // Statistics on the number of operations performed (useful for checking performance)
    BigNumber.stats={
        divs:{count:0,iterations:0},
        mults:{count:0,iterations:0},
        adds:{count:0,iterations:0},
        subs:{count:0,iterations:0},
        pows:{count:0,iterations:0}
    };

    // returns:
    //      0 if this.number === number
    //      -1 if this.number < number
    //      1 if this.number > number
    BigNumber.prototype._compare = function(number) {
        // if the function is called with no arguments then return 0
        var bigNumber;
        var index;
        if (typeof number === 'undefined') {
            return 0;
        }

        bigNumber = BigNumber(number);

        // If the numbers have different signs, then the positive
        // number is greater
        if (this.sign !== bigNumber.sign) {
            return this.sign;
        }

        // Else, check the length
        if (this.number.length > bigNumber.number.length) {
            return this.sign;
        } else if (this.number.length < bigNumber.number.length) {
            return this.sign * (-1);
        }

        // If they have similar length, compare the numbers
        // digit by digit
        for (index = this.number.length - 1; index >= 0; index--) {
            if (this.number[index] > bigNumber.number[index]) {
                return this.sign;
            } else if (this.number[index] < bigNumber.number[index]) {
                return this.sign * (-1);
            }
        }

        return 0;
    };

    // Greater than
    BigNumber.prototype.gt = function(number) {
        return this._compare(number) > 0;
    };

    // Greater than or equal
    BigNumber.prototype.gte = function(number) {
        return this._compare(number) >= 0;
    };

    // this.number equals n
    BigNumber.prototype.equals = function(number) {
        return this._compare(number) === 0;
    };

    // Less than or equal
    BigNumber.prototype.lte = function(number) {
        return this._compare(number) <= 0;
    };

    // Less than
    BigNumber.prototype.lt = function(number) {
        return this._compare(number) < 0;
    };

    // Addition
    BigNumber.prototype.add = function(number) {
        var bigNumber;
        if (typeof number === 'undefined') {
            return this;
        }
        bigNumber = BigNumber(number);

        if (this.sign !== bigNumber.sign) {
            if (this.sign > 0) {
                bigNumber.sign = 1;
                return this.minus(bigNumber);
            }
            else {
                this.sign = 1;
                return bigNumber.minus(this);
            }
        }

        this.number = BigNumber._add(this, bigNumber);
        return this;
    };

    // Subtraction
    BigNumber.prototype.subtract = function(number) {
        var bigNumber;
        if (typeof number === 'undefined') {
            return this;
        }
        bigNumber = BigNumber(number);

        if (this.sign !== bigNumber.sign) {
            this.number = BigNumber._add(this, bigNumber);
            return this;
        }

        // If current number is lesser than the given bigNumber, the result will be negative
        this.sign = (this.lt(bigNumber)) ? -1 : 1;
        this.number = (abs(this).lt(abs(bigNumber)))
            ? BigNumber._subtract(bigNumber, this)
            : BigNumber._subtract(this, bigNumber);

        return this;
    };

    // adds two positive BigNumbers
    BigNumber._add = function(a, b) {
        var index;

        var remainder = 0;
        var length = Math.max(a.number.length, b.number.length);

        for (index = 0; index < length || remainder > 0; index++) {
            a.number[index] = (remainder += (a.number[index] || 0) + (b.number[index] || 0)) % base;
            remainder = Math.floor(remainder / base);
            BigNumber.stats.adds.iterations++;
        }
        BigNumber.stats.adds.count++;
        return a.number;
    };

    // a - b
    // a and b are 2 positive BigNumbers and a > b
    BigNumber._subtract = function(a, b) {
        var index;
        var remainder = 0;
        var length = a.number.length;

        for (index = 0; index < length; index++) {
            a.number[index] -= (b.number[index] || 0) + remainder;
            a.number[index] += (remainder = (a.number[index] < 0) ? 1 : 0) * base;
            BigNumber.stats.subs.iterations++;
        }
        // Count the zeroes which will be removed
        index = 0;
        length = a.number.length - 1;
        while (a.number[length - index] === 0 && length - index > 0) {
            index++;
        }
        if (index > 0) {
            a.number.splice(-index);
        }
        BigNumber.stats.subs.count++;
        return a.number;
    };

    // this.number * number
    BigNumber.prototype.multiply = function(number) {
        if (typeof number === 'undefined') {
            return this;
        }
        var bigNumber = BigNumber(number);
        var index;
        var givenNumberIndex;
        var remainder = 0;
        var result = [];

        if (this.isZero() || bigNumber.isZero()) {
            return BigNumber(0);
        }

        this.sign *= bigNumber.sign;

        // multiply the numbers
        for (index = 0; index < this.number.length; index++) {
            for (remainder = 0, givenNumberIndex = 0; givenNumberIndex < bigNumber.number.length || remainder > 0; givenNumberIndex++) {
                result[index + givenNumberIndex] = (remainder += (result[index + givenNumberIndex] || 0) + this.number[index] * (bigNumber.number[givenNumberIndex] || 0)) % base;
                remainder = Math.floor(remainder / base);
                BigNumber.stats.mults.iterations++;
            }
        }

        this.number = result;
        BigNumber.stats.mults.count++;
        return this;
    };

    // this.number / number
    BigNumber.prototype.divide = function(number) {
        if (typeof number === 'undefined') {
            return this;
        }

        var bigNumber = BigNumber(number);
        var index;
        var length;
        var result = [];
        var rest = BigNumber();
        var nativebigNumber=0;
        var nativerest=0;

        // test if one of the numbers is zero
        if (bigNumber.isZero()) {
            this.number = errors['division by zero'];
            return this;
        } else if (this.isZero()) {
            return BigNumber(0);
        }

        this.sign *= bigNumber.sign;
        bigNumber.sign = 1;

        // Skip division by 1
        if (bigNumber.number.length === 1 && bigNumber.number[0] === 1)
            return this;

        // If our divisor is less than the base then we can perform the division using native arithmetic
        if (bigNumber.lt(base)) nativebigNumber=Number(bigNumber.val());

        for (index = this.number.length - 1; index >= 0; index--) {

            if (nativebigNumber) {
                // If we are dividing by a small number (less than our base) then we can do this division step natively
                // which is much faster
                nativerest*=base;
                nativerest+=this.number[index];
                result[index]=Math.floor(nativerest/nativebigNumber);
                nativerest-=(result[index]*nativebigNumber);
            } else {
                // Otherwise we need to use BigNumber arithmetic
                var digit=this.number[index];
                result[index] = 0;
                // Go into base 10 mode as per original logic to maintain efficiency
                for (var subindex=base/10;subindex>=1;subindex/=10) {
                    rest.multiply(10);
                    rest.add(Math.floor(digit/subindex));
                    digit=digit%subindex;
                    while (bigNumber.lte(rest)) {
                        result[index]+=subindex;
                        rest.subtract(bigNumber);
                        BigNumber.stats.divs.iterations++;
                    }
                }
            }
        }

        index = 0;
        length = result.length - 1;
        while (result[length - index] === 0 && length - index > 0) {
            index++;
        }
        if (index > 0) {
            result.splice(-index);
        }
        if (nativebigNumber) this.rest=BigNumber(nativerest);
        else this.rest = rest;
        this.number = result;
        BigNumber.stats.divs.count++;
        return this;
    };

    // this.number % number
    BigNumber.prototype.mod = function(number) {
        return this.divide(number).rest;
    };

    BigNumber.prototype.power = function(number) {
        if (typeof number === 'undefined')
            return;
        var bigNumber;
        // Convert the argument to a number
        number = +number;
        if (number === 0) {
            return BigNumber(1);
        }
        if (number === 1) {
            return this;
        }

        bigNumber = BigNumber(this);

        this.number = [1];
        while (number > 0) {
            BigNumber.stats.pows.iterations++;
            if (number % 2 === 1) {
                this.multiply(bigNumber);
                number--;
                continue;
            }
            bigNumber.multiply(bigNumber);
            number = Math.floor(number / 2);
        }
        BigNumber.stats.pows.count++;
        return this;
    };

    // |this.number|
    BigNumber.prototype.abs = function() {
        this.sign = 1;
        return this;
    };

    // Check if this.number is equal to 0
    BigNumber.prototype.isZero = function() {
        var index;
        for (index = 0; index < this.number.length; index++) {
            if (this.number[index] !== 0) {
                return false;
            }
        }

        return true;
    };

    // this.number.toString()
    BigNumber.prototype.toString = function() {
        var index;
        var str = '';
        if (typeof this.number === "string") {
            return this.number;
        }

        for (index = this.number.length - 1; index >= 0; index--) {
            var digit=this.number[index];
            var group="";
            for (var digits=0;digits<log10base;digits++) {
                group=(digit % 10)+group;
                digit=Math.floor(digit/10);
                if (digit==0 && str.length==0) break;
            }
            str+=group;
        }

        return (this.sign > 0) ? str : ('-' + str);
    };

    // Use shortcuts for functions names
    BigNumber.prototype.plus = BigNumber.prototype.add;
    BigNumber.prototype.minus = BigNumber.prototype.subtract;
    BigNumber.prototype.div = BigNumber.prototype.divide;
    BigNumber.prototype.mult = BigNumber.prototype.multiply;
    BigNumber.prototype.pow = BigNumber.prototype.power;
    BigNumber.prototype.val = BigNumber.prototype.toString;

    // CommonJS
    if (typeof exports === 'object' && typeof module !== 'undefined') {
        module.exports = BigNumber;
    } else if (typeof define === 'function' && define.amd) {
        define(['BigNumber'], BigNumber);
    } else if (typeof window !== 'undefined') {
        window.BigNumber = BigNumber;
    }
})();
