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

    /**
     * The base to which we hold the big number
     *
     * This must be set to no more than the square root of the maximum native integer that JS can represent accurately
     * It can be any number from base 2 up this maximum
     * The larger the number the more efficient the big number arithmetic will be
     * However, for division, the choice of number also has a significant impact. Infact for maximum efficiency
     * the base should have as many common factors as possible. This is maximised by having the base to be a power
     * of 2. JS typically holds integers accurately to at least up to 2^50 so a value of 2^25 would be the optimal
     * base to use. Setting the base to a prime number will have the worst effect on performance so far as division
     * is concerned.
     *
     * The original version was hard coded with a base of 10. If we set our base to this now it will have similar
     * performance, though the division routine has been optimised such that even with this base it could be up
     * to twice as fast.
     *
     * Even with the base set to 2 (i.e. the numbers are held in binary!) the arithmetic is surprisingly fast.
     * But nothing like as fast as with a base of 2^25
     *
     * @type {number}
     */
    var base=Math.pow(2,25);

    /*
     * Factorise the base - these then become the most efficient way to segment the division process
     * Essentially, the most efficient base is the one with the most factors
     * Which means that a base of a power of 2 is the best choice
     *
     * This is somewhat over the top, but is a good exercise to ensure that division is performed
     * with maximum efficiency whatever the base :-)
     */
    var factors=(function() {
        var result=[];
        var primes=[];
        var factorisingbase=base;
        var lastprime=2;

        // Check number for prime (assumes previous primes have been found)
        function isprime(prime) {
            // Only need to test divisors so far as the square root of the number under test
            for (var i=0;i<primes.length && primes[i]<Math.sqrt(prime);i++) {
                if (prime%primes[i]==0) return false
            }
            return true;
        }

        while (factorisingbase>1) {
            if (factorisingbase%lastprime==0) {
                result.push(lastprime);
                factorisingbase=Math.floor(factorisingbase/lastprime);
            }
            else {
                do {
                    lastprime=(lastprime==2 ? 3 : lastprime+2);
                } while (!isprime(lastprime));
                primes.push(lastprime);
            }
        }
        return result;
    })();

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


    /*
     * Constructor function which creates a new BigNumber object from an integer, a string, an array or other BigNumber object
     *
     * IMPORTANT NOTE: Once we allow for any base, the routines to initiate a number from a string of decimal numbers
     * and to output a number in decimal form (.val()) now use big number arithmetic. This has potential to get
     * us into trouble if we are to build numbers from within internal routines that are already manipulating numbers. It can cause
     * a stack overflow. This situation is now avoided by optimising the initialisation to handle more specifically
     * (and efficiently) numbers constructed from existing BigNumber objects or native numbers.
     */
    function BigNumber(initialNumber) {

        if (!(this instanceof BigNumber)) {
            return new BigNumber(initialNumber);
        }

        this.number = [];
        this.sign = 1;
        this.rest = 0;

        // No parameter initialises the number to zero
        if (!initialNumber) {
            this.number = [0];
            return;
        }

        // A big number parameter initialises this number to the same value
        if (initialNumber instanceof BigNumber) {
            this.number = initialNumber.number.slice();
            this.sign = initialNumber.sign;
            this.rest = initialNumber.rest;
            return;
        }

        // A native number makes for a fast initialisation of the number
        if (typeof initialNumber=="number") {
            this.sign=initialNumber<0 ? -1 : 1;
            initialNumber=Math.abs(initialNumber);
            while (initialNumber>0) {
                this.number.push(initialNumber%base);
                initialNumber=Math.floor(initialNumber/base);
            }
            return;
        }

        // Otherwise, now create the number from a String or Array
        var index;
        var multipleoftens=BigNumber(1);
        var ten=BigNumber(10);

        // Method removed from public API and made local within this context
        function addDigit(digit) {
            if (testDigit(digit)) {
                this.add(BigNumber(digit).mult(multipleoftens));
                multipleoftens.mult(ten);
                return true;
            }
            return false;
        }

        // The initial number can be an array or object
        // e.g. array     : [3,2,1], ['+',3,2,1], ['-',3,2,1]
        //      number    : 312
        //      string    : '321', '+321', -321'
        //      BigNumber : BigNumber(321)
        // Every character except the first must be a digit
        var sign=1;
        if (isArray(initialNumber)) {
            if (initialNumber.length && initialNumber[0] === '-' || initialNumber[0] === '+') {
                sign = initialNumber[0] === '+' ? 1 : -1;
                initialNumber.shift(0);
            }
            for (index = initialNumber.length - 1; index >= 0; index--) {
                if (!addDigit.call(this,initialNumber[index])) {
                    this.number = errors['invalid'];
                    return;
                }
            }
        } else {
            initialNumber = initialNumber.toString();
            if (initialNumber.charAt(0) === '-' || initialNumber.charAt(0) === '+') {
                sign = initialNumber.charAt(0) === '+' ? 1 : -1;
                initialNumber = initialNumber.substring(1);
            }

            for (index = initialNumber.length - 1; index >= 0; index--) {
                if (!addDigit.call(this,parseInt(initialNumber.charAt(index), 10))) {
                    this.number = errors['invalid'];
                    return;
                }
            }
        }
        this.sign=sign;
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
        var nativebigNumber=bigNumber.number.length==1 ? bigNumber.number[0] : 0;
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
                // Segment the division by the factors of the base
                var divisor=base;
                for (var i=0;i<factors.length;i++) {
                    divisor/=factors[i];
                    rest.multiply(factors[i]);
                    rest.add(Math.floor(digit/divisor));
                    digit=digit%divisor;
                    while (bigNumber.lte(rest)) {
                        result[index]+=divisor;
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

    // Gets a single decimal digit value of the number assuming it is less than 10 (used by the toString() function)
    BigNumber.prototype._singleDigit=function() {
        var digit=0;
        var multiplier=1;
        for (var i=0;i<this.number.length && digit<10;i++) {
            digit+=(multiplier*this.number[i]);
            multiplier*=base;
        }
        if (digit<10) return digit.toString();
        return "";
    };

    // this.number.toString()
    // Due to the number not necessarily being in base 10, we need to use BigNumber division
    // to extract the decimal digits
    BigNumber.prototype.toString = function() {
        var index;
        var str = '';
        if (typeof this.number === "string") {
            return this.number;
        }

        var ten=BigNumber(10);
        var clone=BigNumber(this).abs();
        while(!clone.isZero()) {
            str=clone.div(ten).rest._singleDigit()+str;
        }
        if (str.length==0) str="0";
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
