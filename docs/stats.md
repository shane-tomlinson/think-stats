Stats()
-------
compare()
---------
Numerically compare a and b. Can be overridden
by passing in `compare` option to constructor.

< 0 if a < b
> 0 if a > b


**Returns**

0 if a === b

destroy()
---------
Call when no longer needed. Free references.



push()
------
Add a value or an array of values



raw()
-----
Retrieve raw data. Only available if `store_data` option is passed
in options to constructor.



**Returns**

Array of values

sorted()
--------
Retrieve sorted values.



**Returns**

Array of values

hist()
------
Retrieve a histogram of the data.

stats.push([1,1,3]);
var hist = stats.hist();
hist[1] === 2;
hist[3] === 1;

Keys are unique values added via push.
Values are count


**Returns**

Object

frequency()
-----------
Retrieve the number of times a value has been added.



**Returns**

Number

unique()
--------
Retrieve a list of unique values.



**Returns**

Array of values

pmf()
-----
Calculate the Probability Mass Function of a set of values.



distribution()
--------------
bucket()
--------
Calculate a set of buckets from the data.

`count` - number of items in bucket
`min` - bucket lower boundary
`max` - bucket upper boundary
`bucket` - bucket midpoint


**Returns**

Array of buckets. Each bucket contains:

sortedIndexOf()
---------------
amean()
-------
Calculate the arithmetic mean.



**Returns**

Number

median()
--------
Calculate the median.



**Returns**

Number

totalSpread()
-------------
Calculate the total spread.



**Returns**

Number

variance()
----------
Calculate the variance.



**Returns**

Number

sampleVariance()
----------------
Calculate the sample variance.



**Returns**

Number

range()
-------
Retreive the range of values.



**Returns**

Array - [min, max]

stddev()
--------
Calculate the standard deviation.



**Returns**

Number

percentileRank()
----------------
Calculate the percentile rank of a value.

If value is in list, percentile of where item is in list.
If item is not in list, percentile of where item would be.


**Returns**

Number

percentile()
------------
Retreive the value at the specified percentile.



**Returns**

Number

percentileIndex()
-----------------
Retreive the index of the specified percentile.



**Returns**

Number

cdf()
-----
Calculate the Cumulative Distribution Function of a value.

Object if no value given. Object contains the cdf of all values between (and including) the endpoints of the sorted list.


**Returns**

Number if value is given.

ccdf()
------
Calculate the Complementary Cumulative Distribution Function of a value.

Object if no value given. Object contains the ccdf of all values between (and including) the endpoints of the sorted list.


**Returns**

Number if value is given.

