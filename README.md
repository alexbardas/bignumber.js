## BigNumber.js

[![Build Status](https://secure.travis-ci.org/alexbardas/bignumber.js.png)](http://travis-ci.org/alexbardas/bignumber.js)

BigNumber.js is a light javascript library for node.js and the browser. It supports arithmetic operations on Big Integers.

It is build with performance in mind, uses the fastest algorithms and supports all basic arithmetic operations
(+, -, *, /, %, ^, abs). Works with both positive and negative big integers.

: (http://alexbardas.github.io/bignumber.js/)

Install:
npm install

Test:
npm test

Usage:

* in node:
```javascript
	var BigNumber = require('big-number');

    BigNumber(5).plus(97).minus(53).plus(434).multiply(5435423).add(321453).multiply(21).div(2).pow(2);
    // 760056543044267246001
```

* in the browser:
```javascript
	<script src ="big-number.js"></script>

    n(5).plus(97).minus(53).plus(434).multiply(5435423).add(321453).multiply(21).div(2).pow(2);
    // 760056543044267246001
```

### API

Supported methods: `add/plus`, `minus/subtract`, `multiply/mult`, `divide/div`, `power/pow`, `mod`, `equals`,
`lt`, `lte`, `gt`, `gte`, `isZero`, `abs`

###### Addition
```javascript
	BigNumber(2).plus(10); // or
	BigNumber(2).add(10);
```

###### Subtraction
```javascript
	BigNumber(2).minus(10); // or
	BigNumber(2).subtract(10);
```

###### Multiplication
```javascript
	BigNumber(2).multiply(10); // or
	BigNumber(2).mult(10);
```

###### Division
```javascript
	BigNumber(2).divide(10); // or
	BigNumber(2).div(10);
```

###### Modulo
```javascript
	BigNumber(53).mod(14);
```

###### Power
```javascript
	BigNumber(2).power(10); // or
	BigNumber(2).pow(10);
```
