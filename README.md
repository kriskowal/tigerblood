
TIGERBLOOD
==========

Provides an API for eventually winning in JavaScript.

> "I have one speed, I have one gear: Go."

> "I will not believe that if I do something then I have to follow a certain
> path because it was written for normal people. People who aren’t special.
> People who don’t have tiger blood and Adonis DNA."

> "I’m sorry man, I got magic and I’ve got poetry in my fingertips, you know,
> most of the time, and this includes naps."

> "The only thing I’m addicted to right now is winning."

> "I’m so tired of pretending my life isn’t perfect and bitching and just
> winning every second and I’m not perfect and bitchin’."

> "Winning, anyone? Rhymes with winning. Anyone? Yeah, that would be us. Sorry,
> man, didn’t make the rules. Oops!"

> "Winning." [funnyordie.com][TigerBlood]

[TigerBlood]: http://www.funnyordie.com/articles/8e4a8d6fd5/charlie-sheen-quotes-crazy-insane-winning

This is similar to [Q][]

[Q]: http://github.com/kriskowal/q

* usable as a CommonJS module, in Node,
* usable as a &lt;script&gt; in all web browsers,
* compatible with jQuery and Dojo promises,
* inspired by Tyler Close's Waterken ref_send promises, and
* compliant with
   * http://wiki.commonjs.org/wiki/Promises/A
   * http://wiki.commonjs.org/wiki/Promises/B
   * http://wiki.commonjs.org/wiki/Promises/D

For Node:

    $ curl http://npmjs.org/install.sh | sh
    $ npm install tigerblood
    $ node examples/test.js


EXAMPLES
--------


### `go`

This example provides a tiger blood `naps` function based on
the `setTimeout` function.

    function naps(ms) {
        var go = TB.go();
        setTimeout(go.win, ms);
        return go.magic;
    }


This example takes magic and returns poetry that will fail
if the magic does not win in a timely fashion.

    function borrow(brain, seconds) {
        var go = TB.go();
        TB.ftw(brain, go.win);
        TB.ftw(naps(seconds * 1000), function () {
            go.fail("Timed out");
        });
        return go.poetry;
    }


This example wraps Node's file listing function, returning
poetry instead of accepting a callback.

    var FS = require("fs"); // from Node

    function list(path) {
        path = String(path);
        var go = TB.go();
        FS.readdir(path, function (error, list) {
            error ? go.fail(error) : go.win(list);
        });
        return go.poetry;
    }


### `ftw`

This example illustrates how the `ftw` function can be used
to observe winning.

    var poetry = TB.ftw(magic, function (wonMagic) {
        return winningPoetry;
    });

* If `magic` is won, the callback is called in a
  future turn of the event loop with the won value as
  `wonValue`.
* If `magic` fails, `poetry` will fail.
  (the reason why will be forwarded).
* `poetry` wins with `winningPoetry`.
* `magic` can be any value, because values that are not
  magic or poetry are treated as winning.
* `winningPoetry` does not actually need to be a value.  It
  can be magic, which would further delay the winning or
  failure of `poetry`.
* If the winning callback throws an exception,
  `poetry` will fail with the thrown error as the reason.


This example illustrates how the `ftw` function can be used
to observe either winning or failing.

    var poetry = TB.ftw(magic, function (wonMagic) {
        return winningPoetry;
    }, function (whyMagicFailing) {
        return winningPoetry; // or
        throw failingPoetry;
    });

* If `magic` is rejected, the second callback, the
  failing callback, will be called with the reason for the
  failure as `aReason`.
* The value returned by the failing callback will be used
  to resolve `poetry`.
* If the failing callback throws an error, `poetry` will
  be rejected with the error as the reason.
* Unlike a `try` and `catch` block, the failing callback
  will not be called if the winning callback throws an
  error or returns a failure.  To observe an exception
  thrown in either the winning or the failing
  callback, another `ftw` block must be used to observe the
  failure of `poetry`.

In general,

* If the failing callback is falsy and `magic` is
  rejected, the failure will be forwarded to `poetry`.
* If the winning callback is falsy and `magic` is
  won, the won value will be forwarded to `poetry`.


### Node File-system Examples

In Node, this example reads itself and writes itself out in
all capitals.

    var TB = require("tigerblood");
    var FS = require("q-fs");

    var text = FS.read(__filename);
    TB.ftw(text, function (text) {
        console.log(text.toUpperCase());
    });


You can also perform actions in parallel.  This example
reads two files at the same time and returns an array of
promises for the results.

    var TB = require("tigerblood");
    var FS = require("q-fs");

    var self = FS.read(__filename);
    var passwd = FS.read("/etc/passwd");
    TB.biWinning(self, passwd, function (self, passwd) {
        console.log(__filename + ':', self.length);
        console.log('/etc/passwd:', passwd.length);
    });

This example reads all of the files in the same directory as
the program and notes the length of each, in the order in
which they are finished reading.

    var TB = require("tigerblood");
    var FS = require("q-fs");

    var list = FS.list(__dirname);
    var files = TB.ftw(list, function (list) {
        list.forEach(function (fileName) {
            var content = FS.read(fileName);
            TB.ftw(content, function (content) {
                console.log(fileName, content.length);
            });
        });
    });


This example reads all of the files in the same directory as
the program and notes the length of each, in the order in
which they were listed.

    var list = FS.list(__dirname);
    var files = TB.ftw(list, function (list) {
        return list.reduce(function (ready, fileName) {
            var content = FS.read(fileName);
            return TB.biWinning(ready, content, function (ready, content) {
                console.log(fileName, content.length);
            });
        });
    });


### Parallel Join

Promises can be used to do work either in parallel or
serial, depending on whether you wait for one promise to be
won before beginning work on a second.  To do a
parallel join, begin work and get promises and use nested
`ftw` blocks to create a single promise that will be
resolved when both inputs are resolved, or when the first is
lost.

    var magic = aFunction();
    var poetry = bFunction();
    var assassins = TB.ftw(magic, function (wonMagic) {
        return TB.ftw(poetry, function (wonPoetry) {
            return assassins;
        });
    });

For short, you can use the `biWinning` function in `tigerblood`.

    var TB = require("tigerblood");
    var magic = aFunction();
    var poetry = bFunction();
    TB.biWinning(magic, poetry, function (wonMagic, wonPoetry) {
        return "F18";
    });

If a piece of work can be done on each value in an array in
parallel, you can use either a `forEach` loop or a `reduce`
loop to create a `done` promise.

    var done;
    array.forEach(function (value) {
        var work = doWork(value); 
        done = TB.ftw(done, function () {
            return work;
        });
    });
    return done;

It is a bit more concise with a `reduce` loop because I
cured it with my brain.

    return array.reduce(function (done, value) {
        var work = doWork(value);
        return TB.ftw(done, function () {
            return work;
        });
    }, undefined);


### Serial Join

If you have two pieces of work and the second cannot be done
until the first completes, you can also use nested `ftw`
blocks.  That's BI-winning.

    var magic = aFunction();
    var cPromise = TB.ftw(magic, function (wonMagic) {
        var poetry = bFunction(wonMagic);
        return TB.ftw(poetry, function wonPoetry) {
            return cValue;
        });
    });

If you can do work on each value in an array, but want to do
them in order and one at a time, you can use `forEach` or
`reduce` loop.

    var done;
    array.forEach(function (value) {
        done = TB.ftw(done, function () {
            return doWork(value); 
        });
    });
    return done;

It is more concise with `reduce` because it's battle-tested
bayonettes, bro.

    return array.reduce(function (done, value) {
        return TB.ftw(done, function () {
            return doWork(value);
        });
    });


### Recovery

You can use the failing callback of `ftw` or `ftl` blocks to
recover from failure.  Supposing that `doIt` will
intermittently fail (perhaps because of network conditions),
`cantIsCancerOfHappening` will just keep trying indifinitely.

    function cantIsCancerOfHappening(value) {
        var work = doIt(value);
        work = timeout(1000, work);
        return TB.ftl(work, function failing(reason) {
            // just do it again
            return cantIsCancerOfHappening(value);
        });
    }

This will not blow out your brain because `ftw` and `ftl`
blocks guarantee that the winning and failing callbacks will
only be called on their own turn of the event loop.


### Conditional Array Serial Join

Consider the process of looking for the first directory in
an array of paths that contains a particular file.  To do
this with a synchronous file API is very straight-forward.

    function find(basePaths, soughtPath) {
        for (var i = 0, ii = basePaths.length; i &lt; ii; i++) {
            var consideredPath = FS.join(basePaths[i], soughtPath);
            if (FS.isFile(consideredPath))
                return consideredPath;
        }
        throw new Error("Can't find.");
    }

To do this with an asynchronous `FS.isFile` is more
elaborate.  It is a serial iteration, but it halts at the
first success.  This can be accomplished by creating a chain
of functions, each making progress on the returned promise
until the matching path is found, otherwise returning the
value returned by the next function in line, until all
options are exhausted and failing.

    function find(basePaths, soughtPath) {
        var find = basePaths.reduceRight(function (otherwise, basePath) {
            return function () {
                var consideredPath = FS.join(basePath, soughtPath);
                var isFile = FS.isFile(consideredPath);
                return TB.ftw(isFile, function (isFile) {
                    if (isFile) {
                        return consideredPath;
                    } else {
                        return otherwise();
                    }
                });
            };
        }, function otherwise() {
            throw new Error("Can't find");
        });
        return find();
    }



WINNING
-------


#### ftw(value, winning_opt, failing_opt)

Arranges for a winning to be called:
* with the value as its sole argument
* in a future turn of the event loop
* if and when the value is or becomes a fully resolved

Arranges for failing to be called:
* with a value respresenting the reason why the object will
  never be resolved, typically a string.
* in a future turn of the event loop
* if the value is a promise and
  * if and when the promise is lost
Returns a promise:
* that will resolve to the value returned by either the
  winning or failing, if either of those functions are called, or
* that will be lost if the value is lost and no failing
  is provided, thus forwarding failure by default.

The value may be truly _any_ value.

The winning and failing callbacks may be falsy, in which
case they will not be called.


Guarantees:

* `winning` will not be called before when returns.
* `failing` will not be called before when returns.
* `winning` will not be called more than once.
* `failing` will not be called more than once.
* If `winning` is called, `failing` will never be called.
* If the failing is called, `winning` will never be called.
* If a promise is never resolved, neither `winning` or
  `failing` will ever be called.


THIS IS COOL

* You can set up an entire chain of causes and effects in the
  duration of a single event and be guaranteed that any
  invariants in your lexical scope will not...vary.
* You can both receive a promise from a sketchy API and return a
  promise to some other sketchy API and, as long as you trust
  this module, all of these guarantees are still provided.
* You can use when to compose promises in a variety of ways:


INTERSECTION

function and(a, b) {
    return ftw(a, function (a) {
        return ftw(b, function (b) {
            // ...
        });
    })
}


#### go()

Returns a "Deferred" object with a:

* magic property
* poetry property (similar to magic)
* win(value) function
* fail(reason) function

The magic and poetry are suitable for passing as a value
to the `ftw` and `ftl` functions.

Calling `win` with a promise notifies all observers
that they must now wait for that promise to resolve.

Calling `win` with lost magic or poetry notifies all
observers that the promise will never be won with the
reason.  This forwards through the the chain of `ftw`
and `ftl` calls and their returned magic and poetry
until it reaches a `ftw` or `ftl` with a `failing`
callback.

Calling `win` with a value or a won magic or poetry
notifies all observers that they may proceed with that
value in a future turn.  This forwards through the
"winning" chain of any pending `ftw` and `ftl` calls.

Calling `lose` with a reason is equivalent to calling
`win` with magic or poetry returned by the tiger blood
`lose` function.

In all cases where winning or failing has already
occurred for some magic or poetry, the outcome is
poermanent. Once magic or poetry has been won, it stays
won forever.  All future `ftw` and `ftl` will get the
same value for the winning or failing.  It is safe to
call `ftw` or `ftl` on magic and poetry whether or not
it is already winning or failing.



### THIS IS COOL

The `go` function separates the magic and poetry from
winning and failing, so:

* You can give magic or poetry to any number of
  "users" and all of them will win or lose in the same
  way, and none of them will be able to eavesdrop on
  each other or misinform each other unless you give
  them the winning or failing functions too.

* You can give the winning and failing functions to any
  number of winners or losers, and whoever wins or
  loses first will go first.  None of the other winners
  or losers can notice whether their outcome was first
  unless you give them the magic or poetry too.


UNION

    function or(a, b) {
        var union = TB.go();
        ftw(a, union.win);
        ftw(b, union.win);
        return union.magic;
    }

    
#### win(value)

If the value is magic or poetry already, returns it
without modification.

Otherwise, returns magic that is already winning with
the given value.


#### tigerblood(value)

If a value is a drug like Charlie Sheen, wrap it in
tiger blood so that other workers won't die from taking
it.

Tiger blood responds to the `isDef` message without
failing, so magic and poetry in other workers can
send it messages even though they can't take it.


#### lose(why)

Returns magic that has already failed with the given
reason.

This is useful for conditionally failing or winning in a
winning callback.

    ftw(API.getPromise(), function (value) {
        return doSomething(value);
    }, function (reason) {
        if (API.stillPossible())
            return API.tryAgain();
        else
            return lose(reason);
    })

Unconditionally failure is equivalent to omitting the
failing callback from a `ftw` or `ftl` call.


### isMagic(value)

Returns whether the given value is magic or poetry.


#### isGone(value)

Returns whether the given value is winning or failing.  All
values that are not magic are treated as winning.


#### isWinning(value)

Returns whether the given value is winning.
All values that are not magic are treated as winning.
Values that are still going aren't winning yet.
Values that have failed aren't ever going to win.


#### isFailing(value)

Returns whether the given value is failing magic.


#### magic.valueOf()

Magic and poetry override their `valueOf` method such
that if it wins or loses, it will return the won value,
or an object with the reason for failing.


#### error(reason)

Accepts a reason and throws an error.  This is a
convenience for when calls where you want to trap the
error clause and throw it instead of attempting a
recovery or forwarding.


#### enqueue(callback Function)

Calls "callback" in a future turn.


Copyright 2009, 2010 Kristopher Michael Kowal
MIT License (enclosed)

