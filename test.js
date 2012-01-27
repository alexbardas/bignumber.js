/*
 * Tests written in Mocha Framework
*/
should = require('should')
BigNumber = require('./bignumber')

describe('BigNumber.js', function() {
    describe('#initialization', function() {
        it('should create a big number from a number', function() {
            BigNumber.n(517).val().should.equal("517");
            BigNumber.n(-517).val().should.equal("-517");
            BigNumber.n(BigNumber.n(517)).val().should.equal("517");
        }),
        it('should create a big number from an array', function() {
            BigNumber.n([5,1,7]).val().should.equal("517");
            BigNumber.n(["+",5,1,7]).val().should.equal("517");
            BigNumber.n(["-",5,1,7]).val().should.equal("-517");
        }),
        it('should create positive or negative numbers from string', function() {
            BigNumber.n(517).sign.should.equal(1);
            BigNumber.n(-517).sign.should.equal(-1);
        }),
        it('should create positive or negative numbers from array', function() {
            BigNumber.n(["+",5,1,7]).sign.should.equal(1);
            BigNumber.n(["-",5,1,7]).sign.should.equal(-1);
        }),
        it('should throw error at object creation', function() {
            BigNumber.n("51s7").val().should.equal("Invalid Number");
            BigNumber.n([5, 14, 7, 9]).val().should.equal("Invalid Number");
            BigNumber.n([5, 2, "s", 9]).val().should.equal("Invalid Number");
            BigNumber.n("5s17").val().should.equal("Invalid Number");
            BigNumber.n([5,"s",1,7]).val().should.equal("Invalid Number");
        })
    }),
    describe('#compare()', function() {
        it('should compare 2 numbers', function() {
            BigNumber.n(517).compare().should.equal(0);
            BigNumber.n(517).compare(5170).should.equal(-1);
            BigNumber.n(517).compare(65).should.equal(1);
            BigNumber.n(517).compare(925).should.equal(-1);
            BigNumber.n(29100517).compare(-32500000).should.equal(1);
            BigNumber.n(["-",5,3,7,9,4,6]).compare(985).should.equal(-1);
            BigNumber.n(9773).compare(9773).should.equal(0);
            BigNumber.n(199773).compare(199774).should.equal(-1);
            BigNumber.n(199773).compare(199772).should.equal(1);
            BigNumber.n(1).compare(-2).should.equal(1);
            BigNumber.n(-24).compare(-24).should.equal(0);
            BigNumber.n(-5).compare(-4).should.equal(-1);
            BigNumber.n(-97).compare(-12).should.equal(-1);
            BigNumber.n(-97).compare(-102).should.equal(1);
        }),
        it('should test lt, le, equals, ge, gt', function() {
            BigNumber.n(517).lt(518).should.equal(true);
            BigNumber.n(517).lt(517).should.equal(false);
            BigNumber.n(517).lt(516).should.equal(false);
            BigNumber.n(517).lt(516).should.equal(false);
            BigNumber.n(517).lt(518).should.equal(true);
            BigNumber.n(5).lt(33).should.equal(true);
            BigNumber.n(-5).lt(3).should.equal(true);
            BigNumber.n(-5).lt(-3).should.equal(true);
            BigNumber.n(-5).lt(3).should.equal(true);
            BigNumber.n(-5).lt(-7).should.equal(false);
            BigNumber.n(-5).lt(-5).should.equal(false);
            BigNumber.n(517).le(-517).should.equal(false);
            BigNumber.n(517).le(517).should.equal(true);
            BigNumber.n(517).le(518).should.equal(true);
            BigNumber.n(-5).le(5).should.equal(true);
            BigNumber.n(-5).le(-5).should.equal(true);
            BigNumber.n(2).le(-5).should.equal(false);
            BigNumber.n(517).equals(516).should.equal(false);
            BigNumber.n(-9).equals(-9).should.equal(true);
            BigNumber.n(-9).equals(-91).should.equal(false);
            BigNumber.n(517).equals(517).should.equal(true);
            BigNumber.n(517).ge(517).should.equal(true);
            BigNumber.n(-517).ge(517).should.equal(false);
            BigNumber.n(-517).ge(-517).should.equal(true);
            BigNumber.n(32).ge(17).should.equal(true);
            BigNumber.n(32).ge(33).should.equal(false);
        })
    }),
    describe('#plus()', function() {
        it('should add 2 positive numbers', function() {
            BigNumber.n(1).plus(0).val().should.equal("1");
            BigNumber.n(1).plus(1).val().should.equal("2");
            BigNumber.n(8).plus(8).val().should.equal("16");
            BigNumber.n(27).plus(73).val().should.equal("100");
            BigNumber.n(99).plus(10001).val().should.equal("10100");
            BigNumber.n(517).plus().val().should.equal("517");
            BigNumber.n(2).plus(BigNumber.n(5999)).val().should.equal("6001");
            BigNumber.n(517).plus(0).val().should.equal("517");
            BigNumber.n(517).plus(5).val().should.equal("522");
            BigNumber.n(517).plus(925).val().should.equal("1442");
            BigNumber.n(29100517).plus(925).val().should.equal("29101442");
            BigNumber.n([5,3,7,9,4,6]).plus(985).val().should.equal("538931");
            BigNumber.n(9773).plus(227).val().should.equal("10000");
            BigNumber.n(199773).plus(227).val().should.equal("200000");
        }),
        it('should add 2 numbers', function() {
            BigNumber.n(1).plus(-1).val().should.equal("0");
            BigNumber.n(1).plus(-7).val().should.equal("-6");
            BigNumber.n(1).plus(-100).val().should.equal("-99");
            BigNumber.n(-121).plus(-1).val().should.equal("-122");
            BigNumber.n(-121).plus(22).val().should.equal("-99");
            BigNumber.n(-121).plus(1105).val().should.equal("984");
            BigNumber.n(-5).plus(-99).val().should.equal("-104");
        })
    }),
    describe('#minus()', function() {
        it('should substract 2 positive numbers obtaining a positive number', function() {
            BigNumber.n(5).minus().val().should.equal("5");
            BigNumber.n(5).minus(3).val().should.equal("2");
            BigNumber.n(19).minus(17).val().should.equal("2");
            BigNumber.n(57).minus(55).val().should.equal("2");
            BigNumber.n(10000).minus(9999).val().should.equal("1");
            BigNumber.n(10000).minus(10000).val().should.equal("0");
            BigNumber.n(10000).minus(-10000).val().should.equal("20000");
            BigNumber.n(10000).minus(999).val().should.equal("9001");
            BigNumber.n(10000).minus(1).val().should.equal("9999");
            BigNumber.n(2934).minus(999).val().should.equal("1935");
            BigNumber.n(19).minus(0).val().should.equal("19");
            BigNumber.n(10000).minus(227).val().should.equal("9773");
            BigNumber.n(200000).minus(227).val().should.equal("199773");
        }),
        it('should substract 2 positive numbers obtaining a negative number', function() {
            BigNumber.n(5).minus(33).val().should.equal("-28");
            BigNumber.n(5).minus(104).val().should.equal("-99");
            BigNumber.n(0).minus(101).val().should.equal("-101");
        }),
        it('should substract 2 numbers', function() {
            BigNumber.n(55).minus(57).val().should.equal("-2");
            BigNumber.n(5).minus(-33).val().should.equal("38");
            BigNumber.n(-5).minus(98).val().should.equal("-103");
            BigNumber.n(-33).minus(-5).val().should.equal("-28");
            BigNumber.n(-33).minus(-33).val().should.equal("0");
            BigNumber.n(-33).minus(-32).val().should.equal("-1");
            BigNumber.n(-33).minus(-34).val().should.equal("1");
            BigNumber.n(-5).minus(-33).val().should.equal("28");
            BigNumber.n(-5).minus(-3).val().should.equal("-2");
            BigNumber.n(-101).minus(-1010).val().should.equal("909");
            BigNumber.n(-5).minus(99).val().should.equal("-104");
        })
    }),
    describe('#multiply()', function() {
        it('should multiply 2 positive numbers', function() {
            BigNumber.n(5).multiply(0).val().should.equal("0");
            BigNumber.n(0).multiply(5).val().should.equal("0");
            BigNumber.n(243).multiply(1).val().should.equal("243");
            BigNumber.n(243).multiply(2).val().should.equal("486");
            BigNumber.n(5).multiply(2).val().should.equal("10");
            BigNumber.n(5).multiply(100).val().should.equal("500");
            BigNumber.n(100).multiply(5).val().should.equal("500");
            BigNumber.n(54325).multiply(543).val().should.equal("29498475");
            BigNumber.n(1).multiply(100000).val().should.equal("100000");
        }),
        it('should multiply 2 positive numbers', function() {
            BigNumber.n(-5).multiply(0).val().should.equal("0");
            BigNumber.n(-1).multiply(-1).val().should.equal("1");
            BigNumber.n(5).multiply(-1).val().should.equal("-5");
            BigNumber.n(-5).multiply(20).val().should.equal("-100");
            BigNumber.n(17).multiply(-12).val().should.equal("-204");
        })
    }),
    describe('#divide()', function() {
        it('should divide 2 positive numbers', function() {
            BigNumber.n(5).divide(0).val().should.equal("Invalid Number - Division By Zero");
            BigNumber.n(5).divide(1).val().should.equal("5");
            BigNumber.n(99).divide(5).val().should.equal("19");
            BigNumber.n(7321).divide(153).val().should.equal("47");
            BigNumber.n(919).divide(153).val().should.equal("6");
        }),
        it('should divide 2 numbers', function() {
            BigNumber.n(-5).divide(1).val().should.equal("-5");
            BigNumber.n(-5).divide(-1).val().should.equal("5");
            BigNumber.n(5).divide(-1).val().should.equal("-5");
            BigNumber.n(9).divide(2).val().should.equal("4");
            BigNumber.n(17).divide(5).val().should.equal("3");
            BigNumber.n(10).divide(2).val().should.equal("5");
            BigNumber.n(-50).divide(-10).val().should.equal("5");
            BigNumber.n(-50).divide(39).val().should.equal("-1");
            BigNumber.n(99).divide(5).val().should.equal("19");
            BigNumber.n(100).divide(5).val().should.equal("20");
            BigNumber.n(101).divide(5).val().should.equal("20");
            BigNumber.n(104).divide(5).val().should.equal("20");
            BigNumber.n(-17).divide(-9).val().should.equal("1");
            BigNumber.n(-17).divide(3).val().should.equal("-5");
            BigNumber.n(99).divide(-17).val().should.equal("-5");
        }),
        it('should return the division rest', function() {
             BigNumber.n(7321).divide(153).rest.should.equal("130");
             BigNumber.n(3).divide(2).rest.should.equal("1");
             BigNumber.n(9).divide(3).rest.should.equal("0");
             BigNumber.n(93).divide(21).rest.should.equal("9");
             BigNumber.n(100).divide(53).rest.should.equal("47");
        })
    }),
    describe('#pow()', function() {
        it('should raise a a number to a positive integer power', function() {
            BigNumber.n(5).pow(0).val().should.equal("1");
            BigNumber.n(5).pow(1).val().should.equal("5");
            BigNumber.n(5).pow(4).val().should.equal("625");
            BigNumber.n(2).pow(2).val().should.equal("4");
            BigNumber.n(2).pow(3).val().should.equal("8");
            BigNumber.n(2).pow(4).val().should.equal("16");
            BigNumber.n(2).pow(5).val().should.equal("32");
            BigNumber.n(2).pow(6).val().should.equal("64");
            BigNumber.n(2).pow(10).val().should.equal("1024");
            BigNumber.n(2).pow(32).val().should.equal("4294967296");
            BigNumber.n(999999).pow(30).val().should.equal("999970000434995940027404857494593772964205852910692880044960372786493105240295422519882625422555240236493170372730045000692855852922964200593774857494027404995940000434999970000001");
        })
    }),
    describe('#isZero()', function() {
        it('should test if the big number is zero', function() {
            BigNumber.n(517).isZero().should.equal(false);
            BigNumber.n(0).isZero().should.equal(true);
            BigNumber.n([0]).isZero().should.equal(true);
        })
    }),
    describe('#abs()', function() {
        it('should return absolute value of number', function() {
            BigNumber.n(517).abs().val().should.equal("517");
            BigNumber.n(-517).abs().val().should.equal("517");
            BigNumber.abs(517).val().should.equal("517");
            BigNumber.abs(-517).val().should.equal("517");
            BigNumber.abs(BigNumber.n(-517)).val().should.equal("517");
        })
    }),
    describe('chainable tests', function() {
        it('should test random chainable operations', function() {
            var a = 1970485694, b = 153487287;
            BigNumber.n(a).add(1).multiply(BigNumber.n(b).add(1)).multiply(BigNumber.n(a).add(2).add(BigNumber.n(b))).divide(2).val().should.equal("321191979129581791629406140");
            BigNumber.n(5).plus(97).minus(53).plus(434).multiply(5435423).add(321453).multiply(21).div(2).val().should.equal("27569123001");
        })
    })
})
