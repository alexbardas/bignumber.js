/*!
 * n.js -> Arithmetic operations on big integers
 * Pure javascript implementation, no external libraries needed
 * Copyright(c) 2012-2016 Alex Bardas <alex.bardas@gmail.com>
 * MIT Licensed
 * It supports the following operations:
 *      addition, subtraction, multiplication, division, power, absolute value
 * It works with both positive and negative integers
 */

!(function(exports) {
    'use strict';

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
        bigNumber = new BigNumber(number, true);
        bigNumber.sign = 1;
        return bigNumber;
    };

    exports.n = function(number) {
        return new BigNumber(number);
    };

    var errors = {
        "invalid": "Invalid Number",
        "division by zero": "Invalid Number - Division By Zero"
    };
    // Constructor function which creates a new BigNumber object
    // from an integer, a string, an array or other BigNumber object
    // if new_copy is true, the function returns a new object instance
    var BigNumber = function(initialNumber, newCopy) {
        var index;
        this.number = [];
        this.sign = 1;
        this.rest = 0;

        if (!initialNumber) {
            this.number = [0];
            return;
        }

        if (initialNumber.constructor === BigNumber) {
            return newCopy ? new BigNumber(initialNumber.toString()) : initialNumber;
       }

        // The initial number can be an array or object
        // e.g. array: [3,2,1], ['+',3,2,1], ['-',3,2,1]
        // e.g. string: '321', '+321', -321'
        // Every character except the first must be a digit

        if (typeof initialNumber === 'object') {
            if (initialNumber.length && initialNumber[0] === '-' || initialNumber[0] === '+') {
                this.sign = initialNumber[0] === '+' ? 1 : -1;
                initialNumber.shift(0);
            }
            for (index = initialNumber.length - 1; index >= 0; index--) {
                if (!this.addDigit(initialNumber[index]))
                    return;
            }
        } else {
            initialNumber = initialNumber.toString();
            if (initialNumber.charAt(0) === '-' || initialNumber.charAt(0) === '+') {
                this.sign = initialNumber.charAt(0) === '+' ? 1 : -1;
                initialNumber = initialNumber.substring(1);
            }

            for (index = initialNumber.length - 1; index >= 0; index--) {
                if (!this.addDigit(parseInt(initialNumber.charAt(index), 10))) {
                    return;
                }
            }
        }
    };

    BigNumber.prototype.addDigit = function(digit) {
        if (testDigit(digit)) {
            this.number.push(digit);
        } else {
            this.number = errors['invalid'];
            return false;
        }

        return this;
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

        bigNumber = new BigNumber(number);

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
        bigNumber = new BigNumber(number);

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
        bigNumber = new BigNumber(number);

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
            a.number[index] = (remainder += (a.number[index] || 0) + (b.number[index] || 0)) % 10;
            remainder = Math.floor(remainder / 10);
        }

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
            a.number[index] += (remainder = (a.number[index] < 0) ? 1 : 0) * 10;
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
        return a.number;
    };

    // this.number * number
    BigNumber.prototype.multiply = function(number) {
        if (typeof number === 'undefined') {
            return this;
        }
        var bigNumber = new BigNumber(number);
        var index;
        var givenNumberIndex;
        var remainder = 0;
        var result = [];

        if (this.isZero() || bigNumber.isZero()) {
            return new BigNumber(0);
        }

        this.sign *= bigNumber.sign;

        // multiply the numbers
        for (index = 0; index < this.number.length; index++) {
            for (remainder = 0, givenNumberIndex = 0; givenNumberIndex < bigNumber.number.length || remainder > 0; givenNumberIndex++) {
                result[index + givenNumberIndex] = (remainder += (result[index + givenNumberIndex] || 0) + this.number[index] * (bigNumber.number[givenNumberIndex] || 0)) % 10;
                remainder = Math.floor(remainder / 10);
            }
        }

        this.number = result;
        return this;
    };

    // this.number / number
    BigNumber.prototype.divide = function(number) {
        if (typeof number === 'undefined') {
            return this;
        }

        var bigNumber = new BigNumber(number);
        var index;
        var length;
        var result = [];
        var rest = new BigNumber();

        // test if one of the numbers is zero
        if (bigNumber.isZero()) {
            this.number = errors['division by zero'];
            return this;
        } else if (this.isZero()) {
            return new BigNumber(0);
        }

        this.sign *= bigNumber.sign;
        bigNumber.sign = 1;

        // Skip division by 1
        if (bigNumber.number.length === 1 && bigNumber.number[0] === 1)
            return this;

        for (index = this.number.length - 1; index >= 0; index--) {
            rest.multiply(10);
            rest.number[0] = this.number[index];
            result[index] = 0;
            while (bigNumber.lte(rest)) {
                result[index]++;
                rest.subtract(bigNumber);
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

        this.rest = rest;
        this.number = result;
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
            return new BigNumber(1);
        }
        if (number === 1) {
            return this;
        }

        bigNumber = new BigNumber(this, true);

        this.number = [1];
        while (number > 0) {
            if (number % 2 === 1) {
                this.multiply(bigNumber);
                number--;
                continue;
            }
            bigNumber.multiply(bigNumber);
            number = Math.floor(number / 2);
        }

        return this;
    };

    // |this.number|
    BigNumber.prototype.abs = function() {
        this.sign = 1;
        return this;
    };

    // Check if this.number is equal to 0
    BigNumber.prototype.isZero = function () {
		for (var i = 0; i < this.number.length; i++)
			if (this.number[i] !== 0) return false;
        
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
            str += this.number[index];
        }

        return (this.sign > 0) ? str : ('-' + str);
    };

    // Use shorcuts for functions names
    BigNumber.prototype.plus = BigNumber.prototype.add;
    BigNumber.prototype.minus = BigNumber.prototype.subtract;
    BigNumber.prototype.div = BigNumber.prototype.divide;
    BigNumber.prototype.mult = BigNumber.prototype.multiply;
    BigNumber.prototype.pow = BigNumber.prototype.power;
    BigNumber.prototype.val = BigNumber.prototype.toString;
})(this);
