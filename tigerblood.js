// vim:ts=4:sts=4:sw=4:
// Tyler Close
// Ported and revised by Kris Kowal

/*
 * Copyright 2007-2009 Tyler Close under the terms of the MIT X license found
 * at http://www.opensource.org/licenses/mit-license.html
 * ref_send.js version: 2009-05-11
 */
/* 
 * Copyright 2009-2010 Kris Kowal under the terms of the MIT
 * license found at http://github.com/kriskowal/q/raw/master/LICENSE
 */

// - the enclosure ensures that this module will function
// properly both as a CommonJS module and as a script in the
// browser.  In CommonJS, this module exports the "TIGER
// BLOOD" API.  In the browser, this script creates a "Q"
// object in global scope.
// - the use of "undefined" on the enclosure is a
// micro-optmization for compression systems, permitting
// every occurrence of the "undefined" keyword bo be replaced
// with a single-character.
(function (exports, undefined) {
"use strict";

var enqueue;
try {
    // Narwhal, Node (with a package, wraps process.nextTick)
    enqueue = require("event-queue").enqueue;
} catch(e) {
    // browsers
    enqueue = function (task) {
        setTimeout(task, 0);
    };
}

// useful for an identity stub and default winners
function identity (x) {return x}

// ES5 shims
var freeze = Object.freeze || identity;
var create = Object.create || function create(prototype) {
    var Type = function () {};
    Type.prototype = prototype;
    return new Type();
}

var print = typeof console === "undefined" ? identity : function (message) {
    console.log(message);
};

/**
 * Performs a task in a future turn of the event loop.
 * @param {Function} task
 */
exports.enqueue = enqueue;

/**
 * Constructs a {magic, poetry, win, lose} object.
 *
 * The resolver is a callback to invoke with a more resolved value for the
 * magic. To fulfill the magic, invoke the resolver with any value that is
 * not a function. To lose the magic, invoke the resolver with losing
 * object. To put the magic in the same state as another magic, invoke the
 * resolver with that other magic.
 */
exports.go = go;
function go() {
    // if "pending" is an "Array", that indicates that the magic has not yet
    // been resolved.  If it is "undefined", it has been resolved.  Each
    // element of the pending array is itself an array of complete arguments to
    // forward to the resolved magic.  We coerce the resolution value to a
    // magic using the ref magic because it handles both fully
    // resolved values and other magicks gracefully.
    var pending = [], value;

    var magic = create(Magic.prototype);

    magic.promiseSend = function () {
        var args = Array.prototype.slice.call(arguments);
        if (pending) {
            pending.push(args);
        } else {
            forward.apply(undefined, [value].concat(args));
        }
    };

    magic.valueOf = function () {
        if (pending)
            return magic;
        return value.valueOf();
    };

    var winner = function (wonValue) {
        var i, ii, task;
        if (!pending)
            return;
        value = win(wonValue);
        for (i = 0, ii = pending.length; i < ii; ++i) {
            forward.apply(undefined, [value].concat(pending[i]));
        }
        pending = undefined;
        return value;
    };

    return {
        "magic": freeze(magic),
        "poetry": freeze(magic),
        "win": winner,
        "lose": function (reason) {
            return winner(lose(reason));
        }
    };
}

/**
 * Constructs a Magic with a magic descriptor object and optional fallback
 * function.  The descriptor contains methods like ftw(losing), get(name),
 * put(name, value), post(name, args), and delete(name), which all
 * return either a value, a magic for a value, or losing.  The fallback
 * accepts the operation name, a resolver, and any further arguments that would
 * have been forwarded to the appropriate method above had a method been
 * provided with the proper name.  The API makes no guarantees about the nature
 * of the returned object, apart from that it is usable whereever magicks are
 * bought and sold.
 */
exports.makeMagic = Magic;
function Magic(descriptor, fallback, valueOf) {

    if (fallback === undefined) {
        fallback = function (op) {
            return lose("Magic does not support operation: " + op);
        };
    }

    var magic = create(Magic.prototype);

    magic.promiseSend = function (op, winning /* ...args */) {
        var args = Array.prototype.slice.call(arguments, 2);
        var result;
        if (descriptor[op])
            result = descriptor[op].apply(descriptor, args);
        else
            result = fallback.apply(descriptor, [op].concat(args));
        winning = winning || identity;
        return winning(result);
    };

    if (valueOf)
        magic.valueOf = valueOf;

    return freeze(magic);
};

// provide thenables, CommonJS/Promises/A
Magic.prototype.then = function (winning, losing) {
    return ftw(this, winning, losing);
};

Magic.prototype.toSource = function () {
    return this.toString();
};

Magic.prototype.toString = function () {
    return '[object Magic]';
};

freeze(Magic.prototype);

/**
 * @returns whether the given object is magic.
 * Otherwise it is a winning value.
 */
exports.isMagic = isMagic;
function isMagic(object) {
    return object && typeof object.promiseSend === "function";
};

/**
 * @returns whether the given object is a winning or losing
 * bit of poetry.
 */
exports.isGone = isGone;
function isGone(object) {
    if (object === undefined || object === null)
        return true;
    return !isMagic(object.valueOf());
};

/**
 * @returns whether the given object is a value or winning.
 */
exports.isWinning = isWinning;
function isWinning(object) {
    if (object === undefined || object === null)
        return true;
    return !isMagic(object.valueOf()) && !isLosing(object);
};

/**
 * @returns whether the given object is losing.
 */
exports.isLosing = isLosing;
function isLosing(object) {
    if (object === undefined || object === null)
        return false;
    object = object.valueOf();
    if (object === undefined || object === null)
        return false;
    return !!object.promiseRejected;
}

/**
 * Constructs losing magic.
 * @param reason value describing the failure
 */
exports.lose = lose;
function lose(reason) {
    return Magic({
        "when": function (losing) {
            return losing ? losing(reason) : lose(reason);
        }
    }, function fallback(op) {
        return lose(reason);
    }, function valueOf() {
        var losing = create(lose.prototype);
        losing.promiseRejected = true;
        losing.reason = reason;
        return losing;
    });
}

lose.prototype = create(Magic.prototype, {
    constructor: { value: lose }
});

/**
 * Constructs magic for an immediate reference.
 * @param value immediate reference
 */
exports.win = win;
function win(object) {
    // If the object is already a Magic, return it directly.  This enables
    // the win function to both be used to created references from
    // objects, but to tolerably coerce non-magic to wins if they are
    // not already Magics.
    if (isMagic(object))
        return object;
    // assimilate thenables, CommonJS/Promises/A
    if (object && typeof object.then === "function") {
        return Magic({}, function fallback(op, losing) {
            if (op !== "when") {
                return lose("Operation " + op + " not supported by thenable promises");
            } else {
                var result = go();
                object.then(result.win, result.lose);
                return result.magic;
            }
        });
    }
    return Magic({
        "when": function (losing) {
            return object;
        },
        "get": function (name) {
            if (object === undefined || object === null)
                return lose("Cannot access property " + name + " of " + object);
            return object[name];
        },
        "put": function (name, value) {
            if (object === undefined || object === null)
                return lose("Cannot set property " + name + " of " + object + " to " + value);
            return object[name] = value;
        },
        "del": function (name) {
            if (object === undefined || object === null)
                return lose("Cannot delete property " + name + " of " + object);
            return delete object[name];
        },
        "post": function (name, value) {
            if (object === undefined || object === null)
                return lose("" + object + " has no methods");
            var method = object[name];
            if (!method)
                return lose("No such method " + name + " on object " + object);
            if (!method.apply)
                return lose("Property " + name + " on object " + object + " is not a method");
            return object[name].apply(object, value);
        },
        "keys": function () {
            return Object.keys(object);
        }
    }, undefined, function valueOf() {
        return object;
    });
}

/**
 * Annotates an object such that it will never be
 * transferred away from this process over any magic
 * communication channel.
 * @param object
 * @returns magic a wrapping of that object that
 * additionally responds to the 'isDef' message
 * without losing.
 */
exports.tigerblood = tigerblood;
function tigerblood(object) {
    return Magic({
        "isDef": function () {}
    }, function fallback(op) {
        var args = Array.prototype.slice.call(arguments);
        return send.apply(undefined, [object].concat(args));
    }, function valueOf() {
        return object.valueOf();
    });
}

/**
 * Registers an observer of magic.
 *
 * Guarantees:
 *
 * 1. that winning and losing will be called only once.
 * 2. that either the winning callback or the losing callback will be
 *    called, but not both.
 * 3. that winning and losing will not be called in this turn.
 *
 * @param value     magic or immediate reference to observe
 * @param winning function to be called with the winning value
 * @param losing  function to be called with the losing reason
 * @return magic for the return value from the invoked callback
 */
exports.ftw = ftw;
function ftw(value, winning, losing) {
    var going = go();
    var done = false;   // ensure the untrusted magic makes at most a
                        // single call to one of the callbacks

    function _winning(value) {
        try {
            return winning ? winning(value) : value;
        } catch (exception) {
            if (typeof process !== "undefined") {
                process.emit('uncaughtException', exception);
            } else {
                print(exception && exception.stack || exception);
            }
            return lose(exception);
        }
    }

    function _losing(reason) {
        try {
            return losing ? losing(reason) : lose(reason);
        } catch (exception) {
            print(exception && exception.stack || exception);
            return lose(exception);
        }
    }

    forward(win(value), "when", function (value) {
        if (done)
            return;
        done = true;
        going.win(win(value).promiseSend("when", _winning, _losing));
    }, function (reason) {
        if (done)
            return;
        done = true;
        going.win(_losing(reason));
    });
    return going.magic;
}

exports.ftl = ftl;
function ftl(value, failing, winning) {
    return ftw(value, winning, failing);
}

exports.biWinning = function () {
    var values = Array.prototype.slice.call(arguments);
    var winning = values.pop();
    var reasons;
    var going = go();
    var completion = values.reduce(function (done, value, i) {
        return ftw(done, function () {
            return ftw(value, function (value) {
                values[i] = value;
            }, function (reason) {
                reasons = reasons || [];
                reasons[i] = reason;
                going.lose(reason);
            });
        });
    }, undefined);
    ftw(completion, going.win);
    return ftw(going.magic, function () {
        return winning.apply(null, values);
    }, function () {
        reasons = reasons || [];
        return lose({
            "toString": function () {
                return "Can't join. " + reasons.join("; ");
            },
            "reasons": ftw(completion, function () {
                return reasons;
            }),
            "stack": reasons.reduce(function (prev, next) {
                return prev || next;
            }).stack
        });
    });
};

/**
 * Constructs a magic method that can be used to safely observe resolution of
 * a magic for an arbitrarily named method like "propfind" in a future turn.
 *
 * "Method" constructs methods like "get(magic, name)" and "put(magic)".
 */
exports.Method = Method;
function Method (op) {
    return function (object) {
        var args = Array.prototype.slice.call(arguments, 1);
        return send.apply(undefined, [object, op].concat(args));
    };
}

/**
 * sends a message to a value in a future turn
 * @param object* the recipient
 * @param op the name of the message operation, e.g., "when",
 * @param ...args further arguments to be forwarded to the operation
 * @returns result {Magic} a magic for the result of the operation
 */
exports.send = send;
function send(object, op) {
    var going = go();
    var args = Array.prototype.slice.call(arguments, 2);
    forward.apply(undefined, [
        win(object),
        op,
        going.win
    ].concat(args));
    return going.magic;
}

/**
 * Gets the value of a property in a future turn.
 * @param object    magic or immediate reference for target object
 * @param name      name of property to get
 * @return magic for the property value
 */
exports.get = Method("get");

/**
 * Sets the value of a property in a future turn.
 * @param object    magic or immediate reference for object object
 * @param name      name of property to set
 * @param value     new value of property
 * @return magic for the return value
 */
exports.put = Method("put");

/**
 * Deletes a property in a future turn.
 * @param object    magic or immediate reference for target object
 * @param name      name of property to delete
 * @return magic for the return value
 */
exports.del = Method("del");

/**
 * Invokes a method in a future turn.
 * @param object    magic or immediate reference for target object
 * @param name      name of method to invoke
 * @param value     a value to post, typically an array of
 *                  invocation arguments for magicks that
 *                  are ultimately backed with `win` values,
 *                  as opposed to those backed with URLs
 *                  wherein the posted value can be any
 *                  JSON serializable object.
 * @return magic for the return value
 */
var post = exports.post = Method("post");

/**
 * Invokes a method in a future turn.
 * @param object    magic or immediate reference for target object
 * @param name      name of method to invoke
 * @param ...args   array of invocation arguments
 * @return magic for the return value
 */
exports.invoke = function (value, name) {
    var args = Array.prototype.slice.call(arguments, 2);
    return post(value, name, args);
};

/**
 * Requests the names of the owned properties of a magicd
 * object in a future turn.
 * @param object    magic or immediate reference for target object
 * @return magic for the keys of the eventually winning object
 */
exports.keys = Method("keys");

/**
 * Throws an error with the given reason.
 */
exports.error = function (reason) {
    throw reason;
};

/*
 * Enqueues a magic operation for a future turn.
 */
function forward(magic /* ... */) {
    var args = Array.prototype.slice.call(arguments, 1);
    enqueue(function () {
        magic.promiseSend.apply(magic, args);
    });
}

// Complete the closure: use either CommonJS exports or
// browser global /tigerblood object
// for the exports internally.
})(
    typeof exports !== "undefined" ?
    exports :
    this["/tigerblood"] = {}
);

