var ENVIRONMENT_IS_PTHREAD = true;
var Module = typeof Module !== "undefined" ? Module : {};
var moduleOverrides = {};
var key;
for (key in Module) {
    if (Module.hasOwnProperty(key)) {
        moduleOverrides[key] = Module[key]
    }
}
var arguments_ = [];
var thisProgram = "./this.program";
var quit_ = function(status, toThrow) {
    throw toThrow
};
var ENVIRONMENT_IS_WEB = false;
var ENVIRONMENT_IS_WORKER = false;
var ENVIRONMENT_IS_NODE = false;
var ENVIRONMENT_HAS_NODE = false;
var ENVIRONMENT_IS_SHELL = false;
ENVIRONMENT_IS_WEB = typeof window === "object";
ENVIRONMENT_IS_WORKER = typeof importScripts === "function";
ENVIRONMENT_HAS_NODE = typeof process === "object" && typeof process.versions === "object" && typeof process.versions.node === "string";
ENVIRONMENT_IS_NODE = ENVIRONMENT_HAS_NODE && !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_WORKER;
ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;
if (Module["ENVIRONMENT"]) {
    throw new Error("Module.ENVIRONMENT has been deprecated. To force the environment, use the ENVIRONMENT compile-time option (for example, -s ENVIRONMENT=web or -s ENVIRONMENT=node)")
}
var scriptDirectory = "";

function locateFile(path) {
    if (Module["locateFile"]) {
        return Module["locateFile"](path, scriptDirectory)
    }
    return scriptDirectory + path
}
var read_, readAsync, readBinary, setWindowTitle;
if (ENVIRONMENT_IS_NODE) {
    scriptDirectory = __dirname + "/";
    var nodeFS;
    var nodePath;
    read_ = function shell_read(filename, binary) {
        var ret;
        if (!nodeFS) nodeFS = require("fs");
        if (!nodePath) nodePath = require("path");
        filename = nodePath["normalize"](filename);
        ret = nodeFS["readFileSync"](filename);
        return binary ? ret : ret.toString()
    };
    readBinary = function readBinary(filename) {
        var ret = read_(filename, true);
        if (!ret.buffer) {
            ret = new Uint8Array(ret)
        }
        assert(ret.buffer);
        return ret
    };
    if (process["argv"].length > 1) {
        thisProgram = process["argv"][1].replace(/\\/g, "/")
    }
    arguments_ = process["argv"].slice(2);
    if (typeof module !== "undefined") {
        module["exports"] = Module
    }
    process["on"]("uncaughtException", function(ex) {
        if (!(ex instanceof ExitStatus)) {
            throw ex
        }
    });
    process["on"]("unhandledRejection", abort);
    quit_ = function(status) {
        process["exit"](status)
    };
    Module["inspect"] = function() {
        return "[Emscripten Module object]"
    }
} else if (ENVIRONMENT_IS_SHELL) {
    if (typeof read != "undefined") {
        read_ = function shell_read(f) {
            return read(f)
        }
    }
    readBinary = function readBinary(f) {
        var data;
        if (typeof readbuffer === "function") {
            return new Uint8Array(readbuffer(f))
        }
        data = read(f, "binary");
        assert(typeof data === "object");
        return data
    };
    if (typeof scriptArgs != "undefined") {
        arguments_ = scriptArgs
    } else if (typeof arguments != "undefined") {
        arguments_ = arguments
    }
    if (typeof quit === "function") {
        quit_ = function(status) {
            quit(status)
        }
    }
    if (typeof print !== "undefined") {
        if (typeof console === "undefined") console = {};
        console.log = print;
        console.warn = console.error = typeof printErr !== "undefined" ? printErr : print
    }
} else if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
    if (ENVIRONMENT_IS_WORKER) {
        scriptDirectory = self.location.href
    } else if (document.currentScript) {
        scriptDirectory = document.currentScript.src
    }
    if (scriptDirectory.indexOf("blob:") !== 0) {
        scriptDirectory = scriptDirectory.substr(0, scriptDirectory.lastIndexOf("/") + 1)
    } else {
        scriptDirectory = ""
    }
    read_ = function shell_read(url) {
        var xhr = new XMLHttpRequest;
        xhr.open("GET", url, false);
        xhr.send(null);
        return xhr.responseText
    };
    if (ENVIRONMENT_IS_WORKER) {
        readBinary = function readBinary(url) {
            var xhr = new XMLHttpRequest;
            xhr.open("GET", url, false);
            xhr.responseType = "arraybuffer";
            xhr.send(null);
            return new Uint8Array(xhr.response)
        }
    }
    readAsync = function readAsync(url, onload, onerror) {
        var xhr = new XMLHttpRequest;
        xhr.open("GET", url, true);
        xhr.responseType = "arraybuffer";
        xhr.onload = function xhr_onload() {
            if (xhr.status == 200 || xhr.status == 0 && xhr.response) {
                onload(xhr.response);
                return
            }
            onerror()
        };
        xhr.onerror = onerror;
        xhr.send(null)
    };
    setWindowTitle = function(title) {
        document.title = title
    }
} else {
    throw new Error("environment detection error")
}
var out = Module["print"] || console.log.bind(console);
var err = Module["printErr"] || console.warn.bind(console);
for (key in moduleOverrides) {
    if (moduleOverrides.hasOwnProperty(key)) {
        Module[key] = moduleOverrides[key]
    }
}
moduleOverrides = null;
if (Module["arguments"]) arguments_ = Module["arguments"];
if (!Object.getOwnPropertyDescriptor(Module, "arguments")) Object.defineProperty(Module, "arguments", {
    configurable: true,
    get: function() {
        abort("Module.arguments has been replaced with plain arguments_")
    }
});
if (Module["thisProgram"]) thisProgram = Module["thisProgram"];
if (!Object.getOwnPropertyDescriptor(Module, "thisProgram")) Object.defineProperty(Module, "thisProgram", {
    configurable: true,
    get: function() {
        abort("Module.thisProgram has been replaced with plain thisProgram")
    }
});
if (Module["quit"]) quit_ = Module["quit"];
if (!Object.getOwnPropertyDescriptor(Module, "quit")) Object.defineProperty(Module, "quit", {
    configurable: true,
    get: function() {
        abort("Module.quit has been replaced with plain quit_")
    }
});
assert(typeof Module["memoryInitializerPrefixURL"] === "undefined", "Module.memoryInitializerPrefixURL option was removed, use Module.locateFile instead");
assert(typeof Module["pthreadMainPrefixURL"] === "undefined", "Module.pthreadMainPrefixURL option was removed, use Module.locateFile instead");
assert(typeof Module["cdInitializerPrefixURL"] === "undefined", "Module.cdInitializerPrefixURL option was removed, use Module.locateFile instead");
assert(typeof Module["filePackagePrefixURL"] === "undefined", "Module.filePackagePrefixURL option was removed, use Module.locateFile instead");
assert(typeof Module["read"] === "undefined", "Module.read option was removed (modify read_ in JS)");
assert(typeof Module["readAsync"] === "undefined", "Module.readAsync option was removed (modify readAsync in JS)");
assert(typeof Module["readBinary"] === "undefined", "Module.readBinary option was removed (modify readBinary in JS)");
assert(typeof Module["setWindowTitle"] === "undefined", "Module.setWindowTitle option was removed (modify setWindowTitle in JS)");
if (!Object.getOwnPropertyDescriptor(Module, "read")) Object.defineProperty(Module, "read", {
    configurable: true,
    get: function() {
        abort("Module.read has been replaced with plain read_")
    }
});
if (!Object.getOwnPropertyDescriptor(Module, "readAsync")) Object.defineProperty(Module, "readAsync", {
    configurable: true,
    get: function() {
        abort("Module.readAsync has been replaced with plain readAsync")
    }
});
if (!Object.getOwnPropertyDescriptor(Module, "readBinary")) Object.defineProperty(Module, "readBinary", {
    configurable: true,
    get: function() {
        abort("Module.readBinary has been replaced with plain readBinary")
    }
});
stackSave = stackRestore = stackAlloc = function() {
    abort("cannot use the stack before compiled code is ready to run, and has provided stack access")
};

function dynamicAlloc(size) {
    assert(DYNAMICTOP_PTR);
    var ret = HEAP32[DYNAMICTOP_PTR >> 2];
    var end = ret + size + 15 & -16;
    if (end > _emscripten_get_heap_size()) {
        abort("failure to dynamicAlloc - memory growth etc. is not supported there, call malloc/sbrk directly")
    }
    HEAP32[DYNAMICTOP_PTR >> 2] = end;
    return ret
}

function getNativeTypeSize(type) {
    switch (type) {
        case "i1":
        case "i8":
            return 1;
        case "i16":
            return 2;
        case "i32":
            return 4;
        case "i64":
            return 8;
        case "float":
            return 4;
        case "double":
            return 8;
        default: {
            if (type[type.length - 1] === "*") {
                return 4
            } else if (type[0] === "i") {
                var bits = parseInt(type.substr(1));
                assert(bits % 8 === 0, "getNativeTypeSize invalid bits " + bits + ", type " + type);
                return bits / 8
            } else {
                return 0
            }
        }
    }
}

function warnOnce(text) {
    if (!warnOnce.shown) warnOnce.shown = {};
    if (!warnOnce.shown[text]) {
        warnOnce.shown[text] = 1;
        err(text)
    }
}
var asm2wasmImports = {
    "f64-rem": function(x, y) {
        return x % y
    },
    "debugger": function() {
        debugger
    }
};
var jsCallStartIndex = 1;
var functionPointers = new Array(100);

function addFunction(func, sig) {
    assert(typeof func !== "undefined");
    var base = 0;
    for (var i = base; i < base + 100; i++) {
        if (!functionPointers[i]) {
            functionPointers[i] = func;
            return jsCallStartIndex + i
        }
    }
    throw "Finished up all reserved function pointers. Use a higher value for RESERVED_FUNCTION_POINTERS."
}

function removeFunction(index) {
    functionPointers[index - jsCallStartIndex] = null
}
var tempRet0 = 0;
var getTempRet0 = function() {
    return tempRet0
};
var wasmBinary;
if (Module["wasmBinary"]) wasmBinary = Module["wasmBinary"];
if (!Object.getOwnPropertyDescriptor(Module, "wasmBinary")) Object.defineProperty(Module, "wasmBinary", {
    configurable: true,
    get: function() {
        abort("Module.wasmBinary has been replaced with plain wasmBinary")
    }
});
var noExitRuntime;
if (Module["noExitRuntime"]) noExitRuntime = Module["noExitRuntime"];
if (!Object.getOwnPropertyDescriptor(Module, "noExitRuntime")) Object.defineProperty(Module, "noExitRuntime", {
    configurable: true,
    get: function() {
        abort("Module.noExitRuntime has been replaced with plain noExitRuntime")
    }
});
if (typeof WebAssembly !== "object") {
    abort("No WebAssembly support found. Build with -s WASM=0 to target JavaScript instead.")
}

function setValue(ptr, value, type, noSafe) {
    type = type || "i8";
    if (type.charAt(type.length - 1) === "*") type = "i32";
    switch (type) {
        case "i1":
            HEAP8[ptr >> 0] = value;
            break;
        case "i8":
            HEAP8[ptr >> 0] = value;
            break;
        case "i16":
            HEAP16[ptr >> 1] = value;
            break;
        case "i32":
            HEAP32[ptr >> 2] = value;
            break;
        case "i64":
            tempI64 = [value >>> 0, (tempDouble = value, +Math_abs(tempDouble) >= 1 ? tempDouble > 0 ? (Math_min(+Math_floor(tempDouble / 4294967296), 4294967295) | 0) >>> 0 : ~~+Math_ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0 : 0)], HEAP32[ptr >> 2] = tempI64[0], HEAP32[ptr + 4 >> 2] = tempI64[1];
            break;
        case "float":
            HEAPF32[ptr >> 2] = value;
            break;
        case "double":
            HEAPF64[ptr >> 3] = value;
            break;
        default:
            abort("invalid type for setValue: " + type)
    }
}
var wasmMemory;
var wasmTable = new WebAssembly.Table({
    "initial": 8960,
    "element": "anyfunc"
});
var ABORT = false;
var EXITSTATUS = 0;

function assert(condition, text) {
    if (!condition) {
        abort("Assertion failed: " + text)
    }
}

function getCFunc(ident) {
    var func = Module["_" + ident];
    assert(func, "Cannot call unknown function " + ident + ", make sure it is exported");
    return func
}

function ccall(ident, returnType, argTypes, args, opts) {
    var toC = {
        "string": function(str) {
            var ret = 0;
            if (str !== null && str !== undefined && str !== 0) {
                var len = (str.length << 2) + 1;
                ret = stackAlloc(len);
                stringToUTF8(str, ret, len)
            }
            return ret
        },
        "array": function(arr) {
            var ret = stackAlloc(arr.length);
            writeArrayToMemory(arr, ret);
            return ret
        }
    };

    function convertReturnValue(ret) {
        if (returnType === "string") return UTF8ToString(ret);
        if (returnType === "boolean") return Boolean(ret);
        return ret
    }
    var func = getCFunc(ident);
    var cArgs = [];
    var stack = 0;
    assert(returnType !== "array", 'Return type should not be "array".');
    if (args) {
        for (var i = 0; i < args.length; i++) {
            var converter = toC[argTypes[i]];
            if (converter) {
                if (stack === 0) stack = stackSave();
                cArgs[i] = converter(args[i])
            } else {
                cArgs[i] = args[i]
            }
        }
    }
    var ret = func.apply(null, cArgs);
    ret = convertReturnValue(ret);
    if (stack !== 0) stackRestore(stack);
    return ret
}

function cwrap(ident, returnType, argTypes, opts) {
    return function() {
        return ccall(ident, returnType, argTypes, arguments, opts)
    }
}
var ALLOC_NORMAL = 0;
var ALLOC_NONE = 3;

function allocate(slab, types, allocator, ptr) {
    var zeroinit, size;
    if (typeof slab === "number") {
        zeroinit = true;
        size = slab
    } else {
        zeroinit = false;
        size = slab.length
    }
    var singleType = typeof types === "string" ? types : null;
    var ret;
    if (allocator == ALLOC_NONE) {
        ret = ptr
    } else {
        ret = [_malloc, stackAlloc, dynamicAlloc][allocator](Math.max(size, singleType ? 1 : types.length))
    }
    if (zeroinit) {
        var stop;
        ptr = ret;
        assert((ret & 3) == 0);
        stop = ret + (size & ~3);
        for (; ptr < stop; ptr += 4) {
            HEAP32[ptr >> 2] = 0
        }
        stop = ret + size;
        while (ptr < stop) {
            HEAP8[ptr++ >> 0] = 0
        }
        return ret
    }
    if (singleType === "i8") {
        if (slab.subarray || slab.slice) {
            HEAPU8.set(slab, ret)
        } else {
            HEAPU8.set(new Uint8Array(slab), ret)
        }
        return ret
    }
    var i = 0,
        type, typeSize, previousType;
    while (i < size) {
        var curr = slab[i];
        type = singleType || types[i];
        if (type === 0) {
            i++;
            continue
        }
        assert(type, "Must know what type to store in allocate!");
        if (type == "i64") type = "i32";
        setValue(ret + i, curr, type);
        if (previousType !== type) {
            typeSize = getNativeTypeSize(type);
            previousType = type
        }
        i += typeSize
    }
    return ret
}

function getMemory(size) {
    if (!runtimeInitialized) return dynamicAlloc(size);
    return _malloc(size)
}
var UTF8Decoder = typeof TextDecoder !== "undefined" ? new TextDecoder("utf8") : undefined;

function UTF8ArrayToString(u8Array, idx, maxBytesToRead) {
    var endIdx = idx + maxBytesToRead;
    var endPtr = idx;
    while (u8Array[endPtr] && !(endPtr >= endIdx)) ++endPtr;
    if (endPtr - idx > 16 && u8Array.subarray && UTF8Decoder) {
        return UTF8Decoder.decode(u8Array.subarray(idx, endPtr))
    } else {
        var str = "";
        while (idx < endPtr) {
            var u0 = u8Array[idx++];
            if (!(u0 & 128)) {
                str += String.fromCharCode(u0);
                continue
            }
            var u1 = u8Array[idx++] & 63;
            if ((u0 & 224) == 192) {
                str += String.fromCharCode((u0 & 31) << 6 | u1);
                continue
            }
            var u2 = u8Array[idx++] & 63;
            if ((u0 & 240) == 224) {
                u0 = (u0 & 15) << 12 | u1 << 6 | u2
            } else {
                if ((u0 & 248) != 240) warnOnce("Invalid UTF-8 leading byte 0x" + u0.toString(16) + " encountered when deserializing a UTF-8 string on the asm.js/wasm heap to a JS string!");
                u0 = (u0 & 7) << 18 | u1 << 12 | u2 << 6 | u8Array[idx++] & 63
            }
            if (u0 < 65536) {
                str += String.fromCharCode(u0)
            } else {
                var ch = u0 - 65536;
                str += String.fromCharCode(55296 | ch >> 10, 56320 | ch & 1023)
            }
        }
    }
    return str
}

function UTF8ToString(ptr, maxBytesToRead) {
    return ptr ? UTF8ArrayToString(HEAPU8, ptr, maxBytesToRead) : ""
}

function stringToUTF8Array(str, outU8Array, outIdx, maxBytesToWrite) {
    if (!(maxBytesToWrite > 0)) return 0;
    var startIdx = outIdx;
    var endIdx = outIdx + maxBytesToWrite - 1;
    for (var i = 0; i < str.length; ++i) {
        var u = str.charCodeAt(i);
        if (u >= 55296 && u <= 57343) {
            var u1 = str.charCodeAt(++i);
            u = 65536 + ((u & 1023) << 10) | u1 & 1023
        }
        if (u <= 127) {
            if (outIdx >= endIdx) break;
            outU8Array[outIdx++] = u
        } else if (u <= 2047) {
            if (outIdx + 1 >= endIdx) break;
            outU8Array[outIdx++] = 192 | u >> 6;
            outU8Array[outIdx++] = 128 | u & 63
        } else if (u <= 65535) {
            if (outIdx + 2 >= endIdx) break;
            outU8Array[outIdx++] = 224 | u >> 12;
            outU8Array[outIdx++] = 128 | u >> 6 & 63;
            outU8Array[outIdx++] = 128 | u & 63
        } else {
            if (outIdx + 3 >= endIdx) break;
            if (u >= 2097152) warnOnce("Invalid Unicode code point 0x" + u.toString(16) + " encountered when serializing a JS string to an UTF-8 string on the asm.js/wasm heap! (Valid unicode code points should be in range 0-0x1FFFFF).");
            outU8Array[outIdx++] = 240 | u >> 18;
            outU8Array[outIdx++] = 128 | u >> 12 & 63;
            outU8Array[outIdx++] = 128 | u >> 6 & 63;
            outU8Array[outIdx++] = 128 | u & 63
        }
    }
    outU8Array[outIdx] = 0;
    return outIdx - startIdx
}

function stringToUTF8(str, outPtr, maxBytesToWrite) {
    assert(typeof maxBytesToWrite == "number", "stringToUTF8(str, outPtr, maxBytesToWrite) is missing the third parameter that specifies the length of the output buffer!");
    return stringToUTF8Array(str, HEAPU8, outPtr, maxBytesToWrite)
}

function lengthBytesUTF8(str) {
    var len = 0;
    for (var i = 0; i < str.length; ++i) {
        var u = str.charCodeAt(i);
        if (u >= 55296 && u <= 57343) u = 65536 + ((u & 1023) << 10) | str.charCodeAt(++i) & 1023;
        if (u <= 127) ++len;
        else if (u <= 2047) len += 2;
        else if (u <= 65535) len += 3;
        else len += 4
    }
    return len
}
var UTF16Decoder = typeof TextDecoder !== "undefined" ? new TextDecoder("utf-16le") : undefined;

function allocateUTF8(str) {
    var size = lengthBytesUTF8(str) + 1;
    var ret = _malloc(size);
    if (ret) stringToUTF8Array(str, HEAP8, ret, size);
    return ret
}

function allocateUTF8OnStack(str) {
    var size = lengthBytesUTF8(str) + 1;
    var ret = stackAlloc(size);
    stringToUTF8Array(str, HEAP8, ret, size);
    return ret
}

function writeArrayToMemory(array, buffer) {
    assert(array.length >= 0, "writeArrayToMemory array must have a length (should be an array or typed array)");
    HEAP8.set(array, buffer)
}

function writeAsciiToMemory(str, buffer, dontAddNull) {
    for (var i = 0; i < str.length; ++i) {
        assert(str.charCodeAt(i) === str.charCodeAt(i) & 255);
        HEAP8[buffer++ >> 0] = str.charCodeAt(i)
    }
    if (!dontAddNull) HEAP8[buffer >> 0] = 0
}
var PAGE_SIZE = 16384;
var WASM_PAGE_SIZE = 65536;
var buffer, HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64;

function updateGlobalBufferAndViews(buf) {
    buffer = buf;
    Module["HEAP8"] = HEAP8 = new Int8Array(buf);
    Module["HEAP16"] = HEAP16 = new Int16Array(buf);
    Module["HEAP32"] = HEAP32 = new Int32Array(buf);
    Module["HEAPU8"] = HEAPU8 = new Uint8Array(buf);
    Module["HEAPU16"] = HEAPU16 = new Uint16Array(buf);
    Module["HEAPU32"] = HEAPU32 = new Uint32Array(buf);
    Module["HEAPF32"] = HEAPF32 = new Float32Array(buf);
    Module["HEAPF64"] = HEAPF64 = new Float64Array(buf)
}
var STACK_BASE = 1398224,
    STACK_MAX = 6641104,
    DYNAMIC_BASE = 6641104,
    DYNAMICTOP_PTR = 1398e3;
assert(STACK_BASE % 16 === 0, "stack must start aligned");
assert(DYNAMIC_BASE % 16 === 0, "heap must start aligned");
var TOTAL_STACK = 5242880;
if (Module["TOTAL_STACK"]) assert(TOTAL_STACK === Module["TOTAL_STACK"], "the stack size can no longer be determined at runtime");
var INITIAL_TOTAL_MEMORY = Module["TOTAL_MEMORY"] || 2147483648;
if (!Object.getOwnPropertyDescriptor(Module, "TOTAL_MEMORY")) Object.defineProperty(Module, "TOTAL_MEMORY", {
    configurable: true,
    get: function() {
        abort("Module.TOTAL_MEMORY has been replaced with plain INITIAL_TOTAL_MEMORY")
    }
});
assert(INITIAL_TOTAL_MEMORY >= TOTAL_STACK, "TOTAL_MEMORY should be larger than TOTAL_STACK, was " + INITIAL_TOTAL_MEMORY + "! (TOTAL_STACK=" + TOTAL_STACK + ")");
assert(typeof Int32Array !== "undefined" && typeof Float64Array !== "undefined" && Int32Array.prototype.subarray !== undefined && Int32Array.prototype.set !== undefined, "JS engine does not provide full typed array support");
if (Module["wasmMemory"]) {
    wasmMemory = Module["wasmMemory"]
} else {
    wasmMemory = new WebAssembly.Memory({
        "initial": INITIAL_TOTAL_MEMORY / WASM_PAGE_SIZE,
        "maximum": INITIAL_TOTAL_MEMORY / WASM_PAGE_SIZE
    })
}
if (wasmMemory) {
    buffer = wasmMemory.buffer
}
INITIAL_TOTAL_MEMORY = buffer.byteLength;
assert(INITIAL_TOTAL_MEMORY % WASM_PAGE_SIZE === 0);
updateGlobalBufferAndViews(buffer);
HEAP32[DYNAMICTOP_PTR >> 2] = DYNAMIC_BASE;

function writeStackCookie() {
    assert((STACK_MAX & 3) == 0);
    HEAPU32[(STACK_MAX >> 2) - 1] = 34821223;
    HEAPU32[(STACK_MAX >> 2) - 2] = 2310721022;
    HEAP32[0] = 1668509029
}

function checkStackCookie() {
    var cookie1 = HEAPU32[(STACK_MAX >> 2) - 1];
    var cookie2 = HEAPU32[(STACK_MAX >> 2) - 2];
    if (cookie1 != 34821223 || cookie2 != 2310721022) {
        abort("Stack overflow! Stack cookie has been overwritten, expected hex dwords 0x89BACDFE and 0x02135467, but received 0x" + cookie2.toString(16) + " " + cookie1.toString(16))
    }
    if (HEAP32[0] !== 1668509029) abort("Runtime error: The application has corrupted its heap memory area (address zero)!")
}

function abortStackOverflow(allocSize) {
    abort("Stack overflow! Attempted to allocate " + allocSize + " bytes on the stack, but stack has only " + (STACK_MAX - stackSave() + allocSize) + " bytes available!")
}(function() {
    var h16 = new Int16Array(1);
    var h8 = new Int8Array(h16.buffer);
    h16[0] = 25459;
    if (h8[0] !== 115 || h8[1] !== 99) throw "Runtime error: expected the system to be little-endian!"
})();

function abortFnPtrError(ptr, sig) {
    var possibleSig = "";
    for (var x in debug_tables) {
        var tbl = debug_tables[x];
        if (tbl[ptr]) {
            possibleSig += 'as sig "' + x + '" pointing to function ' + tbl[ptr] + ", "
        }
    }
    abort("Invalid function pointer " + ptr + " called with signature '" + sig + "'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this). This pointer might make sense in another type signature: " + possibleSig)
}

function callRuntimeCallbacks(callbacks) {
    while (callbacks.length > 0) {
        var callback = callbacks.shift();
        if (typeof callback == "function") {
            callback();
            continue
        }
        var func = callback.func;
        if (typeof func === "number") {
            if (callback.arg === undefined) {
                Module["dynCall_v"](func)
            } else {
                Module["dynCall_vi"](func, callback.arg)
            }
        } else {
            func(callback.arg === undefined ? null : callback.arg)
        }
    }
}
var __ATPRERUN__ = [];
var __ATINIT__ = [];
var __ATMAIN__ = [];
var __ATPOSTRUN__ = [];
var runtimeInitialized = false;
var runtimeExited = false;

function preRun() {
    if (Module["preRun"]) {
        if (typeof Module["preRun"] == "function") Module["preRun"] = [Module["preRun"]];
        while (Module["preRun"].length) {
            addOnPreRun(Module["preRun"].shift())
        }
    }
    callRuntimeCallbacks(__ATPRERUN__)
}

function initRuntime() {
    checkStackCookie();
    assert(!runtimeInitialized);
    runtimeInitialized = true;
    if (!Module["noFSInit"] && !FS.init.initialized) FS.init();
    TTY.init();
    callRuntimeCallbacks(__ATINIT__)
}

function preMain() {
    checkStackCookie();
    FS.ignorePermissions = false;
    callRuntimeCallbacks(__ATMAIN__)
}

function exitRuntime() {
    checkStackCookie();
    runtimeExited = true
}

function postRun() {
    checkStackCookie();
    if (Module["postRun"]) {
        if (typeof Module["postRun"] == "function") Module["postRun"] = [Module["postRun"]];
        while (Module["postRun"].length) {
            addOnPostRun(Module["postRun"].shift())
        }
    }
    callRuntimeCallbacks(__ATPOSTRUN__)
}

function addOnPreRun(cb) {
    __ATPRERUN__.unshift(cb)
}

function addOnPostRun(cb) {
    __ATPOSTRUN__.unshift(cb)
}
assert(Math.imul, "This browser does not support Math.imul(), build with LEGACY_VM_SUPPORT or POLYFILL_OLD_MATH_FUNCTIONS to add in a polyfill");
assert(Math.fround, "This browser does not support Math.fround(), build with LEGACY_VM_SUPPORT or POLYFILL_OLD_MATH_FUNCTIONS to add in a polyfill");
assert(Math.clz32, "This browser does not support Math.clz32(), build with LEGACY_VM_SUPPORT or POLYFILL_OLD_MATH_FUNCTIONS to add in a polyfill");
assert(Math.trunc, "This browser does not support Math.trunc(), build with LEGACY_VM_SUPPORT or POLYFILL_OLD_MATH_FUNCTIONS to add in a polyfill");
var Math_abs = Math.abs;
var Math_ceil = Math.ceil;
var Math_floor = Math.floor;
var Math_min = Math.min;
var Math_trunc = Math.trunc;
var runDependencies = 0;
var runDependencyWatcher = null;
var dependenciesFulfilled = null;
var runDependencyTracking = {};

function getUniqueRunDependency(id) {
    var orig = id;
    while (1) {
        if (!runDependencyTracking[id]) return id;
        id = orig + Math.random()
    }
    return id
}

function addRunDependency(id) {
    runDependencies++;
    if (Module["monitorRunDependencies"]) {
        Module["monitorRunDependencies"](runDependencies)
    }
    if (id) {
        assert(!runDependencyTracking[id]);
        runDependencyTracking[id] = 1;
        if (runDependencyWatcher === null && typeof setInterval !== "undefined") {
            runDependencyWatcher = setInterval(function() {
                if (ABORT) {
                    clearInterval(runDependencyWatcher);
                    runDependencyWatcher = null;
                    return
                }
                var shown = false;
                for (var dep in runDependencyTracking) {
                    if (!shown) {
                        shown = true;
                        err("still waiting on run dependencies:")
                    }
                    err("dependency: " + dep)
                }
                if (shown) {
                    err("(end of list)")
                }
            }, 1e4)
        }
    } else {
        err("warning: run dependency added without ID")
    }
}

function removeRunDependency(id) {
    runDependencies--;
    if (Module["monitorRunDependencies"]) {
        Module["monitorRunDependencies"](runDependencies)
    }
    if (id) {
        assert(runDependencyTracking[id]);
        delete runDependencyTracking[id]
    } else {
        err("warning: run dependency removed without ID")
    }
    if (runDependencies == 0) {
        if (runDependencyWatcher !== null) {
            clearInterval(runDependencyWatcher);
            runDependencyWatcher = null
        }
        if (dependenciesFulfilled) {
            var callback = dependenciesFulfilled;
            dependenciesFulfilled = null;
            callback()
        }
    }
}
Module["preloadedImages"] = {};
Module["preloadedAudios"] = {};

function abort(what) {
    if (Module["onAbort"]) {
        Module["onAbort"](what)
    }
    what += "";
    out(what);
    err(what);
    ABORT = true;
    EXITSTATUS = 1;
    var extra = "";
    var output = "abort(" + what + ") at " + stackTrace() + extra;
    throw output
}
if (!ENVIRONMENT_IS_PTHREAD) addOnPreRun(function() {
    if (typeof SharedArrayBuffer !== "undefined") {
        addRunDependency("pthreads");
        PThread.allocateUnusedWorkers(5, function() {
            removeRunDependency("pthreads")
        })
    }
});
var dataURIPrefix = "data:application/octet-stream;base64,";

function isDataURI(filename) {
    return String.prototype.startsWith ? filename.startsWith(dataURIPrefix) : filename.indexOf(dataURIPrefix) === 0
}
var wasmBinaryFile = "missile-120func-v20221120.wasm";
if (!isDataURI(wasmBinaryFile)) {
    wasmBinaryFile = locateFile(wasmBinaryFile)
}

function getBinary() {
    try {
        if (wasmBinary) {
            return new Uint8Array(wasmBinary)
        }
        if (readBinary) {
            return readBinary(wasmBinaryFile)
        } else {
            throw "both async and sync fetching of the wasm failed"
        }
    } catch (err) {
        abort(err)
    }
}

function getBinaryPromise() {
    if (!wasmBinary && (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) && typeof fetch === "function") {
        return fetch(wasmBinaryFile, {
            credentials: "same-origin"
        }).then(function(response) {
            if (!response["ok"]) {
                throw "failed to load wasm binary file at '" + wasmBinaryFile + "'"
            }
            return response["arrayBuffer"]()
        }).catch(function() {
            return getBinary()
        })
    }
    return new Promise(function(resolve, reject) {
        resolve(getBinary())
    })
}

function createWasm() {
    var info = {
        "env": asmLibraryArg,
        "wasi_unstable": asmLibraryArg,
        "global": {
            "NaN": NaN,
            Infinity: Infinity
        },
        "global.Math": Math,
        "asm2wasm": asm2wasmImports
    };

    function receiveInstance(instance, module) {
        var exports = instance.exports;
        Module["asm"] = exports;
        removeRunDependency("wasm-instantiate")
    }
    addRunDependency("wasm-instantiate");
    var trueModule = Module;

    function receiveInstantiatedSource(output) {
        assert(Module === trueModule, "the Module object should not be replaced during async compilation - perhaps the order of HTML elements is wrong?");
        trueModule = null;
        receiveInstance(output["instance"])
    }

    function instantiateArrayBuffer(receiver) {
        return getBinaryPromise().then(function(binary) {
            return WebAssembly.instantiate(binary, info)
        }).then(receiver, function(reason) {
            err("failed to asynchronously prepare wasm: " + reason);
            abort(reason)
        })
    }

    function instantiateAsync() {
        if (!wasmBinary && typeof WebAssembly.instantiateStreaming === "function" && !isDataURI(wasmBinaryFile) && typeof fetch === "function") {
            fetch(wasmBinaryFile, {
                credentials: "same-origin"
            }).then(function(response) {
                var result = WebAssembly.instantiateStreaming(response, info);
                return result.then(receiveInstantiatedSource, function(reason) {
                    err("wasm streaming compile failed: " + reason);
                    err("falling back to ArrayBuffer instantiation");
                    instantiateArrayBuffer(receiveInstantiatedSource)
                })
            })
        } else {
            return instantiateArrayBuffer(receiveInstantiatedSource)
        }
    }
    if (Module["instantiateWasm"]) {
        try {
            var exports = Module["instantiateWasm"](info, receiveInstance);
            return exports
        } catch (e) {
            err("Module.instantiateWasm callback failed with error: " + e);
            return false
        }
    }
    instantiateAsync();
    return {}
}
Module["asm"] = createWasm;
var tempDouble;
var tempI64;
var ASM_CONSTS = [function() {
    if (typeof window != "undefined") {
        window.dispatchEvent(new CustomEvent("wasmLoaded"))
    } else {}
}];

function _emscripten_asm_const_i(code) {
    return ASM_CONSTS[code]()
}
__ATINIT__.push({
    func: function() {
        ___emscripten_environ_constructor()
    }
});
var tempDoublePtr = 1398208;
assert(tempDoublePtr % 8 == 0);

function demangle(func) {
    warnOnce("warning: build with  -s DEMANGLE_SUPPORT=1  to link in libcxxabi demangling");
    return func
}

function demangleAll(text) {
    var regex = /\b__Z[\w\d_]+/g;
    return text.replace(regex, function(x) {
        var y = demangle(x);
        return x === y ? x : y + " [" + x + "]"
    })
}

function jsStackTrace() {
    var err = new Error;
    if (!err.stack) {
        try {
            throw new Error(0)
        } catch (e) {
            err = e
        }
        if (!err.stack) {
            return "(no stack trace available)"
        }
    }
    return err.stack.toString()
}

function stackTrace() {
    var js = jsStackTrace();
    if (Module["extraStackTrace"]) js += "\n" + Module["extraStackTrace"]();
    return demangleAll(js)
}
var ENV = {};

function ___buildEnvironment(environ) {
    var MAX_ENV_VALUES = 64;
    var TOTAL_ENV_SIZE = 1024;
    var poolPtr;
    var envPtr;
    if (!___buildEnvironment.called) {
        ___buildEnvironment.called = true;
        ENV["USER"] = "web_user";
        ENV["LOGNAME"] = "web_user";
        ENV["PATH"] = "/";
        ENV["PWD"] = "/";
        ENV["HOME"] = "/home/web_user";
        ENV["LANG"] = (typeof navigator === "object" && navigator.languages && navigator.languages[0] || "C").replace("-", "_") + ".UTF-8";
        ENV["_"] = thisProgram;
        poolPtr = getMemory(TOTAL_ENV_SIZE);
        envPtr = getMemory(MAX_ENV_VALUES * 4);
        HEAP32[envPtr >> 2] = poolPtr;
        HEAP32[environ >> 2] = envPtr
    } else {
        envPtr = HEAP32[environ >> 2];
        poolPtr = HEAP32[envPtr >> 2]
    }
    var strings = [];
    var totalSize = 0;
    for (var key in ENV) {
        if (typeof ENV[key] === "string") {
            var line = key + "=" + ENV[key];
            strings.push(line);
            totalSize += line.length
        }
    }
    if (totalSize > TOTAL_ENV_SIZE) {
        throw new Error("Environment size exceeded TOTAL_ENV_SIZE!")
    }
    var ptrSize = 4;
    for (var i = 0; i < strings.length; i++) {
        var line = strings[i];
        writeAsciiToMemory(line, poolPtr);
        HEAP32[envPtr + i * ptrSize >> 2] = poolPtr;
        poolPtr += line.length + 1
    }
    HEAP32[envPtr + strings.length * ptrSize >> 2] = 0
}

function ___lock() {}

function ___setErrNo(value) {
    if (Module["___errno_location"]) HEAP32[Module["___errno_location"]() >> 2] = value;
    else err("failed to set errno from JS");
    return value
}
var PATH = {
    splitPath: function(filename) {
        var splitPathRe = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
        return splitPathRe.exec(filename).slice(1)
    },
    normalizeArray: function(parts, allowAboveRoot) {
        var up = 0;
        for (var i = parts.length - 1; i >= 0; i--) {
            var last = parts[i];
            if (last === ".") {
                parts.splice(i, 1)
            } else if (last === "..") {
                parts.splice(i, 1);
                up++
            } else if (up) {
                parts.splice(i, 1);
                up--
            }
        }
        if (allowAboveRoot) {
            for (; up; up--) {
                parts.unshift("..")
            }
        }
        return parts
    },
    normalize: function(path) {
        var isAbsolute = path.charAt(0) === "/",
            trailingSlash = path.substr(-1) === "/";
        path = PATH.normalizeArray(path.split("/").filter(function(p) {
            return !!p
        }), !isAbsolute).join("/");
        if (!path && !isAbsolute) {
            path = "."
        }
        if (path && trailingSlash) {
            path += "/"
        }
        return (isAbsolute ? "/" : "") + path
    },
    dirname: function(path) {
        var result = PATH.splitPath(path),
            root = result[0],
            dir = result[1];
        if (!root && !dir) {
            return "."
        }
        if (dir) {
            dir = dir.substr(0, dir.length - 1)
        }
        return root + dir
    },
    basename: function(path) {
        if (path === "/") return "/";
        var lastSlash = path.lastIndexOf("/");
        if (lastSlash === -1) return path;
        return path.substr(lastSlash + 1)
    },
    extname: function(path) {
        return PATH.splitPath(path)[3]
    },
    join: function() {
        var paths = Array.prototype.slice.call(arguments, 0);
        return PATH.normalize(paths.join("/"))
    },
    join2: function(l, r) {
        return PATH.normalize(l + "/" + r)
    }
};
var PATH_FS = {
    resolve: function() {
        var resolvedPath = "",
            resolvedAbsolute = false;
        for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
            var path = i >= 0 ? arguments[i] : FS.cwd();
            if (typeof path !== "string") {
                throw new TypeError("Arguments to path.resolve must be strings")
            } else if (!path) {
                return ""
            }
            resolvedPath = path + "/" + resolvedPath;
            resolvedAbsolute = path.charAt(0) === "/"
        }
        resolvedPath = PATH.normalizeArray(resolvedPath.split("/").filter(function(p) {
            return !!p
        }), !resolvedAbsolute).join("/");
        return (resolvedAbsolute ? "/" : "") + resolvedPath || "."
    },
    relative: function(from, to) {
        from = PATH_FS.resolve(from).substr(1);
        to = PATH_FS.resolve(to).substr(1);

        function trim(arr) {
            var start = 0;
            for (; start < arr.length; start++) {
                if (arr[start] !== "") break
            }
            var end = arr.length - 1;
            for (; end >= 0; end--) {
                if (arr[end] !== "") break
            }
            if (start > end) return [];
            return arr.slice(start, end - start + 1)
        }
        var fromParts = trim(from.split("/"));
        var toParts = trim(to.split("/"));
        var length = Math.min(fromParts.length, toParts.length);
        var samePartsLength = length;
        for (var i = 0; i < length; i++) {
            if (fromParts[i] !== toParts[i]) {
                samePartsLength = i;
                break
            }
        }
        var outputParts = [];
        for (var i = samePartsLength; i < fromParts.length; i++) {
            outputParts.push("..")
        }
        outputParts = outputParts.concat(toParts.slice(samePartsLength));
        return outputParts.join("/")
    }
};
var TTY = {
    ttys: [],
    init: function() {},
    shutdown: function() {},
    register: function(dev, ops) {
        TTY.ttys[dev] = {
            input: [],
            output: [],
            ops: ops
        };
        FS.registerDevice(dev, TTY.stream_ops)
    },
    stream_ops: {
        open: function(stream) {
            var tty = TTY.ttys[stream.node.rdev];
            if (!tty) {
                throw new FS.ErrnoError(43)
            }
            stream.tty = tty;
            stream.seekable = false
        },
        close: function(stream) {
            stream.tty.ops.flush(stream.tty)
        },
        flush: function(stream) {
            stream.tty.ops.flush(stream.tty)
        },
        read: function(stream, buffer, offset, length, pos) {
            if (!stream.tty || !stream.tty.ops.get_char) {
                throw new FS.ErrnoError(60)
            }
            var bytesRead = 0;
            for (var i = 0; i < length; i++) {
                var result;
                try {
                    result = stream.tty.ops.get_char(stream.tty)
                } catch (e) {
                    throw new FS.ErrnoError(29)
                }
                if (result === undefined && bytesRead === 0) {
                    throw new FS.ErrnoError(6)
                }
                if (result === null || result === undefined) break;
                bytesRead++;
                buffer[offset + i] = result
            }
            if (bytesRead) {
                stream.node.timestamp = Date.now()
            }
            return bytesRead
        },
        write: function(stream, buffer, offset, length, pos) {
            if (!stream.tty || !stream.tty.ops.put_char) {
                throw new FS.ErrnoError(60)
            }
            try {
                for (var i = 0; i < length; i++) {
                    stream.tty.ops.put_char(stream.tty, buffer[offset + i])
                }
            } catch (e) {
                throw new FS.ErrnoError(29)
            }
            if (length) {
                stream.node.timestamp = Date.now()
            }
            return i
        }
    },
    default_tty_ops: {
        get_char: function(tty) {
            if (!tty.input.length) {
                var result = null;
                if (ENVIRONMENT_IS_NODE) {
                    var BUFSIZE = 256;
                    var buf = Buffer.alloc ? Buffer.alloc(BUFSIZE) : new Buffer(BUFSIZE);
                    var bytesRead = 0;
                    try {
                        bytesRead = fs.readSync(process.stdin.fd, buf, 0, BUFSIZE, null)
                    } catch (e) {
                        if (e.toString().indexOf("EOF") != -1) bytesRead = 0;
                        else throw e
                    }
                    if (bytesRead > 0) {
                        result = buf.slice(0, bytesRead).toString("utf-8")
                    } else {
                        result = null
                    }
                } else if (typeof window != "undefined" && typeof window.prompt == "function") {
                    result = window.prompt("Input: ");
                    if (result !== null) {
                        result += "\n"
                    }
                } else if (typeof readline == "function") {
                    result = readline();
                    if (result !== null) {
                        result += "\n"
                    }
                }
                if (!result) {
                    return null
                }
                tty.input = intArrayFromString(result, true)
            }
            return tty.input.shift()
        },
        put_char: function(tty, val) {
            if (val === null || val === 10) {
                out(UTF8ArrayToString(tty.output, 0));
                tty.output = []
            } else {
                if (val != 0) tty.output.push(val)
            }
        },
        flush: function(tty) {
            if (tty.output && tty.output.length > 0) {
                out(UTF8ArrayToString(tty.output, 0));
                tty.output = []
            }
        }
    },
    default_tty1_ops: {
        put_char: function(tty, val) {
            if (val === null || val === 10) {
                err(UTF8ArrayToString(tty.output, 0));
                tty.output = []
            } else {
                if (val != 0) tty.output.push(val)
            }
        },
        flush: function(tty) {
            if (tty.output && tty.output.length > 0) {
                err(UTF8ArrayToString(tty.output, 0));
                tty.output = []
            }
        }
    }
};
var MEMFS = {
    ops_table: null,
    mount: function(mount) {
        return MEMFS.createNode(null, "/", 16384 | 511, 0)
    },
    createNode: function(parent, name, mode, dev) {
        if (FS.isBlkdev(mode) || FS.isFIFO(mode)) {
            throw new FS.ErrnoError(63)
        }
        if (!MEMFS.ops_table) {
            MEMFS.ops_table = {
                dir: {
                    node: {
                        getattr: MEMFS.node_ops.getattr,
                        setattr: MEMFS.node_ops.setattr,
                        lookup: MEMFS.node_ops.lookup,
                        mknod: MEMFS.node_ops.mknod,
                        rename: MEMFS.node_ops.rename,
                        unlink: MEMFS.node_ops.unlink,
                        rmdir: MEMFS.node_ops.rmdir,
                        readdir: MEMFS.node_ops.readdir,
                        symlink: MEMFS.node_ops.symlink
                    },
                    stream: {
                        llseek: MEMFS.stream_ops.llseek
                    }
                },
                file: {
                    node: {
                        getattr: MEMFS.node_ops.getattr,
                        setattr: MEMFS.node_ops.setattr
                    },
                    stream: {
                        llseek: MEMFS.stream_ops.llseek,
                        read: MEMFS.stream_ops.read,
                        write: MEMFS.stream_ops.write,
                        allocate: MEMFS.stream_ops.allocate,
                        mmap: MEMFS.stream_ops.mmap,
                        msync: MEMFS.stream_ops.msync
                    }
                },
                link: {
                    node: {
                        getattr: MEMFS.node_ops.getattr,
                        setattr: MEMFS.node_ops.setattr,
                        readlink: MEMFS.node_ops.readlink
                    },
                    stream: {}
                },
                chrdev: {
                    node: {
                        getattr: MEMFS.node_ops.getattr,
                        setattr: MEMFS.node_ops.setattr
                    },
                    stream: FS.chrdev_stream_ops
                }
            }
        }
        var node = FS.createNode(parent, name, mode, dev);
        if (FS.isDir(node.mode)) {
            node.node_ops = MEMFS.ops_table.dir.node;
            node.stream_ops = MEMFS.ops_table.dir.stream;
            node.contents = {}
        } else if (FS.isFile(node.mode)) {
            node.node_ops = MEMFS.ops_table.file.node;
            node.stream_ops = MEMFS.ops_table.file.stream;
            node.usedBytes = 0;
            node.contents = null
        } else if (FS.isLink(node.mode)) {
            node.node_ops = MEMFS.ops_table.link.node;
            node.stream_ops = MEMFS.ops_table.link.stream
        } else if (FS.isChrdev(node.mode)) {
            node.node_ops = MEMFS.ops_table.chrdev.node;
            node.stream_ops = MEMFS.ops_table.chrdev.stream
        }
        node.timestamp = Date.now();
        if (parent) {
            parent.contents[name] = node
        }
        return node
    },
    getFileDataAsRegularArray: function(node) {
        if (node.contents && node.contents.subarray) {
            var arr = [];
            for (var i = 0; i < node.usedBytes; ++i) arr.push(node.contents[i]);
            return arr
        }
        return node.contents
    },
    getFileDataAsTypedArray: function(node) {
        if (!node.contents) return new Uint8Array;
        if (node.contents.subarray) return node.contents.subarray(0, node.usedBytes);
        return new Uint8Array(node.contents)
    },
    expandFileStorage: function(node, newCapacity) {
        var prevCapacity = node.contents ? node.contents.length : 0;
        if (prevCapacity >= newCapacity) return;
        var CAPACITY_DOUBLING_MAX = 1024 * 1024;
        newCapacity = Math.max(newCapacity, prevCapacity * (prevCapacity < CAPACITY_DOUBLING_MAX ? 2 : 1.125) | 0);
        if (prevCapacity != 0) newCapacity = Math.max(newCapacity, 256);
        var oldContents = node.contents;
        node.contents = new Uint8Array(newCapacity);
        if (node.usedBytes > 0) node.contents.set(oldContents.subarray(0, node.usedBytes), 0);
        return
    },
    resizeFileStorage: function(node, newSize) {
        if (node.usedBytes == newSize) return;
        if (newSize == 0) {
            node.contents = null;
            node.usedBytes = 0;
            return
        }
        if (!node.contents || node.contents.subarray) {
            var oldContents = node.contents;
            node.contents = new Uint8Array(new ArrayBuffer(newSize));
            if (oldContents) {
                node.contents.set(oldContents.subarray(0, Math.min(newSize, node.usedBytes)))
            }
            node.usedBytes = newSize;
            return
        }
        if (!node.contents) node.contents = [];
        if (node.contents.length > newSize) node.contents.length = newSize;
        else
            while (node.contents.length < newSize) node.contents.push(0);
        node.usedBytes = newSize
    },
    node_ops: {
        getattr: function(node) {
            var attr = {};
            attr.dev = FS.isChrdev(node.mode) ? node.id : 1;
            attr.ino = node.id;
            attr.mode = node.mode;
            attr.nlink = 1;
            attr.uid = 0;
            attr.gid = 0;
            attr.rdev = node.rdev;
            if (FS.isDir(node.mode)) {
                attr.size = 4096
            } else if (FS.isFile(node.mode)) {
                attr.size = node.usedBytes
            } else if (FS.isLink(node.mode)) {
                attr.size = node.link.length
            } else {
                attr.size = 0
            }
            attr.atime = new Date(node.timestamp);
            attr.mtime = new Date(node.timestamp);
            attr.ctime = new Date(node.timestamp);
            attr.blksize = 4096;
            attr.blocks = Math.ceil(attr.size / attr.blksize);
            return attr
        },
        setattr: function(node, attr) {
            if (attr.mode !== undefined) {
                node.mode = attr.mode
            }
            if (attr.timestamp !== undefined) {
                node.timestamp = attr.timestamp
            }
            if (attr.size !== undefined) {
                MEMFS.resizeFileStorage(node, attr.size)
            }
        },
        lookup: function(parent, name) {
            throw FS.genericErrors[44]
        },
        mknod: function(parent, name, mode, dev) {
            return MEMFS.createNode(parent, name, mode, dev)
        },
        rename: function(old_node, new_dir, new_name) {
            if (FS.isDir(old_node.mode)) {
                var new_node;
                try {
                    new_node = FS.lookupNode(new_dir, new_name)
                } catch (e) {}
                if (new_node) {
                    for (var i in new_node.contents) {
                        throw new FS.ErrnoError(55)
                    }
                }
            }
            delete old_node.parent.contents[old_node.name];
            old_node.name = new_name;
            new_dir.contents[new_name] = old_node;
            old_node.parent = new_dir
        },
        unlink: function(parent, name) {
            delete parent.contents[name]
        },
        rmdir: function(parent, name) {
            var node = FS.lookupNode(parent, name);
            for (var i in node.contents) {
                throw new FS.ErrnoError(55)
            }
            delete parent.contents[name]
        },
        readdir: function(node) {
            var entries = [".", ".."];
            for (var key in node.contents) {
                if (!node.contents.hasOwnProperty(key)) {
                    continue
                }
                entries.push(key)
            }
            return entries
        },
        symlink: function(parent, newname, oldpath) {
            var node = MEMFS.createNode(parent, newname, 511 | 40960, 0);
            node.link = oldpath;
            return node
        },
        readlink: function(node) {
            if (!FS.isLink(node.mode)) {
                throw new FS.ErrnoError(28)
            }
            return node.link
        }
    },
    stream_ops: {
        read: function(stream, buffer, offset, length, position) {
            var contents = stream.node.contents;
            if (position >= stream.node.usedBytes) return 0;
            var size = Math.min(stream.node.usedBytes - position, length);
            assert(size >= 0);
            if (size > 8 && contents.subarray) {
                buffer.set(contents.subarray(position, position + size), offset)
            } else {
                for (var i = 0; i < size; i++) buffer[offset + i] = contents[position + i]
            }
            return size
        },
        write: function(stream, buffer, offset, length, position, canOwn) {
            if (!length) return 0;
            var node = stream.node;
            node.timestamp = Date.now();
            if (buffer.subarray && (!node.contents || node.contents.subarray)) {
                if (canOwn) {
                    assert(position === 0, "canOwn must imply no weird position inside the file");
                    node.contents = buffer.subarray(offset, offset + length);
                    node.usedBytes = length;
                    return length
                } else if (node.usedBytes === 0 && position === 0) {
                    node.contents = new Uint8Array(buffer.subarray(offset, offset + length));
                    node.usedBytes = length;
                    return length
                } else if (position + length <= node.usedBytes) {
                    node.contents.set(buffer.subarray(offset, offset + length), position);
                    return length
                }
            }
            MEMFS.expandFileStorage(node, position + length);
            if (node.contents.subarray && buffer.subarray) node.contents.set(buffer.subarray(offset, offset + length), position);
            else {
                for (var i = 0; i < length; i++) {
                    node.contents[position + i] = buffer[offset + i]
                }
            }
            node.usedBytes = Math.max(node.usedBytes, position + length);
            return length
        },
        llseek: function(stream, offset, whence) {
            var position = offset;
            if (whence === 1) {
                position += stream.position
            } else if (whence === 2) {
                if (FS.isFile(stream.node.mode)) {
                    position += stream.node.usedBytes
                }
            }
            if (position < 0) {
                throw new FS.ErrnoError(28)
            }
            return position
        },
        allocate: function(stream, offset, length) {
            MEMFS.expandFileStorage(stream.node, offset + length);
            stream.node.usedBytes = Math.max(stream.node.usedBytes, offset + length)
        },
        mmap: function(stream, buffer, offset, length, position, prot, flags) {
            if (!FS.isFile(stream.node.mode)) {
                throw new FS.ErrnoError(43)
            }
            var ptr;
            var allocated;
            var contents = stream.node.contents;
            if (!(flags & 2) && (contents.buffer === buffer || contents.buffer === buffer.buffer)) {
                allocated = false;
                ptr = contents.byteOffset
            } else {
                if (position > 0 || position + length < stream.node.usedBytes) {
                    if (contents.subarray) {
                        contents = contents.subarray(position, position + length)
                    } else {
                        contents = Array.prototype.slice.call(contents, position, position + length)
                    }
                }
                allocated = true;
                var fromHeap = buffer.buffer == HEAP8.buffer;
                ptr = _malloc(length);
                if (!ptr) {
                    throw new FS.ErrnoError(48)
                }(fromHeap ? HEAP8 : buffer).set(contents, ptr)
            }
            return {
                ptr: ptr,
                allocated: allocated
            }
        },
        msync: function(stream, buffer, offset, length, mmapFlags) {
            if (!FS.isFile(stream.node.mode)) {
                throw new FS.ErrnoError(43)
            }
            if (mmapFlags & 2) {
                return 0
            }
            var bytesWritten = MEMFS.stream_ops.write(stream, buffer, 0, length, offset, false);
            return 0
        }
    }
};
var IDBFS = {
    dbs: {},
    indexedDB: function() {
        if (typeof indexedDB !== "undefined") return indexedDB;
        var ret = null;
        if (typeof window === "object") ret = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
        assert(ret, "IDBFS used, but indexedDB not supported");
        return ret
    },
    DB_VERSION: 21,
    DB_STORE_NAME: "FILE_DATA",
    mount: function(mount) {
        return MEMFS.mount.apply(null, arguments)
    },
    syncfs: function(mount, populate, callback) {
        IDBFS.getLocalSet(mount, function(err, local) {
            if (err) return callback(err);
            IDBFS.getRemoteSet(mount, function(err, remote) {
                if (err) return callback(err);
                var src = populate ? remote : local;
                var dst = populate ? local : remote;
                IDBFS.reconcile(src, dst, callback)
            })
        })
    },
    getDB: function(name, callback) {
        var db = IDBFS.dbs[name];
        if (db) {
            return callback(null, db)
        }
        var req;
        try {
            req = IDBFS.indexedDB().open(name, IDBFS.DB_VERSION)
        } catch (e) {
            return callback(e)
        }
        if (!req) {
            return callback("Unable to connect to IndexedDB")
        }
        req.onupgradeneeded = function(e) {
            var db = e.target.result;
            var transaction = e.target.transaction;
            var fileStore;
            if (db.objectStoreNames.contains(IDBFS.DB_STORE_NAME)) {
                fileStore = transaction.objectStore(IDBFS.DB_STORE_NAME)
            } else {
                fileStore = db.createObjectStore(IDBFS.DB_STORE_NAME)
            }
            if (!fileStore.indexNames.contains("timestamp")) {
                fileStore.createIndex("timestamp", "timestamp", {
                    unique: false
                })
            }
        };
        req.onsuccess = function() {
            db = req.result;
            IDBFS.dbs[name] = db;
            callback(null, db)
        };
        req.onerror = function(e) {
            callback(this.error);
            e.preventDefault()
        }
    },
    getLocalSet: function(mount, callback) {
        var entries = {};

        function isRealDir(p) {
            return p !== "." && p !== ".."
        }

        function toAbsolute(root) {
            return function(p) {
                return PATH.join2(root, p)
            }
        }
        var check = FS.readdir(mount.mountpoint).filter(isRealDir).map(toAbsolute(mount.mountpoint));
        while (check.length) {
            var path = check.pop();
            var stat;
            try {
                stat = FS.stat(path)
            } catch (e) {
                return callback(e)
            }
            if (FS.isDir(stat.mode)) {
                check.push.apply(check, FS.readdir(path).filter(isRealDir).map(toAbsolute(path)))
            }
            entries[path] = {
                timestamp: stat.mtime
            }
        }
        return callback(null, {
            type: "local",
            entries: entries
        })
    },
    getRemoteSet: function(mount, callback) {
        var entries = {};
        IDBFS.getDB(mount.mountpoint, function(err, db) {
            if (err) return callback(err);
            try {
                var transaction = db.transaction([IDBFS.DB_STORE_NAME], "readonly");
                transaction.onerror = function(e) {
                    callback(this.error);
                    e.preventDefault()
                };
                var store = transaction.objectStore(IDBFS.DB_STORE_NAME);
                var index = store.index("timestamp");
                index.openKeyCursor().onsuccess = function(event) {
                    var cursor = event.target.result;
                    if (!cursor) {
                        return callback(null, {
                            type: "remote",
                            db: db,
                            entries: entries
                        })
                    }
                    entries[cursor.primaryKey] = {
                        timestamp: cursor.key
                    };
                    cursor.continue()
                }
            } catch (e) {
                return callback(e)
            }
        })
    },
    loadLocalEntry: function(path, callback) {
        var stat, node;
        try {
            var lookup = FS.lookupPath(path);
            node = lookup.node;
            stat = FS.stat(path)
        } catch (e) {
            return callback(e)
        }
        if (FS.isDir(stat.mode)) {
            return callback(null, {
                timestamp: stat.mtime,
                mode: stat.mode
            })
        } else if (FS.isFile(stat.mode)) {
            node.contents = MEMFS.getFileDataAsTypedArray(node);
            return callback(null, {
                timestamp: stat.mtime,
                mode: stat.mode,
                contents: node.contents
            })
        } else {
            return callback(new Error("node type not supported"))
        }
    },
    storeLocalEntry: function(path, entry, callback) {
        try {
            if (FS.isDir(entry.mode)) {
                FS.mkdir(path, entry.mode)
            } else if (FS.isFile(entry.mode)) {
                FS.writeFile(path, entry.contents, {
                    canOwn: true
                })
            } else {
                return callback(new Error("node type not supported"))
            }
            FS.chmod(path, entry.mode);
            FS.utime(path, entry.timestamp, entry.timestamp)
        } catch (e) {
            return callback(e)
        }
        callback(null)
    },
    removeLocalEntry: function(path, callback) {
        try {
            var lookup = FS.lookupPath(path);
            var stat = FS.stat(path);
            if (FS.isDir(stat.mode)) {
                FS.rmdir(path)
            } else if (FS.isFile(stat.mode)) {
                FS.unlink(path)
            }
        } catch (e) {
            return callback(e)
        }
        callback(null)
    },
    loadRemoteEntry: function(store, path, callback) {
        var req = store.get(path);
        req.onsuccess = function(event) {
            callback(null, event.target.result)
        };
        req.onerror = function(e) {
            callback(this.error);
            e.preventDefault()
        }
    },
    storeRemoteEntry: function(store, path, entry, callback) {
        var req = store.put(entry, path);
        req.onsuccess = function() {
            callback(null)
        };
        req.onerror = function(e) {
            callback(this.error);
            e.preventDefault()
        }
    },
    removeRemoteEntry: function(store, path, callback) {
        var req = store.delete(path);
        req.onsuccess = function() {
            callback(null)
        };
        req.onerror = function(e) {
            callback(this.error);
            e.preventDefault()
        }
    },
    reconcile: function(src, dst, callback) {
        var total = 0;
        var create = [];
        Object.keys(src.entries).forEach(function(key) {
            var e = src.entries[key];
            var e2 = dst.entries[key];
            if (!e2 || e.timestamp > e2.timestamp) {
                create.push(key);
                total++
            }
        });
        var remove = [];
        Object.keys(dst.entries).forEach(function(key) {
            var e = dst.entries[key];
            var e2 = src.entries[key];
            if (!e2) {
                remove.push(key);
                total++
            }
        });
        if (!total) {
            return callback(null)
        }
        var errored = false;
        var db = src.type === "remote" ? src.db : dst.db;
        var transaction = db.transaction([IDBFS.DB_STORE_NAME], "readwrite");
        var store = transaction.objectStore(IDBFS.DB_STORE_NAME);

        function done(err) {
            if (err && !errored) {
                errored = true;
                return callback(err)
            }
        }
        transaction.onerror = function(e) {
            done(this.error);
            e.preventDefault()
        };
        transaction.oncomplete = function(e) {
            if (!errored) {
                callback(null)
            }
        };
        create.sort().forEach(function(path) {
            if (dst.type === "local") {
                IDBFS.loadRemoteEntry(store, path, function(err, entry) {
                    if (err) return done(err);
                    IDBFS.storeLocalEntry(path, entry, done)
                })
            } else {
                IDBFS.loadLocalEntry(path, function(err, entry) {
                    if (err) return done(err);
                    IDBFS.storeRemoteEntry(store, path, entry, done)
                })
            }
        });
        remove.sort().reverse().forEach(function(path) {
            if (dst.type === "local") {
                IDBFS.removeLocalEntry(path, done)
            } else {
                IDBFS.removeRemoteEntry(store, path, done)
            }
        })
    }
};
var ERRNO_CODES = {
    EPERM: 63,
    ENOENT: 44,
    ESRCH: 71,
    EINTR: 27,
    EIO: 29,
    ENXIO: 60,
    E2BIG: 1,
    ENOEXEC: 45,
    EBADF: 8,
    ECHILD: 12,
    EAGAIN: 6,
    EWOULDBLOCK: 6,
    ENOMEM: 48,
    EACCES: 2,
    EFAULT: 21,
    ENOTBLK: 105,
    EBUSY: 10,
    EEXIST: 20,
    EXDEV: 75,
    ENODEV: 43,
    ENOTDIR: 54,
    EISDIR: 31,
    EINVAL: 28,
    ENFILE: 41,
    EMFILE: 33,
    ENOTTY: 59,
    ETXTBSY: 74,
    EFBIG: 22,
    ENOSPC: 51,
    ESPIPE: 70,
    EROFS: 69,
    EMLINK: 34,
    EPIPE: 64,
    EDOM: 18,
    ERANGE: 68,
    ENOMSG: 49,
    EIDRM: 24,
    ECHRNG: 106,
    EL2NSYNC: 156,
    EL3HLT: 107,
    EL3RST: 108,
    ELNRNG: 109,
    EUNATCH: 110,
    ENOCSI: 111,
    EL2HLT: 112,
    EDEADLK: 16,
    ENOLCK: 46,
    EBADE: 113,
    EBADR: 114,
    EXFULL: 115,
    ENOANO: 104,
    EBADRQC: 103,
    EBADSLT: 102,
    EDEADLOCK: 16,
    EBFONT: 101,
    ENOSTR: 100,
    ENODATA: 116,
    ETIME: 117,
    ENOSR: 118,
    ENONET: 119,
    ENOPKG: 120,
    EREMOTE: 121,
    ENOLINK: 47,
    EADV: 122,
    ESRMNT: 123,
    ECOMM: 124,
    EPROTO: 65,
    EMULTIHOP: 36,
    EDOTDOT: 125,
    EBADMSG: 9,
    ENOTUNIQ: 126,
    EBADFD: 127,
    EREMCHG: 128,
    ELIBACC: 129,
    ELIBBAD: 130,
    ELIBSCN: 131,
    ELIBMAX: 132,
    ELIBEXEC: 133,
    ENOSYS: 52,
    ENOTEMPTY: 55,
    ENAMETOOLONG: 37,
    ELOOP: 32,
    EOPNOTSUPP: 138,
    EPFNOSUPPORT: 139,
    ECONNRESET: 15,
    ENOBUFS: 42,
    EAFNOSUPPORT: 5,
    EPROTOTYPE: 67,
    ENOTSOCK: 57,
    ENOPROTOOPT: 50,
    ESHUTDOWN: 140,
    ECONNREFUSED: 14,
    EADDRINUSE: 3,
    ECONNABORTED: 13,
    ENETUNREACH: 40,
    ENETDOWN: 38,
    ETIMEDOUT: 73,
    EHOSTDOWN: 142,
    EHOSTUNREACH: 23,
    EINPROGRESS: 26,
    EALREADY: 7,
    EDESTADDRREQ: 17,
    EMSGSIZE: 35,
    EPROTONOSUPPORT: 66,
    ESOCKTNOSUPPORT: 137,
    EADDRNOTAVAIL: 4,
    ENETRESET: 39,
    EISCONN: 30,
    ENOTCONN: 53,
    ETOOMANYREFS: 141,
    EUSERS: 136,
    EDQUOT: 19,
    ESTALE: 72,
    ENOTSUP: 138,
    ENOMEDIUM: 148,
    EILSEQ: 25,
    EOVERFLOW: 61,
    ECANCELED: 11,
    ENOTRECOVERABLE: 56,
    EOWNERDEAD: 62,
    ESTRPIPE: 135
};
var NODEFS = {
    isWindows: false,
    staticInit: function() {
        NODEFS.isWindows = !!process.platform.match(/^win/);
        var flags = process["binding"]("constants");
        if (flags["fs"]) {
            flags = flags["fs"]
        }
        NODEFS.flagsForNodeMap = {
            1024: flags["O_APPEND"],
            64: flags["O_CREAT"],
            128: flags["O_EXCL"],
            0: flags["O_RDONLY"],
            2: flags["O_RDWR"],
            4096: flags["O_SYNC"],
            512: flags["O_TRUNC"],
            1: flags["O_WRONLY"]
        }
    },
    bufferFrom: function(arrayBuffer) {
        return Buffer["alloc"] ? Buffer.from(arrayBuffer) : new Buffer(arrayBuffer)
    },
    convertNodeCode: function(e) {
        var code = e.code;
        assert(code in ERRNO_CODES);
        return ERRNO_CODES[code]
    },
    mount: function(mount) {
        assert(ENVIRONMENT_HAS_NODE);
        return NODEFS.createNode(null, "/", NODEFS.getMode(mount.opts.root), 0)
    },
    createNode: function(parent, name, mode, dev) {
        if (!FS.isDir(mode) && !FS.isFile(mode) && !FS.isLink(mode)) {
            throw new FS.ErrnoError(28)
        }
        var node = FS.createNode(parent, name, mode);
        node.node_ops = NODEFS.node_ops;
        node.stream_ops = NODEFS.stream_ops;
        return node
    },
    getMode: function(path) {
        var stat;
        try {
            stat = fs.lstatSync(path);
            if (NODEFS.isWindows) {
                stat.mode = stat.mode | (stat.mode & 292) >> 2
            }
        } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(NODEFS.convertNodeCode(e))
        }
        return stat.mode
    },
    realPath: function(node) {
        var parts = [];
        while (node.parent !== node) {
            parts.push(node.name);
            node = node.parent
        }
        parts.push(node.mount.opts.root);
        parts.reverse();
        return PATH.join.apply(null, parts)
    },
    flagsForNode: function(flags) {
        flags &= ~2097152;
        flags &= ~2048;
        flags &= ~32768;
        flags &= ~524288;
        var newFlags = 0;
        for (var k in NODEFS.flagsForNodeMap) {
            if (flags & k) {
                newFlags |= NODEFS.flagsForNodeMap[k];
                flags ^= k
            }
        }
        if (!flags) {
            return newFlags
        } else {
            throw new FS.ErrnoError(28)
        }
    },
    node_ops: {
        getattr: function(node) {
            var path = NODEFS.realPath(node);
            var stat;
            try {
                stat = fs.lstatSync(path)
            } catch (e) {
                if (!e.code) throw e;
                throw new FS.ErrnoError(NODEFS.convertNodeCode(e))
            }
            if (NODEFS.isWindows && !stat.blksize) {
                stat.blksize = 4096
            }
            if (NODEFS.isWindows && !stat.blocks) {
                stat.blocks = (stat.size + stat.blksize - 1) / stat.blksize | 0
            }
            return {
                dev: stat.dev,
                ino: stat.ino,
                mode: stat.mode,
                nlink: stat.nlink,
                uid: stat.uid,
                gid: stat.gid,
                rdev: stat.rdev,
                size: stat.size,
                atime: stat.atime,
                mtime: stat.mtime,
                ctime: stat.ctime,
                blksize: stat.blksize,
                blocks: stat.blocks
            }
        },
        setattr: function(node, attr) {
            var path = NODEFS.realPath(node);
            try {
                if (attr.mode !== undefined) {
                    fs.chmodSync(path, attr.mode);
                    node.mode = attr.mode
                }
                if (attr.timestamp !== undefined) {
                    var date = new Date(attr.timestamp);
                    fs.utimesSync(path, date, date)
                }
                if (attr.size !== undefined) {
                    fs.truncateSync(path, attr.size)
                }
            } catch (e) {
                if (!e.code) throw e;
                throw new FS.ErrnoError(NODEFS.convertNodeCode(e))
            }
        },
        lookup: function(parent, name) {
            var path = PATH.join2(NODEFS.realPath(parent), name);
            var mode = NODEFS.getMode(path);
            return NODEFS.createNode(parent, name, mode)
        },
        mknod: function(parent, name, mode, dev) {
            var node = NODEFS.createNode(parent, name, mode, dev);
            var path = NODEFS.realPath(node);
            try {
                if (FS.isDir(node.mode)) {
                    fs.mkdirSync(path, node.mode)
                } else {
                    fs.writeFileSync(path, "", {
                        mode: node.mode
                    })
                }
            } catch (e) {
                if (!e.code) throw e;
                throw new FS.ErrnoError(NODEFS.convertNodeCode(e))
            }
            return node
        },
        rename: function(oldNode, newDir, newName) {
            var oldPath = NODEFS.realPath(oldNode);
            var newPath = PATH.join2(NODEFS.realPath(newDir), newName);
            try {
                fs.renameSync(oldPath, newPath)
            } catch (e) {
                if (!e.code) throw e;
                throw new FS.ErrnoError(NODEFS.convertNodeCode(e))
            }
        },
        unlink: function(parent, name) {
            var path = PATH.join2(NODEFS.realPath(parent), name);
            try {
                fs.unlinkSync(path)
            } catch (e) {
                if (!e.code) throw e;
                throw new FS.ErrnoError(NODEFS.convertNodeCode(e))
            }
        },
        rmdir: function(parent, name) {
            var path = PATH.join2(NODEFS.realPath(parent), name);
            try {
                fs.rmdirSync(path)
            } catch (e) {
                if (!e.code) throw e;
                throw new FS.ErrnoError(NODEFS.convertNodeCode(e))
            }
        },
        readdir: function(node) {
            var path = NODEFS.realPath(node);
            try {
                return fs.readdirSync(path)
            } catch (e) {
                if (!e.code) throw e;
                throw new FS.ErrnoError(NODEFS.convertNodeCode(e))
            }
        },
        symlink: function(parent, newName, oldPath) {
            var newPath = PATH.join2(NODEFS.realPath(parent), newName);
            try {
                fs.symlinkSync(oldPath, newPath)
            } catch (e) {
                if (!e.code) throw e;
                throw new FS.ErrnoError(NODEFS.convertNodeCode(e))
            }
        },
        readlink: function(node) {
            var path = NODEFS.realPath(node);
            try {
                path = fs.readlinkSync(path);
                path = NODEJS_PATH.relative(NODEJS_PATH.resolve(node.mount.opts.root), path);
                return path
            } catch (e) {
                if (!e.code) throw e;
                throw new FS.ErrnoError(NODEFS.convertNodeCode(e))
            }
        }
    },
    stream_ops: {
        open: function(stream) {
            var path = NODEFS.realPath(stream.node);
            try {
                if (FS.isFile(stream.node.mode)) {
                    stream.nfd = fs.openSync(path, NODEFS.flagsForNode(stream.flags))
                }
            } catch (e) {
                if (!e.code) throw e;
                throw new FS.ErrnoError(NODEFS.convertNodeCode(e))
            }
        },
        close: function(stream) {
            try {
                if (FS.isFile(stream.node.mode) && stream.nfd) {
                    fs.closeSync(stream.nfd)
                }
            } catch (e) {
                if (!e.code) throw e;
                throw new FS.ErrnoError(NODEFS.convertNodeCode(e))
            }
        },
        read: function(stream, buffer, offset, length, position) {
            if (length === 0) return 0;
            try {
                return fs.readSync(stream.nfd, NODEFS.bufferFrom(buffer.buffer), offset, length, position)
            } catch (e) {
                throw new FS.ErrnoError(NODEFS.convertNodeCode(e))
            }
        },
        write: function(stream, buffer, offset, length, position) {
            try {
                return fs.writeSync(stream.nfd, NODEFS.bufferFrom(buffer.buffer), offset, length, position)
            } catch (e) {
                throw new FS.ErrnoError(NODEFS.convertNodeCode(e))
            }
        },
        llseek: function(stream, offset, whence) {
            var position = offset;
            if (whence === 1) {
                position += stream.position
            } else if (whence === 2) {
                if (FS.isFile(stream.node.mode)) {
                    try {
                        var stat = fs.fstatSync(stream.nfd);
                        position += stat.size
                    } catch (e) {
                        throw new FS.ErrnoError(NODEFS.convertNodeCode(e))
                    }
                }
            }
            if (position < 0) {
                throw new FS.ErrnoError(28)
            }
            return position
        }
    }
};
var WORKERFS = {
    DIR_MODE: 16895,
    FILE_MODE: 33279,
    reader: null,
    mount: function(mount) {
        assert(ENVIRONMENT_IS_WORKER);
        if (!WORKERFS.reader) WORKERFS.reader = new FileReaderSync;
        var root = WORKERFS.createNode(null, "/", WORKERFS.DIR_MODE, 0);
        var createdParents = {};

        function ensureParent(path) {
            var parts = path.split("/");
            var parent = root;
            for (var i = 0; i < parts.length - 1; i++) {
                var curr = parts.slice(0, i + 1).join("/");
                if (!createdParents[curr]) {
                    createdParents[curr] = WORKERFS.createNode(parent, parts[i], WORKERFS.DIR_MODE, 0)
                }
                parent = createdParents[curr]
            }
            return parent
        }

        function base(path) {
            var parts = path.split("/");
            return parts[parts.length - 1]
        }
        Array.prototype.forEach.call(mount.opts["files"] || [], function(file) {
            WORKERFS.createNode(ensureParent(file.name), base(file.name), WORKERFS.FILE_MODE, 0, file, file.lastModifiedDate)
        });
        (mount.opts["blobs"] || []).forEach(function(obj) {
            WORKERFS.createNode(ensureParent(obj["name"]), base(obj["name"]), WORKERFS.FILE_MODE, 0, obj["data"])
        });
        (mount.opts["packages"] || []).forEach(function(pack) {
            pack["metadata"].files.forEach(function(file) {
                var name = file.filename.substr(1);
                WORKERFS.createNode(ensureParent(name), base(name), WORKERFS.FILE_MODE, 0, pack["blob"].slice(file.start, file.end))
            })
        });
        return root
    },
    createNode: function(parent, name, mode, dev, contents, mtime) {
        var node = FS.createNode(parent, name, mode);
        node.mode = mode;
        node.node_ops = WORKERFS.node_ops;
        node.stream_ops = WORKERFS.stream_ops;
        node.timestamp = (mtime || new Date).getTime();
        assert(WORKERFS.FILE_MODE !== WORKERFS.DIR_MODE);
        if (mode === WORKERFS.FILE_MODE) {
            node.size = contents.size;
            node.contents = contents
        } else {
            node.size = 4096;
            node.contents = {}
        }
        if (parent) {
            parent.contents[name] = node
        }
        return node
    },
    node_ops: {
        getattr: function(node) {
            return {
                dev: 1,
                ino: undefined,
                mode: node.mode,
                nlink: 1,
                uid: 0,
                gid: 0,
                rdev: undefined,
                size: node.size,
                atime: new Date(node.timestamp),
                mtime: new Date(node.timestamp),
                ctime: new Date(node.timestamp),
                blksize: 4096,
                blocks: Math.ceil(node.size / 4096)
            }
        },
        setattr: function(node, attr) {
            if (attr.mode !== undefined) {
                node.mode = attr.mode
            }
            if (attr.timestamp !== undefined) {
                node.timestamp = attr.timestamp
            }
        },
        lookup: function(parent, name) {
            throw new FS.ErrnoError(44)
        },
        mknod: function(parent, name, mode, dev) {
            throw new FS.ErrnoError(63)
        },
        rename: function(oldNode, newDir, newName) {
            throw new FS.ErrnoError(63)
        },
        unlink: function(parent, name) {
            throw new FS.ErrnoError(63)
        },
        rmdir: function(parent, name) {
            throw new FS.ErrnoError(63)
        },
        readdir: function(node) {
            var entries = [".", ".."];
            for (var key in node.contents) {
                if (!node.contents.hasOwnProperty(key)) {
                    continue
                }
                entries.push(key)
            }
            return entries
        },
        symlink: function(parent, newName, oldPath) {
            throw new FS.ErrnoError(63)
        },
        readlink: function(node) {
            throw new FS.ErrnoError(63)
        }
    },
    stream_ops: {
        read: function(stream, buffer, offset, length, position) {
            if (position >= stream.node.size) return 0;
            var chunk = stream.node.contents.slice(position, position + length);
            var ab = WORKERFS.reader.readAsArrayBuffer(chunk);
            buffer.set(new Uint8Array(ab), offset);
            return chunk.size
        },
        write: function(stream, buffer, offset, length, position) {
            throw new FS.ErrnoError(29)
        },
        llseek: function(stream, offset, whence) {
            var position = offset;
            if (whence === 1) {
                position += stream.position
            } else if (whence === 2) {
                if (FS.isFile(stream.node.mode)) {
                    position += stream.node.size
                }
            }
            if (position < 0) {
                throw new FS.ErrnoError(28)
            }
            return position
        }
    }
};
var ERRNO_MESSAGES = {
    0: "Success",
    1: "Arg list too long",
    2: "Permission denied",
    3: "Address already in use",
    4: "Address not available",
    5: "Address family not supported by protocol family",
    6: "No more processes",
    7: "Socket already connected",
    8: "Bad file number",
    9: "Trying to read unreadable message",
    10: "Mount device busy",
    11: "Operation canceled",
    12: "No children",
    13: "Connection aborted",
    14: "Connection refused",
    15: "Connection reset by peer",
    16: "File locking deadlock error",
    17: "Destination address required",
    18: "Math arg out of domain of func",
    19: "Quota exceeded",
    20: "File exists",
    21: "Bad address",
    22: "File too large",
    23: "Host is unreachable",
    24: "Identifier removed",
    25: "Illegal byte sequence",
    26: "Connection already in progress",
    27: "Interrupted system call",
    28: "Invalid argument",
    29: "I/O error",
    30: "Socket is already connected",
    31: "Is a directory",
    32: "Too many symbolic links",
    33: "Too many open files",
    34: "Too many links",
    35: "Message too long",
    36: "Multihop attempted",
    37: "File or path name too long",
    38: "Network interface is not configured",
    39: "Connection reset by network",
    40: "Network is unreachable",
    41: "Too many open files in system",
    42: "No buffer space available",
    43: "No such device",
    44: "No such file or directory",
    45: "Exec format error",
    46: "No record locks available",
    47: "The link has been severed",
    48: "Not enough core",
    49: "No message of desired type",
    50: "Protocol not available",
    51: "No space left on device",
    52: "Function not implemented",
    53: "Socket is not connected",
    54: "Not a directory",
    55: "Directory not empty",
    56: "State not recoverable",
    57: "Socket operation on non-socket",
    59: "Not a typewriter",
    60: "No such device or address",
    61: "Value too large for defined data type",
    62: "Previous owner died",
    63: "Not super-user",
    64: "Broken pipe",
    65: "Protocol error",
    66: "Unknown protocol",
    67: "Protocol wrong type for socket",
    68: "Math result not representable",
    69: "Read only file system",
    70: "Illegal seek",
    71: "No such process",
    72: "Stale file handle",
    73: "Connection timed out",
    74: "Text file busy",
    75: "Cross-device link",
    100: "Device not a stream",
    101: "Bad font file fmt",
    102: "Invalid slot",
    103: "Invalid request code",
    104: "No anode",
    105: "Block device required",
    106: "Channel number out of range",
    107: "Level 3 halted",
    108: "Level 3 reset",
    109: "Link number out of range",
    110: "Protocol driver not attached",
    111: "No CSI structure available",
    112: "Level 2 halted",
    113: "Invalid exchange",
    114: "Invalid request descriptor",
    115: "Exchange full",
    116: "No data (for no delay io)",
    117: "Timer expired",
    118: "Out of streams resources",
    119: "Machine is not on the network",
    120: "Package not installed",
    121: "The object is remote",
    122: "Advertise error",
    123: "Srmount error",
    124: "Communication error on send",
    125: "Cross mount point (not really error)",
    126: "Given log. name not unique",
    127: "f.d. invalid for this operation",
    128: "Remote address changed",
    129: "Can   access a needed shared lib",
    130: "Accessing a corrupted shared lib",
    131: ".lib section in a.out corrupted",
    132: "Attempting to link in too many libs",
    133: "Attempting to exec a shared library",
    135: "Streams pipe error",
    136: "Too many users",
    137: "Socket type not supported",
    138: "Not supported",
    139: "Protocol family not supported",
    140: "Can't send after socket shutdown",
    141: "Too many references",
    142: "Host is down",
    148: "No medium (in tape drive)",
    156: "Level 2 not synchronized"
};
var FS = {
    root: null,
    mounts: [],
    devices: {},
    streams: [],
    nextInode: 1,
    nameTable: null,
    currentPath: "/",
    initialized: false,
    ignorePermissions: true,
    trackingDelegate: {},
    tracking: {
        openFlags: {
            READ: 1,
            WRITE: 2
        }
    },
    ErrnoError: null,
    genericErrors: {},
    filesystems: null,
    syncFSRequests: 0,
    handleFSError: function(e) {
        if (!(e instanceof FS.ErrnoError)) throw e + " : " + stackTrace();
        return ___setErrNo(e.errno)
    },
    lookupPath: function(path, opts) {
        path = PATH_FS.resolve(FS.cwd(), path);
        opts = opts || {};
        if (!path) return {
            path: "",
            node: null
        };
        var defaults = {
            follow_mount: true,
            recurse_count: 0
        };
        for (var key in defaults) {
            if (opts[key] === undefined) {
                opts[key] = defaults[key]
            }
        }
        if (opts.recurse_count > 8) {
            throw new FS.ErrnoError(32)
        }
        var parts = PATH.normalizeArray(path.split("/").filter(function(p) {
            return !!p
        }), false);
        var current = FS.root;
        var current_path = "/";
        for (var i = 0; i < parts.length; i++) {
            var islast = i === parts.length - 1;
            if (islast && opts.parent) {
                break
            }
            current = FS.lookupNode(current, parts[i]);
            current_path = PATH.join2(current_path, parts[i]);
            if (FS.isMountpoint(current)) {
                if (!islast || islast && opts.follow_mount) {
                    current = current.mounted.root
                }
            }
            if (!islast || opts.follow) {
                var count = 0;
                while (FS.isLink(current.mode)) {
                    var link = FS.readlink(current_path);
                    current_path = PATH_FS.resolve(PATH.dirname(current_path), link);
                    var lookup = FS.lookupPath(current_path, {
                        recurse_count: opts.recurse_count
                    });
                    current = lookup.node;
                    if (count++ > 40) {
                        throw new FS.ErrnoError(32)
                    }
                }
            }
        }
        return {
            path: current_path,
            node: current
        }
    },
    getPath: function(node) {
        var path;
        while (true) {
            if (FS.isRoot(node)) {
                var mount = node.mount.mountpoint;
                if (!path) return mount;
                return mount[mount.length - 1] !== "/" ? mount + "/" + path : mount + path
            }
            path = path ? node.name + "/" + path : node.name;
            node = node.parent
        }
    },
    hashName: function(parentid, name) {
        var hash = 0;
        for (var i = 0; i < name.length; i++) {
            hash = (hash << 5) - hash + name.charCodeAt(i) | 0
        }
        return (parentid + hash >>> 0) % FS.nameTable.length
    },
    hashAddNode: function(node) {
        var hash = FS.hashName(node.parent.id, node.name);
        node.name_next = FS.nameTable[hash];
        FS.nameTable[hash] = node
    },
    hashRemoveNode: function(node) {
        var hash = FS.hashName(node.parent.id, node.name);
        if (FS.nameTable[hash] === node) {
            FS.nameTable[hash] = node.name_next
        } else {
            var current = FS.nameTable[hash];
            while (current) {
                if (current.name_next === node) {
                    current.name_next = node.name_next;
                    break
                }
                current = current.name_next
            }
        }
    },
    lookupNode: function(parent, name) {
        var err = FS.mayLookup(parent);
        if (err) {
            throw new FS.ErrnoError(err, parent)
        }
        var hash = FS.hashName(parent.id, name);
        for (var node = FS.nameTable[hash]; node; node = node.name_next) {
            var nodeName = node.name;
            if (node.parent.id === parent.id && nodeName === name) {
                return node
            }
        }
        return FS.lookup(parent, name)
    },
    createNode: function(parent, name, mode, rdev) {
        if (!FS.FSNode) {
            FS.FSNode = function(parent, name, mode, rdev) {
                if (!parent) {
                    parent = this
                }
                this.parent = parent;
                this.mount = parent.mount;
                this.mounted = null;
                this.id = FS.nextInode++;
                this.name = name;
                this.mode = mode;
                this.node_ops = {};
                this.stream_ops = {};
                this.rdev = rdev
            };
            FS.FSNode.prototype = {};
            var readMode = 292 | 73;
            var writeMode = 146;
            Object.defineProperties(FS.FSNode.prototype, {
                read: {
                    get: function() {
                        return (this.mode & readMode) === readMode
                    },
                    set: function(val) {
                        val ? this.mode |= readMode : this.mode &= ~readMode
                    }
                },
                write: {
                    get: function() {
                        return (this.mode & writeMode) === writeMode
                    },
                    set: function(val) {
                        val ? this.mode |= writeMode : this.mode &= ~writeMode
                    }
                },
                isFolder: {
                    get: function() {
                        return FS.isDir(this.mode)
                    }
                },
                isDevice: {
                    get: function() {
                        return FS.isChrdev(this.mode)
                    }
                }
            })
        }
        var node = new FS.FSNode(parent, name, mode, rdev);
        FS.hashAddNode(node);
        return node
    },
    destroyNode: function(node) {
        FS.hashRemoveNode(node)
    },
    isRoot: function(node) {
        return node === node.parent
    },
    isMountpoint: function(node) {
        return !!node.mounted
    },
    isFile: function(mode) {
        return (mode & 61440) === 32768
    },
    isDir: function(mode) {
        return (mode & 61440) === 16384
    },
    isLink: function(mode) {
        return (mode & 61440) === 40960
    },
    isChrdev: function(mode) {
        return (mode & 61440) === 8192
    },
    isBlkdev: function(mode) {
        return (mode & 61440) === 24576
    },
    isFIFO: function(mode) {
        return (mode & 61440) === 4096
    },
    isSocket: function(mode) {
        return (mode & 49152) === 49152
    },
    flagModes: {
        "r": 0,
        "rs": 1052672,
        "r+": 2,
        "w": 577,
        "wx": 705,
        "xw": 705,
        "w+": 578,
        "wx+": 706,
        "xw+": 706,
        "a": 1089,
        "ax": 1217,
        "xa": 1217,
        "a+": 1090,
        "ax+": 1218,
        "xa+": 1218
    },
    modeStringToFlags: function(str) {
        var flags = FS.flagModes[str];
        if (typeof flags === "undefined") {
            throw new Error("Unknown file open mode: " + str)
        }
        return flags
    },
    flagsToPermissionString: function(flag) {
        var perms = ["r", "w", "rw"][flag & 3];
        if (flag & 512) {
            perms += "w"
        }
        return perms
    },
    nodePermissions: function(node, perms) {
        if (FS.ignorePermissions) {
            return 0
        }
        if (perms.indexOf("r") !== -1 && !(node.mode & 292)) {
            return 2
        } else if (perms.indexOf("w") !== -1 && !(node.mode & 146)) {
            return 2
        } else if (perms.indexOf("x") !== -1 && !(node.mode & 73)) {
            return 2
        }
        return 0
    },
    mayLookup: function(dir) {
        var err = FS.nodePermissions(dir, "x");
        if (err) return err;
        if (!dir.node_ops.lookup) return 2;
        return 0
    },
    mayCreate: function(dir, name) {
        try {
            var node = FS.lookupNode(dir, name);
            return 20
        } catch (e) {}
        return FS.nodePermissions(dir, "wx")
    },
    mayDelete: function(dir, name, isdir) {
        var node;
        try {
            node = FS.lookupNode(dir, name)
        } catch (e) {
            return e.errno
        }
        var err = FS.nodePermissions(dir, "wx");
        if (err) {
            return err
        }
        if (isdir) {
            if (!FS.isDir(node.mode)) {
                return 54
            }
            if (FS.isRoot(node) || FS.getPath(node) === FS.cwd()) {
                return 10
            }
        } else {
            if (FS.isDir(node.mode)) {
                return 31
            }
        }
        return 0
    },
    mayOpen: function(node, flags) {
        if (!node) {
            return 44
        }
        if (FS.isLink(node.mode)) {
            return 32
        } else if (FS.isDir(node.mode)) {
            if (FS.flagsToPermissionString(flags) !== "r" || flags & 512) {
                return 31
            }
        }
        return FS.nodePermissions(node, FS.flagsToPermissionString(flags))
    },
    MAX_OPEN_FDS: 4096,
    nextfd: function(fd_start, fd_end) {
        fd_start = fd_start || 0;
        fd_end = fd_end || FS.MAX_OPEN_FDS;
        for (var fd = fd_start; fd <= fd_end; fd++) {
            if (!FS.streams[fd]) {
                return fd
            }
        }
        throw new FS.ErrnoError(33)
    },
    getStream: function(fd) {
        return FS.streams[fd]
    },
    createStream: function(stream, fd_start, fd_end) {
        if (!FS.FSStream) {
            FS.FSStream = function() {};
            FS.FSStream.prototype = {};
            Object.defineProperties(FS.FSStream.prototype, {
                object: {
                    get: function() {
                        return this.node
                    },
                    set: function(val) {
                        this.node = val
                    }
                },
                isRead: {
                    get: function() {
                        return (this.flags & 2097155) !== 1
                    }
                },
                isWrite: {
                    get: function() {
                        return (this.flags & 2097155) !== 0
                    }
                },
                isAppend: {
                    get: function() {
                        return this.flags & 1024
                    }
                }
            })
        }
        var newStream = new FS.FSStream;
        for (var p in stream) {
            newStream[p] = stream[p]
        }
        stream = newStream;
        var fd = FS.nextfd(fd_start, fd_end);
        stream.fd = fd;
        FS.streams[fd] = stream;
        return stream
    },
    closeStream: function(fd) {
        FS.streams[fd] = null
    },
    chrdev_stream_ops: {
        open: function(stream) {
            var device = FS.getDevice(stream.node.rdev);
            stream.stream_ops = device.stream_ops;
            if (stream.stream_ops.open) {
                stream.stream_ops.open(stream)
            }
        },
        llseek: function() {
            throw new FS.ErrnoError(70)
        }
    },
    major: function(dev) {
        return dev >> 8
    },
    minor: function(dev) {
        return dev & 255
    },
    makedev: function(ma, mi) {
        return ma << 8 | mi
    },
    registerDevice: function(dev, ops) {
        FS.devices[dev] = {
            stream_ops: ops
        }
    },
    getDevice: function(dev) {
        return FS.devices[dev]
    },
    getMounts: function(mount) {
        var mounts = [];
        var check = [mount];
        while (check.length) {
            var m = check.pop();
            mounts.push(m);
            check.push.apply(check, m.mounts)
        }
        return mounts
    },
    syncfs: function(populate, callback) {
        if (typeof populate === "function") {
            callback = populate;
            populate = false
        }
        FS.syncFSRequests++;
        if (FS.syncFSRequests > 1) {
            console.log("warning: " + FS.syncFSRequests + " FS.syncfs operations in flight at once, probably just doing extra work")
        }
        var mounts = FS.getMounts(FS.root.mount);
        var completed = 0;

        function doCallback(err) {
            assert(FS.syncFSRequests > 0);
            FS.syncFSRequests--;
            return callback(err)
        }

        function done(err) {
            if (err) {
                if (!done.errored) {
                    done.errored = true;
                    return doCallback(err)
                }
                return
            }
            if (++completed >= mounts.length) {
                doCallback(null)
            }
        }
        mounts.forEach(function(mount) {
            if (!mount.type.syncfs) {
                return done(null)
            }
            mount.type.syncfs(mount, populate, done)
        })
    },
    mount: function(type, opts, mountpoint) {
        var root = mountpoint === "/";
        var pseudo = !mountpoint;
        var node;
        if (root && FS.root) {
            throw new FS.ErrnoError(10)
        } else if (!root && !pseudo) {
            var lookup = FS.lookupPath(mountpoint, {
                follow_mount: false
            });
            mountpoint = lookup.path;
            node = lookup.node;
            if (FS.isMountpoint(node)) {
                throw new FS.ErrnoError(10)
            }
            if (!FS.isDir(node.mode)) {
                throw new FS.ErrnoError(54)
            }
        }
        var mount = {
            type: type,
            opts: opts,
            mountpoint: mountpoint,
            mounts: []
        };
        var mountRoot = type.mount(mount);
        mountRoot.mount = mount;
        mount.root = mountRoot;
        if (root) {
            FS.root = mountRoot
        } else if (node) {
            node.mounted = mount;
            if (node.mount) {
                node.mount.mounts.push(mount)
            }
        }
        return mountRoot
    },
    unmount: function(mountpoint) {
        var lookup = FS.lookupPath(mountpoint, {
            follow_mount: false
        });
        if (!FS.isMountpoint(lookup.node)) {
            throw new FS.ErrnoError(28)
        }
        var node = lookup.node;
        var mount = node.mounted;
        var mounts = FS.getMounts(mount);
        Object.keys(FS.nameTable).forEach(function(hash) {
            var current = FS.nameTable[hash];
            while (current) {
                var next = current.name_next;
                if (mounts.indexOf(current.mount) !== -1) {
                    FS.destroyNode(current)
                }
                current = next
            }
        });
        node.mounted = null;
        var idx = node.mount.mounts.indexOf(mount);
        assert(idx !== -1);
        node.mount.mounts.splice(idx, 1)
    },
    lookup: function(parent, name) {
        return parent.node_ops.lookup(parent, name)
    },
    mknod: function(path, mode, dev) {
        var lookup = FS.lookupPath(path, {
            parent: true
        });
        var parent = lookup.node;
        var name = PATH.basename(path);
        if (!name || name === "." || name === "..") {
            throw new FS.ErrnoError(28)
        }
        var err = FS.mayCreate(parent, name);
        if (err) {
            throw new FS.ErrnoError(err)
        }
        if (!parent.node_ops.mknod) {
            throw new FS.ErrnoError(63)
        }
        return parent.node_ops.mknod(parent, name, mode, dev)
    },
    create: function(path, mode) {
        mode = mode !== undefined ? mode : 438;
        mode &= 4095;
        mode |= 32768;
        return FS.mknod(path, mode, 0)
    },
    mkdir: function(path, mode) {
        mode = mode !== undefined ? mode : 511;
        mode &= 511 | 512;
        mode |= 16384;
        return FS.mknod(path, mode, 0)
    },
    mkdirTree: function(path, mode) {
        var dirs = path.split("/");
        var d = "";
        for (var i = 0; i < dirs.length; ++i) {
            if (!dirs[i]) continue;
            d += "/" + dirs[i];
            try {
                FS.mkdir(d, mode)
            } catch (e) {
                if (e.errno != 20) throw e
            }
        }
    },
    mkdev: function(path, mode, dev) {
        if (typeof dev === "undefined") {
            dev = mode;
            mode = 438
        }
        mode |= 8192;
        return FS.mknod(path, mode, dev)
    },
    symlink: function(oldpath, newpath) {
        if (!PATH_FS.resolve(oldpath)) {
            throw new FS.ErrnoError(44)
        }
        var lookup = FS.lookupPath(newpath, {
            parent: true
        });
        var parent = lookup.node;
        if (!parent) {
            throw new FS.ErrnoError(44)
        }
        var newname = PATH.basename(newpath);
        var err = FS.mayCreate(parent, newname);
        if (err) {
            throw new FS.ErrnoError(err)
        }
        if (!parent.node_ops.symlink) {
            throw new FS.ErrnoError(63)
        }
        return parent.node_ops.symlink(parent, newname, oldpath)
    },
    rename: function(old_path, new_path) {
        var old_dirname = PATH.dirname(old_path);
        var new_dirname = PATH.dirname(new_path);
        var old_name = PATH.basename(old_path);
        var new_name = PATH.basename(new_path);
        var lookup, old_dir, new_dir;
        try {
            lookup = FS.lookupPath(old_path, {
                parent: true
            });
            old_dir = lookup.node;
            lookup = FS.lookupPath(new_path, {
                parent: true
            });
            new_dir = lookup.node
        } catch (e) {
            throw new FS.ErrnoError(10)
        }
        if (!old_dir || !new_dir) throw new FS.ErrnoError(44);
        if (old_dir.mount !== new_dir.mount) {
            throw new FS.ErrnoError(75)
        }
        var old_node = FS.lookupNode(old_dir, old_name);
        var relative = PATH_FS.relative(old_path, new_dirname);
        if (relative.charAt(0) !== ".") {
            throw new FS.ErrnoError(28)
        }
        relative = PATH_FS.relative(new_path, old_dirname);
        if (relative.charAt(0) !== ".") {
            throw new FS.ErrnoError(55)
        }
        var new_node;
        try {
            new_node = FS.lookupNode(new_dir, new_name)
        } catch (e) {}
        if (old_node === new_node) {
            return
        }
        var isdir = FS.isDir(old_node.mode);
        var err = FS.mayDelete(old_dir, old_name, isdir);
        if (err) {
            throw new FS.ErrnoError(err)
        }
        err = new_node ? FS.mayDelete(new_dir, new_name, isdir) : FS.mayCreate(new_dir, new_name);
        if (err) {
            throw new FS.ErrnoError(err)
        }
        if (!old_dir.node_ops.rename) {
            throw new FS.ErrnoError(63)
        }
        if (FS.isMountpoint(old_node) || new_node && FS.isMountpoint(new_node)) {
            throw new FS.ErrnoError(10)
        }
        if (new_dir !== old_dir) {
            err = FS.nodePermissions(old_dir, "w");
            if (err) {
                throw new FS.ErrnoError(err)
            }
        }
        try {
            if (FS.trackingDelegate["willMovePath"]) {
                FS.trackingDelegate["willMovePath"](old_path, new_path)
            }
        } catch (e) {
            console.log("FS.trackingDelegate['willMovePath']('" + old_path + "', '" + new_path + "') threw an exception: " + e.message)
        }
        FS.hashRemoveNode(old_node);
        try {
            old_dir.node_ops.rename(old_node, new_dir, new_name)
        } catch (e) {
            throw e
        } finally {
            FS.hashAddNode(old_node)
        }
        try {
            if (FS.trackingDelegate["onMovePath"]) FS.trackingDelegate["onMovePath"](old_path, new_path)
        } catch (e) {
            console.log("FS.trackingDelegate['onMovePath']('" + old_path + "', '" + new_path + "') threw an exception: " + e.message)
        }
    },
    rmdir: function(path) {
        var lookup = FS.lookupPath(path, {
            parent: true
        });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var err = FS.mayDelete(parent, name, true);
        if (err) {
            throw new FS.ErrnoError(err)
        }
        if (!parent.node_ops.rmdir) {
            throw new FS.ErrnoError(63)
        }
        if (FS.isMountpoint(node)) {
            throw new FS.ErrnoError(10)
        }
        try {
            if (FS.trackingDelegate["willDeletePath"]) {
                FS.trackingDelegate["willDeletePath"](path)
            }
        } catch (e) {
            console.log("FS.trackingDelegate['willDeletePath']('" + path + "') threw an exception: " + e.message)
        }
        parent.node_ops.rmdir(parent, name);
        FS.destroyNode(node);
        try {
            if (FS.trackingDelegate["onDeletePath"]) FS.trackingDelegate["onDeletePath"](path)
        } catch (e) {
            console.log("FS.trackingDelegate['onDeletePath']('" + path + "') threw an exception: " + e.message)
        }
    },
    readdir: function(path) {
        var lookup = FS.lookupPath(path, {
            follow: true
        });
        var node = lookup.node;
        if (!node.node_ops.readdir) {
            throw new FS.ErrnoError(54)
        }
        return node.node_ops.readdir(node)
    },
    unlink: function(path) {
        var lookup = FS.lookupPath(path, {
            parent: true
        });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var err = FS.mayDelete(parent, name, false);
        if (err) {
            throw new FS.ErrnoError(err)
        }
        if (!parent.node_ops.unlink) {
            throw new FS.ErrnoError(63)
        }
        if (FS.isMountpoint(node)) {
            throw new FS.ErrnoError(10)
        }
        try {
            if (FS.trackingDelegate["willDeletePath"]) {
                FS.trackingDelegate["willDeletePath"](path)
            }
        } catch (e) {
            console.log("FS.trackingDelegate['willDeletePath']('" + path + "') threw an exception: " + e.message)
        }
        parent.node_ops.unlink(parent, name);
        FS.destroyNode(node);
        try {
            if (FS.trackingDelegate["onDeletePath"]) FS.trackingDelegate["onDeletePath"](path)
        } catch (e) {
            console.log("FS.trackingDelegate['onDeletePath']('" + path + "') threw an exception: " + e.message)
        }
    },
    readlink: function(path) {
        var lookup = FS.lookupPath(path);
        var link = lookup.node;
        if (!link) {
            throw new FS.ErrnoError(44)
        }
        if (!link.node_ops.readlink) {
            throw new FS.ErrnoError(28)
        }
        return PATH_FS.resolve(FS.getPath(link.parent), link.node_ops.readlink(link))
    },
    stat: function(path, dontFollow) {
        var lookup = FS.lookupPath(path, {
            follow: !dontFollow
        });
        var node = lookup.node;
        if (!node) {
            throw new FS.ErrnoError(44)
        }
        if (!node.node_ops.getattr) {
            throw new FS.ErrnoError(63)
        }
        return node.node_ops.getattr(node)
    },
    lstat: function(path) {
        return FS.stat(path, true)
    },
    chmod: function(path, mode, dontFollow) {
        var node;
        if (typeof path === "string") {
            var lookup = FS.lookupPath(path, {
                follow: !dontFollow
            });
            node = lookup.node
        } else {
            node = path
        }
        if (!node.node_ops.setattr) {
            throw new FS.ErrnoError(63)
        }
        node.node_ops.setattr(node, {
            mode: mode & 4095 | node.mode & ~4095,
            timestamp: Date.now()
        })
    },
    lchmod: function(path, mode) {
        FS.chmod(path, mode, true)
    },
    fchmod: function(fd, mode) {
        var stream = FS.getStream(fd);
        if (!stream) {
            throw new FS.ErrnoError(8)
        }
        FS.chmod(stream.node, mode)
    },
    chown: function(path, uid, gid, dontFollow) {
        var node;
        if (typeof path === "string") {
            var lookup = FS.lookupPath(path, {
                follow: !dontFollow
            });
            node = lookup.node
        } else {
            node = path
        }
        if (!node.node_ops.setattr) {
            throw new FS.ErrnoError(63)
        }
        node.node_ops.setattr(node, {
            timestamp: Date.now()
        })
    },
    lchown: function(path, uid, gid) {
        FS.chown(path, uid, gid, true)
    },
    fchown: function(fd, uid, gid) {
        var stream = FS.getStream(fd);
        if (!stream) {
            throw new FS.ErrnoError(8)
        }
        FS.chown(stream.node, uid, gid)
    },
    truncate: function(path, len) {
        if (len < 0) {
            throw new FS.ErrnoError(28)
        }
        var node;
        if (typeof path === "string") {
            var lookup = FS.lookupPath(path, {
                follow: true
            });
            node = lookup.node
        } else {
            node = path
        }
        if (!node.node_ops.setattr) {
            throw new FS.ErrnoError(63)
        }
        if (FS.isDir(node.mode)) {
            throw new FS.ErrnoError(31)
        }
        if (!FS.isFile(node.mode)) {
            throw new FS.ErrnoError(28)
        }
        var err = FS.nodePermissions(node, "w");
        if (err) {
            throw new FS.ErrnoError(err)
        }
        node.node_ops.setattr(node, {
            size: len,
            timestamp: Date.now()
        })
    },
    ftruncate: function(fd, len) {
        var stream = FS.getStream(fd);
        if (!stream) {
            throw new FS.ErrnoError(8)
        }
        if ((stream.flags & 2097155) === 0) {
            throw new FS.ErrnoError(28)
        }
        FS.truncate(stream.node, len)
    },
    utime: function(path, atime, mtime) {
        var lookup = FS.lookupPath(path, {
            follow: true
        });
        var node = lookup.node;
        node.node_ops.setattr(node, {
            timestamp: Math.max(atime, mtime)
        })
    },
    open: function(path, flags, mode, fd_start, fd_end) {
        if (path === "") {
            throw new FS.ErrnoError(44)
        }
        flags = typeof flags === "string" ? FS.modeStringToFlags(flags) : flags;
        mode = typeof mode === "undefined" ? 438 : mode;
        if (flags & 64) {
            mode = mode & 4095 | 32768
        } else {
            mode = 0
        }
        var node;
        if (typeof path === "object") {
            node = path
        } else {
            path = PATH.normalize(path);
            try {
                var lookup = FS.lookupPath(path, {
                    follow: !(flags & 131072)
                });
                node = lookup.node
            } catch (e) {}
        }
        var created = false;
        if (flags & 64) {
            if (node) {
                if (flags & 128) {
                    throw new FS.ErrnoError(20)
                }
            } else {
                node = FS.mknod(path, mode, 0);
                created = true
            }
        }
        if (!node) {
            throw new FS.ErrnoError(44)
        }
        if (FS.isChrdev(node.mode)) {
            flags &= ~512
        }
        if (flags & 65536 && !FS.isDir(node.mode)) {
            throw new FS.ErrnoError(54)
        }
        if (!created) {
            var err = FS.mayOpen(node, flags);
            if (err) {
                throw new FS.ErrnoError(err)
            }
        }
        if (flags & 512) {
            FS.truncate(node, 0)
        }
        flags &= ~(128 | 512);
        var stream = FS.createStream({
            node: node,
            path: FS.getPath(node),
            flags: flags,
            seekable: true,
            position: 0,
            stream_ops: node.stream_ops,
            ungotten: [],
            error: false
        }, fd_start, fd_end);
        if (stream.stream_ops.open) {
            stream.stream_ops.open(stream)
        }
        if (Module["logReadFiles"] && !(flags & 1)) {
            if (!FS.readFiles) FS.readFiles = {};
            if (!(path in FS.readFiles)) {
                FS.readFiles[path] = 1;
                console.log("FS.trackingDelegate error on read file: " + path)
            }
        }
        try {
            if (FS.trackingDelegate["onOpenFile"]) {
                var trackingFlags = 0;
                if ((flags & 2097155) !== 1) {
                    trackingFlags |= FS.tracking.openFlags.READ
                }
                if ((flags & 2097155) !== 0) {
                    trackingFlags |= FS.tracking.openFlags.WRITE
                }
                FS.trackingDelegate["onOpenFile"](path, trackingFlags)
            }
        } catch (e) {
            console.log("FS.trackingDelegate['onOpenFile']('" + path + "', flags) threw an exception: " + e.message)
        }
        return stream
    },
    close: function(stream) {
        if (FS.isClosed(stream)) {
            throw new FS.ErrnoError(8)
        }
        if (stream.getdents) stream.getdents = null;
        try {
            if (stream.stream_ops.close) {
                stream.stream_ops.close(stream)
            }
        } catch (e) {
            throw e
        } finally {
            FS.closeStream(stream.fd)
        }
        stream.fd = null
    },
    isClosed: function(stream) {
        return stream.fd === null
    },
    llseek: function(stream, offset, whence) {
        if (FS.isClosed(stream)) {
            throw new FS.ErrnoError(8)
        }
        if (!stream.seekable || !stream.stream_ops.llseek) {
            throw new FS.ErrnoError(70)
        }
        if (whence != 0 && whence != 1 && whence != 2) {
            throw new FS.ErrnoError(28)
        }
        stream.position = stream.stream_ops.llseek(stream, offset, whence);
        stream.ungotten = [];
        return stream.position
    },
    read: function(stream, buffer, offset, length, position) {
        if (length < 0 || position < 0) {
            throw new FS.ErrnoError(28)
        }
        if (FS.isClosed(stream)) {
            throw new FS.ErrnoError(8)
        }
        if ((stream.flags & 2097155) === 1) {
            throw new FS.ErrnoError(8)
        }
        if (FS.isDir(stream.node.mode)) {
            throw new FS.ErrnoError(31)
        }
        if (!stream.stream_ops.read) {
            throw new FS.ErrnoError(28)
        }
        var seeking = typeof position !== "undefined";
        if (!seeking) {
            position = stream.position
        } else if (!stream.seekable) {
            throw new FS.ErrnoError(70)
        }
        var bytesRead = stream.stream_ops.read(stream, buffer, offset, length, position);
        if (!seeking) stream.position += bytesRead;
        return bytesRead
    },
    write: function(stream, buffer, offset, length, position, canOwn) {
        if (length < 0 || position < 0) {
            throw new FS.ErrnoError(28)
        }
        if (FS.isClosed(stream)) {
            throw new FS.ErrnoError(8)
        }
        if ((stream.flags & 2097155) === 0) {
            throw new FS.ErrnoError(8)
        }
        if (FS.isDir(stream.node.mode)) {
            throw new FS.ErrnoError(31)
        }
        if (!stream.stream_ops.write) {
            throw new FS.ErrnoError(28)
        }
        if (stream.flags & 1024) {
            FS.llseek(stream, 0, 2)
        }
        var seeking = typeof position !== "undefined";
        if (!seeking) {
            position = stream.position
        } else if (!stream.seekable) {
            throw new FS.ErrnoError(70)
        }
        var bytesWritten = stream.stream_ops.write(stream, buffer, offset, length, position, canOwn);
        if (!seeking) stream.position += bytesWritten;
        try {
            if (stream.path && FS.trackingDelegate["onWriteToFile"]) FS.trackingDelegate["onWriteToFile"](stream.path)
        } catch (e) {
            console.log("FS.trackingDelegate['onWriteToFile']('" + stream.path + "') threw an exception: " + e.message)
        }
        return bytesWritten
    },
    allocate: function(stream, offset, length) {
        if (FS.isClosed(stream)) {
            throw new FS.ErrnoError(8)
        }
        if (offset < 0 || length <= 0) {
            throw new FS.ErrnoError(28)
        }
        if ((stream.flags & 2097155) === 0) {
            throw new FS.ErrnoError(8)
        }
        if (!FS.isFile(stream.node.mode) && !FS.isDir(stream.node.mode)) {
            throw new FS.ErrnoError(43)
        }
        if (!stream.stream_ops.allocate) {
            throw new FS.ErrnoError(138)
        }
        stream.stream_ops.allocate(stream, offset, length)
    },
    mmap: function(stream, buffer, offset, length, position, prot, flags) {
        if ((prot & 2) !== 0 && (flags & 2) === 0 && (stream.flags & 2097155) !== 2) {
            throw new FS.ErrnoError(2)
        }
        if ((stream.flags & 2097155) === 1) {
            throw new FS.ErrnoError(2)
        }
        if (!stream.stream_ops.mmap) {
            throw new FS.ErrnoError(43)
        }
        return stream.stream_ops.mmap(stream, buffer, offset, length, position, prot, flags)
    },
    msync: function(stream, buffer, offset, length, mmapFlags) {
        if (!stream || !stream.stream_ops.msync) {
            return 0
        }
        return stream.stream_ops.msync(stream, buffer, offset, length, mmapFlags)
    },
    munmap: function(stream) {
        return 0
    },
    ioctl: function(stream, cmd, arg) {
        if (!stream.stream_ops.ioctl) {
            throw new FS.ErrnoError(59)
        }
        return stream.stream_ops.ioctl(stream, cmd, arg)
    },
    readFile: function(path, opts) {
        opts = opts || {};
        opts.flags = opts.flags || "r";
        opts.encoding = opts.encoding || "binary";
        if (opts.encoding !== "utf8" && opts.encoding !== "binary") {
            throw new Error('Invalid encoding type "' + opts.encoding + '"')
        }
        var ret;
        var stream = FS.open(path, opts.flags);
        var stat = FS.stat(path);
        var length = stat.size;
        var buf = new Uint8Array(length);
        FS.read(stream, buf, 0, length, 0);
        if (opts.encoding === "utf8") {
            ret = UTF8ArrayToString(buf, 0)
        } else if (opts.encoding === "binary") {
            ret = buf
        }
        FS.close(stream);
        return ret
    },
    writeFile: function(path, data, opts) {
        opts = opts || {};
        opts.flags = opts.flags || "w";
        var stream = FS.open(path, opts.flags, opts.mode);
        if (typeof data === "string") {
            var buf = new Uint8Array(lengthBytesUTF8(data) + 1);
            var actualNumBytes = stringToUTF8Array(data, buf, 0, buf.length);
            FS.write(stream, buf, 0, actualNumBytes, undefined, opts.canOwn)
        } else if (ArrayBuffer.isView(data)) {
            FS.write(stream, data, 0, data.byteLength, undefined, opts.canOwn)
        } else {
            throw new Error("Unsupported data type")
        }
        FS.close(stream)
    },
    cwd: function() {
        return FS.currentPath
    },
    chdir: function(path) {
        var lookup = FS.lookupPath(path, {
            follow: true
        });
        if (lookup.node === null) {
            throw new FS.ErrnoError(44)
        }
        if (!FS.isDir(lookup.node.mode)) {
            throw new FS.ErrnoError(54)
        }
        var err = FS.nodePermissions(lookup.node, "x");
        if (err) {
            throw new FS.ErrnoError(err)
        }
        FS.currentPath = lookup.path
    },
    createDefaultDirectories: function() {
        FS.mkdir("/tmp");
        FS.mkdir("/home");
        FS.mkdir("/home/web_user")
    },
    createDefaultDevices: function() {
        FS.mkdir("/dev");
        FS.registerDevice(FS.makedev(1, 3), {
            read: function() {
                return 0
            },
            write: function(stream, buffer, offset, length, pos) {
                return length
            }
        });
        FS.mkdev("/dev/null", FS.makedev(1, 3));
        TTY.register(FS.makedev(5, 0), TTY.default_tty_ops);
        TTY.register(FS.makedev(6, 0), TTY.default_tty1_ops);
        FS.mkdev("/dev/tty", FS.makedev(5, 0));
        FS.mkdev("/dev/tty1", FS.makedev(6, 0));
        var random_device;
        if (typeof crypto === "object" && typeof crypto["getRandomValues"] === "function") {
            var randomBuffer = new Uint8Array(1);
            random_device = function() {
                crypto.getRandomValues(randomBuffer);
                return randomBuffer[0]
            }
        } else if (ENVIRONMENT_IS_NODE) {
            try {
                var crypto_module = require("crypto");
                random_device = function() {
                    return crypto_module["randomBytes"](1)[0]
                }
            } catch (e) {}
        } else {}
        if (!random_device) {
            random_device = function() {
                abort("no cryptographic support found for random_device. consider polyfilling it if you want to use something insecure like Math.random(), e.g. put this in a --pre-js: var crypto = { getRandomValues: function(array) { for (var i = 0; i < array.length; i++) array[i] = (Math.random()*256)|0 } };")
            }
        }
        FS.createDevice("/dev", "random", random_device);
        FS.createDevice("/dev", "urandom", random_device);
        FS.mkdir("/dev/shm");
        FS.mkdir("/dev/shm/tmp")
    },
    createSpecialDirectories: function() {
        FS.mkdir("/proc");
        FS.mkdir("/proc/self");
        FS.mkdir("/proc/self/fd");
        FS.mount({
            mount: function() {
                var node = FS.createNode("/proc/self", "fd", 16384 | 511, 73);
                node.node_ops = {
                    lookup: function(parent, name) {
                        var fd = +name;
                        var stream = FS.getStream(fd);
                        if (!stream) throw new FS.ErrnoError(8);
                        var ret = {
                            parent: null,
                            mount: {
                                mountpoint: "fake"
                            },
                            node_ops: {
                                readlink: function() {
                                    return stream.path
                                }
                            }
                        };
                        ret.parent = ret;
                        return ret
                    }
                };
                return node
            }
        }, {}, "/proc/self/fd")
    },
    createStandardStreams: function() {
        if (Module["stdin"]) {
            FS.createDevice("/dev", "stdin", Module["stdin"])
        } else {
            FS.symlink("/dev/tty", "/dev/stdin")
        }
        if (Module["stdout"]) {
            FS.createDevice("/dev", "stdout", null, Module["stdout"])
        } else {
            FS.symlink("/dev/tty", "/dev/stdout")
        }
        if (Module["stderr"]) {
            FS.createDevice("/dev", "stderr", null, Module["stderr"])
        } else {
            FS.symlink("/dev/tty1", "/dev/stderr")
        }
        var stdin = FS.open("/dev/stdin", "r");
        var stdout = FS.open("/dev/stdout", "w");
        var stderr = FS.open("/dev/stderr", "w");
        assert(stdin.fd === 0, "invalid handle for stdin (" + stdin.fd + ")");
        assert(stdout.fd === 1, "invalid handle for stdout (" + stdout.fd + ")");
        assert(stderr.fd === 2, "invalid handle for stderr (" + stderr.fd + ")")
    },
    ensureErrnoError: function() {
        if (FS.ErrnoError) return;
        FS.ErrnoError = function ErrnoError(errno, node) {
            this.node = node;
            this.setErrno = function(errno) {
                this.errno = errno;
                for (var key in ERRNO_CODES) {
                    if (ERRNO_CODES[key] === errno) {
                        this.code = key;
                        break
                    }
                }
            };
            this.setErrno(errno);
            this.message = ERRNO_MESSAGES[errno];
            if (this.stack) {
                Object.defineProperty(this, "stack", {
                    value: (new Error).stack,
                    writable: true
                });
                this.stack = demangleAll(this.stack)
            }
        };
        FS.ErrnoError.prototype = new Error;
        FS.ErrnoError.prototype.constructor = FS.ErrnoError;
        [44].forEach(function(code) {
            FS.genericErrors[code] = new FS.ErrnoError(code);
            FS.genericErrors[code].stack = "<generic error, no stack>"
        })
    },
    staticInit: function() {
        FS.ensureErrnoError();
        FS.nameTable = new Array(4096);
        FS.mount(MEMFS, {}, "/");
        FS.createDefaultDirectories();
        FS.createDefaultDevices();
        FS.createSpecialDirectories();
        FS.filesystems = {
            "MEMFS": MEMFS,
            "IDBFS": IDBFS,
            "NODEFS": NODEFS,
            "WORKERFS": WORKERFS
        }
    },
    init: function(input, output, error) {
        assert(!FS.init.initialized, "FS.init was previously called. If you want to initialize later with custom parameters, remove any earlier calls (note that one is automatically added to the generated code)");
        FS.init.initialized = true;
        FS.ensureErrnoError();
        Module["stdin"] = input || Module["stdin"];
        Module["stdout"] = output || Module["stdout"];
        Module["stderr"] = error || Module["stderr"];
        FS.createStandardStreams()
    },
    quit: function() {
        FS.init.initialized = false;
        var fflush = Module["_fflush"];
        if (fflush) fflush(0);
        for (var i = 0; i < FS.streams.length; i++) {
            var stream = FS.streams[i];
            if (!stream) {
                continue
            }
            FS.close(stream)
        }
    },
    getMode: function(canRead, canWrite) {
        var mode = 0;
        if (canRead) mode |= 292 | 73;
        if (canWrite) mode |= 146;
        return mode
    },
    joinPath: function(parts, forceRelative) {
        var path = PATH.join.apply(null, parts);
        if (forceRelative && path[0] == "/") path = path.substr(1);
        return path
    },
    absolutePath: function(relative, base) {
        return PATH_FS.resolve(base, relative)
    },
    standardizePath: function(path) {
        return PATH.normalize(path)
    },
    findObject: function(path, dontResolveLastLink) {
        var ret = FS.analyzePath(path, dontResolveLastLink);
        if (ret.exists) {
            return ret.object
        } else {
            ___setErrNo(ret.error);
            return null
        }
    },
    analyzePath: function(path, dontResolveLastLink) {
        try {
            var lookup = FS.lookupPath(path, {
                follow: !dontResolveLastLink
            });
            path = lookup.path
        } catch (e) {}
        var ret = {
            isRoot: false,
            exists: false,
            error: 0,
            name: null,
            path: null,
            object: null,
            parentExists: false,
            parentPath: null,
            parentObject: null
        };
        try {
            var lookup = FS.lookupPath(path, {
                parent: true
            });
            ret.parentExists = true;
            ret.parentPath = lookup.path;
            ret.parentObject = lookup.node;
            ret.name = PATH.basename(path);
            lookup = FS.lookupPath(path, {
                follow: !dontResolveLastLink
            });
            ret.exists = true;
            ret.path = lookup.path;
            ret.object = lookup.node;
            ret.name = lookup.node.name;
            ret.isRoot = lookup.path === "/"
        } catch (e) {
            ret.error = e.errno
        }
        return ret
    },
    createFolder: function(parent, name, canRead, canWrite) {
        var path = PATH.join2(typeof parent === "string" ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(canRead, canWrite);
        return FS.mkdir(path, mode)
    },
    createPath: function(parent, path, canRead, canWrite) {
        parent = typeof parent === "string" ? parent : FS.getPath(parent);
        var parts = path.split("/").reverse();
        while (parts.length) {
            var part = parts.pop();
            if (!part) continue;
            var current = PATH.join2(parent, part);
            try {
                FS.mkdir(current)
            } catch (e) {}
            parent = current
        }
        return current
    },
    createFile: function(parent, name, properties, canRead, canWrite) {
        var path = PATH.join2(typeof parent === "string" ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(canRead, canWrite);
        return FS.create(path, mode)
    },
    createDataFile: function(parent, name, data, canRead, canWrite, canOwn) {
        var path = name ? PATH.join2(typeof parent === "string" ? parent : FS.getPath(parent), name) : parent;
        var mode = FS.getMode(canRead, canWrite);
        var node = FS.create(path, mode);
        if (data) {
            if (typeof data === "string") {
                var arr = new Array(data.length);
                for (var i = 0, len = data.length; i < len; ++i) arr[i] = data.charCodeAt(i);
                data = arr
            }
            FS.chmod(node, mode | 146);
            var stream = FS.open(node, "w");
            FS.write(stream, data, 0, data.length, 0, canOwn);
            FS.close(stream);
            FS.chmod(node, mode)
        }
        return node
    },
    createDevice: function(parent, name, input, output) {
        var path = PATH.join2(typeof parent === "string" ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(!!input, !!output);
        if (!FS.createDevice.major) FS.createDevice.major = 64;
        var dev = FS.makedev(FS.createDevice.major++, 0);
        FS.registerDevice(dev, {
            open: function(stream) {
                stream.seekable = false
            },
            close: function(stream) {
                if (output && output.buffer && output.buffer.length) {
                    output(10)
                }
            },
            read: function(stream, buffer, offset, length, pos) {
                var bytesRead = 0;
                for (var i = 0; i < length; i++) {
                    var result;
                    try {
                        result = input()
                    } catch (e) {
                        throw new FS.ErrnoError(29)
                    }
                    if (result === undefined && bytesRead === 0) {
                        throw new FS.ErrnoError(6)
                    }
                    if (result === null || result === undefined) break;
                    bytesRead++;
                    buffer[offset + i] = result
                }
                if (bytesRead) {
                    stream.node.timestamp = Date.now()
                }
                return bytesRead
            },
            write: function(stream, buffer, offset, length, pos) {
                for (var i = 0; i < length; i++) {
                    try {
                        output(buffer[offset + i])
                    } catch (e) {
                        throw new FS.ErrnoError(29)
                    }
                }
                if (length) {
                    stream.node.timestamp = Date.now()
                }
                return i
            }
        });
        return FS.mkdev(path, mode, dev)
    },
    createLink: function(parent, name, target, canRead, canWrite) {
        var path = PATH.join2(typeof parent === "string" ? parent : FS.getPath(parent), name);
        return FS.symlink(target, path)
    },
    forceLoadFile: function(obj) {
        if (obj.isDevice || obj.isFolder || obj.link || obj.contents) return true;
        var success = true;
        if (typeof XMLHttpRequest !== "undefined") {
            throw new Error("Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread.")
        } else if (read_) {
            try {
                obj.contents = intArrayFromString(read_(obj.url), true);
                obj.usedBytes = obj.contents.length
            } catch (e) {
                success = false
            }
        } else {
            throw new Error("Cannot load without read() or XMLHttpRequest.")
        }
        if (!success) ___setErrNo(29);
        return success
    },
    createLazyFile: function(parent, name, url, canRead, canWrite) {
        function LazyUint8Array() {
            this.lengthKnown = false;
            this.chunks = []
        }
        LazyUint8Array.prototype.get = function LazyUint8Array_get(idx) {
            if (idx > this.length - 1 || idx < 0) {
                return undefined
            }
            var chunkOffset = idx % this.chunkSize;
            var chunkNum = idx / this.chunkSize | 0;
            return this.getter(chunkNum)[chunkOffset]
        };
        LazyUint8Array.prototype.setDataGetter = function LazyUint8Array_setDataGetter(getter) {
            this.getter = getter
        };
        LazyUint8Array.prototype.cacheLength = function LazyUint8Array_cacheLength() {
            var xhr = new XMLHttpRequest;
            xhr.open("HEAD", url, false);
            xhr.send(null);
            if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
            var datalength = Number(xhr.getResponseHeader("Content-length"));
            var header;
            var hasByteServing = (header = xhr.getResponseHeader("Accept-Ranges")) && header === "bytes";
            var usesGzip = (header = xhr.getResponseHeader("Content-Encoding")) && header === "gzip";
            var chunkSize = 1024 * 1024;
            if (!hasByteServing) chunkSize = datalength;
            var doXHR = function(from, to) {
                if (from > to) throw new Error("invalid range (" + from + ", " + to + ") or no bytes requested!");
                if (to > datalength - 1) throw new Error("only " + datalength + " bytes available! programmer error!");
                var xhr = new XMLHttpRequest;
                xhr.open("GET", url, false);
                if (datalength !== chunkSize) xhr.setRequestHeader("Range", "bytes=" + from + "-" + to);
                if (typeof Uint8Array != "undefined") xhr.responseType = "arraybuffer";
                if (xhr.overrideMimeType) {
                    xhr.overrideMimeType("text/plain; charset=x-user-defined")
                }
                xhr.send(null);
                if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
                if (xhr.response !== undefined) {
                    return new Uint8Array(xhr.response || [])
                } else {
                    return intArrayFromString(xhr.responseText || "", true)
                }
            };
            var lazyArray = this;
            lazyArray.setDataGetter(function(chunkNum) {
                var start = chunkNum * chunkSize;
                var end = (chunkNum + 1) * chunkSize - 1;
                end = Math.min(end, datalength - 1);
                if (typeof lazyArray.chunks[chunkNum] === "undefined") {
                    lazyArray.chunks[chunkNum] = doXHR(start, end)
                }
                if (typeof lazyArray.chunks[chunkNum] === "undefined") throw new Error("doXHR failed!");
                return lazyArray.chunks[chunkNum]
            });
            if (usesGzip || !datalength) {
                chunkSize = datalength = 1;
                datalength = this.getter(0).length;
                chunkSize = datalength;
                console.log("LazyFiles on gzip forces download of the whole file when length is accessed")
            }
            this._length = datalength;
            this._chunkSize = chunkSize;
            this.lengthKnown = true
        };
        if (typeof XMLHttpRequest !== "undefined") {
            if (!ENVIRONMENT_IS_WORKER) throw "Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc";
            var lazyArray = new LazyUint8Array;
            Object.defineProperties(lazyArray, {
                length: {
                    get: function() {
                        if (!this.lengthKnown) {
                            this.cacheLength()
                        }
                        return this._length
                    }
                },
                chunkSize: {
                    get: function() {
                        if (!this.lengthKnown) {
                            this.cacheLength()
                        }
                        return this._chunkSize
                    }
                }
            });
            var properties = {
                isDevice: false,
                contents: lazyArray
            }
        } else {
            var properties = {
                isDevice: false,
                url: url
            }
        }
        var node = FS.createFile(parent, name, properties, canRead, canWrite);
        if (properties.contents) {
            node.contents = properties.contents
        } else if (properties.url) {
            node.contents = null;
            node.url = properties.url
        }
        Object.defineProperties(node, {
            usedBytes: {
                get: function() {
                    return this.contents.length
                }
            }
        });
        var stream_ops = {};
        var keys = Object.keys(node.stream_ops);
        keys.forEach(function(key) {
            var fn = node.stream_ops[key];
            stream_ops[key] = function forceLoadLazyFile() {
                if (!FS.forceLoadFile(node)) {
                    throw new FS.ErrnoError(29)
                }
                return fn.apply(null, arguments)
            }
        });
        stream_ops.read = function stream_ops_read(stream, buffer, offset, length, position) {
            if (!FS.forceLoadFile(node)) {
                throw new FS.ErrnoError(29)
            }
            var contents = stream.node.contents;
            if (position >= contents.length) return 0;
            var size = Math.min(contents.length - position, length);
            assert(size >= 0);
            if (contents.slice) {
                for (var i = 0; i < size; i++) {
                    buffer[offset + i] = contents[position + i]
                }
            } else {
                for (var i = 0; i < size; i++) {
                    buffer[offset + i] = contents.get(position + i)
                }
            }
            return size
        };
        node.stream_ops = stream_ops;
        return node
    },
    createPreloadedFile: function(parent, name, url, canRead, canWrite, onload, onerror, dontCreateFile, canOwn, preFinish) {
        Browser.init();
        var fullname = name ? PATH_FS.resolve(PATH.join2(parent, name)) : parent;
        var dep = getUniqueRunDependency("cp " + fullname);

        function processData(byteArray) {
            function finish(byteArray) {
                if (preFinish) preFinish();
                if (!dontCreateFile) {
                    FS.createDataFile(parent, name, byteArray, canRead, canWrite, canOwn)
                }
                if (onload) onload();
                removeRunDependency(dep)
            }
            var handled = false;
            Module["preloadPlugins"].forEach(function(plugin) {
                if (handled) return;
                if (plugin["canHandle"](fullname)) {
                    plugin["handle"](byteArray, fullname, finish, function() {
                        if (onerror) onerror();
                        removeRunDependency(dep)
                    });
                    handled = true
                }
            });
            if (!handled) finish(byteArray)
        }
        addRunDependency(dep);
        if (typeof url == "string") {
            Browser.asyncLoad(url, function(byteArray) {
                processData(byteArray)
            }, onerror)
        } else {
            processData(url)
        }
    },
    indexedDB: function() {
        return window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB
    },
    DB_NAME: function() {
        return "EM_FS_" + window.location.pathname
    },
    DB_VERSION: 20,
    DB_STORE_NAME: "FILE_DATA",
    saveFilesToDB: function(paths, onload, onerror) {
        onload = onload || function() {};
        onerror = onerror || function() {};
        var indexedDB = FS.indexedDB();
        try {
            var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION)
        } catch (e) {
            return onerror(e)
        }
        openRequest.onupgradeneeded = function openRequest_onupgradeneeded() {
            console.log("creating db");
            var db = openRequest.result;
            db.createObjectStore(FS.DB_STORE_NAME)
        };
        openRequest.onsuccess = function openRequest_onsuccess() {
            var db = openRequest.result;
            var transaction = db.transaction([FS.DB_STORE_NAME], "readwrite");
            var files = transaction.objectStore(FS.DB_STORE_NAME);
            var ok = 0,
                fail = 0,
                total = paths.length;

            function finish() {
                if (fail == 0) onload();
                else onerror()
            }
            paths.forEach(function(path) {
                var putRequest = files.put(FS.analyzePath(path).object.contents, path);
                putRequest.onsuccess = function putRequest_onsuccess() {
                    ok++;
                    if (ok + fail == total) finish()
                };
                putRequest.onerror = function putRequest_onerror() {
                    fail++;
                    if (ok + fail == total) finish()
                }
            });
            transaction.onerror = onerror
        };
        openRequest.onerror = onerror
    },
    loadFilesFromDB: function(paths, onload, onerror) {
        onload = onload || function() {};
        onerror = onerror || function() {};
        var indexedDB = FS.indexedDB();
        try {
            var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION)
        } catch (e) {
            return onerror(e)
        }
        openRequest.onupgradeneeded = onerror;
        openRequest.onsuccess = function openRequest_onsuccess() {
            var db = openRequest.result;
            try {
                var transaction = db.transaction([FS.DB_STORE_NAME], "readonly")
            } catch (e) {
                onerror(e);
                return
            }
            var files = transaction.objectStore(FS.DB_STORE_NAME);
            var ok = 0,
                fail = 0,
                total = paths.length;

            function finish() {
                if (fail == 0) onload();
                else onerror()
            }
            paths.forEach(function(path) {
                var getRequest = files.get(path);
                getRequest.onsuccess = function getRequest_onsuccess() {
                    if (FS.analyzePath(path).exists) {
                        FS.unlink(path)
                    }
                    FS.createDataFile(PATH.dirname(path), PATH.basename(path), getRequest.result, true, true, true);
                    ok++;
                    if (ok + fail == total) finish()
                };
                getRequest.onerror = function getRequest_onerror() {
                    fail++;
                    if (ok + fail == total) finish()
                }
            });
            transaction.onerror = onerror
        };
        openRequest.onerror = onerror
    }
};
var SYSCALLS = {
    DEFAULT_POLLMASK: 5,
    mappings: {},
    umask: 511,
    calculateAt: function(dirfd, path) {
        if (path[0] !== "/") {
            var dir;
            if (dirfd === -100) {
                dir = FS.cwd()
            } else {
                var dirstream = FS.getStream(dirfd);
                if (!dirstream) throw new FS.ErrnoError(8);
                dir = dirstream.path
            }
            path = PATH.join2(dir, path)
        }
        return path
    },
    doStat: function(func, path, buf) {
        try {
            var stat = func(path)
        } catch (e) {
            if (e && e.node && PATH.normalize(path) !== PATH.normalize(FS.getPath(e.node))) {
                return -54
            }
            throw e
        }
        HEAP32[buf >> 2] = stat.dev;
        HEAP32[buf + 4 >> 2] = 0;
        HEAP32[buf + 8 >> 2] = stat.ino;
        HEAP32[buf + 12 >> 2] = stat.mode;
        HEAP32[buf + 16 >> 2] = stat.nlink;
        HEAP32[buf + 20 >> 2] = stat.uid;
        HEAP32[buf + 24 >> 2] = stat.gid;
        HEAP32[buf + 28 >> 2] = stat.rdev;
        HEAP32[buf + 32 >> 2] = 0;
        tempI64 = [stat.size >>> 0, (tempDouble = stat.size, +Math_abs(tempDouble) >= 1 ? tempDouble > 0 ? (Math_min(+Math_floor(tempDouble / 4294967296), 4294967295) | 0) >>> 0 : ~~+Math_ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0 : 0)], HEAP32[buf + 40 >> 2] = tempI64[0], HEAP32[buf + 44 >> 2] = tempI64[1];
        HEAP32[buf + 48 >> 2] = 4096;
        HEAP32[buf + 52 >> 2] = stat.blocks;
        HEAP32[buf + 56 >> 2] = stat.atime.getTime() / 1e3 | 0;
        HEAP32[buf + 60 >> 2] = 0;
        HEAP32[buf + 64 >> 2] = stat.mtime.getTime() / 1e3 | 0;
        HEAP32[buf + 68 >> 2] = 0;
        HEAP32[buf + 72 >> 2] = stat.ctime.getTime() / 1e3 | 0;
        HEAP32[buf + 76 >> 2] = 0;
        tempI64 = [stat.ino >>> 0, (tempDouble = stat.ino, +Math_abs(tempDouble) >= 1 ? tempDouble > 0 ? (Math_min(+Math_floor(tempDouble / 4294967296), 4294967295) | 0) >>> 0 : ~~+Math_ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0 : 0)], HEAP32[buf + 80 >> 2] = tempI64[0], HEAP32[buf + 84 >> 2] = tempI64[1];
        return 0
    },
    doMsync: function(addr, stream, len, flags) {
        var buffer = new Uint8Array(HEAPU8.subarray(addr, addr + len));
        FS.msync(stream, buffer, 0, len, flags)
    },
    doMkdir: function(path, mode) {
        path = PATH.normalize(path);
        if (path[path.length - 1] === "/") path = path.substr(0, path.length - 1);
        FS.mkdir(path, mode, 0);
        return 0
    },
    doMknod: function(path, mode, dev) {
        switch (mode & 61440) {
            case 32768:
            case 8192:
            case 24576:
            case 4096:
            case 49152:
                break;
            default:
                return -28
        }
        FS.mknod(path, mode, dev);
        return 0
    },
    doReadlink: function(path, buf, bufsize) {
        if (bufsize <= 0) return -28;
        var ret = FS.readlink(path);
        var len = Math.min(bufsize, lengthBytesUTF8(ret));
        var endChar = HEAP8[buf + len];
        stringToUTF8(ret, buf, bufsize + 1);
        HEAP8[buf + len] = endChar;
        return len
    },
    doAccess: function(path, amode) {
        if (amode & ~7) {
            return -28
        }
        var node;
        var lookup = FS.lookupPath(path, {
            follow: true
        });
        node = lookup.node;
        if (!node) {
            return -44
        }
        var perms = "";
        if (amode & 4) perms += "r";
        if (amode & 2) perms += "w";
        if (amode & 1) perms += "x";
        if (perms && FS.nodePermissions(node, perms)) {
            return -2
        }
        return 0
    },
    doDup: function(path, flags, suggestFD) {
        var suggest = FS.getStream(suggestFD);
        if (suggest) FS.close(suggest);
        return FS.open(path, flags, 0, suggestFD, suggestFD).fd
    },
    doReadv: function(stream, iov, iovcnt, offset) {
        var ret = 0;
        for (var i = 0; i < iovcnt; i++) {
            var ptr = HEAP32[iov + i * 8 >> 2];
            var len = HEAP32[iov + (i * 8 + 4) >> 2];
            var curr = FS.read(stream, HEAP8, ptr, len, offset);
            if (curr < 0) return -1;
            ret += curr;
            if (curr < len) break
        }
        return ret
    },
    doWritev: function(stream, iov, iovcnt, offset) {
        var ret = 0;
        for (var i = 0; i < iovcnt; i++) {
            var ptr = HEAP32[iov + i * 8 >> 2];
            var len = HEAP32[iov + (i * 8 + 4) >> 2];
            var curr = FS.write(stream, HEAP8, ptr, len, offset);
            if (curr < 0) return -1;
            ret += curr
        }
        return ret
    },
    varargs: 0,
    get: function(varargs) {
        SYSCALLS.varargs += 4;
        var ret = HEAP32[SYSCALLS.varargs - 4 >> 2];
        return ret
    },
    getStr: function() {
        var ret = UTF8ToString(SYSCALLS.get());
        return ret
    },
    getStreamFromFD: function(fd) {
        if (fd === undefined) fd = SYSCALLS.get();
        var stream = FS.getStream(fd);
        if (!stream) throw new FS.ErrnoError(8);
        return stream
    },
    get64: function() {
        var low = SYSCALLS.get(),
            high = SYSCALLS.get();
        if (low >= 0) assert(high === 0);
        else assert(high === -1);
        return low
    },
    getZero: function() {
        assert(SYSCALLS.get() === 0)
    }
};

function ___syscall221(which, varargs) {
    SYSCALLS.varargs = varargs;
    try {
        var stream = SYSCALLS.getStreamFromFD(),
            cmd = SYSCALLS.get();
        switch (cmd) {
            case 0: {
                var arg = SYSCALLS.get();
                if (arg < 0) {
                    return -28
                }
                var newStream;
                newStream = FS.open(stream.path, stream.flags, 0, arg);
                return newStream.fd
            }
            case 1:
            case 2:
                return 0;
            case 3:
                return stream.flags;
            case 4: {
                var arg = SYSCALLS.get();
                stream.flags |= arg;
                return 0
            }
            case 12: {
                var arg = SYSCALLS.get();
                var offset = 0;
                HEAP16[arg + offset >> 1] = 2;
                return 0
            }
            case 13:
            case 14:
                return 0;
            case 16:
            case 8:
                return -28;
            case 9:
                ___setErrNo(28);
                return -1;
            default: {
                return -28
            }
        }
    } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
        return -e.errno
    }
}

function ___syscall3(which, varargs) {
    SYSCALLS.varargs = varargs;
    try {
        var stream = SYSCALLS.getStreamFromFD(),
            buf = SYSCALLS.get(),
            count = SYSCALLS.get();
        return FS.read(stream, HEAP8, buf, count)
    } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
        return -e.errno
    }
}

function ___syscall5(which, varargs) {
    SYSCALLS.varargs = varargs;
    try {
        var pathname = SYSCALLS.getStr(),
            flags = SYSCALLS.get(),
            mode = SYSCALLS.get();
        var stream = FS.open(pathname, flags, mode);
        return stream.fd
    } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
        return -e.errno
    }
}

function ___unlock() {}

function _fd_close(fd) {
    try {
        var stream = SYSCALLS.getStreamFromFD(fd);
        FS.close(stream);
        return 0
    } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
        return e.errno
    }
}

function ___wasi_fd_close() {
    return _fd_close.apply(null, arguments)
}

function _fd_fdstat_get(fd, pbuf) {
    try {
        var stream = SYSCALLS.getStreamFromFD(fd);
        var type = stream.tty ? 2 : FS.isDir(stream.mode) ? 3 : FS.isLink(stream.mode) ? 7 : 4;
        HEAP8[pbuf >> 0] = type;
        return 0
    } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
        return e.errno
    }
}

function ___wasi_fd_fdstat_get() {
    return _fd_fdstat_get.apply(null, arguments)
}

function _fd_seek(fd, offset_low, offset_high, whence, newOffset) {
    try {
        var stream = SYSCALLS.getStreamFromFD(fd);
        var HIGH_OFFSET = 4294967296;
        var offset = offset_high * HIGH_OFFSET + (offset_low >>> 0);
        var DOUBLE_LIMIT = 9007199254740992;
        if (offset <= -DOUBLE_LIMIT || offset >= DOUBLE_LIMIT) {
            return -61
        }
        FS.llseek(stream, offset, whence);
        tempI64 = [stream.position >>> 0, (tempDouble = stream.position, +Math_abs(tempDouble) >= 1 ? tempDouble > 0 ? (Math_min(+Math_floor(tempDouble / 4294967296), 4294967295) | 0) >>> 0 : ~~+Math_ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0 : 0)], HEAP32[newOffset >> 2] = tempI64[0], HEAP32[newOffset + 4 >> 2] = tempI64[1];
        if (stream.getdents && offset === 0 && whence === 0) stream.getdents = null;
        return 0
    } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
        return e.errno
    }
}

function ___wasi_fd_seek() {
    return _fd_seek.apply(null, arguments)
}

function _fd_write(fd, iov, iovcnt, pnum) {
    try {
        var stream = SYSCALLS.getStreamFromFD(fd);
        var num = SYSCALLS.doWritev(stream, iov, iovcnt);
        HEAP32[pnum >> 2] = num;
        return 0
    } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
        return e.errno
    }
}

function ___wasi_fd_write() {
    return _fd_write.apply(null, arguments)
}

function __emscripten_fetch_free(id) {
    delete Fetch.xhrs[id - 1]
}

function _abort() {
    abort()
}

function _clock() {
    if (_clock.start === undefined) _clock.start = Date.now();
    return (Date.now() - _clock.start) * (1e6 / 1e3) | 0
}

function _emscripten_get_now() {
    abort()
}

function _emscripten_get_now_is_monotonic() {
    return 0 || ENVIRONMENT_IS_NODE || typeof dateNow !== "undefined" || typeof performance === "object" && performance && typeof performance["now"] === "function"
}

function _clock_gettime(clk_id, tp) {
    var now;
    if (clk_id === 0) {
        now = Date.now()
    } else if (clk_id === 1 && _emscripten_get_now_is_monotonic()) {
        now = _emscripten_get_now()
    } else {
        ___setErrNo(28);
        return -1
    }
    HEAP32[tp >> 2] = now / 1e3 | 0;
    HEAP32[tp + 4 >> 2] = now % 1e3 * 1e3 * 1e3 | 0;
    return 0
}

function _emscripten_get_heap_size() {
    return HEAP8.length
}

function _emscripten_is_main_browser_thread() {
    return !ENVIRONMENT_IS_WORKER
}

function abortOnCannotGrowMemory(requestedSize) {
    abort("Cannot enlarge memory arrays to size " + requestedSize + " bytes (OOM). Either (1) compile with  -s TOTAL_MEMORY=X  with X higher than the current value " + HEAP8.length + ", (2) compile with  -s ALLOW_MEMORY_GROWTH=1  which allows increasing the size at runtime, or (3) if you want malloc to return NULL (0) instead of this abort, compile with  -s ABORTING_MALLOC=0 ")
}

function _emscripten_resize_heap(requestedSize) {
    abortOnCannotGrowMemory(requestedSize)
}
var Fetch = {
    xhrs: [],
    setu64: function(addr, val) {
        HEAPU32[addr >> 2] = val;
        HEAPU32[addr + 4 >> 2] = val / 4294967296 | 0
    },
    openDatabase: function(dbname, dbversion, onsuccess, onerror) {
        try {
            var openRequest = indexedDB.open(dbname, dbversion)
        } catch (e) {
            return onerror(e)
        }
        openRequest.onupgradeneeded = function(event) {
            var db = event.target.result;
            if (db.objectStoreNames.contains("FILES")) {
                db.deleteObjectStore("FILES")
            }
            db.createObjectStore("FILES")
        };
        openRequest.onsuccess = function(event) {
            onsuccess(event.target.result)
        };
        openRequest.onerror = function(error) {
            onerror(error)
        }
    },
    staticInit: function() {
        var isMainThread = typeof ENVIRONMENT_IS_FETCH_WORKER === "undefined";
        var onsuccess = function(db) {
            Fetch.dbInstance = db;
            if (isMainThread) {
                removeRunDependency("library_fetch_init")
            }
        };
        var onerror = function() {
            Fetch.dbInstance = false;
            if (isMainThread) {
                removeRunDependency("library_fetch_init")
            }
        };
        Fetch.openDatabase("emscripten_filesystem", 1, onsuccess, onerror);
        if (typeof ENVIRONMENT_IS_FETCH_WORKER === "undefined" || !ENVIRONMENT_IS_FETCH_WORKER) addRunDependency("library_fetch_init")
    }
};

function __emscripten_fetch_xhr(fetch, onsuccess, onerror, onprogress, onreadystatechange) {
    var url = HEAPU32[fetch + 8 >> 2];
    if (!url) {
        onerror(fetch, 0, "no url specified!");
        return
    }
    var url_ = UTF8ToString(url);
    var fetch_attr = fetch + 112;
    var requestMethod = UTF8ToString(fetch_attr);
    if (!requestMethod) requestMethod = "GET";
    var userData = HEAPU32[fetch_attr + 32 >> 2];
    var fetchAttributes = HEAPU32[fetch_attr + 52 >> 2];
    var timeoutMsecs = HEAPU32[fetch_attr + 56 >> 2];
    var withCredentials = !!HEAPU32[fetch_attr + 60 >> 2];
    var destinationPath = HEAPU32[fetch_attr + 64 >> 2];
    var userName = HEAPU32[fetch_attr + 68 >> 2];
    var password = HEAPU32[fetch_attr + 72 >> 2];
    var requestHeaders = HEAPU32[fetch_attr + 76 >> 2];
    var overriddenMimeType = HEAPU32[fetch_attr + 80 >> 2];
    var dataPtr = HEAPU32[fetch_attr + 84 >> 2];
    var dataLength = HEAPU32[fetch_attr + 88 >> 2];
    var fetchAttrLoadToMemory = !!(fetchAttributes & 1);
    var fetchAttrStreamData = !!(fetchAttributes & 2);
    var fetchAttrPersistFile = !!(fetchAttributes & 4);
    var fetchAttrAppend = !!(fetchAttributes & 8);
    var fetchAttrReplace = !!(fetchAttributes & 16);
    var fetchAttrSynchronous = !!(fetchAttributes & 64);
    var fetchAttrWaitable = !!(fetchAttributes & 128);
    var userNameStr = userName ? UTF8ToString(userName) : undefined;
    var passwordStr = password ? UTF8ToString(password) : undefined;
    var overriddenMimeTypeStr = overriddenMimeType ? UTF8ToString(overriddenMimeType) : undefined;
    var xhr = new XMLHttpRequest;
    xhr.withCredentials = withCredentials;
    xhr.open(requestMethod, url_, !fetchAttrSynchronous, userNameStr, passwordStr);
    if (!fetchAttrSynchronous) xhr.timeout = timeoutMsecs;
    xhr.url_ = url_;
    assert(!fetchAttrStreamData, "streaming uses moz-chunked-arraybuffer which is no longer supported; TODO: rewrite using fetch()");
    xhr.responseType = "arraybuffer";
    if (overriddenMimeType) {
        xhr.overrideMimeType(overriddenMimeTypeStr)
    }
    if (requestHeaders) {
        for (;;) {
            var key = HEAPU32[requestHeaders >> 2];
            if (!key) break;
            var value = HEAPU32[requestHeaders + 4 >> 2];
            if (!value) break;
            requestHeaders += 8;
            var keyStr = UTF8ToString(key);
            var valueStr = UTF8ToString(value);
            xhr.setRequestHeader(keyStr, valueStr)
        }
    }
    Fetch.xhrs.push(xhr);
    var id = Fetch.xhrs.length;
    HEAPU32[fetch + 0 >> 2] = id;
    var data = dataPtr && dataLength ? HEAPU8.slice(dataPtr, dataPtr + dataLength) : null;
    xhr.onload = function(e) {
        var len = xhr.response ? xhr.response.byteLength : 0;
        var ptr = 0;
        var ptrLen = 0;
        if (fetchAttrLoadToMemory && !fetchAttrStreamData) {
            ptrLen = len;
            ptr = _malloc(ptrLen);
            HEAPU8.set(new Uint8Array(xhr.response), ptr)
        }
        HEAPU32[fetch + 12 >> 2] = ptr;
        Fetch.setu64(fetch + 16, ptrLen);
        Fetch.setu64(fetch + 24, 0);
        if (len) {
            Fetch.setu64(fetch + 32, len)
        }
        HEAPU16[fetch + 40 >> 1] = xhr.readyState;
        if (xhr.readyState === 4 && xhr.status === 0) {
            if (len > 0) xhr.status = 200;
            else xhr.status = 404
        }
        HEAPU16[fetch + 42 >> 1] = xhr.status;
        if (xhr.statusText) stringToUTF8(xhr.statusText, fetch + 44, 64);
        if (xhr.status >= 200 && xhr.status < 300) {
            if (onsuccess) onsuccess(fetch, xhr, e)
        } else {
            if (onerror) onerror(fetch, xhr, e)
        }
    };
    xhr.onerror = function(e) {
        var status = xhr.status;
        if (xhr.readyState === 4 && status === 0) status = 404;
        HEAPU32[fetch + 12 >> 2] = 0;
        Fetch.setu64(fetch + 16, 0);
        Fetch.setu64(fetch + 24, 0);
        Fetch.setu64(fetch + 32, 0);
        HEAPU16[fetch + 40 >> 1] = xhr.readyState;
        HEAPU16[fetch + 42 >> 1] = status;
        if (onerror) onerror(fetch, xhr, e)
    };
    xhr.ontimeout = function(e) {
        if (onerror) onerror(fetch, xhr, e)
    };
    xhr.onprogress = function(e) {
        var ptrLen = fetchAttrLoadToMemory && fetchAttrStreamData && xhr.response ? xhr.response.byteLength : 0;
        var ptr = 0;
        if (fetchAttrLoadToMemory && fetchAttrStreamData) {
            ptr = _malloc(ptrLen);
            HEAPU8.set(new Uint8Array(xhr.response), ptr)
        }
        HEAPU32[fetch + 12 >> 2] = ptr;
        Fetch.setu64(fetch + 16, ptrLen);
        Fetch.setu64(fetch + 24, e.loaded - ptrLen);
        Fetch.setu64(fetch + 32, e.total);
        HEAPU16[fetch + 40 >> 1] = xhr.readyState;
        if (xhr.readyState >= 3 && xhr.status === 0 && e.loaded > 0) xhr.status = 200;
        HEAPU16[fetch + 42 >> 1] = xhr.status;
        if (xhr.statusText) stringToUTF8(xhr.statusText, fetch + 44, 64);
        if (onprogress) onprogress(fetch, xhr, e)
    };
    xhr.onreadystatechange = function(e) {
        HEAPU16[fetch + 40 >> 1] = xhr.readyState;
        if (xhr.readyState >= 2) {
            HEAPU16[fetch + 42 >> 1] = xhr.status
        }
        if (onreadystatechange) onreadystatechange(fetch, xhr, e)
    };
    try {
        xhr.send(data)
    } catch (e) {
        if (onerror) onerror(fetch, xhr, e)
    }
}

function __emscripten_fetch_cache_data(db, fetch, data, onsuccess, onerror) {
    if (!db) {
        onerror(fetch, 0, "IndexedDB not available!");
        return
    }
    var fetch_attr = fetch + 112;
    var destinationPath = HEAPU32[fetch_attr + 64 >> 2];
    if (!destinationPath) destinationPath = HEAPU32[fetch + 8 >> 2];
    var destinationPathStr = UTF8ToString(destinationPath);
    try {
        var transaction = db.transaction(["FILES"], "readwrite");
        var packages = transaction.objectStore("FILES");
        var putRequest = packages.put(data, destinationPathStr);
        putRequest.onsuccess = function(event) {
            HEAPU16[fetch + 40 >> 1] = 4;
            HEAPU16[fetch + 42 >> 1] = 200;
            stringToUTF8("OK", fetch + 44, 64);
            onsuccess(fetch, 0, destinationPathStr)
        };
        putRequest.onerror = function(error) {
            HEAPU16[fetch + 40 >> 1] = 4;
            HEAPU16[fetch + 42 >> 1] = 413;
            stringToUTF8("Payload Too Large", fetch + 44, 64);
            onerror(fetch, 0, error)
        }
    } catch (e) {
        onerror(fetch, 0, e)
    }
}

function __emscripten_fetch_load_cached_data(db, fetch, onsuccess, onerror) {
    if (!db) {
        onerror(fetch, 0, "IndexedDB not available!");
        return
    }
    var fetch_attr = fetch + 112;
    var path = HEAPU32[fetch_attr + 64 >> 2];
    if (!path) path = HEAPU32[fetch + 8 >> 2];
    var pathStr = UTF8ToString(path);
    try {
        var transaction = db.transaction(["FILES"], "readonly");
        var packages = transaction.objectStore("FILES");
        var getRequest = packages.get(pathStr);
        getRequest.onsuccess = function(event) {
            if (event.target.result) {
                var value = event.target.result;
                var len = value.byteLength || value.length;
                var ptr = _malloc(len);
                HEAPU8.set(new Uint8Array(value), ptr);
                HEAPU32[fetch + 12 >> 2] = ptr;
                Fetch.setu64(fetch + 16, len);
                Fetch.setu64(fetch + 24, 0);
                Fetch.setu64(fetch + 32, len);
                HEAPU16[fetch + 40 >> 1] = 4;
                HEAPU16[fetch + 42 >> 1] = 200;
                stringToUTF8("OK", fetch + 44, 64);
                onsuccess(fetch, 0, value)
            } else {
                HEAPU16[fetch + 40 >> 1] = 4;
                HEAPU16[fetch + 42 >> 1] = 404;
                stringToUTF8("Not Found", fetch + 44, 64);
                onerror(fetch, 0, "no data")
            }
        };
        getRequest.onerror = function(error) {
            HEAPU16[fetch + 40 >> 1] = 4;
            HEAPU16[fetch + 42 >> 1] = 404;
            stringToUTF8("Not Found", fetch + 44, 64);
            onerror(fetch, 0, error)
        }
    } catch (e) {
        onerror(fetch, 0, e)
    }
}

function __emscripten_fetch_delete_cached_data(db, fetch, onsuccess, onerror) {
    if (!db) {
        onerror(fetch, 0, "IndexedDB not available!");
        return
    }
    var fetch_attr = fetch + 112;
    var path = HEAPU32[fetch_attr + 64 >> 2];
    if (!path) path = HEAPU32[fetch + 8 >> 2];
    var pathStr = UTF8ToString(path);
    try {
        var transaction = db.transaction(["FILES"], "readwrite");
        var packages = transaction.objectStore("FILES");
        var request = packages.delete(pathStr);
        request.onsuccess = function(event) {
            var value = event.target.result;
            HEAPU32[fetch + 12 >> 2] = 0;
            Fetch.setu64(fetch + 16, 0);
            Fetch.setu64(fetch + 24, 0);
            Fetch.setu64(fetch + 32, 0);
            HEAPU16[fetch + 40 >> 1] = 4;
            HEAPU16[fetch + 42 >> 1] = 200;
            stringToUTF8("OK", fetch + 44, 64);
            onsuccess(fetch, 0, value)
        };
        request.onerror = function(error) {
            HEAPU16[fetch + 40 >> 1] = 4;
            HEAPU16[fetch + 42 >> 1] = 404;
            stringToUTF8("Not Found", fetch + 44, 64);
            onerror(fetch, 0, error)
        }
    } catch (e) {
        onerror(fetch, 0, e)
    }
}

function _emscripten_start_fetch(fetch, successcb, errorcb, progresscb, readystatechangecb) {
    if (typeof noExitRuntime !== "undefined") noExitRuntime = true;
    var fetch_attr = fetch + 112;
    var requestMethod = UTF8ToString(fetch_attr);
    var onsuccess = HEAPU32[fetch_attr + 36 >> 2];
    var onerror = HEAPU32[fetch_attr + 40 >> 2];
    var onprogress = HEAPU32[fetch_attr + 44 >> 2];
    var onreadystatechange = HEAPU32[fetch_attr + 48 >> 2];
    var fetchAttributes = HEAPU32[fetch_attr + 52 >> 2];
    var fetchAttrLoadToMemory = !!(fetchAttributes & 1);
    var fetchAttrStreamData = !!(fetchAttributes & 2);
    var fetchAttrPersistFile = !!(fetchAttributes & 4);
    var fetchAttrNoDownload = !!(fetchAttributes & 32);
    var fetchAttrAppend = !!(fetchAttributes & 8);
    var fetchAttrReplace = !!(fetchAttributes & 16);
    var reportSuccess = function(fetch, xhr, e) {
        if (onsuccess) dynCall_vi(onsuccess, fetch);
        else if (successcb) successcb(fetch)
    };
    var reportProgress = function(fetch, xhr, e) {
        if (onprogress) dynCall_vi(onprogress, fetch);
        else if (progresscb) progresscb(fetch)
    };
    var reportError = function(fetch, xhr, e) {
        if (onerror) dynCall_vi(onerror, fetch);
        else if (errorcb) errorcb(fetch)
    };
    var reportReadyStateChange = function(fetch, xhr, e) {
        if (onreadystatechange) dynCall_vi(onreadystatechange, fetch);
        else if (readystatechangecb) readystatechangecb(fetch)
    };
    var performUncachedXhr = function(fetch, xhr, e) {
        __emscripten_fetch_xhr(fetch, reportSuccess, reportError, reportProgress, reportReadyStateChange)
    };
    var cacheResultAndReportSuccess = function(fetch, xhr, e) {
        var storeSuccess = function(fetch, xhr, e) {
            if (onsuccess) dynCall_vi(onsuccess, fetch);
            else if (successcb) successcb(fetch)
        };
        var storeError = function(fetch, xhr, e) {
            if (onsuccess) dynCall_vi(onsuccess, fetch);
            else if (successcb) successcb(fetch)
        };
        __emscripten_fetch_cache_data(Fetch.dbInstance, fetch, xhr.response, storeSuccess, storeError)
    };
    var performCachedXhr = function(fetch, xhr, e) {
        __emscripten_fetch_xhr(fetch, cacheResultAndReportSuccess, reportError, reportProgress, reportReadyStateChange)
    };
    if (requestMethod === "EM_IDB_STORE") {
        var ptr = HEAPU32[fetch_attr + 84 >> 2];
        __emscripten_fetch_cache_data(Fetch.dbInstance, fetch, HEAPU8.slice(ptr, ptr + HEAPU32[fetch_attr + 88 >> 2]), reportSuccess, reportError)
    } else if (requestMethod === "EM_IDB_DELETE") {
        __emscripten_fetch_delete_cached_data(Fetch.dbInstance, fetch, reportSuccess, reportError)
    } else if (!fetchAttrReplace) {
        __emscripten_fetch_load_cached_data(Fetch.dbInstance, fetch, reportSuccess, fetchAttrNoDownload ? reportError : fetchAttrPersistFile ? performCachedXhr : performUncachedXhr)
    } else if (!fetchAttrNoDownload) {
        __emscripten_fetch_xhr(fetch, fetchAttrPersistFile ? cacheResultAndReportSuccess : reportSuccess, reportError, reportProgress, reportReadyStateChange)
    } else {
        return 0
    }
    return fetch
}
var _fabs = Math_abs;

function _getenv(name) {
    if (name === 0) return 0;
    name = UTF8ToString(name);
    if (!ENV.hasOwnProperty(name)) return 0;
    if (_getenv.ret) _free(_getenv.ret);
    _getenv.ret = allocateUTF8(ENV[name]);
    return _getenv.ret
}

function _gettimeofday(ptr) {
    var now = Date.now();
    HEAP32[ptr >> 2] = now / 1e3 | 0;
    HEAP32[ptr + 4 >> 2] = now % 1e3 * 1e3 | 0;
    return 0
}
var ___tm_timezone = (stringToUTF8("GMT", 1398096, 4), 1398096);

function _gmtime_r(time, tmPtr) {
    var date = new Date(HEAP32[time >> 2] * 1e3);
    HEAP32[tmPtr >> 2] = date.getUTCSeconds();
    HEAP32[tmPtr + 4 >> 2] = date.getUTCMinutes();
    HEAP32[tmPtr + 8 >> 2] = date.getUTCHours();
    HEAP32[tmPtr + 12 >> 2] = date.getUTCDate();
    HEAP32[tmPtr + 16 >> 2] = date.getUTCMonth();
    HEAP32[tmPtr + 20 >> 2] = date.getUTCFullYear() - 1900;
    HEAP32[tmPtr + 24 >> 2] = date.getUTCDay();
    HEAP32[tmPtr + 36 >> 2] = 0;
    HEAP32[tmPtr + 32 >> 2] = 0;
    var start = Date.UTC(date.getUTCFullYear(), 0, 1, 0, 0, 0, 0);
    var yday = (date.getTime() - start) / (1e3 * 60 * 60 * 24) | 0;
    HEAP32[tmPtr + 28 >> 2] = yday;
    HEAP32[tmPtr + 40 >> 2] = ___tm_timezone;
    return tmPtr
}

function _llvm_exp2_f32(x) {
    return Math.pow(2, x)
}

function _llvm_exp2_f64(a0) {
    return _llvm_exp2_f32(a0)
}

function _llvm_log2_f32(x) {
    return Math.log(x) / Math.LN2
}

function _llvm_stackrestore(p) {
    var self = _llvm_stacksave;
    var ret = self.LLVM_SAVEDSTACKS[p];
    self.LLVM_SAVEDSTACKS.splice(p, 1);
    stackRestore(ret)
}

function _llvm_stacksave() {
    var self = _llvm_stacksave;
    if (!self.LLVM_SAVEDSTACKS) {
        self.LLVM_SAVEDSTACKS = []
    }
    self.LLVM_SAVEDSTACKS.push(stackSave());
    return self.LLVM_SAVEDSTACKS.length - 1
}
var _llvm_trunc_f64 = Math_trunc;

function _tzset() {
    if (_tzset.called) return;
    _tzset.called = true;
    HEAP32[__get_timezone() >> 2] = (new Date).getTimezoneOffset() * 60;
    var currentYear = (new Date).getFullYear();
    var winter = new Date(currentYear, 0, 1);
    var summer = new Date(currentYear, 6, 1);
    HEAP32[__get_daylight() >> 2] = Number(winter.getTimezoneOffset() != summer.getTimezoneOffset());

    function extractZone(date) {
        var match = date.toTimeString().match(/\(([A-Za-z ]+)\)$/);
        return match ? match[1] : "GMT"
    }
    var winterName = extractZone(winter);
    var summerName = extractZone(summer);
    var winterNamePtr = allocate(intArrayFromString(winterName), "i8", ALLOC_NORMAL);
    var summerNamePtr = allocate(intArrayFromString(summerName), "i8", ALLOC_NORMAL);
    if (summer.getTimezoneOffset() < winter.getTimezoneOffset()) {
        HEAP32[__get_tzname() >> 2] = winterNamePtr;
        HEAP32[__get_tzname() + 4 >> 2] = summerNamePtr
    } else {
        HEAP32[__get_tzname() >> 2] = summerNamePtr;
        HEAP32[__get_tzname() + 4 >> 2] = winterNamePtr
    }
}

function _localtime_r(time, tmPtr) {
    _tzset();
    var date = new Date(HEAP32[time >> 2] * 1e3);
    HEAP32[tmPtr >> 2] = date.getSeconds();
    HEAP32[tmPtr + 4 >> 2] = date.getMinutes();
    HEAP32[tmPtr + 8 >> 2] = date.getHours();
    HEAP32[tmPtr + 12 >> 2] = date.getDate();
    HEAP32[tmPtr + 16 >> 2] = date.getMonth();
    HEAP32[tmPtr + 20 >> 2] = date.getFullYear() - 1900;
    HEAP32[tmPtr + 24 >> 2] = date.getDay();
    var start = new Date(date.getFullYear(), 0, 1);
    var yday = (date.getTime() - start.getTime()) / (1e3 * 60 * 60 * 24) | 0;
    HEAP32[tmPtr + 28 >> 2] = yday;
    HEAP32[tmPtr + 36 >> 2] = -(date.getTimezoneOffset() * 60);
    var summerOffset = new Date(date.getFullYear(), 6, 1).getTimezoneOffset();
    var winterOffset = start.getTimezoneOffset();
    var dst = (summerOffset != winterOffset && date.getTimezoneOffset() == Math.min(winterOffset, summerOffset)) | 0;
    HEAP32[tmPtr + 32 >> 2] = dst;
    var zonePtr = HEAP32[__get_tzname() + (dst ? 4 : 0) >> 2];
    HEAP32[tmPtr + 40 >> 2] = zonePtr;
    return tmPtr
}

function _emscripten_memcpy_big(dest, src, num) {
    HEAPU8.set(HEAPU8.subarray(src, src + num), dest)
}

function _usleep(useconds) {
    var msec = useconds / 1e3;
    if ((ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) && self["performance"] && self["performance"]["now"]) {
        var start = self["performance"]["now"]();
        while (self["performance"]["now"]() - start < msec) {}
    } else {
        var start = Date.now();
        while (Date.now() - start < msec) {}
    }
    return 0
}
Module["_usleep"] = _usleep;

function _nanosleep(rqtp, rmtp) {
    if (rqtp === 0) {
        ___setErrNo(28);
        return -1
    }
    var seconds = HEAP32[rqtp >> 2];
    var nanoseconds = HEAP32[rqtp + 4 >> 2];
    if (nanoseconds < 0 || nanoseconds > 999999999 || seconds < 0) {
        ___setErrNo(28);
        return -1
    }
    if (rmtp !== 0) {
        HEAP32[rmtp >> 2] = 0;
        HEAP32[rmtp + 4 >> 2] = 0
    }
    return _usleep(seconds * 1e6 + nanoseconds / 1e3)
}

function _pthread_cond_destroy() {
    return 0
}

function _pthread_cond_init() {
    return 0
}

function _pthread_create() {
    return 6
}

function _pthread_join() {}

function __isLeapYear(year) {
    return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)
}

function __arraySum(array, index) {
    var sum = 0;
    for (var i = 0; i <= index; sum += array[i++]);
    return sum
}
var __MONTH_DAYS_LEAP = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
var __MONTH_DAYS_REGULAR = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

function __addDays(date, days) {
    var newDate = new Date(date.getTime());
    while (days > 0) {
        var leap = __isLeapYear(newDate.getFullYear());
        var currentMonth = newDate.getMonth();
        var daysInCurrentMonth = (leap ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR)[currentMonth];
        if (days > daysInCurrentMonth - newDate.getDate()) {
            days -= daysInCurrentMonth - newDate.getDate() + 1;
            newDate.setDate(1);
            if (currentMonth < 11) {
                newDate.setMonth(currentMonth + 1)
            } else {
                newDate.setMonth(0);
                newDate.setFullYear(newDate.getFullYear() + 1)
            }
        } else {
            newDate.setDate(newDate.getDate() + days);
            return newDate
        }
    }
    return newDate
}

function _strftime(s, maxsize, format, tm) {
    var tm_zone = HEAP32[tm + 40 >> 2];
    var date = {
        tm_sec: HEAP32[tm >> 2],
        tm_min: HEAP32[tm + 4 >> 2],
        tm_hour: HEAP32[tm + 8 >> 2],
        tm_mday: HEAP32[tm + 12 >> 2],
        tm_mon: HEAP32[tm + 16 >> 2],
        tm_year: HEAP32[tm + 20 >> 2],
        tm_wday: HEAP32[tm + 24 >> 2],
        tm_yday: HEAP32[tm + 28 >> 2],
        tm_isdst: HEAP32[tm + 32 >> 2],
        tm_gmtoff: HEAP32[tm + 36 >> 2],
        tm_zone: tm_zone ? UTF8ToString(tm_zone) : ""
    };
    var pattern = UTF8ToString(format);
    var EXPANSION_RULES_1 = {
        "%c": "%a %b %d %H:%M:%S %Y",
        "%D": "%m/%d/%y",
        "%F": "%Y-%m-%d",
        "%h": "%b",
        "%r": "%I:%M:%S %p",
        "%R": "%H:%M",
        "%T": "%H:%M:%S",
        "%x": "%m/%d/%y",
        "%X": "%H:%M:%S",
        "%Ec": "%c",
        "%EC": "%C",
        "%Ex": "%m/%d/%y",
        "%EX": "%H:%M:%S",
        "%Ey": "%y",
        "%EY": "%Y",
        "%Od": "%d",
        "%Oe": "%e",
        "%OH": "%H",
        "%OI": "%I",
        "%Om": "%m",
        "%OM": "%M",
        "%OS": "%S",
        "%Ou": "%u",
        "%OU": "%U",
        "%OV": "%V",
        "%Ow": "%w",
        "%OW": "%W",
        "%Oy": "%y"
    };
    for (var rule in EXPANSION_RULES_1) {
        pattern = pattern.replace(new RegExp(rule, "g"), EXPANSION_RULES_1[rule])
    }
    var WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    var MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    function leadingSomething(value, digits, character) {
        var str = typeof value === "number" ? value.toString() : value || "";
        while (str.length < digits) {
            str = character[0] + str
        }
        return str
    }

    function leadingNulls(value, digits) {
        return leadingSomething(value, digits, "0")
    }

    function compareByDay(date1, date2) {
        function sgn(value) {
            return value < 0 ? -1 : value > 0 ? 1 : 0
        }
        var compare;
        if ((compare = sgn(date1.getFullYear() - date2.getFullYear())) === 0) {
            if ((compare = sgn(date1.getMonth() - date2.getMonth())) === 0) {
                compare = sgn(date1.getDate() - date2.getDate())
            }
        }
        return compare
    }

    function getFirstWeekStartDate(janFourth) {
        switch (janFourth.getDay()) {
            case 0:
                return new Date(janFourth.getFullYear() - 1, 11, 29);
            case 1:
                return janFourth;
            case 2:
                return new Date(janFourth.getFullYear(), 0, 3);
            case 3:
                return new Date(janFourth.getFullYear(), 0, 2);
            case 4:
                return new Date(janFourth.getFullYear(), 0, 1);
            case 5:
                return new Date(janFourth.getFullYear() - 1, 11, 31);
            case 6:
                return new Date(janFourth.getFullYear() - 1, 11, 30)
        }
    }

    function getWeekBasedYear(date) {
        var thisDate = __addDays(new Date(date.tm_year + 1900, 0, 1), date.tm_yday);
        var janFourthThisYear = new Date(thisDate.getFullYear(), 0, 4);
        var janFourthNextYear = new Date(thisDate.getFullYear() + 1, 0, 4);
        var firstWeekStartThisYear = getFirstWeekStartDate(janFourthThisYear);
        var firstWeekStartNextYear = getFirstWeekStartDate(janFourthNextYear);
        if (compareByDay(firstWeekStartThisYear, thisDate) <= 0) {
            if (compareByDay(firstWeekStartNextYear, thisDate) <= 0) {
                return thisDate.getFullYear() + 1
            } else {
                return thisDate.getFullYear()
            }
        } else {
            return thisDate.getFullYear() - 1
        }
    }
    var EXPANSION_RULES_2 = {
        "%a": function(date) {
            return WEEKDAYS[date.tm_wday].substring(0, 3)
        },
        "%A": function(date) {
            return WEEKDAYS[date.tm_wday]
        },
        "%b": function(date) {
            return MONTHS[date.tm_mon].substring(0, 3)
        },
        "%B": function(date) {
            return MONTHS[date.tm_mon]
        },
        "%C": function(date) {
            var year = date.tm_year + 1900;
            return leadingNulls(year / 100 | 0, 2)
        },
        "%d": function(date) {
            return leadingNulls(date.tm_mday, 2)
        },
        "%e": function(date) {
            return leadingSomething(date.tm_mday, 2, " ")
        },
        "%g": function(date) {
            return getWeekBasedYear(date).toString().substring(2)
        },
        "%G": function(date) {
            return getWeekBasedYear(date)
        },
        "%H": function(date) {
            return leadingNulls(date.tm_hour, 2)
        },
        "%I": function(date) {
            var twelveHour = date.tm_hour;
            if (twelveHour == 0) twelveHour = 12;
            else if (twelveHour > 12) twelveHour -= 12;
            return leadingNulls(twelveHour, 2)
        },
        "%j": function(date) {
            return leadingNulls(date.tm_mday + __arraySum(__isLeapYear(date.tm_year + 1900) ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR, date.tm_mon - 1), 3)
        },
        "%m": function(date) {
            return leadingNulls(date.tm_mon + 1, 2)
        },
        "%M": function(date) {
            return leadingNulls(date.tm_min, 2)
        },
        "%n": function() {
            return "\n"
        },
        "%p": function(date) {
            if (date.tm_hour >= 0 && date.tm_hour < 12) {
                return "AM"
            } else {
                return "PM"
            }
        },
        "%S": function(date) {
            return leadingNulls(date.tm_sec, 2)
        },
        "%t": function() {
            return "\t"
        },
        "%u": function(date) {
            return date.tm_wday || 7
        },
        "%U": function(date) {
            var janFirst = new Date(date.tm_year + 1900, 0, 1);
            var firstSunday = janFirst.getDay() === 0 ? janFirst : __addDays(janFirst, 7 - janFirst.getDay());
            var endDate = new Date(date.tm_year + 1900, date.tm_mon, date.tm_mday);
            if (compareByDay(firstSunday, endDate) < 0) {
                var februaryFirstUntilEndMonth = __arraySum(__isLeapYear(endDate.getFullYear()) ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR, endDate.getMonth() - 1) - 31;
                var firstSundayUntilEndJanuary = 31 - firstSunday.getDate();
                var days = firstSundayUntilEndJanuary + februaryFirstUntilEndMonth + endDate.getDate();
                return leadingNulls(Math.ceil(days / 7), 2)
            }
            return compareByDay(firstSunday, janFirst) === 0 ? "01" : "00"
        },
        "%V": function(date) {
            var janFourthThisYear = new Date(date.tm_year + 1900, 0, 4);
            var janFourthNextYear = new Date(date.tm_year + 1901, 0, 4);
            var firstWeekStartThisYear = getFirstWeekStartDate(janFourthThisYear);
            var firstWeekStartNextYear = getFirstWeekStartDate(janFourthNextYear);
            var endDate = __addDays(new Date(date.tm_year + 1900, 0, 1), date.tm_yday);
            if (compareByDay(endDate, firstWeekStartThisYear) < 0) {
                return "53"
            }
            if (compareByDay(firstWeekStartNextYear, endDate) <= 0) {
                return "01"
            }
            var daysDifference;
            if (firstWeekStartThisYear.getFullYear() < date.tm_year + 1900) {
                daysDifference = date.tm_yday + 32 - firstWeekStartThisYear.getDate()
            } else {
                daysDifference = date.tm_yday + 1 - firstWeekStartThisYear.getDate()
            }
            return leadingNulls(Math.ceil(daysDifference / 7), 2)
        },
        "%w": function(date) {
            return date.tm_wday
        },
        "%W": function(date) {
            var janFirst = new Date(date.tm_year, 0, 1);
            var firstMonday = janFirst.getDay() === 1 ? janFirst : __addDays(janFirst, janFirst.getDay() === 0 ? 1 : 7 - janFirst.getDay() + 1);
            var endDate = new Date(date.tm_year + 1900, date.tm_mon, date.tm_mday);
            if (compareByDay(firstMonday, endDate) < 0) {
                var februaryFirstUntilEndMonth = __arraySum(__isLeapYear(endDate.getFullYear()) ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR, endDate.getMonth() - 1) - 31;
                var firstMondayUntilEndJanuary = 31 - firstMonday.getDate();
                var days = firstMondayUntilEndJanuary + februaryFirstUntilEndMonth + endDate.getDate();
                return leadingNulls(Math.ceil(days / 7), 2)
            }
            return compareByDay(firstMonday, janFirst) === 0 ? "01" : "00"
        },
        "%y": function(date) {
            return (date.tm_year + 1900).toString().substring(2)
        },
        "%Y": function(date) {
            return date.tm_year + 1900
        },
        "%z": function(date) {
            var off = date.tm_gmtoff;
            var ahead = off >= 0;
            off = Math.abs(off) / 60;
            off = off / 60 * 100 + off % 60;
            return (ahead ? "+" : "-") + String("0000" + off).slice(-4)
        },
        "%Z": function(date) {
            return date.tm_zone
        },
        "%%": function() {
            return "%"
        }
    };
    for (var rule in EXPANSION_RULES_2) {
        if (pattern.indexOf(rule) >= 0) {
            pattern = pattern.replace(new RegExp(rule, "g"), EXPANSION_RULES_2[rule](date))
        }
    }
    var bytes = intArrayFromString(pattern, false);
    if (bytes.length > maxsize) {
        return 0
    }
    writeArrayToMemory(bytes, s);
    return bytes.length - 1
}

function _sysconf(name) {
    switch (name) {
        case 30:
            return PAGE_SIZE;
        case 85:
            var maxHeapSize = 2 * 1024 * 1024 * 1024 - 65536;
            maxHeapSize = HEAPU8.length;
            return maxHeapSize / PAGE_SIZE;
        case 132:
        case 133:
        case 12:
        case 137:
        case 138:
        case 15:
        case 235:
        case 16:
        case 17:
        case 18:
        case 19:
        case 20:
        case 149:
        case 13:
        case 10:
        case 236:
        case 153:
        case 9:
        case 21:
        case 22:
        case 159:
        case 154:
        case 14:
        case 77:
        case 78:
        case 139:
        case 80:
        case 81:
        case 82:
        case 68:
        case 67:
        case 164:
        case 11:
        case 29:
        case 47:
        case 48:
        case 95:
        case 52:
        case 51:
        case 46:
            return 200809;
        case 79:
            return 0;
        case 27:
        case 246:
        case 127:
        case 128:
        case 23:
        case 24:
        case 160:
        case 161:
        case 181:
        case 182:
        case 242:
        case 183:
        case 184:
        case 243:
        case 244:
        case 245:
        case 165:
        case 178:
        case 179:
        case 49:
        case 50:
        case 168:
        case 169:
        case 175:
        case 170:
        case 171:
        case 172:
        case 97:
        case 76:
        case 32:
        case 173:
        case 35:
            return -1;
        case 176:
        case 177:
        case 7:
        case 155:
        case 8:
        case 157:
        case 125:
        case 126:
        case 92:
        case 93:
        case 129:
        case 130:
        case 131:
        case 94:
        case 91:
            return 1;
        case 74:
        case 60:
        case 69:
        case 70:
        case 4:
            return 1024;
        case 31:
        case 42:
        case 72:
            return 32;
        case 87:
        case 26:
        case 33:
            return 2147483647;
        case 34:
        case 1:
            return 47839;
        case 38:
        case 36:
            return 99;
        case 43:
        case 37:
            return 2048;
        case 0:
            return 2097152;
        case 3:
            return 65536;
        case 28:
            return 32768;
        case 44:
            return 32767;
        case 75:
            return 16384;
        case 39:
            return 1e3;
        case 89:
            return 700;
        case 71:
            return 256;
        case 40:
            return 255;
        case 2:
            return 100;
        case 180:
            return 64;
        case 25:
            return 20;
        case 5:
            return 16;
        case 6:
            return 6;
        case 73:
            return 4;
        case 84: {
            if (typeof navigator === "object") return navigator["hardwareConcurrency"] || 1;
            return 1
        }
    }
    ___setErrNo(28);
    return -1
}

function _time(ptr) {
    var ret = Date.now() / 1e3 | 0;
    if (ptr) {
        HEAP32[ptr >> 2] = ret
    }
    return ret
}
FS.staticInit();
if (ENVIRONMENT_HAS_NODE) {
    var fs = require("fs");
    var NODEJS_PATH = require("path");
    NODEFS.staticInit()
}
if (ENVIRONMENT_IS_NODE) {
    _emscripten_get_now = function _emscripten_get_now_actual() {
        var t = process["hrtime"]();
        return t[0] * 1e3 + t[1] / 1e6
    }
} else if (typeof dateNow !== "undefined") {
    _emscripten_get_now = dateNow
} else if (typeof performance === "object" && performance && typeof performance["now"] === "function") {
    _emscripten_get_now = function() {
        return performance["now"]()
    }
} else {
    _emscripten_get_now = Date.now
}
Fetch.staticInit();

function intArrayFromString(stringy, dontAddNull, length) {
    var len = length > 0 ? length : lengthBytesUTF8(stringy) + 1;
    var u8array = new Array(len);
    var numBytesWritten = stringToUTF8Array(stringy, u8array, 0, u8array.length);
    if (dontAddNull) u8array.length = numBytesWritten;
    return u8array
}
var debug_table_dd = [0, "jsCall_dd_0", "jsCall_dd_1", "jsCall_dd_2", "jsCall_dd_3", "jsCall_dd_4", "jsCall_dd_5", "jsCall_dd_6", "jsCall_dd_7", "jsCall_dd_8", "jsCall_dd_9", "jsCall_dd_10", "jsCall_dd_11", "jsCall_dd_12", "jsCall_dd_13", "jsCall_dd_14", "jsCall_dd_15", "jsCall_dd_16", "jsCall_dd_17", "jsCall_dd_18", "jsCall_dd_19", "jsCall_dd_20", "jsCall_dd_21", "jsCall_dd_22", "jsCall_dd_23", "jsCall_dd_24", "jsCall_dd_25", "jsCall_dd_26", "jsCall_dd_27", "jsCall_dd_28", "jsCall_dd_29", "jsCall_dd_30", "jsCall_dd_31", "jsCall_dd_32", "jsCall_dd_33", "jsCall_dd_34", "jsCall_dd_35", "jsCall_dd_36", "jsCall_dd_37", "jsCall_dd_38", "jsCall_dd_39", "jsCall_dd_40", "jsCall_dd_41", "jsCall_dd_42", "jsCall_dd_43", "jsCall_dd_44", "jsCall_dd_45", "jsCall_dd_46", "jsCall_dd_47", "jsCall_dd_48", "jsCall_dd_49", "jsCall_dd_50", "jsCall_dd_51", "jsCall_dd_52", "jsCall_dd_53", "jsCall_dd_54", "jsCall_dd_55", "jsCall_dd_56", "jsCall_dd_57", "jsCall_dd_58", "jsCall_dd_59", "jsCall_dd_60", "jsCall_dd_61", "jsCall_dd_62", "jsCall_dd_63", "jsCall_dd_64", "jsCall_dd_65", "jsCall_dd_66", "jsCall_dd_67", "jsCall_dd_68", "jsCall_dd_69", "jsCall_dd_70", "jsCall_dd_71", "jsCall_dd_72", "jsCall_dd_73", "jsCall_dd_74", "jsCall_dd_75", "jsCall_dd_76", "jsCall_dd_77", "jsCall_dd_78", "jsCall_dd_79", "jsCall_dd_80", "jsCall_dd_81", "jsCall_dd_82", "jsCall_dd_83", "jsCall_dd_84", "jsCall_dd_85", "jsCall_dd_86", "jsCall_dd_87", "jsCall_dd_88", "jsCall_dd_89", "jsCall_dd_90", "jsCall_dd_91", "jsCall_dd_92", "jsCall_dd_93", "jsCall_dd_94", "jsCall_dd_95", "jsCall_dd_96", "jsCall_dd_97", "jsCall_dd_98", "jsCall_dd_99", "_sinh", "_cosh", "_tanh", "_sin", "_cos", "_tan", "_atan", "_asin", "_acos", "_exp", "_log", "_fabs", "_etime", 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
var debug_table_did = [0, "jsCall_did_0", "jsCall_did_1", "jsCall_did_2", "jsCall_did_3", "jsCall_did_4", "jsCall_did_5", "jsCall_did_6", "jsCall_did_7", "jsCall_did_8", "jsCall_did_9", "jsCall_did_10", "jsCall_did_11", "jsCall_did_12", "jsCall_did_13", "jsCall_did_14", "jsCall_did_15", "jsCall_did_16", "jsCall_did_17", "jsCall_did_18", "jsCall_did_19", "jsCall_did_20", "jsCall_did_21", "jsCall_did_22", "jsCall_did_23", "jsCall_did_24", "jsCall_did_25", "jsCall_did_26", "jsCall_did_27", "jsCall_did_28", "jsCall_did_29", "jsCall_did_30", "jsCall_did_31", "jsCall_did_32", "jsCall_did_33", "jsCall_did_34", "jsCall_did_35", "jsCall_did_36", "jsCall_did_37", "jsCall_did_38", "jsCall_did_39", "jsCall_did_40", "jsCall_did_41", "jsCall_did_42", "jsCall_did_43", "jsCall_did_44", "jsCall_did_45", "jsCall_did_46", "jsCall_did_47", "jsCall_did_48", "jsCall_did_49", "jsCall_did_50", "jsCall_did_51", "jsCall_did_52", "jsCall_did_53", "jsCall_did_54", "jsCall_did_55", "jsCall_did_56", "jsCall_did_57", "jsCall_did_58", "jsCall_did_59", "jsCall_did_60", "jsCall_did_61", "jsCall_did_62", "jsCall_did_63", "jsCall_did_64", "jsCall_did_65", "jsCall_did_66", "jsCall_did_67", "jsCall_did_68", "jsCall_did_69", "jsCall_did_70", "jsCall_did_71", "jsCall_did_72", "jsCall_did_73", "jsCall_did_74", "jsCall_did_75", "jsCall_did_76", "jsCall_did_77", "jsCall_did_78", "jsCall_did_79", "jsCall_did_80", "jsCall_did_81", "jsCall_did_82", "jsCall_did_83", "jsCall_did_84", "jsCall_did_85", "jsCall_did_86", "jsCall_did_87", "jsCall_did_88", "jsCall_did_89", "jsCall_did_90", "jsCall_did_91", "jsCall_did_92", "jsCall_did_93", "jsCall_did_94", "jsCall_did_95", "jsCall_did_96", "jsCall_did_97", "jsCall_did_98", "jsCall_did_99", 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
var debug_table_didd = [0, "jsCall_didd_0", "jsCall_didd_1", "jsCall_didd_2", "jsCall_didd_3", "jsCall_didd_4", "jsCall_didd_5", "jsCall_didd_6", "jsCall_didd_7", "jsCall_didd_8", "jsCall_didd_9", "jsCall_didd_10", "jsCall_didd_11", "jsCall_didd_12", "jsCall_didd_13", "jsCall_didd_14", "jsCall_didd_15", "jsCall_didd_16", "jsCall_didd_17", "jsCall_didd_18", "jsCall_didd_19", "jsCall_didd_20", "jsCall_didd_21", "jsCall_didd_22", "jsCall_didd_23", "jsCall_didd_24", "jsCall_didd_25", "jsCall_didd_26", "jsCall_didd_27", "jsCall_didd_28", "jsCall_didd_29", "jsCall_didd_30", "jsCall_didd_31", "jsCall_didd_32", "jsCall_didd_33", "jsCall_didd_34", "jsCall_didd_35", "jsCall_didd_36", "jsCall_didd_37", "jsCall_didd_38", "jsCall_didd_39", "jsCall_didd_40", "jsCall_didd_41", "jsCall_didd_42", "jsCall_didd_43", "jsCall_didd_44", "jsCall_didd_45", "jsCall_didd_46", "jsCall_didd_47", "jsCall_didd_48", "jsCall_didd_49", "jsCall_didd_50", "jsCall_didd_51", "jsCall_didd_52", "jsCall_didd_53", "jsCall_didd_54", "jsCall_didd_55", "jsCall_didd_56", "jsCall_didd_57", "jsCall_didd_58", "jsCall_didd_59", "jsCall_didd_60", "jsCall_didd_61", "jsCall_didd_62", "jsCall_didd_63", "jsCall_didd_64", "jsCall_didd_65", "jsCall_didd_66", "jsCall_didd_67", "jsCall_didd_68", "jsCall_didd_69", "jsCall_didd_70", "jsCall_didd_71", "jsCall_didd_72", "jsCall_didd_73", "jsCall_didd_74", "jsCall_didd_75", "jsCall_didd_76", "jsCall_didd_77", "jsCall_didd_78", "jsCall_didd_79", "jsCall_didd_80", "jsCall_didd_81", "jsCall_didd_82", "jsCall_didd_83", "jsCall_didd_84", "jsCall_didd_85", "jsCall_didd_86", "jsCall_didd_87", "jsCall_didd_88", "jsCall_didd_89", "jsCall_didd_90", "jsCall_didd_91", "jsCall_didd_92", "jsCall_didd_93", "jsCall_didd_94", "jsCall_didd_95", "jsCall_didd_96", "jsCall_didd_97", "jsCall_didd_98", "jsCall_didd_99", 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
var debug_table_fii = [0, "jsCall_fii_0", "jsCall_fii_1", "jsCall_fii_2", "jsCall_fii_3", "jsCall_fii_4", "jsCall_fii_5", "jsCall_fii_6", "jsCall_fii_7", "jsCall_fii_8", "jsCall_fii_9", "jsCall_fii_10", "jsCall_fii_11", "jsCall_fii_12", "jsCall_fii_13", "jsCall_fii_14", "jsCall_fii_15", "jsCall_fii_16", "jsCall_fii_17", "jsCall_fii_18", "jsCall_fii_19", "jsCall_fii_20", "jsCall_fii_21", "jsCall_fii_22", "jsCall_fii_23", "jsCall_fii_24", "jsCall_fii_25", "jsCall_fii_26", "jsCall_fii_27", "jsCall_fii_28", "jsCall_fii_29", "jsCall_fii_30", "jsCall_fii_31", "jsCall_fii_32", "jsCall_fii_33", "jsCall_fii_34", "jsCall_fii_35", "jsCall_fii_36", "jsCall_fii_37", "jsCall_fii_38", "jsCall_fii_39", "jsCall_fii_40", "jsCall_fii_41", "jsCall_fii_42", "jsCall_fii_43", "jsCall_fii_44", "jsCall_fii_45", "jsCall_fii_46", "jsCall_fii_47", "jsCall_fii_48", "jsCall_fii_49", "jsCall_fii_50", "jsCall_fii_51", "jsCall_fii_52", "jsCall_fii_53", "jsCall_fii_54", "jsCall_fii_55", "jsCall_fii_56", "jsCall_fii_57", "jsCall_fii_58", "jsCall_fii_59", "jsCall_fii_60", "jsCall_fii_61", "jsCall_fii_62", "jsCall_fii_63", "jsCall_fii_64", "jsCall_fii_65", "jsCall_fii_66", "jsCall_fii_67", "jsCall_fii_68", "jsCall_fii_69", "jsCall_fii_70", "jsCall_fii_71", "jsCall_fii_72", "jsCall_fii_73", "jsCall_fii_74", "jsCall_fii_75", "jsCall_fii_76", "jsCall_fii_77", "jsCall_fii_78", "jsCall_fii_79", "jsCall_fii_80", "jsCall_fii_81", "jsCall_fii_82", "jsCall_fii_83", "jsCall_fii_84", "jsCall_fii_85", "jsCall_fii_86", "jsCall_fii_87", "jsCall_fii_88", "jsCall_fii_89", "jsCall_fii_90", "jsCall_fii_91", "jsCall_fii_92", "jsCall_fii_93", "jsCall_fii_94", "jsCall_fii_95", "jsCall_fii_96", "jsCall_fii_97", "jsCall_fii_98", "jsCall_fii_99", "_sbr_sum_square_c", 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
var debug_table_fiii = [0, "jsCall_fiii_0", "jsCall_fiii_1", "jsCall_fiii_2", "jsCall_fiii_3", "jsCall_fiii_4", "jsCall_fiii_5", "jsCall_fiii_6", "jsCall_fiii_7", "jsCall_fiii_8", "jsCall_fiii_9", "jsCall_fiii_10", "jsCall_fiii_11", "jsCall_fiii_12", "jsCall_fiii_13", "jsCall_fiii_14", "jsCall_fiii_15", "jsCall_fiii_16", "jsCall_fiii_17", "jsCall_fiii_18", "jsCall_fiii_19", "jsCall_fiii_20", "jsCall_fiii_21", "jsCall_fiii_22", "jsCall_fiii_23", "jsCall_fiii_24", "jsCall_fiii_25", "jsCall_fiii_26", "jsCall_fiii_27", "jsCall_fiii_28", "jsCall_fiii_29", "jsCall_fiii_30", "jsCall_fiii_31", "jsCall_fiii_32", "jsCall_fiii_33", "jsCall_fiii_34", "jsCall_fiii_35", "jsCall_fiii_36", "jsCall_fiii_37", "jsCall_fiii_38", "jsCall_fiii_39", "jsCall_fiii_40", "jsCall_fiii_41", "jsCall_fiii_42", "jsCall_fiii_43", "jsCall_fiii_44", "jsCall_fiii_45", "jsCall_fiii_46", "jsCall_fiii_47", "jsCall_fiii_48", "jsCall_fiii_49", "jsCall_fiii_50", "jsCall_fiii_51", "jsCall_fiii_52", "jsCall_fiii_53", "jsCall_fiii_54", "jsCall_fiii_55", "jsCall_fiii_56", "jsCall_fiii_57", "jsCall_fiii_58", "jsCall_fiii_59", "jsCall_fiii_60", "jsCall_fiii_61", "jsCall_fiii_62", "jsCall_fiii_63", "jsCall_fiii_64", "jsCall_fiii_65", "jsCall_fiii_66", "jsCall_fiii_67", "jsCall_fiii_68", "jsCall_fiii_69", "jsCall_fiii_70", "jsCall_fiii_71", "jsCall_fiii_72", "jsCall_fiii_73", "jsCall_fiii_74", "jsCall_fiii_75", "jsCall_fiii_76", "jsCall_fiii_77", "jsCall_fiii_78", "jsCall_fiii_79", "jsCall_fiii_80", "jsCall_fiii_81", "jsCall_fiii_82", "jsCall_fiii_83", "jsCall_fiii_84", "jsCall_fiii_85", "jsCall_fiii_86", "jsCall_fiii_87", "jsCall_fiii_88", "jsCall_fiii_89", "jsCall_fiii_90", "jsCall_fiii_91", "jsCall_fiii_92", "jsCall_fiii_93", "jsCall_fiii_94", "jsCall_fiii_95", "jsCall_fiii_96", "jsCall_fiii_97", "jsCall_fiii_98", "jsCall_fiii_99", "_avpriv_scalarproduct_float_c", 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
var debug_table_ii = [0, "jsCall_ii_0", "jsCall_ii_1", "jsCall_ii_2", "jsCall_ii_3", "jsCall_ii_4", "jsCall_ii_5", "jsCall_ii_6", "jsCall_ii_7", "jsCall_ii_8", "jsCall_ii_9", "jsCall_ii_10", "jsCall_ii_11", "jsCall_ii_12", "jsCall_ii_13", "jsCall_ii_14", "jsCall_ii_15", "jsCall_ii_16", "jsCall_ii_17", "jsCall_ii_18", "jsCall_ii_19", "jsCall_ii_20", "jsCall_ii_21", "jsCall_ii_22", "jsCall_ii_23", "jsCall_ii_24", "jsCall_ii_25", "jsCall_ii_26", "jsCall_ii_27", "jsCall_ii_28", "jsCall_ii_29", "jsCall_ii_30", "jsCall_ii_31", "jsCall_ii_32", "jsCall_ii_33", "jsCall_ii_34", "jsCall_ii_35", "jsCall_ii_36", "jsCall_ii_37", "jsCall_ii_38", "jsCall_ii_39", "jsCall_ii_40", "jsCall_ii_41", "jsCall_ii_42", "jsCall_ii_43", "jsCall_ii_44", "jsCall_ii_45", "jsCall_ii_46", "jsCall_ii_47", "jsCall_ii_48", "jsCall_ii_49", "jsCall_ii_50", "jsCall_ii_51", "jsCall_ii_52", "jsCall_ii_53", "jsCall_ii_54", "jsCall_ii_55", "jsCall_ii_56", "jsCall_ii_57", "jsCall_ii_58", "jsCall_ii_59", "jsCall_ii_60", "jsCall_ii_61", "jsCall_ii_62", "jsCall_ii_63", "jsCall_ii_64", "jsCall_ii_65", "jsCall_ii_66", "jsCall_ii_67", "jsCall_ii_68", "jsCall_ii_69", "jsCall_ii_70", "jsCall_ii_71", "jsCall_ii_72", "jsCall_ii_73", "jsCall_ii_74", "jsCall_ii_75", "jsCall_ii_76", "jsCall_ii_77", "jsCall_ii_78", "jsCall_ii_79", "jsCall_ii_80", "jsCall_ii_81", "jsCall_ii_82", "jsCall_ii_83", "jsCall_ii_84", "jsCall_ii_85", "jsCall_ii_86", "jsCall_ii_87", "jsCall_ii_88", "jsCall_ii_89", "jsCall_ii_90", "jsCall_ii_91", "jsCall_ii_92", "jsCall_ii_93", "jsCall_ii_94", "jsCall_ii_95", "jsCall_ii_96", "jsCall_ii_97", "jsCall_ii_98", "jsCall_ii_99", "_avi_probe", "_avi_read_header", "_avi_read_close", "_av_default_item_name", "_ff_avio_child_class_next", "_flv_probe", "_flv_read_header", "_flv_read_close", "_live_flv_probe", "_h264_probe", "_ff_raw_video_read_header", "_hevc_probe", "_mpeg4video_probe", "_matroska_probe", "_matroska_read_header", "_matroska_read_close", "_mov_probe", "_mov_read_header", "_mov_read_close", "_mp3_read_probe", "_mp3_read_header", "_mpegps_probe", "_mpegps_read_header", "_mpegts_probe", "_mpegts_read_header", "_mpegts_read_close", "_mpegvideo_probe", "_format_to_name", "_format_child_class_next", "_get_category", "_pcm_read_header", "_urlcontext_to_name", "_ff_urlcontext_child_class_next", "_sws_context_to_name", "_ff_bsf_child_class_next", "_hevc_mp4toannexb_init", "_hevc_init_thread_copy", "_hevc_decode_init", "_hevc_decode_free", "_decode_init", "_context_to_name", "_codec_child_class_next", "_get_category_2911", "_pcm_decode_init", "_pcm_decode_close", "_aac_decode_init", "_aac_decode_close", "_init", "_context_to_name_6198", "_resample_flush", "___stdio_close", "___emscripten_stdout_close", "_releaseSniffStreamFunc", "_naluLListLengthFunc", "_hflv_releaseFunc", "_hflv_getBufferLength", "_g711_releaseFunc", "_g711_decodeVideoFrameFunc", "_g711_getBufferLength", "_initializeDecoderFunc", "__getFrame", "_closeVideoFunc", "_releaseFunc", "_initializeDemuxerFunc", "_getPacketFunc", "_releaseDemuxerFunc", "_io_short_seek", "_avio_rb16", "_avio_rl16", "_av_buffer_allocz", "_frame_worker_thread", "_av_buffer_alloc", "_thread_worker", 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
var debug_table_iid = [0, "jsCall_iid_0", "jsCall_iid_1", "jsCall_iid_2", "jsCall_iid_3", "jsCall_iid_4", "jsCall_iid_5", "jsCall_iid_6", "jsCall_iid_7", "jsCall_iid_8", "jsCall_iid_9", "jsCall_iid_10", "jsCall_iid_11", "jsCall_iid_12", "jsCall_iid_13", "jsCall_iid_14", "jsCall_iid_15", "jsCall_iid_16", "jsCall_iid_17", "jsCall_iid_18", "jsCall_iid_19", "jsCall_iid_20", "jsCall_iid_21", "jsCall_iid_22", "jsCall_iid_23", "jsCall_iid_24", "jsCall_iid_25", "jsCall_iid_26", "jsCall_iid_27", "jsCall_iid_28", "jsCall_iid_29", "jsCall_iid_30", "jsCall_iid_31", "jsCall_iid_32", "jsCall_iid_33", "jsCall_iid_34", "jsCall_iid_35", "jsCall_iid_36", "jsCall_iid_37", "jsCall_iid_38", "jsCall_iid_39", "jsCall_iid_40", "jsCall_iid_41", "jsCall_iid_42", "jsCall_iid_43", "jsCall_iid_44", "jsCall_iid_45", "jsCall_iid_46", "jsCall_iid_47", "jsCall_iid_48", "jsCall_iid_49", "jsCall_iid_50", "jsCall_iid_51", "jsCall_iid_52", "jsCall_iid_53", "jsCall_iid_54", "jsCall_iid_55", "jsCall_iid_56", "jsCall_iid_57", "jsCall_iid_58", "jsCall_iid_59", "jsCall_iid_60", "jsCall_iid_61", "jsCall_iid_62", "jsCall_iid_63", "jsCall_iid_64", "jsCall_iid_65", "jsCall_iid_66", "jsCall_iid_67", "jsCall_iid_68", "jsCall_iid_69", "jsCall_iid_70", "jsCall_iid_71", "jsCall_iid_72", "jsCall_iid_73", "jsCall_iid_74", "jsCall_iid_75", "jsCall_iid_76", "jsCall_iid_77", "jsCall_iid_78", "jsCall_iid_79", "jsCall_iid_80", "jsCall_iid_81", "jsCall_iid_82", "jsCall_iid_83", "jsCall_iid_84", "jsCall_iid_85", "jsCall_iid_86", "jsCall_iid_87", "jsCall_iid_88", "jsCall_iid_89", "jsCall_iid_90", "jsCall_iid_91", "jsCall_iid_92", "jsCall_iid_93", "jsCall_iid_94", "jsCall_iid_95", "jsCall_iid_96", "jsCall_iid_97", "jsCall_iid_98", "jsCall_iid_99", "_seekBufferFunc", 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
var debug_table_iidiiii = [0, "jsCall_iidiiii_0", "jsCall_iidiiii_1", "jsCall_iidiiii_2", "jsCall_iidiiii_3", "jsCall_iidiiii_4", "jsCall_iidiiii_5", "jsCall_iidiiii_6", "jsCall_iidiiii_7", "jsCall_iidiiii_8", "jsCall_iidiiii_9", "jsCall_iidiiii_10", "jsCall_iidiiii_11", "jsCall_iidiiii_12", "jsCall_iidiiii_13", "jsCall_iidiiii_14", "jsCall_iidiiii_15", "jsCall_iidiiii_16", "jsCall_iidiiii_17", "jsCall_iidiiii_18", "jsCall_iidiiii_19", "jsCall_iidiiii_20", "jsCall_iidiiii_21", "jsCall_iidiiii_22", "jsCall_iidiiii_23", "jsCall_iidiiii_24", "jsCall_iidiiii_25", "jsCall_iidiiii_26", "jsCall_iidiiii_27", "jsCall_iidiiii_28", "jsCall_iidiiii_29", "jsCall_iidiiii_30", "jsCall_iidiiii_31", "jsCall_iidiiii_32", "jsCall_iidiiii_33", "jsCall_iidiiii_34", "jsCall_iidiiii_35", "jsCall_iidiiii_36", "jsCall_iidiiii_37", "jsCall_iidiiii_38", "jsCall_iidiiii_39", "jsCall_iidiiii_40", "jsCall_iidiiii_41", "jsCall_iidiiii_42", "jsCall_iidiiii_43", "jsCall_iidiiii_44", "jsCall_iidiiii_45", "jsCall_iidiiii_46", "jsCall_iidiiii_47", "jsCall_iidiiii_48", "jsCall_iidiiii_49", "jsCall_iidiiii_50", "jsCall_iidiiii_51", "jsCall_iidiiii_52", "jsCall_iidiiii_53", "jsCall_iidiiii_54", "jsCall_iidiiii_55", "jsCall_iidiiii_56", "jsCall_iidiiii_57", "jsCall_iidiiii_58", "jsCall_iidiiii_59", "jsCall_iidiiii_60", "jsCall_iidiiii_61", "jsCall_iidiiii_62", "jsCall_iidiiii_63", "jsCall_iidiiii_64", "jsCall_iidiiii_65", "jsCall_iidiiii_66", "jsCall_iidiiii_67", "jsCall_iidiiii_68", "jsCall_iidiiii_69", "jsCall_iidiiii_70", "jsCall_iidiiii_71", "jsCall_iidiiii_72", "jsCall_iidiiii_73", "jsCall_iidiiii_74", "jsCall_iidiiii_75", "jsCall_iidiiii_76", "jsCall_iidiiii_77", "jsCall_iidiiii_78", "jsCall_iidiiii_79", "jsCall_iidiiii_80", "jsCall_iidiiii_81", "jsCall_iidiiii_82", "jsCall_iidiiii_83", "jsCall_iidiiii_84", "jsCall_iidiiii_85", "jsCall_iidiiii_86", "jsCall_iidiiii_87", "jsCall_iidiiii_88", "jsCall_iidiiii_89", "jsCall_iidiiii_90", "jsCall_iidiiii_91", "jsCall_iidiiii_92", "jsCall_iidiiii_93", "jsCall_iidiiii_94", "jsCall_iidiiii_95", "jsCall_iidiiii_96", "jsCall_iidiiii_97", "jsCall_iidiiii_98", "jsCall_iidiiii_99", "_fmt_fp", 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
var debug_table_iii = [0, "jsCall_iii_0", "jsCall_iii_1", "jsCall_iii_2", "jsCall_iii_3", "jsCall_iii_4", "jsCall_iii_5", "jsCall_iii_6", "jsCall_iii_7", "jsCall_iii_8", "jsCall_iii_9", "jsCall_iii_10", "jsCall_iii_11", "jsCall_iii_12", "jsCall_iii_13", "jsCall_iii_14", "jsCall_iii_15", "jsCall_iii_16", "jsCall_iii_17", "jsCall_iii_18", "jsCall_iii_19", "jsCall_iii_20", "jsCall_iii_21", "jsCall_iii_22", "jsCall_iii_23", "jsCall_iii_24", "jsCall_iii_25", "jsCall_iii_26", "jsCall_iii_27", "jsCall_iii_28", "jsCall_iii_29", "jsCall_iii_30", "jsCall_iii_31", "jsCall_iii_32", "jsCall_iii_33", "jsCall_iii_34", "jsCall_iii_35", "jsCall_iii_36", "jsCall_iii_37", "jsCall_iii_38", "jsCall_iii_39", "jsCall_iii_40", "jsCall_iii_41", "jsCall_iii_42", "jsCall_iii_43", "jsCall_iii_44", "jsCall_iii_45", "jsCall_iii_46", "jsCall_iii_47", "jsCall_iii_48", "jsCall_iii_49", "jsCall_iii_50", "jsCall_iii_51", "jsCall_iii_52", "jsCall_iii_53", "jsCall_iii_54", "jsCall_iii_55", "jsCall_iii_56", "jsCall_iii_57", "jsCall_iii_58", "jsCall_iii_59", "jsCall_iii_60", "jsCall_iii_61", "jsCall_iii_62", "jsCall_iii_63", "jsCall_iii_64", "jsCall_iii_65", "jsCall_iii_66", "jsCall_iii_67", "jsCall_iii_68", "jsCall_iii_69", "jsCall_iii_70", "jsCall_iii_71", "jsCall_iii_72", "jsCall_iii_73", "jsCall_iii_74", "jsCall_iii_75", "jsCall_iii_76", "jsCall_iii_77", "jsCall_iii_78", "jsCall_iii_79", "jsCall_iii_80", "jsCall_iii_81", "jsCall_iii_82", "jsCall_iii_83", "jsCall_iii_84", "jsCall_iii_85", "jsCall_iii_86", "jsCall_iii_87", "jsCall_iii_88", "jsCall_iii_89", "jsCall_iii_90", "jsCall_iii_91", "jsCall_iii_92", "jsCall_iii_93", "jsCall_iii_94", "jsCall_iii_95", "jsCall_iii_96", "jsCall_iii_97", "jsCall_iii_98", "jsCall_iii_99", "_avi_read_packet", "_ff_avio_child_next", "_flv_read_packet", "_ff_raw_read_partial_packet", "_matroska_read_packet", "_mov_read_packet", "_mp3_read_packet", "_mpegps_read_packet", "_mpegts_read_packet", "_mpegts_raw_read_packet", "_format_child_next", "_ff_pcm_read_packet", "_urlcontext_child_next", "_bsf_child_next", "_hevc_mp4toannexb_filter", "_hevc_update_thread_context", "_null_filter", "_codec_child_next", "_initSniffStreamFunc", "_hflv_initFunc", "_hflv_getPacketFunc", "_g711_initFunc", "_io_read_pause", "_descriptor_compare", "_hls_decode_entry", "_avcodec_default_get_format", "_ff_startcode_find_candidate_c", "_color_table_compare", 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
var debug_table_iiii = [0, "jsCall_iiii_0", "jsCall_iiii_1", "jsCall_iiii_2", "jsCall_iiii_3", "jsCall_iiii_4", "jsCall_iiii_5", "jsCall_iiii_6", "jsCall_iiii_7", "jsCall_iiii_8", "jsCall_iiii_9", "jsCall_iiii_10", "jsCall_iiii_11", "jsCall_iiii_12", "jsCall_iiii_13", "jsCall_iiii_14", "jsCall_iiii_15", "jsCall_iiii_16", "jsCall_iiii_17", "jsCall_iiii_18", "jsCall_iiii_19", "jsCall_iiii_20", "jsCall_iiii_21", "jsCall_iiii_22", "jsCall_iiii_23", "jsCall_iiii_24", "jsCall_iiii_25", "jsCall_iiii_26", "jsCall_iiii_27", "jsCall_iiii_28", "jsCall_iiii_29", "jsCall_iiii_30", "jsCall_iiii_31", "jsCall_iiii_32", "jsCall_iiii_33", "jsCall_iiii_34", "jsCall_iiii_35", "jsCall_iiii_36", "jsCall_iiii_37", "jsCall_iiii_38", "jsCall_iiii_39", "jsCall_iiii_40", "jsCall_iiii_41", "jsCall_iiii_42", "jsCall_iiii_43", "jsCall_iiii_44", "jsCall_iiii_45", "jsCall_iiii_46", "jsCall_iiii_47", "jsCall_iiii_48", "jsCall_iiii_49", "jsCall_iiii_50", "jsCall_iiii_51", "jsCall_iiii_52", "jsCall_iiii_53", "jsCall_iiii_54", "jsCall_iiii_55", "jsCall_iiii_56", "jsCall_iiii_57", "jsCall_iiii_58", "jsCall_iiii_59", "jsCall_iiii_60", "jsCall_iiii_61", "jsCall_iiii_62", "jsCall_iiii_63", "jsCall_iiii_64", "jsCall_iiii_65", "jsCall_iiii_66", "jsCall_iiii_67", "jsCall_iiii_68", "jsCall_iiii_69", "jsCall_iiii_70", "jsCall_iiii_71", "jsCall_iiii_72", "jsCall_iiii_73", "jsCall_iiii_74", "jsCall_iiii_75", "jsCall_iiii_76", "jsCall_iiii_77", "jsCall_iiii_78", "jsCall_iiii_79", "jsCall_iiii_80", "jsCall_iiii_81", "jsCall_iiii_82", "jsCall_iiii_83", "jsCall_iiii_84", "jsCall_iiii_85", "jsCall_iiii_86", "jsCall_iiii_87", "jsCall_iiii_88", "jsCall_iiii_89", "jsCall_iiii_90", "jsCall_iiii_91", "jsCall_iiii_92", "jsCall_iiii_93", "jsCall_iiii_94", "jsCall_iiii_95", "jsCall_iiii_96", "jsCall_iiii_97", "jsCall_iiii_98", "jsCall_iiii_99", "_mov_read_aclr", "_mov_read_avid", "_mov_read_ares", "_mov_read_avss", "_mov_read_av1c", "_mov_read_chpl", "_mov_read_stco", "_mov_read_colr", "_mov_read_ctts", "_mov_read_default", "_mov_read_dpxe", "_mov_read_dref", "_mov_read_elst", "_mov_read_enda", "_mov_read_fiel", "_mov_read_adrm", "_mov_read_ftyp", "_mov_read_glbl", "_mov_read_hdlr", "_mov_read_ilst", "_mov_read_jp2h", "_mov_read_mdat", "_mov_read_mdhd", "_mov_read_meta", "_mov_read_moof", "_mov_read_moov", "_mov_read_mvhd", "_mov_read_svq3", "_mov_read_alac", "_mov_read_pasp", "_mov_read_sidx", "_mov_read_stps", "_mov_read_strf", "_mov_read_stsc", "_mov_read_stsd", "_mov_read_stss", "_mov_read_stsz", "_mov_read_stts", "_mov_read_tkhd", "_mov_read_tfdt", "_mov_read_tfhd", "_mov_read_trak", "_mov_read_tmcd", "_mov_read_chap", "_mov_read_trex", "_mov_read_trun", "_mov_read_wave", "_mov_read_esds", "_mov_read_dac3", "_mov_read_dec3", "_mov_read_ddts", "_mov_read_wide", "_mov_read_wfex", "_mov_read_cmov", "_mov_read_chan", "_mov_read_dvc1", "_mov_read_sbgp", "_mov_read_uuid", "_mov_read_targa_y216", "_mov_read_free", "_mov_read_custom", "_mov_read_frma", "_mov_read_senc", "_mov_read_saiz", "_mov_read_saio", "_mov_read_pssh", "_mov_read_schm", "_mov_read_tenc", "_mov_read_dfla", "_mov_read_st3d", "_mov_read_sv3d", "_mov_read_dops", "_mov_read_smdm", "_mov_read_coll", "_mov_read_vpcc", "_mov_read_mdcv", "_mov_read_clli", "_h264_split", "_hevc_split", "_set_compensation", "___stdio_write", "_sn_write", "_read_stream_live", "_read_stream_vod", "_getSniffStreamPacketFunc", "_hflv_read_stream_live", "_g711_read_stream_live", "_setCodecTypeFunc", "_read_packet", "_io_write_packet", "_io_read_packet", "_dyn_buf_write", "_mov_read_keys", "_mov_read_udta_string", "_ff_crcA001_update", "_avcodec_default_get_buffer2", "_do_read", 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
var debug_table_iiiii = [0, "jsCall_iiiii_0", "jsCall_iiiii_1", "jsCall_iiiii_2", "jsCall_iiiii_3", "jsCall_iiiii_4", "jsCall_iiiii_5", "jsCall_iiiii_6", "jsCall_iiiii_7", "jsCall_iiiii_8", "jsCall_iiiii_9", "jsCall_iiiii_10", "jsCall_iiiii_11", "jsCall_iiiii_12", "jsCall_iiiii_13", "jsCall_iiiii_14", "jsCall_iiiii_15", "jsCall_iiiii_16", "jsCall_iiiii_17", "jsCall_iiiii_18", "jsCall_iiiii_19", "jsCall_iiiii_20", "jsCall_iiiii_21", "jsCall_iiiii_22", "jsCall_iiiii_23", "jsCall_iiiii_24", "jsCall_iiiii_25", "jsCall_iiiii_26", "jsCall_iiiii_27", "jsCall_iiiii_28", "jsCall_iiiii_29", "jsCall_iiiii_30", "jsCall_iiiii_31", "jsCall_iiiii_32", "jsCall_iiiii_33", "jsCall_iiiii_34", "jsCall_iiiii_35", "jsCall_iiiii_36", "jsCall_iiiii_37", "jsCall_iiiii_38", "jsCall_iiiii_39", "jsCall_iiiii_40", "jsCall_iiiii_41", "jsCall_iiiii_42", "jsCall_iiiii_43", "jsCall_iiiii_44", "jsCall_iiiii_45", "jsCall_iiiii_46", "jsCall_iiiii_47", "jsCall_iiiii_48", "jsCall_iiiii_49", "jsCall_iiiii_50", "jsCall_iiiii_51", "jsCall_iiiii_52", "jsCall_iiiii_53", "jsCall_iiiii_54", "jsCall_iiiii_55", "jsCall_iiiii_56", "jsCall_iiiii_57", "jsCall_iiiii_58", "jsCall_iiiii_59", "jsCall_iiiii_60", "jsCall_iiiii_61", "jsCall_iiiii_62", "jsCall_iiiii_63", "jsCall_iiiii_64", "jsCall_iiiii_65", "jsCall_iiiii_66", "jsCall_iiiii_67", "jsCall_iiiii_68", "jsCall_iiiii_69", "jsCall_iiiii_70", "jsCall_iiiii_71", "jsCall_iiiii_72", "jsCall_iiiii_73", "jsCall_iiiii_74", "jsCall_iiiii_75", "jsCall_iiiii_76", "jsCall_iiiii_77", "jsCall_iiiii_78", "jsCall_iiiii_79", "jsCall_iiiii_80", "jsCall_iiiii_81", "jsCall_iiiii_82", "jsCall_iiiii_83", "jsCall_iiiii_84", "jsCall_iiiii_85", "jsCall_iiiii_86", "jsCall_iiiii_87", "jsCall_iiiii_88", "jsCall_iiiii_89", "jsCall_iiiii_90", "jsCall_iiiii_91", "jsCall_iiiii_92", "jsCall_iiiii_93", "jsCall_iiiii_94", "jsCall_iiiii_95", "jsCall_iiiii_96", "jsCall_iiiii_97", "jsCall_iiiii_98", "jsCall_iiiii_99", "_hevc_decode_frame", "_decode_frame", "_pcm_decode_frame", "_aac_decode_frame", "_hflv_pushBufferFunc", "_g711_pushBufferFunc", "_demuxBoxFunc", "_mov_metadata_int8_no_padding", "_mov_metadata_track_or_disc_number", "_mov_metadata_gnre", "_mov_metadata_int8_bypass_padding", "_lum_planar_vscale", "_chr_planar_vscale", "_any_vscale", "_packed_vscale", "_gamma_convert", "_lum_convert", "_lum_h_scale", "_chr_convert", "_chr_h_scale", "_no_chr_scale", "_hls_decode_entry_wpp", 0, 0, 0, 0, 0];
var debug_table_iiiiii = [0, "jsCall_iiiiii_0", "jsCall_iiiiii_1", "jsCall_iiiiii_2", "jsCall_iiiiii_3", "jsCall_iiiiii_4", "jsCall_iiiiii_5", "jsCall_iiiiii_6", "jsCall_iiiiii_7", "jsCall_iiiiii_8", "jsCall_iiiiii_9", "jsCall_iiiiii_10", "jsCall_iiiiii_11", "jsCall_iiiiii_12", "jsCall_iiiiii_13", "jsCall_iiiiii_14", "jsCall_iiiiii_15", "jsCall_iiiiii_16", "jsCall_iiiiii_17", "jsCall_iiiiii_18", "jsCall_iiiiii_19", "jsCall_iiiiii_20", "jsCall_iiiiii_21", "jsCall_iiiiii_22", "jsCall_iiiiii_23", "jsCall_iiiiii_24", "jsCall_iiiiii_25", "jsCall_iiiiii_26", "jsCall_iiiiii_27", "jsCall_iiiiii_28", "jsCall_iiiiii_29", "jsCall_iiiiii_30", "jsCall_iiiiii_31", "jsCall_iiiiii_32", "jsCall_iiiiii_33", "jsCall_iiiiii_34", "jsCall_iiiiii_35", "jsCall_iiiiii_36", "jsCall_iiiiii_37", "jsCall_iiiiii_38", "jsCall_iiiiii_39", "jsCall_iiiiii_40", "jsCall_iiiiii_41", "jsCall_iiiiii_42", "jsCall_iiiiii_43", "jsCall_iiiiii_44", "jsCall_iiiiii_45", "jsCall_iiiiii_46", "jsCall_iiiiii_47", "jsCall_iiiiii_48", "jsCall_iiiiii_49", "jsCall_iiiiii_50", "jsCall_iiiiii_51", "jsCall_iiiiii_52", "jsCall_iiiiii_53", "jsCall_iiiiii_54", "jsCall_iiiiii_55", "jsCall_iiiiii_56", "jsCall_iiiiii_57", "jsCall_iiiiii_58", "jsCall_iiiiii_59", "jsCall_iiiiii_60", "jsCall_iiiiii_61", "jsCall_iiiiii_62", "jsCall_iiiiii_63", "jsCall_iiiiii_64", "jsCall_iiiiii_65", "jsCall_iiiiii_66", "jsCall_iiiiii_67", "jsCall_iiiiii_68", "jsCall_iiiiii_69", "jsCall_iiiiii_70", "jsCall_iiiiii_71", "jsCall_iiiiii_72", "jsCall_iiiiii_73", "jsCall_iiiiii_74", "jsCall_iiiiii_75", "jsCall_iiiiii_76", "jsCall_iiiiii_77", "jsCall_iiiiii_78", "jsCall_iiiiii_79", "jsCall_iiiiii_80", "jsCall_iiiiii_81", "jsCall_iiiiii_82", "jsCall_iiiiii_83", "jsCall_iiiiii_84", "jsCall_iiiiii_85", "jsCall_iiiiii_86", "jsCall_iiiiii_87", "jsCall_iiiiii_88", "jsCall_iiiiii_89", "jsCall_iiiiii_90", "jsCall_iiiiii_91", "jsCall_iiiiii_92", "jsCall_iiiiii_93", "jsCall_iiiiii_94", "jsCall_iiiiii_95", "jsCall_iiiiii_96", "jsCall_iiiiii_97", "jsCall_iiiiii_98", "jsCall_iiiiii_99", "_pushBufferFunc", "_g711_setSniffStreamCodecTypeFunc", "_decodeCodecContextFunc", "_io_open_default", "_avcodec_default_execute2", "_thread_execute2", "_sbr_lf_gen", "_resample_common_int16", "_resample_linear_int16", "_resample_common_int32", "_resample_linear_int32", "_resample_common_float", "_resample_linear_float", "_resample_common_double", "_resample_linear_double", 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
var debug_table_iiiiiii = [0, "jsCall_iiiiiii_0", "jsCall_iiiiiii_1", "jsCall_iiiiiii_2", "jsCall_iiiiiii_3", "jsCall_iiiiiii_4", "jsCall_iiiiiii_5", "jsCall_iiiiiii_6", "jsCall_iiiiiii_7", "jsCall_iiiiiii_8", "jsCall_iiiiiii_9", "jsCall_iiiiiii_10", "jsCall_iiiiiii_11", "jsCall_iiiiiii_12", "jsCall_iiiiiii_13", "jsCall_iiiiiii_14", "jsCall_iiiiiii_15", "jsCall_iiiiiii_16", "jsCall_iiiiiii_17", "jsCall_iiiiiii_18", "jsCall_iiiiiii_19", "jsCall_iiiiiii_20", "jsCall_iiiiiii_21", "jsCall_iiiiiii_22", "jsCall_iiiiiii_23", "jsCall_iiiiiii_24", "jsCall_iiiiiii_25", "jsCall_iiiiiii_26", "jsCall_iiiiiii_27", "jsCall_iiiiiii_28", "jsCall_iiiiiii_29", "jsCall_iiiiiii_30", "jsCall_iiiiiii_31", "jsCall_iiiiiii_32", "jsCall_iiiiiii_33", "jsCall_iiiiiii_34", "jsCall_iiiiiii_35", "jsCall_iiiiiii_36", "jsCall_iiiiiii_37", "jsCall_iiiiiii_38", "jsCall_iiiiiii_39", "jsCall_iiiiiii_40", "jsCall_iiiiiii_41", "jsCall_iiiiiii_42", "jsCall_iiiiiii_43", "jsCall_iiiiiii_44", "jsCall_iiiiiii_45", "jsCall_iiiiiii_46", "jsCall_iiiiiii_47", "jsCall_iiiiiii_48", "jsCall_iiiiiii_49", "jsCall_iiiiiii_50", "jsCall_iiiiiii_51", "jsCall_iiiiiii_52", "jsCall_iiiiiii_53", "jsCall_iiiiiii_54", "jsCall_iiiiiii_55", "jsCall_iiiiiii_56", "jsCall_iiiiiii_57", "jsCall_iiiiiii_58", "jsCall_iiiiiii_59", "jsCall_iiiiiii_60", "jsCall_iiiiiii_61", "jsCall_iiiiiii_62", "jsCall_iiiiiii_63", "jsCall_iiiiiii_64", "jsCall_iiiiiii_65", "jsCall_iiiiiii_66", "jsCall_iiiiiii_67", "jsCall_iiiiiii_68", "jsCall_iiiiiii_69", "jsCall_iiiiiii_70", "jsCall_iiiiiii_71", "jsCall_iiiiiii_72", "jsCall_iiiiiii_73", "jsCall_iiiiiii_74", "jsCall_iiiiiii_75", "jsCall_iiiiiii_76", "jsCall_iiiiiii_77", "jsCall_iiiiiii_78", "jsCall_iiiiiii_79", "jsCall_iiiiiii_80", "jsCall_iiiiiii_81", "jsCall_iiiiiii_82", "jsCall_iiiiiii_83", "jsCall_iiiiiii_84", "jsCall_iiiiiii_85", "jsCall_iiiiiii_86", "jsCall_iiiiiii_87", "jsCall_iiiiiii_88", "jsCall_iiiiiii_89", "jsCall_iiiiiii_90", "jsCall_iiiiiii_91", "jsCall_iiiiiii_92", "jsCall_iiiiiii_93", "jsCall_iiiiiii_94", "jsCall_iiiiiii_95", "jsCall_iiiiiii_96", "jsCall_iiiiiii_97", "jsCall_iiiiiii_98", "jsCall_iiiiiii_99", "_h264_parse", "_hevc_parse", "_mpegaudio_parse", "_multiple_resample", "_invert_initial_buffer", "_hflv_decodeVideoFrameFunc", "_avcodec_default_execute", "_thread_execute", "_sbr_x_gen", 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
var debug_table_iiiiiiidiiddii = [0, "jsCall_iiiiiiidiiddii_0", "jsCall_iiiiiiidiiddii_1", "jsCall_iiiiiiidiiddii_2", "jsCall_iiiiiiidiiddii_3", "jsCall_iiiiiiidiiddii_4", "jsCall_iiiiiiidiiddii_5", "jsCall_iiiiiiidiiddii_6", "jsCall_iiiiiiidiiddii_7", "jsCall_iiiiiiidiiddii_8", "jsCall_iiiiiiidiiddii_9", "jsCall_iiiiiiidiiddii_10", "jsCall_iiiiiiidiiddii_11", "jsCall_iiiiiiidiiddii_12", "jsCall_iiiiiiidiiddii_13", "jsCall_iiiiiiidiiddii_14", "jsCall_iiiiiiidiiddii_15", "jsCall_iiiiiiidiiddii_16", "jsCall_iiiiiiidiiddii_17", "jsCall_iiiiiiidiiddii_18", "jsCall_iiiiiiidiiddii_19", "jsCall_iiiiiiidiiddii_20", "jsCall_iiiiiiidiiddii_21", "jsCall_iiiiiiidiiddii_22", "jsCall_iiiiiiidiiddii_23", "jsCall_iiiiiiidiiddii_24", "jsCall_iiiiiiidiiddii_25", "jsCall_iiiiiiidiiddii_26", "jsCall_iiiiiiidiiddii_27", "jsCall_iiiiiiidiiddii_28", "jsCall_iiiiiiidiiddii_29", "jsCall_iiiiiiidiiddii_30", "jsCall_iiiiiiidiiddii_31", "jsCall_iiiiiiidiiddii_32", "jsCall_iiiiiiidiiddii_33", "jsCall_iiiiiiidiiddii_34", "jsCall_iiiiiiidiiddii_35", "jsCall_iiiiiiidiiddii_36", "jsCall_iiiiiiidiiddii_37", "jsCall_iiiiiiidiiddii_38", "jsCall_iiiiiiidiiddii_39", "jsCall_iiiiiiidiiddii_40", "jsCall_iiiiiiidiiddii_41", "jsCall_iiiiiiidiiddii_42", "jsCall_iiiiiiidiiddii_43", "jsCall_iiiiiiidiiddii_44", "jsCall_iiiiiiidiiddii_45", "jsCall_iiiiiiidiiddii_46", "jsCall_iiiiiiidiiddii_47", "jsCall_iiiiiiidiiddii_48", "jsCall_iiiiiiidiiddii_49", "jsCall_iiiiiiidiiddii_50", "jsCall_iiiiiiidiiddii_51", "jsCall_iiiiiiidiiddii_52", "jsCall_iiiiiiidiiddii_53", "jsCall_iiiiiiidiiddii_54", "jsCall_iiiiiiidiiddii_55", "jsCall_iiiiiiidiiddii_56", "jsCall_iiiiiiidiiddii_57", "jsCall_iiiiiiidiiddii_58", "jsCall_iiiiiiidiiddii_59", "jsCall_iiiiiiidiiddii_60", "jsCall_iiiiiiidiiddii_61", "jsCall_iiiiiiidiiddii_62", "jsCall_iiiiiiidiiddii_63", "jsCall_iiiiiiidiiddii_64", "jsCall_iiiiiiidiiddii_65", "jsCall_iiiiiiidiiddii_66", "jsCall_iiiiiiidiiddii_67", "jsCall_iiiiiiidiiddii_68", "jsCall_iiiiiiidiiddii_69", "jsCall_iiiiiiidiiddii_70", "jsCall_iiiiiiidiiddii_71", "jsCall_iiiiiiidiiddii_72", "jsCall_iiiiiiidiiddii_73", "jsCall_iiiiiiidiiddii_74", "jsCall_iiiiiiidiiddii_75", "jsCall_iiiiiiidiiddii_76", "jsCall_iiiiiiidiiddii_77", "jsCall_iiiiiiidiiddii_78", "jsCall_iiiiiiidiiddii_79", "jsCall_iiiiiiidiiddii_80", "jsCall_iiiiiiidiiddii_81", "jsCall_iiiiiiidiiddii_82", "jsCall_iiiiiiidiiddii_83", "jsCall_iiiiiiidiiddii_84", "jsCall_iiiiiiidiiddii_85", "jsCall_iiiiiiidiiddii_86", "jsCall_iiiiiiidiiddii_87", "jsCall_iiiiiiidiiddii_88", "jsCall_iiiiiiidiiddii_89", "jsCall_iiiiiiidiiddii_90", "jsCall_iiiiiiidiiddii_91", "jsCall_iiiiiiidiiddii_92", "jsCall_iiiiiiidiiddii_93", "jsCall_iiiiiiidiiddii_94", "jsCall_iiiiiiidiiddii_95", "jsCall_iiiiiiidiiddii_96", "jsCall_iiiiiiidiiddii_97", "jsCall_iiiiiiidiiddii_98", "jsCall_iiiiiiidiiddii_99", "_resample_init", 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
var debug_table_iiiiiiii = [0, "jsCall_iiiiiiii_0", "jsCall_iiiiiiii_1", "jsCall_iiiiiiii_2", "jsCall_iiiiiiii_3", "jsCall_iiiiiiii_4", "jsCall_iiiiiiii_5", "jsCall_iiiiiiii_6", "jsCall_iiiiiiii_7", "jsCall_iiiiiiii_8", "jsCall_iiiiiiii_9", "jsCall_iiiiiiii_10", "jsCall_iiiiiiii_11", "jsCall_iiiiiiii_12", "jsCall_iiiiiiii_13", "jsCall_iiiiiiii_14", "jsCall_iiiiiiii_15", "jsCall_iiiiiiii_16", "jsCall_iiiiiiii_17", "jsCall_iiiiiiii_18", "jsCall_iiiiiiii_19", "jsCall_iiiiiiii_20", "jsCall_iiiiiiii_21", "jsCall_iiiiiiii_22", "jsCall_iiiiiiii_23", "jsCall_iiiiiiii_24", "jsCall_iiiiiiii_25", "jsCall_iiiiiiii_26", "jsCall_iiiiiiii_27", "jsCall_iiiiiiii_28", "jsCall_iiiiiiii_29", "jsCall_iiiiiiii_30", "jsCall_iiiiiiii_31", "jsCall_iiiiiiii_32", "jsCall_iiiiiiii_33", "jsCall_iiiiiiii_34", "jsCall_iiiiiiii_35", "jsCall_iiiiiiii_36", "jsCall_iiiiiiii_37", "jsCall_iiiiiiii_38", "jsCall_iiiiiiii_39", "jsCall_iiiiiiii_40", "jsCall_iiiiiiii_41", "jsCall_iiiiiiii_42", "jsCall_iiiiiiii_43", "jsCall_iiiiiiii_44", "jsCall_iiiiiiii_45", "jsCall_iiiiiiii_46", "jsCall_iiiiiiii_47", "jsCall_iiiiiiii_48", "jsCall_iiiiiiii_49", "jsCall_iiiiiiii_50", "jsCall_iiiiiiii_51", "jsCall_iiiiiiii_52", "jsCall_iiiiiiii_53", "jsCall_iiiiiiii_54", "jsCall_iiiiiiii_55", "jsCall_iiiiiiii_56", "jsCall_iiiiiiii_57", "jsCall_iiiiiiii_58", "jsCall_iiiiiiii_59", "jsCall_iiiiiiii_60", "jsCall_iiiiiiii_61", "jsCall_iiiiiiii_62", "jsCall_iiiiiiii_63", "jsCall_iiiiiiii_64", "jsCall_iiiiiiii_65", "jsCall_iiiiiiii_66", "jsCall_iiiiiiii_67", "jsCall_iiiiiiii_68", "jsCall_iiiiiiii_69", "jsCall_iiiiiiii_70", "jsCall_iiiiiiii_71", "jsCall_iiiiiiii_72", "jsCall_iiiiiiii_73", "jsCall_iiiiiiii_74", "jsCall_iiiiiiii_75", "jsCall_iiiiiiii_76", "jsCall_iiiiiiii_77", "jsCall_iiiiiiii_78", "jsCall_iiiiiiii_79", "jsCall_iiiiiiii_80", "jsCall_iiiiiiii_81", "jsCall_iiiiiiii_82", "jsCall_iiiiiiii_83", "jsCall_iiiiiiii_84", "jsCall_iiiiiiii_85", "jsCall_iiiiiiii_86", "jsCall_iiiiiiii_87", "jsCall_iiiiiiii_88", "jsCall_iiiiiiii_89", "jsCall_iiiiiiii_90", "jsCall_iiiiiiii_91", "jsCall_iiiiiiii_92", "jsCall_iiiiiiii_93", "jsCall_iiiiiiii_94", "jsCall_iiiiiiii_95", "jsCall_iiiiiiii_96", "jsCall_iiiiiiii_97", "jsCall_iiiiiiii_98", "jsCall_iiiiiiii_99", "_decodeVideoFrameFunc", "_hflv_setSniffStreamCodecTypeFunc", "_swscale", "_ff_sws_alphablendaway", "_yuv2rgb_c_32", "_yuva2rgba_c", "_yuv2rgb_c_bgr48", "_yuv2rgb_c_48", "_yuva2argb_c", "_yuv2rgb_c_24_rgb", "_yuv2rgb_c_24_bgr", "_yuv2rgb_c_16_ordered_dither", "_yuv2rgb_c_15_ordered_dither", "_yuv2rgb_c_12_ordered_dither", "_yuv2rgb_c_8_ordered_dither", "_yuv2rgb_c_4_ordered_dither", "_yuv2rgb_c_4b_ordered_dither", "_yuv2rgb_c_1_ordered_dither", "_planarToP01xWrapper", "_planar8ToP01xleWrapper", "_yvu9ToYv12Wrapper", "_bgr24ToYv12Wrapper", "_rgbToRgbWrapper", "_planarRgbToplanarRgbWrapper", "_planarRgbToRgbWrapper", "_planarRgbaToRgbWrapper", "_Rgb16ToPlanarRgb16Wrapper", "_planarRgb16ToRgb16Wrapper", "_rgbToPlanarRgbWrapper", "_bayer_to_rgb24_wrapper", "_bayer_to_yv12_wrapper", "_bswap_16bpc", "_palToRgbWrapper", "_yuv422pToYuy2Wrapper", "_yuv422pToUyvyWrapper", "_uint_y_to_float_y_wrapper", "_float_y_to_uint_y_wrapper", "_planarToYuy2Wrapper", "_planarToUyvyWrapper", "_yuyvToYuv420Wrapper", "_uyvyToYuv420Wrapper", "_yuyvToYuv422Wrapper", "_uyvyToYuv422Wrapper", "_packedCopyWrapper", "_planarCopyWrapper", "_planarToNv12Wrapper", "_planarToNv24Wrapper", "_nv12ToPlanarWrapper", "_nv24ToPlanarWrapper", 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
var debug_table_iiiiiiiid = [0, "jsCall_iiiiiiiid_0", "jsCall_iiiiiiiid_1", "jsCall_iiiiiiiid_2", "jsCall_iiiiiiiid_3", "jsCall_iiiiiiiid_4", "jsCall_iiiiiiiid_5", "jsCall_iiiiiiiid_6", "jsCall_iiiiiiiid_7", "jsCall_iiiiiiiid_8", "jsCall_iiiiiiiid_9", "jsCall_iiiiiiiid_10", "jsCall_iiiiiiiid_11", "jsCall_iiiiiiiid_12", "jsCall_iiiiiiiid_13", "jsCall_iiiiiiiid_14", "jsCall_iiiiiiiid_15", "jsCall_iiiiiiiid_16", "jsCall_iiiiiiiid_17", "jsCall_iiiiiiiid_18", "jsCall_iiiiiiiid_19", "jsCall_iiiiiiiid_20", "jsCall_iiiiiiiid_21", "jsCall_iiiiiiiid_22", "jsCall_iiiiiiiid_23", "jsCall_iiiiiiiid_24", "jsCall_iiiiiiiid_25", "jsCall_iiiiiiiid_26", "jsCall_iiiiiiiid_27", "jsCall_iiiiiiiid_28", "jsCall_iiiiiiiid_29", "jsCall_iiiiiiiid_30", "jsCall_iiiiiiiid_31", "jsCall_iiiiiiiid_32", "jsCall_iiiiiiiid_33", "jsCall_iiiiiiiid_34", "jsCall_iiiiiiiid_35", "jsCall_iiiiiiiid_36", "jsCall_iiiiiiiid_37", "jsCall_iiiiiiiid_38", "jsCall_iiiiiiiid_39", "jsCall_iiiiiiiid_40", "jsCall_iiiiiiiid_41", "jsCall_iiiiiiiid_42", "jsCall_iiiiiiiid_43", "jsCall_iiiiiiiid_44", "jsCall_iiiiiiiid_45", "jsCall_iiiiiiiid_46", "jsCall_iiiiiiiid_47", "jsCall_iiiiiiiid_48", "jsCall_iiiiiiiid_49", "jsCall_iiiiiiiid_50", "jsCall_iiiiiiiid_51", "jsCall_iiiiiiiid_52", "jsCall_iiiiiiiid_53", "jsCall_iiiiiiiid_54", "jsCall_iiiiiiiid_55", "jsCall_iiiiiiiid_56", "jsCall_iiiiiiiid_57", "jsCall_iiiiiiiid_58", "jsCall_iiiiiiiid_59", "jsCall_iiiiiiiid_60", "jsCall_iiiiiiiid_61", "jsCall_iiiiiiiid_62", "jsCall_iiiiiiiid_63", "jsCall_iiiiiiiid_64", "jsCall_iiiiiiiid_65", "jsCall_iiiiiiiid_66", "jsCall_iiiiiiiid_67", "jsCall_iiiiiiiid_68", "jsCall_iiiiiiiid_69", "jsCall_iiiiiiiid_70", "jsCall_iiiiiiiid_71", "jsCall_iiiiiiiid_72", "jsCall_iiiiiiiid_73", "jsCall_iiiiiiiid_74", "jsCall_iiiiiiiid_75", "jsCall_iiiiiiiid_76", "jsCall_iiiiiiiid_77", "jsCall_iiiiiiiid_78", "jsCall_iiiiiiiid_79", "jsCall_iiiiiiiid_80", "jsCall_iiiiiiiid_81", "jsCall_iiiiiiiid_82", "jsCall_iiiiiiiid_83", "jsCall_iiiiiiiid_84", "jsCall_iiiiiiiid_85", "jsCall_iiiiiiiid_86", "jsCall_iiiiiiiid_87", "jsCall_iiiiiiiid_88", "jsCall_iiiiiiiid_89", "jsCall_iiiiiiiid_90", "jsCall_iiiiiiiid_91", "jsCall_iiiiiiiid_92", "jsCall_iiiiiiiid_93", "jsCall_iiiiiiiid_94", "jsCall_iiiiiiiid_95", "jsCall_iiiiiiiid_96", "jsCall_iiiiiiiid_97", "jsCall_iiiiiiiid_98", "jsCall_iiiiiiiid_99", "_setSniffStreamCodecTypeFunc", 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
var debug_table_iiiiij = [0, "jsCall_iiiiij_0", "jsCall_iiiiij_1", "jsCall_iiiiij_2", "jsCall_iiiiij_3", "jsCall_iiiiij_4", "jsCall_iiiiij_5", "jsCall_iiiiij_6", "jsCall_iiiiij_7", "jsCall_iiiiij_8", "jsCall_iiiiij_9", "jsCall_iiiiij_10", "jsCall_iiiiij_11", "jsCall_iiiiij_12", "jsCall_iiiiij_13", "jsCall_iiiiij_14", "jsCall_iiiiij_15", "jsCall_iiiiij_16", "jsCall_iiiiij_17", "jsCall_iiiiij_18", "jsCall_iiiiij_19", "jsCall_iiiiij_20", "jsCall_iiiiij_21", "jsCall_iiiiij_22", "jsCall_iiiiij_23", "jsCall_iiiiij_24", "jsCall_iiiiij_25", "jsCall_iiiiij_26", "jsCall_iiiiij_27", "jsCall_iiiiij_28", "jsCall_iiiiij_29", "jsCall_iiiiij_30", "jsCall_iiiiij_31", "jsCall_iiiiij_32", "jsCall_iiiiij_33", "jsCall_iiiiij_34", "jsCall_iiiiij_35", "jsCall_iiiiij_36", "jsCall_iiiiij_37", "jsCall_iiiiij_38", "jsCall_iiiiij_39", "jsCall_iiiiij_40", "jsCall_iiiiij_41", "jsCall_iiiiij_42", "jsCall_iiiiij_43", "jsCall_iiiiij_44", "jsCall_iiiiij_45", "jsCall_iiiiij_46", "jsCall_iiiiij_47", "jsCall_iiiiij_48", "jsCall_iiiiij_49", "jsCall_iiiiij_50", "jsCall_iiiiij_51", "jsCall_iiiiij_52", "jsCall_iiiiij_53", "jsCall_iiiiij_54", "jsCall_iiiiij_55", "jsCall_iiiiij_56", "jsCall_iiiiij_57", "jsCall_iiiiij_58", "jsCall_iiiiij_59", "jsCall_iiiiij_60", "jsCall_iiiiij_61", "jsCall_iiiiij_62", "jsCall_iiiiij_63", "jsCall_iiiiij_64", "jsCall_iiiiij_65", "jsCall_iiiiij_66", "jsCall_iiiiij_67", "jsCall_iiiiij_68", "jsCall_iiiiij_69", "jsCall_iiiiij_70", "jsCall_iiiiij_71", "jsCall_iiiiij_72", "jsCall_iiiiij_73", "jsCall_iiiiij_74", "jsCall_iiiiij_75", "jsCall_iiiiij_76", "jsCall_iiiiij_77", "jsCall_iiiiij_78", "jsCall_iiiiij_79", "jsCall_iiiiij_80", "jsCall_iiiiij_81", "jsCall_iiiiij_82", "jsCall_iiiiij_83", "jsCall_iiiiij_84", "jsCall_iiiiij_85", "jsCall_iiiiij_86", "jsCall_iiiiij_87", "jsCall_iiiiij_88", "jsCall_iiiiij_89", "jsCall_iiiiij_90", "jsCall_iiiiij_91", "jsCall_iiiiij_92", "jsCall_iiiiij_93", "jsCall_iiiiij_94", "jsCall_iiiiij_95", "jsCall_iiiiij_96", "jsCall_iiiiij_97", "jsCall_iiiiij_98", "jsCall_iiiiij_99", "_mpegts_push_data", 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
var debug_table_iiiji = [0, "jsCall_iiiji_0", "jsCall_iiiji_1", "jsCall_iiiji_2", "jsCall_iiiji_3", "jsCall_iiiji_4", "jsCall_iiiji_5", "jsCall_iiiji_6", "jsCall_iiiji_7", "jsCall_iiiji_8", "jsCall_iiiji_9", "jsCall_iiiji_10", "jsCall_iiiji_11", "jsCall_iiiji_12", "jsCall_iiiji_13", "jsCall_iiiji_14", "jsCall_iiiji_15", "jsCall_iiiji_16", "jsCall_iiiji_17", "jsCall_iiiji_18", "jsCall_iiiji_19", "jsCall_iiiji_20", "jsCall_iiiji_21", "jsCall_iiiji_22", "jsCall_iiiji_23", "jsCall_iiiji_24", "jsCall_iiiji_25", "jsCall_iiiji_26", "jsCall_iiiji_27", "jsCall_iiiji_28", "jsCall_iiiji_29", "jsCall_iiiji_30", "jsCall_iiiji_31", "jsCall_iiiji_32", "jsCall_iiiji_33", "jsCall_iiiji_34", "jsCall_iiiji_35", "jsCall_iiiji_36", "jsCall_iiiji_37", "jsCall_iiiji_38", "jsCall_iiiji_39", "jsCall_iiiji_40", "jsCall_iiiji_41", "jsCall_iiiji_42", "jsCall_iiiji_43", "jsCall_iiiji_44", "jsCall_iiiji_45", "jsCall_iiiji_46", "jsCall_iiiji_47", "jsCall_iiiji_48", "jsCall_iiiji_49", "jsCall_iiiji_50", "jsCall_iiiji_51", "jsCall_iiiji_52", "jsCall_iiiji_53", "jsCall_iiiji_54", "jsCall_iiiji_55", "jsCall_iiiji_56", "jsCall_iiiji_57", "jsCall_iiiji_58", "jsCall_iiiji_59", "jsCall_iiiji_60", "jsCall_iiiji_61", "jsCall_iiiji_62", "jsCall_iiiji_63", "jsCall_iiiji_64", "jsCall_iiiji_65", "jsCall_iiiji_66", "jsCall_iiiji_67", "jsCall_iiiji_68", "jsCall_iiiji_69", "jsCall_iiiji_70", "jsCall_iiiji_71", "jsCall_iiiji_72", "jsCall_iiiji_73", "jsCall_iiiji_74", "jsCall_iiiji_75", "jsCall_iiiji_76", "jsCall_iiiji_77", "jsCall_iiiji_78", "jsCall_iiiji_79", "jsCall_iiiji_80", "jsCall_iiiji_81", "jsCall_iiiji_82", "jsCall_iiiji_83", "jsCall_iiiji_84", "jsCall_iiiji_85", "jsCall_iiiji_86", "jsCall_iiiji_87", "jsCall_iiiji_88", "jsCall_iiiji_89", "jsCall_iiiji_90", "jsCall_iiiji_91", "jsCall_iiiji_92", "jsCall_iiiji_93", "jsCall_iiiji_94", "jsCall_iiiji_95", "jsCall_iiiji_96", "jsCall_iiiji_97", "jsCall_iiiji_98", "jsCall_iiiji_99", "_avi_read_seek", "_flv_read_seek", "_matroska_read_seek", "_mov_read_seek", "_mp3_seek", "_ff_pcm_read_seek", 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
var debug_table_iiijjji = [0, "jsCall_iiijjji_0", "jsCall_iiijjji_1", "jsCall_iiijjji_2", "jsCall_iiijjji_3", "jsCall_iiijjji_4", "jsCall_iiijjji_5", "jsCall_iiijjji_6", "jsCall_iiijjji_7", "jsCall_iiijjji_8", "jsCall_iiijjji_9", "jsCall_iiijjji_10", "jsCall_iiijjji_11", "jsCall_iiijjji_12", "jsCall_iiijjji_13", "jsCall_iiijjji_14", "jsCall_iiijjji_15", "jsCall_iiijjji_16", "jsCall_iiijjji_17", "jsCall_iiijjji_18", "jsCall_iiijjji_19", "jsCall_iiijjji_20", "jsCall_iiijjji_21", "jsCall_iiijjji_22", "jsCall_iiijjji_23", "jsCall_iiijjji_24", "jsCall_iiijjji_25", "jsCall_iiijjji_26", "jsCall_iiijjji_27", "jsCall_iiijjji_28", "jsCall_iiijjji_29", "jsCall_iiijjji_30", "jsCall_iiijjji_31", "jsCall_iiijjji_32", "jsCall_iiijjji_33", "jsCall_iiijjji_34", "jsCall_iiijjji_35", "jsCall_iiijjji_36", "jsCall_iiijjji_37", "jsCall_iiijjji_38", "jsCall_iiijjji_39", "jsCall_iiijjji_40", "jsCall_iiijjji_41", "jsCall_iiijjji_42", "jsCall_iiijjji_43", "jsCall_iiijjji_44", "jsCall_iiijjji_45", "jsCall_iiijjji_46", "jsCall_iiijjji_47", "jsCall_iiijjji_48", "jsCall_iiijjji_49", "jsCall_iiijjji_50", "jsCall_iiijjji_51", "jsCall_iiijjji_52", "jsCall_iiijjji_53", "jsCall_iiijjji_54", "jsCall_iiijjji_55", "jsCall_iiijjji_56", "jsCall_iiijjji_57", "jsCall_iiijjji_58", "jsCall_iiijjji_59", "jsCall_iiijjji_60", "jsCall_iiijjji_61", "jsCall_iiijjji_62", "jsCall_iiijjji_63", "jsCall_iiijjji_64", "jsCall_iiijjji_65", "jsCall_iiijjji_66", "jsCall_iiijjji_67", "jsCall_iiijjji_68", "jsCall_iiijjji_69", "jsCall_iiijjji_70", "jsCall_iiijjji_71", "jsCall_iiijjji_72", "jsCall_iiijjji_73", "jsCall_iiijjji_74", "jsCall_iiijjji_75", "jsCall_iiijjji_76", "jsCall_iiijjji_77", "jsCall_iiijjji_78", "jsCall_iiijjji_79", "jsCall_iiijjji_80", "jsCall_iiijjji_81", "jsCall_iiijjji_82", "jsCall_iiijjji_83", "jsCall_iiijjji_84", "jsCall_iiijjji_85", "jsCall_iiijjji_86", "jsCall_iiijjji_87", "jsCall_iiijjji_88", "jsCall_iiijjji_89", "jsCall_iiijjji_90", "jsCall_iiijjji_91", "jsCall_iiijjji_92", "jsCall_iiijjji_93", "jsCall_iiijjji_94", "jsCall_iiijjji_95", "jsCall_iiijjji_96", "jsCall_iiijjji_97", "jsCall_iiijjji_98", "jsCall_iiijjji_99", 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
var debug_table_jii = [0, "jsCall_jii_0", "jsCall_jii_1", "jsCall_jii_2", "jsCall_jii_3", "jsCall_jii_4", "jsCall_jii_5", "jsCall_jii_6", "jsCall_jii_7", "jsCall_jii_8", "jsCall_jii_9", "jsCall_jii_10", "jsCall_jii_11", "jsCall_jii_12", "jsCall_jii_13", "jsCall_jii_14", "jsCall_jii_15", "jsCall_jii_16", "jsCall_jii_17", "jsCall_jii_18", "jsCall_jii_19", "jsCall_jii_20", "jsCall_jii_21", "jsCall_jii_22", "jsCall_jii_23", "jsCall_jii_24", "jsCall_jii_25", "jsCall_jii_26", "jsCall_jii_27", "jsCall_jii_28", "jsCall_jii_29", "jsCall_jii_30", "jsCall_jii_31", "jsCall_jii_32", "jsCall_jii_33", "jsCall_jii_34", "jsCall_jii_35", "jsCall_jii_36", "jsCall_jii_37", "jsCall_jii_38", "jsCall_jii_39", "jsCall_jii_40", "jsCall_jii_41", "jsCall_jii_42", "jsCall_jii_43", "jsCall_jii_44", "jsCall_jii_45", "jsCall_jii_46", "jsCall_jii_47", "jsCall_jii_48", "jsCall_jii_49", "jsCall_jii_50", "jsCall_jii_51", "jsCall_jii_52", "jsCall_jii_53", "jsCall_jii_54", "jsCall_jii_55", "jsCall_jii_56", "jsCall_jii_57", "jsCall_jii_58", "jsCall_jii_59", "jsCall_jii_60", "jsCall_jii_61", "jsCall_jii_62", "jsCall_jii_63", "jsCall_jii_64", "jsCall_jii_65", "jsCall_jii_66", "jsCall_jii_67", "jsCall_jii_68", "jsCall_jii_69", "jsCall_jii_70", "jsCall_jii_71", "jsCall_jii_72", "jsCall_jii_73", "jsCall_jii_74", "jsCall_jii_75", "jsCall_jii_76", "jsCall_jii_77", "jsCall_jii_78", "jsCall_jii_79", "jsCall_jii_80", "jsCall_jii_81", "jsCall_jii_82", "jsCall_jii_83", "jsCall_jii_84", "jsCall_jii_85", "jsCall_jii_86", "jsCall_jii_87", "jsCall_jii_88", "jsCall_jii_89", "jsCall_jii_90", "jsCall_jii_91", "jsCall_jii_92", "jsCall_jii_93", "jsCall_jii_94", "jsCall_jii_95", "jsCall_jii_96", "jsCall_jii_97", "jsCall_jii_98", "jsCall_jii_99", "_get_out_samples", 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
var debug_table_jiiij = [0, "jsCall_jiiij_0", "jsCall_jiiij_1", "jsCall_jiiij_2", "jsCall_jiiij_3", "jsCall_jiiij_4", "jsCall_jiiij_5", "jsCall_jiiij_6", "jsCall_jiiij_7", "jsCall_jiiij_8", "jsCall_jiiij_9", "jsCall_jiiij_10", "jsCall_jiiij_11", "jsCall_jiiij_12", "jsCall_jiiij_13", "jsCall_jiiij_14", "jsCall_jiiij_15", "jsCall_jiiij_16", "jsCall_jiiij_17", "jsCall_jiiij_18", "jsCall_jiiij_19", "jsCall_jiiij_20", "jsCall_jiiij_21", "jsCall_jiiij_22", "jsCall_jiiij_23", "jsCall_jiiij_24", "jsCall_jiiij_25", "jsCall_jiiij_26", "jsCall_jiiij_27", "jsCall_jiiij_28", "jsCall_jiiij_29", "jsCall_jiiij_30", "jsCall_jiiij_31", "jsCall_jiiij_32", "jsCall_jiiij_33", "jsCall_jiiij_34", "jsCall_jiiij_35", "jsCall_jiiij_36", "jsCall_jiiij_37", "jsCall_jiiij_38", "jsCall_jiiij_39", "jsCall_jiiij_40", "jsCall_jiiij_41", "jsCall_jiiij_42", "jsCall_jiiij_43", "jsCall_jiiij_44", "jsCall_jiiij_45", "jsCall_jiiij_46", "jsCall_jiiij_47", "jsCall_jiiij_48", "jsCall_jiiij_49", "jsCall_jiiij_50", "jsCall_jiiij_51", "jsCall_jiiij_52", "jsCall_jiiij_53", "jsCall_jiiij_54", "jsCall_jiiij_55", "jsCall_jiiij_56", "jsCall_jiiij_57", "jsCall_jiiij_58", "jsCall_jiiij_59", "jsCall_jiiij_60", "jsCall_jiiij_61", "jsCall_jiiij_62", "jsCall_jiiij_63", "jsCall_jiiij_64", "jsCall_jiiij_65", "jsCall_jiiij_66", "jsCall_jiiij_67", "jsCall_jiiij_68", "jsCall_jiiij_69", "jsCall_jiiij_70", "jsCall_jiiij_71", "jsCall_jiiij_72", "jsCall_jiiij_73", "jsCall_jiiij_74", "jsCall_jiiij_75", "jsCall_jiiij_76", "jsCall_jiiij_77", "jsCall_jiiij_78", "jsCall_jiiij_79", "jsCall_jiiij_80", "jsCall_jiiij_81", "jsCall_jiiij_82", "jsCall_jiiij_83", "jsCall_jiiij_84", "jsCall_jiiij_85", "jsCall_jiiij_86", "jsCall_jiiij_87", "jsCall_jiiij_88", "jsCall_jiiij_89", "jsCall_jiiij_90", "jsCall_jiiij_91", "jsCall_jiiij_92", "jsCall_jiiij_93", "jsCall_jiiij_94", "jsCall_jiiij_95", "jsCall_jiiij_96", "jsCall_jiiij_97", "jsCall_jiiij_98", "jsCall_jiiij_99", "_mpegps_read_dts", "_mpegts_get_dts", 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
var debug_table_jiiji = [0, "jsCall_jiiji_0", "jsCall_jiiji_1", "jsCall_jiiji_2", "jsCall_jiiji_3", "jsCall_jiiji_4", "jsCall_jiiji_5", "jsCall_jiiji_6", "jsCall_jiiji_7", "jsCall_jiiji_8", "jsCall_jiiji_9", "jsCall_jiiji_10", "jsCall_jiiji_11", "jsCall_jiiji_12", "jsCall_jiiji_13", "jsCall_jiiji_14", "jsCall_jiiji_15", "jsCall_jiiji_16", "jsCall_jiiji_17", "jsCall_jiiji_18", "jsCall_jiiji_19", "jsCall_jiiji_20", "jsCall_jiiji_21", "jsCall_jiiji_22", "jsCall_jiiji_23", "jsCall_jiiji_24", "jsCall_jiiji_25", "jsCall_jiiji_26", "jsCall_jiiji_27", "jsCall_jiiji_28", "jsCall_jiiji_29", "jsCall_jiiji_30", "jsCall_jiiji_31", "jsCall_jiiji_32", "jsCall_jiiji_33", "jsCall_jiiji_34", "jsCall_jiiji_35", "jsCall_jiiji_36", "jsCall_jiiji_37", "jsCall_jiiji_38", "jsCall_jiiji_39", "jsCall_jiiji_40", "jsCall_jiiji_41", "jsCall_jiiji_42", "jsCall_jiiji_43", "jsCall_jiiji_44", "jsCall_jiiji_45", "jsCall_jiiji_46", "jsCall_jiiji_47", "jsCall_jiiji_48", "jsCall_jiiji_49", "jsCall_jiiji_50", "jsCall_jiiji_51", "jsCall_jiiji_52", "jsCall_jiiji_53", "jsCall_jiiji_54", "jsCall_jiiji_55", "jsCall_jiiji_56", "jsCall_jiiji_57", "jsCall_jiiji_58", "jsCall_jiiji_59", "jsCall_jiiji_60", "jsCall_jiiji_61", "jsCall_jiiji_62", "jsCall_jiiji_63", "jsCall_jiiji_64", "jsCall_jiiji_65", "jsCall_jiiji_66", "jsCall_jiiji_67", "jsCall_jiiji_68", "jsCall_jiiji_69", "jsCall_jiiji_70", "jsCall_jiiji_71", "jsCall_jiiji_72", "jsCall_jiiji_73", "jsCall_jiiji_74", "jsCall_jiiji_75", "jsCall_jiiji_76", "jsCall_jiiji_77", "jsCall_jiiji_78", "jsCall_jiiji_79", "jsCall_jiiji_80", "jsCall_jiiji_81", "jsCall_jiiji_82", "jsCall_jiiji_83", "jsCall_jiiji_84", "jsCall_jiiji_85", "jsCall_jiiji_86", "jsCall_jiiji_87", "jsCall_jiiji_88", "jsCall_jiiji_89", "jsCall_jiiji_90", "jsCall_jiiji_91", "jsCall_jiiji_92", "jsCall_jiiji_93", "jsCall_jiiji_94", "jsCall_jiiji_95", "jsCall_jiiji_96", "jsCall_jiiji_97", "jsCall_jiiji_98", "jsCall_jiiji_99", "_io_read_seek", 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
var debug_table_jij = [0, "jsCall_jij_0", "jsCall_jij_1", "jsCall_jij_2", "jsCall_jij_3", "jsCall_jij_4", "jsCall_jij_5", "jsCall_jij_6", "jsCall_jij_7", "jsCall_jij_8", "jsCall_jij_9", "jsCall_jij_10", "jsCall_jij_11", "jsCall_jij_12", "jsCall_jij_13", "jsCall_jij_14", "jsCall_jij_15", "jsCall_jij_16", "jsCall_jij_17", "jsCall_jij_18", "jsCall_jij_19", "jsCall_jij_20", "jsCall_jij_21", "jsCall_jij_22", "jsCall_jij_23", "jsCall_jij_24", "jsCall_jij_25", "jsCall_jij_26", "jsCall_jij_27", "jsCall_jij_28", "jsCall_jij_29", "jsCall_jij_30", "jsCall_jij_31", "jsCall_jij_32", "jsCall_jij_33", "jsCall_jij_34", "jsCall_jij_35", "jsCall_jij_36", "jsCall_jij_37", "jsCall_jij_38", "jsCall_jij_39", "jsCall_jij_40", "jsCall_jij_41", "jsCall_jij_42", "jsCall_jij_43", "jsCall_jij_44", "jsCall_jij_45", "jsCall_jij_46", "jsCall_jij_47", "jsCall_jij_48", "jsCall_jij_49", "jsCall_jij_50", "jsCall_jij_51", "jsCall_jij_52", "jsCall_jij_53", "jsCall_jij_54", "jsCall_jij_55", "jsCall_jij_56", "jsCall_jij_57", "jsCall_jij_58", "jsCall_jij_59", "jsCall_jij_60", "jsCall_jij_61", "jsCall_jij_62", "jsCall_jij_63", "jsCall_jij_64", "jsCall_jij_65", "jsCall_jij_66", "jsCall_jij_67", "jsCall_jij_68", "jsCall_jij_69", "jsCall_jij_70", "jsCall_jij_71", "jsCall_jij_72", "jsCall_jij_73", "jsCall_jij_74", "jsCall_jij_75", "jsCall_jij_76", "jsCall_jij_77", "jsCall_jij_78", "jsCall_jij_79", "jsCall_jij_80", "jsCall_jij_81", "jsCall_jij_82", "jsCall_jij_83", "jsCall_jij_84", "jsCall_jij_85", "jsCall_jij_86", "jsCall_jij_87", "jsCall_jij_88", "jsCall_jij_89", "jsCall_jij_90", "jsCall_jij_91", "jsCall_jij_92", "jsCall_jij_93", "jsCall_jij_94", "jsCall_jij_95", "jsCall_jij_96", "jsCall_jij_97", "jsCall_jij_98", "jsCall_jij_99", "_get_delay", 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
var debug_table_jiji = [0, "jsCall_jiji_0", "jsCall_jiji_1", "jsCall_jiji_2", "jsCall_jiji_3", "jsCall_jiji_4", "jsCall_jiji_5", "jsCall_jiji_6", "jsCall_jiji_7", "jsCall_jiji_8", "jsCall_jiji_9", "jsCall_jiji_10", "jsCall_jiji_11", "jsCall_jiji_12", "jsCall_jiji_13", "jsCall_jiji_14", "jsCall_jiji_15", "jsCall_jiji_16", "jsCall_jiji_17", "jsCall_jiji_18", "jsCall_jiji_19", "jsCall_jiji_20", "jsCall_jiji_21", "jsCall_jiji_22", "jsCall_jiji_23", "jsCall_jiji_24", "jsCall_jiji_25", "jsCall_jiji_26", "jsCall_jiji_27", "jsCall_jiji_28", "jsCall_jiji_29", "jsCall_jiji_30", "jsCall_jiji_31", "jsCall_jiji_32", "jsCall_jiji_33", "jsCall_jiji_34", "jsCall_jiji_35", "jsCall_jiji_36", "jsCall_jiji_37", "jsCall_jiji_38", "jsCall_jiji_39", "jsCall_jiji_40", "jsCall_jiji_41", "jsCall_jiji_42", "jsCall_jiji_43", "jsCall_jiji_44", "jsCall_jiji_45", "jsCall_jiji_46", "jsCall_jiji_47", "jsCall_jiji_48", "jsCall_jiji_49", "jsCall_jiji_50", "jsCall_jiji_51", "jsCall_jiji_52", "jsCall_jiji_53", "jsCall_jiji_54", "jsCall_jiji_55", "jsCall_jiji_56", "jsCall_jiji_57", "jsCall_jiji_58", "jsCall_jiji_59", "jsCall_jiji_60", "jsCall_jiji_61", "jsCall_jiji_62", "jsCall_jiji_63", "jsCall_jiji_64", "jsCall_jiji_65", "jsCall_jiji_66", "jsCall_jiji_67", "jsCall_jiji_68", "jsCall_jiji_69", "jsCall_jiji_70", "jsCall_jiji_71", "jsCall_jiji_72", "jsCall_jiji_73", "jsCall_jiji_74", "jsCall_jiji_75", "jsCall_jiji_76", "jsCall_jiji_77", "jsCall_jiji_78", "jsCall_jiji_79", "jsCall_jiji_80", "jsCall_jiji_81", "jsCall_jiji_82", "jsCall_jiji_83", "jsCall_jiji_84", "jsCall_jiji_85", "jsCall_jiji_86", "jsCall_jiji_87", "jsCall_jiji_88", "jsCall_jiji_89", "jsCall_jiji_90", "jsCall_jiji_91", "jsCall_jiji_92", "jsCall_jiji_93", "jsCall_jiji_94", "jsCall_jiji_95", "jsCall_jiji_96", "jsCall_jiji_97", "jsCall_jiji_98", "jsCall_jiji_99", "___stdio_seek", "___emscripten_stdout_seek", "_seek_in_buffer", "_io_seek", "_dyn_buf_seek", 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
var debug_table_v = [0, "jsCall_v_0", "jsCall_v_1", "jsCall_v_2", "jsCall_v_3", "jsCall_v_4", "jsCall_v_5", "jsCall_v_6", "jsCall_v_7", "jsCall_v_8", "jsCall_v_9", "jsCall_v_10", "jsCall_v_11", "jsCall_v_12", "jsCall_v_13", "jsCall_v_14", "jsCall_v_15", "jsCall_v_16", "jsCall_v_17", "jsCall_v_18", "jsCall_v_19", "jsCall_v_20", "jsCall_v_21", "jsCall_v_22", "jsCall_v_23", "jsCall_v_24", "jsCall_v_25", "jsCall_v_26", "jsCall_v_27", "jsCall_v_28", "jsCall_v_29", "jsCall_v_30", "jsCall_v_31", "jsCall_v_32", "jsCall_v_33", "jsCall_v_34", "jsCall_v_35", "jsCall_v_36", "jsCall_v_37", "jsCall_v_38", "jsCall_v_39", "jsCall_v_40", "jsCall_v_41", "jsCall_v_42", "jsCall_v_43", "jsCall_v_44", "jsCall_v_45", "jsCall_v_46", "jsCall_v_47", "jsCall_v_48", "jsCall_v_49", "jsCall_v_50", "jsCall_v_51", "jsCall_v_52", "jsCall_v_53", "jsCall_v_54", "jsCall_v_55", "jsCall_v_56", "jsCall_v_57", "jsCall_v_58", "jsCall_v_59", "jsCall_v_60", "jsCall_v_61", "jsCall_v_62", "jsCall_v_63", "jsCall_v_64", "jsCall_v_65", "jsCall_v_66", "jsCall_v_67", "jsCall_v_68", "jsCall_v_69", "jsCall_v_70", "jsCall_v_71", "jsCall_v_72", "jsCall_v_73", "jsCall_v_74", "jsCall_v_75", "jsCall_v_76", "jsCall_v_77", "jsCall_v_78", "jsCall_v_79", "jsCall_v_80", "jsCall_v_81", "jsCall_v_82", "jsCall_v_83", "jsCall_v_84", "jsCall_v_85", "jsCall_v_86", "jsCall_v_87", "jsCall_v_88", "jsCall_v_89", "jsCall_v_90", "jsCall_v_91", "jsCall_v_92", "jsCall_v_93", "jsCall_v_94", "jsCall_v_95", "jsCall_v_96", "jsCall_v_97", "jsCall_v_98", "jsCall_v_99", "_init_ff_cos_tabs_16", "_init_ff_cos_tabs_32", "_init_ff_cos_tabs_64", "_init_ff_cos_tabs_128", "_init_ff_cos_tabs_256", "_init_ff_cos_tabs_512", "_init_ff_cos_tabs_1024", "_init_ff_cos_tabs_2048", "_init_ff_cos_tabs_4096", "_init_ff_cos_tabs_8192", "_init_ff_cos_tabs_16384", "_init_ff_cos_tabs_32768", "_init_ff_cos_tabs_65536", "_init_ff_cos_tabs_131072", "_introduce_mine", "_introduceMineFunc", "_av_format_init_next", "_av_codec_init_static", "_av_codec_init_next", "_ff_init_mpadsp_tabs_float", "_ff_init_mpadsp_tabs_fixed", "_aac_static_table_init", "_AV_CRC_8_ATM_init_table_once", "_AV_CRC_8_EBU_init_table_once", "_AV_CRC_16_ANSI_init_table_once", "_AV_CRC_16_CCITT_init_table_once", "_AV_CRC_24_IEEE_init_table_once", "_AV_CRC_32_IEEE_init_table_once", "_AV_CRC_32_IEEE_LE_init_table_once", "_AV_CRC_16_ANSI_LE_init_table_once", 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
var debug_table_vdiidiiiii = [0, "jsCall_vdiidiiiii_0", "jsCall_vdiidiiiii_1", "jsCall_vdiidiiiii_2", "jsCall_vdiidiiiii_3", "jsCall_vdiidiiiii_4", "jsCall_vdiidiiiii_5", "jsCall_vdiidiiiii_6", "jsCall_vdiidiiiii_7", "jsCall_vdiidiiiii_8", "jsCall_vdiidiiiii_9", "jsCall_vdiidiiiii_10", "jsCall_vdiidiiiii_11", "jsCall_vdiidiiiii_12", "jsCall_vdiidiiiii_13", "jsCall_vdiidiiiii_14", "jsCall_vdiidiiiii_15", "jsCall_vdiidiiiii_16", "jsCall_vdiidiiiii_17", "jsCall_vdiidiiiii_18", "jsCall_vdiidiiiii_19", "jsCall_vdiidiiiii_20", "jsCall_vdiidiiiii_21", "jsCall_vdiidiiiii_22", "jsCall_vdiidiiiii_23", "jsCall_vdiidiiiii_24", "jsCall_vdiidiiiii_25", "jsCall_vdiidiiiii_26", "jsCall_vdiidiiiii_27", "jsCall_vdiidiiiii_28", "jsCall_vdiidiiiii_29", "jsCall_vdiidiiiii_30", "jsCall_vdiidiiiii_31", "jsCall_vdiidiiiii_32", "jsCall_vdiidiiiii_33", "jsCall_vdiidiiiii_34", "jsCall_vdiidiiiii_35", "jsCall_vdiidiiiii_36", "jsCall_vdiidiiiii_37", "jsCall_vdiidiiiii_38", "jsCall_vdiidiiiii_39", "jsCall_vdiidiiiii_40", "jsCall_vdiidiiiii_41", "jsCall_vdiidiiiii_42", "jsCall_vdiidiiiii_43", "jsCall_vdiidiiiii_44", "jsCall_vdiidiiiii_45", "jsCall_vdiidiiiii_46", "jsCall_vdiidiiiii_47", "jsCall_vdiidiiiii_48", "jsCall_vdiidiiiii_49", "jsCall_vdiidiiiii_50", "jsCall_vdiidiiiii_51", "jsCall_vdiidiiiii_52", "jsCall_vdiidiiiii_53", "jsCall_vdiidiiiii_54", "jsCall_vdiidiiiii_55", "jsCall_vdiidiiiii_56", "jsCall_vdiidiiiii_57", "jsCall_vdiidiiiii_58", "jsCall_vdiidiiiii_59", "jsCall_vdiidiiiii_60", "jsCall_vdiidiiiii_61", "jsCall_vdiidiiiii_62", "jsCall_vdiidiiiii_63", "jsCall_vdiidiiiii_64", "jsCall_vdiidiiiii_65", "jsCall_vdiidiiiii_66", "jsCall_vdiidiiiii_67", "jsCall_vdiidiiiii_68", "jsCall_vdiidiiiii_69", "jsCall_vdiidiiiii_70", "jsCall_vdiidiiiii_71", "jsCall_vdiidiiiii_72", "jsCall_vdiidiiiii_73", "jsCall_vdiidiiiii_74", "jsCall_vdiidiiiii_75", "jsCall_vdiidiiiii_76", "jsCall_vdiidiiiii_77", "jsCall_vdiidiiiii_78", "jsCall_vdiidiiiii_79", "jsCall_vdiidiiiii_80", "jsCall_vdiidiiiii_81", "jsCall_vdiidiiiii_82", "jsCall_vdiidiiiii_83", "jsCall_vdiidiiiii_84", "jsCall_vdiidiiiii_85", "jsCall_vdiidiiiii_86", "jsCall_vdiidiiiii_87", "jsCall_vdiidiiiii_88", "jsCall_vdiidiiiii_89", "jsCall_vdiidiiiii_90", "jsCall_vdiidiiiii_91", "jsCall_vdiidiiiii_92", "jsCall_vdiidiiiii_93", "jsCall_vdiidiiiii_94", "jsCall_vdiidiiiii_95", "jsCall_vdiidiiiii_96", "jsCall_vdiidiiiii_97", "jsCall_vdiidiiiii_98", "jsCall_vdiidiiiii_99", 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
var debug_table_vdiidiiiiii = [0, "jsCall_vdiidiiiiii_0", "jsCall_vdiidiiiiii_1", "jsCall_vdiidiiiiii_2", "jsCall_vdiidiiiiii_3", "jsCall_vdiidiiiiii_4", "jsCall_vdiidiiiiii_5", "jsCall_vdiidiiiiii_6", "jsCall_vdiidiiiiii_7", "jsCall_vdiidiiiiii_8", "jsCall_vdiidiiiiii_9", "jsCall_vdiidiiiiii_10", "jsCall_vdiidiiiiii_11", "jsCall_vdiidiiiiii_12", "jsCall_vdiidiiiiii_13", "jsCall_vdiidiiiiii_14", "jsCall_vdiidiiiiii_15", "jsCall_vdiidiiiiii_16", "jsCall_vdiidiiiiii_17", "jsCall_vdiidiiiiii_18", "jsCall_vdiidiiiiii_19", "jsCall_vdiidiiiiii_20", "jsCall_vdiidiiiiii_21", "jsCall_vdiidiiiiii_22", "jsCall_vdiidiiiiii_23", "jsCall_vdiidiiiiii_24", "jsCall_vdiidiiiiii_25", "jsCall_vdiidiiiiii_26", "jsCall_vdiidiiiiii_27", "jsCall_vdiidiiiiii_28", "jsCall_vdiidiiiiii_29", "jsCall_vdiidiiiiii_30", "jsCall_vdiidiiiiii_31", "jsCall_vdiidiiiiii_32", "jsCall_vdiidiiiiii_33", "jsCall_vdiidiiiiii_34", "jsCall_vdiidiiiiii_35", "jsCall_vdiidiiiiii_36", "jsCall_vdiidiiiiii_37", "jsCall_vdiidiiiiii_38", "jsCall_vdiidiiiiii_39", "jsCall_vdiidiiiiii_40", "jsCall_vdiidiiiiii_41", "jsCall_vdiidiiiiii_42", "jsCall_vdiidiiiiii_43", "jsCall_vdiidiiiiii_44", "jsCall_vdiidiiiiii_45", "jsCall_vdiidiiiiii_46", "jsCall_vdiidiiiiii_47", "jsCall_vdiidiiiiii_48", "jsCall_vdiidiiiiii_49", "jsCall_vdiidiiiiii_50", "jsCall_vdiidiiiiii_51", "jsCall_vdiidiiiiii_52", "jsCall_vdiidiiiiii_53", "jsCall_vdiidiiiiii_54", "jsCall_vdiidiiiiii_55", "jsCall_vdiidiiiiii_56", "jsCall_vdiidiiiiii_57", "jsCall_vdiidiiiiii_58", "jsCall_vdiidiiiiii_59", "jsCall_vdiidiiiiii_60", "jsCall_vdiidiiiiii_61", "jsCall_vdiidiiiiii_62", "jsCall_vdiidiiiiii_63", "jsCall_vdiidiiiiii_64", "jsCall_vdiidiiiiii_65", "jsCall_vdiidiiiiii_66", "jsCall_vdiidiiiiii_67", "jsCall_vdiidiiiiii_68", "jsCall_vdiidiiiiii_69", "jsCall_vdiidiiiiii_70", "jsCall_vdiidiiiiii_71", "jsCall_vdiidiiiiii_72", "jsCall_vdiidiiiiii_73", "jsCall_vdiidiiiiii_74", "jsCall_vdiidiiiiii_75", "jsCall_vdiidiiiiii_76", "jsCall_vdiidiiiiii_77", "jsCall_vdiidiiiiii_78", "jsCall_vdiidiiiiii_79", "jsCall_vdiidiiiiii_80", "jsCall_vdiidiiiiii_81", "jsCall_vdiidiiiiii_82", "jsCall_vdiidiiiiii_83", "jsCall_vdiidiiiiii_84", "jsCall_vdiidiiiiii_85", "jsCall_vdiidiiiiii_86", "jsCall_vdiidiiiiii_87", "jsCall_vdiidiiiiii_88", "jsCall_vdiidiiiiii_89", "jsCall_vdiidiiiiii_90", "jsCall_vdiidiiiiii_91", "jsCall_vdiidiiiiii_92", "jsCall_vdiidiiiiii_93", "jsCall_vdiidiiiiii_94", "jsCall_vdiidiiiiii_95", "jsCall_vdiidiiiiii_96", "jsCall_vdiidiiiiii_97", "jsCall_vdiidiiiiii_98", "jsCall_vdiidiiiiii_99", 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
var debug_table_vi = [0, "jsCall_vi_0", "jsCall_vi_1", "jsCall_vi_2", "jsCall_vi_3", "jsCall_vi_4", "jsCall_vi_5", "jsCall_vi_6", "jsCall_vi_7", "jsCall_vi_8", "jsCall_vi_9", "jsCall_vi_10", "jsCall_vi_11", "jsCall_vi_12", "jsCall_vi_13", "jsCall_vi_14", "jsCall_vi_15", "jsCall_vi_16", "jsCall_vi_17", "jsCall_vi_18", "jsCall_vi_19", "jsCall_vi_20", "jsCall_vi_21", "jsCall_vi_22", "jsCall_vi_23", "jsCall_vi_24", "jsCall_vi_25", "jsCall_vi_26", "jsCall_vi_27", "jsCall_vi_28", "jsCall_vi_29", "jsCall_vi_30", "jsCall_vi_31", "jsCall_vi_32", "jsCall_vi_33", "jsCall_vi_34", "jsCall_vi_35", "jsCall_vi_36", "jsCall_vi_37", "jsCall_vi_38", "jsCall_vi_39", "jsCall_vi_40", "jsCall_vi_41", "jsCall_vi_42", "jsCall_vi_43", "jsCall_vi_44", "jsCall_vi_45", "jsCall_vi_46", "jsCall_vi_47", "jsCall_vi_48", "jsCall_vi_49", "jsCall_vi_50", "jsCall_vi_51", "jsCall_vi_52", "jsCall_vi_53", "jsCall_vi_54", "jsCall_vi_55", "jsCall_vi_56", "jsCall_vi_57", "jsCall_vi_58", "jsCall_vi_59", "jsCall_vi_60", "jsCall_vi_61", "jsCall_vi_62", "jsCall_vi_63", "jsCall_vi_64", "jsCall_vi_65", "jsCall_vi_66", "jsCall_vi_67", "jsCall_vi_68", "jsCall_vi_69", "jsCall_vi_70", "jsCall_vi_71", "jsCall_vi_72", "jsCall_vi_73", "jsCall_vi_74", "jsCall_vi_75", "jsCall_vi_76", "jsCall_vi_77", "jsCall_vi_78", "jsCall_vi_79", "jsCall_vi_80", "jsCall_vi_81", "jsCall_vi_82", "jsCall_vi_83", "jsCall_vi_84", "jsCall_vi_85", "jsCall_vi_86", "jsCall_vi_87", "jsCall_vi_88", "jsCall_vi_89", "jsCall_vi_90", "jsCall_vi_91", "jsCall_vi_92", "jsCall_vi_93", "jsCall_vi_94", "jsCall_vi_95", "jsCall_vi_96", "jsCall_vi_97", "jsCall_vi_98", "jsCall_vi_99", "_free_geobtag", "_free_apic", "_free_chapter", "_free_priv", "_hevc_decode_flush", "_flush", "_flush_3915", "_fft4", "_fft8", "_fft16", "_fft32", "_fft64", "_fft128", "_fft256", "_fft512", "_fft1024", "_fft2048", "_fft4096", "_fft8192", "_fft16384", "_fft32768", "_fft65536", "_fft131072", "_h264_close", "_hevc_parser_close", "_ff_parse_close", "_resample_free", "_logRequest_downloadSucceeded", "_logRequest_downloadFailed", "_downloadSucceeded", "_downloadFailed", "_transform_4x4_luma_9", "_idct_4x4_dc_9", "_idct_8x8_dc_9", "_idct_16x16_dc_9", "_idct_32x32_dc_9", "_transform_4x4_luma_10", "_idct_4x4_dc_10", "_idct_8x8_dc_10", "_idct_16x16_dc_10", "_idct_32x32_dc_10", "_transform_4x4_luma_12", "_idct_4x4_dc_12", "_idct_8x8_dc_12", "_idct_16x16_dc_12", "_idct_32x32_dc_12", "_transform_4x4_luma_8", "_idct_4x4_dc_8", "_idct_8x8_dc_8", "_idct_16x16_dc_8", "_idct_32x32_dc_8", "_main_function", "_sbr_sum64x5_c", "_sbr_neg_odd_64_c", "_sbr_qmf_pre_shuffle_c", 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
var debug_table_vii = [0, "jsCall_vii_0", "jsCall_vii_1", "jsCall_vii_2", "jsCall_vii_3", "jsCall_vii_4", "jsCall_vii_5", "jsCall_vii_6", "jsCall_vii_7", "jsCall_vii_8", "jsCall_vii_9", "jsCall_vii_10", "jsCall_vii_11", "jsCall_vii_12", "jsCall_vii_13", "jsCall_vii_14", "jsCall_vii_15", "jsCall_vii_16", "jsCall_vii_17", "jsCall_vii_18", "jsCall_vii_19", "jsCall_vii_20", "jsCall_vii_21", "jsCall_vii_22", "jsCall_vii_23", "jsCall_vii_24", "jsCall_vii_25", "jsCall_vii_26", "jsCall_vii_27", "jsCall_vii_28", "jsCall_vii_29", "jsCall_vii_30", "jsCall_vii_31", "jsCall_vii_32", "jsCall_vii_33", "jsCall_vii_34", "jsCall_vii_35", "jsCall_vii_36", "jsCall_vii_37", "jsCall_vii_38", "jsCall_vii_39", "jsCall_vii_40", "jsCall_vii_41", "jsCall_vii_42", "jsCall_vii_43", "jsCall_vii_44", "jsCall_vii_45", "jsCall_vii_46", "jsCall_vii_47", "jsCall_vii_48", "jsCall_vii_49", "jsCall_vii_50", "jsCall_vii_51", "jsCall_vii_52", "jsCall_vii_53", "jsCall_vii_54", "jsCall_vii_55", "jsCall_vii_56", "jsCall_vii_57", "jsCall_vii_58", "jsCall_vii_59", "jsCall_vii_60", "jsCall_vii_61", "jsCall_vii_62", "jsCall_vii_63", "jsCall_vii_64", "jsCall_vii_65", "jsCall_vii_66", "jsCall_vii_67", "jsCall_vii_68", "jsCall_vii_69", "jsCall_vii_70", "jsCall_vii_71", "jsCall_vii_72", "jsCall_vii_73", "jsCall_vii_74", "jsCall_vii_75", "jsCall_vii_76", "jsCall_vii_77", "jsCall_vii_78", "jsCall_vii_79", "jsCall_vii_80", "jsCall_vii_81", "jsCall_vii_82", "jsCall_vii_83", "jsCall_vii_84", "jsCall_vii_85", "jsCall_vii_86", "jsCall_vii_87", "jsCall_vii_88", "jsCall_vii_89", "jsCall_vii_90", "jsCall_vii_91", "jsCall_vii_92", "jsCall_vii_93", "jsCall_vii_94", "jsCall_vii_95", "jsCall_vii_96", "jsCall_vii_97", "jsCall_vii_98", "jsCall_vii_99", "_io_close_default", "_lumRangeFromJpeg_c", "_lumRangeToJpeg_c", "_lumRangeFromJpeg16_c", "_lumRangeToJpeg16_c", "_decode_data_free", "_dequant_9", "_idct_4x4_9", "_idct_8x8_9", "_idct_16x16_9", "_idct_32x32_9", "_dequant_10", "_idct_4x4_10", "_idct_8x8_10", "_idct_16x16_10", "_idct_32x32_10", "_dequant_12", "_idct_4x4_12", "_idct_8x8_12", "_idct_16x16_12", "_idct_32x32_12", "_dequant_8", "_idct_4x4_8", "_idct_8x8_8", "_idct_16x16_8", "_idct_32x32_8", "_ff_dct32_fixed", "_imdct_and_windowing", "_apply_ltp", "_update_ltp", "_imdct_and_windowing_ld", "_imdct_and_windowing_eld", "_imdct_and_windowing_960", "_ff_dct32_float", "_dct32_func", "_dct_calc_I_c", "_dct_calc_II_c", "_dct_calc_III_c", "_dst_calc_I_c", "_fft_permute_c", "_fft_calc_c", "_ff_h264_chroma_dc_dequant_idct_9_c", "_ff_h264_chroma422_dc_dequant_idct_9_c", "_ff_h264_chroma_dc_dequant_idct_10_c", "_ff_h264_chroma422_dc_dequant_idct_10_c", "_ff_h264_chroma_dc_dequant_idct_12_c", "_ff_h264_chroma422_dc_dequant_idct_12_c", "_ff_h264_chroma_dc_dequant_idct_14_c", "_ff_h264_chroma422_dc_dequant_idct_14_c", "_ff_h264_chroma_dc_dequant_idct_8_c", "_ff_h264_chroma422_dc_dequant_idct_8_c", "_hevc_pps_free", "_rdft_calc_c", "_sbr_qmf_post_shuffle_c", "_sbr_qmf_deint_neg_c", "_sbr_autocorrelate_c", "_av_buffer_default_free", "_pool_release_buffer", "_sha1_transform", "_sha256_transform", "_pop_arg_long_double", 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
var debug_table_viidi = [0, "jsCall_viidi_0", "jsCall_viidi_1", "jsCall_viidi_2", "jsCall_viidi_3", "jsCall_viidi_4", "jsCall_viidi_5", "jsCall_viidi_6", "jsCall_viidi_7", "jsCall_viidi_8", "jsCall_viidi_9", "jsCall_viidi_10", "jsCall_viidi_11", "jsCall_viidi_12", "jsCall_viidi_13", "jsCall_viidi_14", "jsCall_viidi_15", "jsCall_viidi_16", "jsCall_viidi_17", "jsCall_viidi_18", "jsCall_viidi_19", "jsCall_viidi_20", "jsCall_viidi_21", "jsCall_viidi_22", "jsCall_viidi_23", "jsCall_viidi_24", "jsCall_viidi_25", "jsCall_viidi_26", "jsCall_viidi_27", "jsCall_viidi_28", "jsCall_viidi_29", "jsCall_viidi_30", "jsCall_viidi_31", "jsCall_viidi_32", "jsCall_viidi_33", "jsCall_viidi_34", "jsCall_viidi_35", "jsCall_viidi_36", "jsCall_viidi_37", "jsCall_viidi_38", "jsCall_viidi_39", "jsCall_viidi_40", "jsCall_viidi_41", "jsCall_viidi_42", "jsCall_viidi_43", "jsCall_viidi_44", "jsCall_viidi_45", "jsCall_viidi_46", "jsCall_viidi_47", "jsCall_viidi_48", "jsCall_viidi_49", "jsCall_viidi_50", "jsCall_viidi_51", "jsCall_viidi_52", "jsCall_viidi_53", "jsCall_viidi_54", "jsCall_viidi_55", "jsCall_viidi_56", "jsCall_viidi_57", "jsCall_viidi_58", "jsCall_viidi_59", "jsCall_viidi_60", "jsCall_viidi_61", "jsCall_viidi_62", "jsCall_viidi_63", "jsCall_viidi_64", "jsCall_viidi_65", "jsCall_viidi_66", "jsCall_viidi_67", "jsCall_viidi_68", "jsCall_viidi_69", "jsCall_viidi_70", "jsCall_viidi_71", "jsCall_viidi_72", "jsCall_viidi_73", "jsCall_viidi_74", "jsCall_viidi_75", "jsCall_viidi_76", "jsCall_viidi_77", "jsCall_viidi_78", "jsCall_viidi_79", "jsCall_viidi_80", "jsCall_viidi_81", "jsCall_viidi_82", "jsCall_viidi_83", "jsCall_viidi_84", "jsCall_viidi_85", "jsCall_viidi_86", "jsCall_viidi_87", "jsCall_viidi_88", "jsCall_viidi_89", "jsCall_viidi_90", "jsCall_viidi_91", "jsCall_viidi_92", "jsCall_viidi_93", "jsCall_viidi_94", "jsCall_viidi_95", "jsCall_viidi_96", "jsCall_viidi_97", "jsCall_viidi_98", "jsCall_viidi_99", "_vector_dmac_scalar_c", "_vector_dmul_scalar_c", 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
var debug_table_viifi = [0, "jsCall_viifi_0", "jsCall_viifi_1", "jsCall_viifi_2", "jsCall_viifi_3", "jsCall_viifi_4", "jsCall_viifi_5", "jsCall_viifi_6", "jsCall_viifi_7", "jsCall_viifi_8", "jsCall_viifi_9", "jsCall_viifi_10", "jsCall_viifi_11", "jsCall_viifi_12", "jsCall_viifi_13", "jsCall_viifi_14", "jsCall_viifi_15", "jsCall_viifi_16", "jsCall_viifi_17", "jsCall_viifi_18", "jsCall_viifi_19", "jsCall_viifi_20", "jsCall_viifi_21", "jsCall_viifi_22", "jsCall_viifi_23", "jsCall_viifi_24", "jsCall_viifi_25", "jsCall_viifi_26", "jsCall_viifi_27", "jsCall_viifi_28", "jsCall_viifi_29", "jsCall_viifi_30", "jsCall_viifi_31", "jsCall_viifi_32", "jsCall_viifi_33", "jsCall_viifi_34", "jsCall_viifi_35", "jsCall_viifi_36", "jsCall_viifi_37", "jsCall_viifi_38", "jsCall_viifi_39", "jsCall_viifi_40", "jsCall_viifi_41", "jsCall_viifi_42", "jsCall_viifi_43", "jsCall_viifi_44", "jsCall_viifi_45", "jsCall_viifi_46", "jsCall_viifi_47", "jsCall_viifi_48", "jsCall_viifi_49", "jsCall_viifi_50", "jsCall_viifi_51", "jsCall_viifi_52", "jsCall_viifi_53", "jsCall_viifi_54", "jsCall_viifi_55", "jsCall_viifi_56", "jsCall_viifi_57", "jsCall_viifi_58", "jsCall_viifi_59", "jsCall_viifi_60", "jsCall_viifi_61", "jsCall_viifi_62", "jsCall_viifi_63", "jsCall_viifi_64", "jsCall_viifi_65", "jsCall_viifi_66", "jsCall_viifi_67", "jsCall_viifi_68", "jsCall_viifi_69", "jsCall_viifi_70", "jsCall_viifi_71", "jsCall_viifi_72", "jsCall_viifi_73", "jsCall_viifi_74", "jsCall_viifi_75", "jsCall_viifi_76", "jsCall_viifi_77", "jsCall_viifi_78", "jsCall_viifi_79", "jsCall_viifi_80", "jsCall_viifi_81", "jsCall_viifi_82", "jsCall_viifi_83", "jsCall_viifi_84", "jsCall_viifi_85", "jsCall_viifi_86", "jsCall_viifi_87", "jsCall_viifi_88", "jsCall_viifi_89", "jsCall_viifi_90", "jsCall_viifi_91", "jsCall_viifi_92", "jsCall_viifi_93", "jsCall_viifi_94", "jsCall_viifi_95", "jsCall_viifi_96", "jsCall_viifi_97", "jsCall_viifi_98", "jsCall_viifi_99", "_vector_fmac_scalar_c", "_vector_fmul_scalar_c", 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
var debug_table_viii = [0, "jsCall_viii_0", "jsCall_viii_1", "jsCall_viii_2", "jsCall_viii_3", "jsCall_viii_4", "jsCall_viii_5", "jsCall_viii_6", "jsCall_viii_7", "jsCall_viii_8", "jsCall_viii_9", "jsCall_viii_10", "jsCall_viii_11", "jsCall_viii_12", "jsCall_viii_13", "jsCall_viii_14", "jsCall_viii_15", "jsCall_viii_16", "jsCall_viii_17", "jsCall_viii_18", "jsCall_viii_19", "jsCall_viii_20", "jsCall_viii_21", "jsCall_viii_22", "jsCall_viii_23", "jsCall_viii_24", "jsCall_viii_25", "jsCall_viii_26", "jsCall_viii_27", "jsCall_viii_28", "jsCall_viii_29", "jsCall_viii_30", "jsCall_viii_31", "jsCall_viii_32", "jsCall_viii_33", "jsCall_viii_34", "jsCall_viii_35", "jsCall_viii_36", "jsCall_viii_37", "jsCall_viii_38", "jsCall_viii_39", "jsCall_viii_40", "jsCall_viii_41", "jsCall_viii_42", "jsCall_viii_43", "jsCall_viii_44", "jsCall_viii_45", "jsCall_viii_46", "jsCall_viii_47", "jsCall_viii_48", "jsCall_viii_49", "jsCall_viii_50", "jsCall_viii_51", "jsCall_viii_52", "jsCall_viii_53", "jsCall_viii_54", "jsCall_viii_55", "jsCall_viii_56", "jsCall_viii_57", "jsCall_viii_58", "jsCall_viii_59", "jsCall_viii_60", "jsCall_viii_61", "jsCall_viii_62", "jsCall_viii_63", "jsCall_viii_64", "jsCall_viii_65", "jsCall_viii_66", "jsCall_viii_67", "jsCall_viii_68", "jsCall_viii_69", "jsCall_viii_70", "jsCall_viii_71", "jsCall_viii_72", "jsCall_viii_73", "jsCall_viii_74", "jsCall_viii_75", "jsCall_viii_76", "jsCall_viii_77", "jsCall_viii_78", "jsCall_viii_79", "jsCall_viii_80", "jsCall_viii_81", "jsCall_viii_82", "jsCall_viii_83", "jsCall_viii_84", "jsCall_viii_85", "jsCall_viii_86", "jsCall_viii_87", "jsCall_viii_88", "jsCall_viii_89", "jsCall_viii_90", "jsCall_viii_91", "jsCall_viii_92", "jsCall_viii_93", "jsCall_viii_94", "jsCall_viii_95", "jsCall_viii_96", "jsCall_viii_97", "jsCall_viii_98", "jsCall_viii_99", "_avcHandleFrame", "_handleFrame", "_sdt_cb", "_pat_cb", "_pmt_cb", "_scte_data_cb", "_m4sl_cb", "_chrRangeFromJpeg_c", "_chrRangeToJpeg_c", "_chrRangeFromJpeg16_c", "_chrRangeToJpeg16_c", "_rgb15to16_c", "_rgb15tobgr24_c", "_rgb15to32_c", "_rgb16tobgr24_c", "_rgb16to32_c", "_rgb16to15_c", "_rgb24tobgr16_c", "_rgb24tobgr15_c", "_rgb24tobgr32_c", "_rgb32to16_c", "_rgb32to15_c", "_rgb32tobgr24_c", "_rgb24to15_c", "_rgb24to16_c", "_rgb24tobgr24_c", "_shuffle_bytes_0321_c", "_shuffle_bytes_2103_c", "_shuffle_bytes_1230_c", "_shuffle_bytes_3012_c", "_shuffle_bytes_3210_c", "_rgb32tobgr16_c", "_rgb32tobgr15_c", "_rgb48tobgr48_bswap", "_rgb48tobgr64_bswap", "_rgb48to64_bswap", "_rgb64to48_bswap", "_rgb48tobgr48_nobswap", "_rgb48tobgr64_nobswap", "_rgb48to64_nobswap", "_rgb64tobgr48_nobswap", "_rgb64tobgr48_bswap", "_rgb64to48_nobswap", "_rgb12to15", "_rgb15to24", "_rgb16to24", "_rgb32to24", "_rgb24to32", "_rgb12tobgr12", "_rgb15tobgr15", "_rgb16tobgr15", "_rgb15tobgr16", "_rgb16tobgr16", "_rgb15tobgr32", "_rgb16tobgr32", "_add_residual4x4_9", "_add_residual8x8_9", "_add_residual16x16_9", "_add_residual32x32_9", "_transform_rdpcm_9", "_add_residual4x4_10", "_add_residual8x8_10", "_add_residual16x16_10", "_add_residual32x32_10", "_transform_rdpcm_10", "_add_residual4x4_12", "_add_residual8x8_12", "_add_residual16x16_12", "_add_residual32x32_12", "_transform_rdpcm_12", "_add_residual4x4_8", "_add_residual8x8_8", "_add_residual16x16_8", "_add_residual32x32_8", "_transform_rdpcm_8", "_just_return", "_bswap_buf", "_bswap16_buf", "_ff_imdct_calc_c", "_ff_imdct_half_c", "_ff_mdct_calc_c", "_ff_h264_add_pixels4_16_c", "_ff_h264_add_pixels4_8_c", "_ff_h264_add_pixels8_16_c", "_ff_h264_add_pixels8_8_c", "_ff_h264_idct_add_9_c", "_ff_h264_idct8_add_9_c", "_ff_h264_idct_dc_add_9_c", "_ff_h264_idct8_dc_add_9_c", "_ff_h264_luma_dc_dequant_idct_9_c", "_ff_h264_idct_add_10_c", "_ff_h264_idct8_add_10_c", "_ff_h264_idct_dc_add_10_c", "_ff_h264_idct8_dc_add_10_c", "_ff_h264_luma_dc_dequant_idct_10_c", "_ff_h264_idct_add_12_c", "_ff_h264_idct8_add_12_c", "_ff_h264_idct_dc_add_12_c", "_ff_h264_idct8_dc_add_12_c", "_ff_h264_luma_dc_dequant_idct_12_c", "_ff_h264_idct_add_14_c", "_ff_h264_idct8_add_14_c", "_ff_h264_idct_dc_add_14_c", "_ff_h264_idct8_dc_add_14_c", "_ff_h264_luma_dc_dequant_idct_14_c", "_ff_h264_idct_add_8_c", "_ff_h264_idct8_add_8_c", "_ff_h264_idct_dc_add_8_c", "_ff_h264_idct8_dc_add_8_c", "_ff_h264_luma_dc_dequant_idct_8_c", "_sbr_qmf_deint_bfly_c", "_ps_add_squares_c", "_butterflies_float_c", "_cpy1", "_cpy2", "_cpy4", "_cpy8", 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
var debug_table_viiid = [0, "jsCall_viiid_0", "jsCall_viiid_1", "jsCall_viiid_2", "jsCall_viiid_3", "jsCall_viiid_4", "jsCall_viiid_5", "jsCall_viiid_6", "jsCall_viiid_7", "jsCall_viiid_8", "jsCall_viiid_9", "jsCall_viiid_10", "jsCall_viiid_11", "jsCall_viiid_12", "jsCall_viiid_13", "jsCall_viiid_14", "jsCall_viiid_15", "jsCall_viiid_16", "jsCall_viiid_17", "jsCall_viiid_18", "jsCall_viiid_19", "jsCall_viiid_20", "jsCall_viiid_21", "jsCall_viiid_22", "jsCall_viiid_23", "jsCall_viiid_24", "jsCall_viiid_25", "jsCall_viiid_26", "jsCall_viiid_27", "jsCall_viiid_28", "jsCall_viiid_29", "jsCall_viiid_30", "jsCall_viiid_31", "jsCall_viiid_32", "jsCall_viiid_33", "jsCall_viiid_34", "jsCall_viiid_35", "jsCall_viiid_36", "jsCall_viiid_37", "jsCall_viiid_38", "jsCall_viiid_39", "jsCall_viiid_40", "jsCall_viiid_41", "jsCall_viiid_42", "jsCall_viiid_43", "jsCall_viiid_44", "jsCall_viiid_45", "jsCall_viiid_46", "jsCall_viiid_47", "jsCall_viiid_48", "jsCall_viiid_49", "jsCall_viiid_50", "jsCall_viiid_51", "jsCall_viiid_52", "jsCall_viiid_53", "jsCall_viiid_54", "jsCall_viiid_55", "jsCall_viiid_56", "jsCall_viiid_57", "jsCall_viiid_58", "jsCall_viiid_59", "jsCall_viiid_60", "jsCall_viiid_61", "jsCall_viiid_62", "jsCall_viiid_63", "jsCall_viiid_64", "jsCall_viiid_65", "jsCall_viiid_66", "jsCall_viiid_67", "jsCall_viiid_68", "jsCall_viiid_69", "jsCall_viiid_70", "jsCall_viiid_71", "jsCall_viiid_72", "jsCall_viiid_73", "jsCall_viiid_74", "jsCall_viiid_75", "jsCall_viiid_76", "jsCall_viiid_77", "jsCall_viiid_78", "jsCall_viiid_79", "jsCall_viiid_80", "jsCall_viiid_81", "jsCall_viiid_82", "jsCall_viiid_83", "jsCall_viiid_84", "jsCall_viiid_85", "jsCall_viiid_86", "jsCall_viiid_87", "jsCall_viiid_88", "jsCall_viiid_89", "jsCall_viiid_90", "jsCall_viiid_91", "jsCall_viiid_92", "jsCall_viiid_93", "jsCall_viiid_94", "jsCall_viiid_95", "jsCall_viiid_96", "jsCall_viiid_97", "jsCall_viiid_98", "jsCall_viiid_99", 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
var debug_table_viiii = [0, "jsCall_viiii_0", "jsCall_viiii_1", "jsCall_viiii_2", "jsCall_viiii_3", "jsCall_viiii_4", "jsCall_viiii_5", "jsCall_viiii_6", "jsCall_viiii_7", "jsCall_viiii_8", "jsCall_viiii_9", "jsCall_viiii_10", "jsCall_viiii_11", "jsCall_viiii_12", "jsCall_viiii_13", "jsCall_viiii_14", "jsCall_viiii_15", "jsCall_viiii_16", "jsCall_viiii_17", "jsCall_viiii_18", "jsCall_viiii_19", "jsCall_viiii_20", "jsCall_viiii_21", "jsCall_viiii_22", "jsCall_viiii_23", "jsCall_viiii_24", "jsCall_viiii_25", "jsCall_viiii_26", "jsCall_viiii_27", "jsCall_viiii_28", "jsCall_viiii_29", "jsCall_viiii_30", "jsCall_viiii_31", "jsCall_viiii_32", "jsCall_viiii_33", "jsCall_viiii_34", "jsCall_viiii_35", "jsCall_viiii_36", "jsCall_viiii_37", "jsCall_viiii_38", "jsCall_viiii_39", "jsCall_viiii_40", "jsCall_viiii_41", "jsCall_viiii_42", "jsCall_viiii_43", "jsCall_viiii_44", "jsCall_viiii_45", "jsCall_viiii_46", "jsCall_viiii_47", "jsCall_viiii_48", "jsCall_viiii_49", "jsCall_viiii_50", "jsCall_viiii_51", "jsCall_viiii_52", "jsCall_viiii_53", "jsCall_viiii_54", "jsCall_viiii_55", "jsCall_viiii_56", "jsCall_viiii_57", "jsCall_viiii_58", "jsCall_viiii_59", "jsCall_viiii_60", "jsCall_viiii_61", "jsCall_viiii_62", "jsCall_viiii_63", "jsCall_viiii_64", "jsCall_viiii_65", "jsCall_viiii_66", "jsCall_viiii_67", "jsCall_viiii_68", "jsCall_viiii_69", "jsCall_viiii_70", "jsCall_viiii_71", "jsCall_viiii_72", "jsCall_viiii_73", "jsCall_viiii_74", "jsCall_viiii_75", "jsCall_viiii_76", "jsCall_viiii_77", "jsCall_viiii_78", "jsCall_viiii_79", "jsCall_viiii_80", "jsCall_viiii_81", "jsCall_viiii_82", "jsCall_viiii_83", "jsCall_viiii_84", "jsCall_viiii_85", "jsCall_viiii_86", "jsCall_viiii_87", "jsCall_viiii_88", "jsCall_viiii_89", "jsCall_viiii_90", "jsCall_viiii_91", "jsCall_viiii_92", "jsCall_viiii_93", "jsCall_viiii_94", "jsCall_viiii_95", "jsCall_viiii_96", "jsCall_viiii_97", "jsCall_viiii_98", "jsCall_viiii_99", "_planar_rgb9le_to_y", "_planar_rgb10le_to_a", "_planar_rgb10le_to_y", "_planar_rgb12le_to_a", "_planar_rgb12le_to_y", "_planar_rgb14le_to_y", "_planar_rgb16le_to_a", "_planar_rgb16le_to_y", "_planar_rgb9be_to_y", "_planar_rgb10be_to_a", "_planar_rgb10be_to_y", "_planar_rgb12be_to_a", "_planar_rgb12be_to_y", "_planar_rgb14be_to_y", "_planar_rgb16be_to_a", "_planar_rgb16be_to_y", "_planar_rgb_to_a", "_planar_rgb_to_y", "_gray8aToPacked32", "_gray8aToPacked32_1", "_gray8aToPacked24", "_sws_convertPalette8ToPacked32", "_sws_convertPalette8ToPacked24", "_intra_pred_2_9", "_intra_pred_3_9", "_intra_pred_4_9", "_intra_pred_5_9", "_pred_planar_0_9", "_pred_planar_1_9", "_pred_planar_2_9", "_pred_planar_3_9", "_intra_pred_2_10", "_intra_pred_3_10", "_intra_pred_4_10", "_intra_pred_5_10", "_pred_planar_0_10", "_pred_planar_1_10", "_pred_planar_2_10", "_pred_planar_3_10", "_intra_pred_2_12", "_intra_pred_3_12", "_intra_pred_4_12", "_intra_pred_5_12", "_pred_planar_0_12", "_pred_planar_1_12", "_pred_planar_2_12", "_pred_planar_3_12", "_intra_pred_2_8", "_intra_pred_3_8", "_intra_pred_4_8", "_intra_pred_5_8", "_pred_planar_0_8", "_pred_planar_1_8", "_pred_planar_2_8", "_pred_planar_3_8", "_apply_tns", "_windowing_and_mdct_ltp", "_h264_v_loop_filter_luma_intra_9_c", "_h264_h_loop_filter_luma_intra_9_c", "_h264_h_loop_filter_luma_mbaff_intra_9_c", "_h264_v_loop_filter_chroma_intra_9_c", "_h264_h_loop_filter_chroma_intra_9_c", "_h264_h_loop_filter_chroma422_intra_9_c", "_h264_h_loop_filter_chroma_mbaff_intra_9_c", "_h264_h_loop_filter_chroma422_mbaff_intra_9_c", "_h264_v_loop_filter_luma_intra_10_c", "_h264_h_loop_filter_luma_intra_10_c", "_h264_h_loop_filter_luma_mbaff_intra_10_c", "_h264_v_loop_filter_chroma_intra_10_c", "_h264_h_loop_filter_chroma_intra_10_c", "_h264_h_loop_filter_chroma422_intra_10_c", "_h264_h_loop_filter_chroma_mbaff_intra_10_c", "_h264_h_loop_filter_chroma422_mbaff_intra_10_c", "_h264_v_loop_filter_luma_intra_12_c", "_h264_h_loop_filter_luma_intra_12_c", "_h264_h_loop_filter_luma_mbaff_intra_12_c", "_h264_v_loop_filter_chroma_intra_12_c", "_h264_h_loop_filter_chroma_intra_12_c", "_h264_h_loop_filter_chroma422_intra_12_c", "_h264_h_loop_filter_chroma_mbaff_intra_12_c", "_h264_h_loop_filter_chroma422_mbaff_intra_12_c", "_h264_v_loop_filter_luma_intra_14_c", "_h264_h_loop_filter_luma_intra_14_c", "_h264_h_loop_filter_luma_mbaff_intra_14_c", "_h264_v_loop_filter_chroma_intra_14_c", "_h264_h_loop_filter_chroma_intra_14_c", "_h264_h_loop_filter_chroma422_intra_14_c", "_h264_h_loop_filter_chroma_mbaff_intra_14_c", "_h264_h_loop_filter_chroma422_mbaff_intra_14_c", "_h264_v_loop_filter_luma_intra_8_c", "_h264_h_loop_filter_luma_intra_8_c", "_h264_h_loop_filter_luma_mbaff_intra_8_c", "_h264_v_loop_filter_chroma_intra_8_c", "_h264_h_loop_filter_chroma_intra_8_c", "_h264_h_loop_filter_chroma422_intra_8_c", "_h264_h_loop_filter_chroma_mbaff_intra_8_c", "_h264_h_loop_filter_chroma422_mbaff_intra_8_c", "_fft15_c", "_mdct15", "_imdct15_half", "_ps_mul_pair_single_c", "_ps_hybrid_analysis_ileave_c", "_ps_hybrid_synthesis_deint_c", "_vector_fmul_c", "_vector_dmul_c", "_vector_fmul_reverse_c", "_av_log_default_callback", "_mix6to2_s16", "_mix8to2_s16", "_mix6to2_clip_s16", "_mix8to2_clip_s16", "_mix6to2_float", "_mix8to2_float", "_mix6to2_double", "_mix8to2_double", "_mix6to2_s32", "_mix8to2_s32", 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
var debug_table_viiiifii = [0, "jsCall_viiiifii_0", "jsCall_viiiifii_1", "jsCall_viiiifii_2", "jsCall_viiiifii_3", "jsCall_viiiifii_4", "jsCall_viiiifii_5", "jsCall_viiiifii_6", "jsCall_viiiifii_7", "jsCall_viiiifii_8", "jsCall_viiiifii_9", "jsCall_viiiifii_10", "jsCall_viiiifii_11", "jsCall_viiiifii_12", "jsCall_viiiifii_13", "jsCall_viiiifii_14", "jsCall_viiiifii_15", "jsCall_viiiifii_16", "jsCall_viiiifii_17", "jsCall_viiiifii_18", "jsCall_viiiifii_19", "jsCall_viiiifii_20", "jsCall_viiiifii_21", "jsCall_viiiifii_22", "jsCall_viiiifii_23", "jsCall_viiiifii_24", "jsCall_viiiifii_25", "jsCall_viiiifii_26", "jsCall_viiiifii_27", "jsCall_viiiifii_28", "jsCall_viiiifii_29", "jsCall_viiiifii_30", "jsCall_viiiifii_31", "jsCall_viiiifii_32", "jsCall_viiiifii_33", "jsCall_viiiifii_34", "jsCall_viiiifii_35", "jsCall_viiiifii_36", "jsCall_viiiifii_37", "jsCall_viiiifii_38", "jsCall_viiiifii_39", "jsCall_viiiifii_40", "jsCall_viiiifii_41", "jsCall_viiiifii_42", "jsCall_viiiifii_43", "jsCall_viiiifii_44", "jsCall_viiiifii_45", "jsCall_viiiifii_46", "jsCall_viiiifii_47", "jsCall_viiiifii_48", "jsCall_viiiifii_49", "jsCall_viiiifii_50", "jsCall_viiiifii_51", "jsCall_viiiifii_52", "jsCall_viiiifii_53", "jsCall_viiiifii_54", "jsCall_viiiifii_55", "jsCall_viiiifii_56", "jsCall_viiiifii_57", "jsCall_viiiifii_58", "jsCall_viiiifii_59", "jsCall_viiiifii_60", "jsCall_viiiifii_61", "jsCall_viiiifii_62", "jsCall_viiiifii_63", "jsCall_viiiifii_64", "jsCall_viiiifii_65", "jsCall_viiiifii_66", "jsCall_viiiifii_67", "jsCall_viiiifii_68", "jsCall_viiiifii_69", "jsCall_viiiifii_70", "jsCall_viiiifii_71", "jsCall_viiiifii_72", "jsCall_viiiifii_73", "jsCall_viiiifii_74", "jsCall_viiiifii_75", "jsCall_viiiifii_76", "jsCall_viiiifii_77", "jsCall_viiiifii_78", "jsCall_viiiifii_79", "jsCall_viiiifii_80", "jsCall_viiiifii_81", "jsCall_viiiifii_82", "jsCall_viiiifii_83", "jsCall_viiiifii_84", "jsCall_viiiifii_85", "jsCall_viiiifii_86", "jsCall_viiiifii_87", "jsCall_viiiifii_88", "jsCall_viiiifii_89", "jsCall_viiiifii_90", "jsCall_viiiifii_91", "jsCall_viiiifii_92", "jsCall_viiiifii_93", "jsCall_viiiifii_94", "jsCall_viiiifii_95", "jsCall_viiiifii_96", "jsCall_viiiifii_97", "jsCall_viiiifii_98", "jsCall_viiiifii_99", "_sbr_hf_gen_c", 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
var debug_table_viiiii = [0, "jsCall_viiiii_0", "jsCall_viiiii_1", "jsCall_viiiii_2", "jsCall_viiiii_3", "jsCall_viiiii_4", "jsCall_viiiii_5", "jsCall_viiiii_6", "jsCall_viiiii_7", "jsCall_viiiii_8", "jsCall_viiiii_9", "jsCall_viiiii_10", "jsCall_viiiii_11", "jsCall_viiiii_12", "jsCall_viiiii_13", "jsCall_viiiii_14", "jsCall_viiiii_15", "jsCall_viiiii_16", "jsCall_viiiii_17", "jsCall_viiiii_18", "jsCall_viiiii_19", "jsCall_viiiii_20", "jsCall_viiiii_21", "jsCall_viiiii_22", "jsCall_viiiii_23", "jsCall_viiiii_24", "jsCall_viiiii_25", "jsCall_viiiii_26", "jsCall_viiiii_27", "jsCall_viiiii_28", "jsCall_viiiii_29", "jsCall_viiiii_30", "jsCall_viiiii_31", "jsCall_viiiii_32", "jsCall_viiiii_33", "jsCall_viiiii_34", "jsCall_viiiii_35", "jsCall_viiiii_36", "jsCall_viiiii_37", "jsCall_viiiii_38", "jsCall_viiiii_39", "jsCall_viiiii_40", "jsCall_viiiii_41", "jsCall_viiiii_42", "jsCall_viiiii_43", "jsCall_viiiii_44", "jsCall_viiiii_45", "jsCall_viiiii_46", "jsCall_viiiii_47", "jsCall_viiiii_48", "jsCall_viiiii_49", "jsCall_viiiii_50", "jsCall_viiiii_51", "jsCall_viiiii_52", "jsCall_viiiii_53", "jsCall_viiiii_54", "jsCall_viiiii_55", "jsCall_viiiii_56", "jsCall_viiiii_57", "jsCall_viiiii_58", "jsCall_viiiii_59", "jsCall_viiiii_60", "jsCall_viiiii_61", "jsCall_viiiii_62", "jsCall_viiiii_63", "jsCall_viiiii_64", "jsCall_viiiii_65", "jsCall_viiiii_66", "jsCall_viiiii_67", "jsCall_viiiii_68", "jsCall_viiiii_69", "jsCall_viiiii_70", "jsCall_viiiii_71", "jsCall_viiiii_72", "jsCall_viiiii_73", "jsCall_viiiii_74", "jsCall_viiiii_75", "jsCall_viiiii_76", "jsCall_viiiii_77", "jsCall_viiiii_78", "jsCall_viiiii_79", "jsCall_viiiii_80", "jsCall_viiiii_81", "jsCall_viiiii_82", "jsCall_viiiii_83", "jsCall_viiiii_84", "jsCall_viiiii_85", "jsCall_viiiii_86", "jsCall_viiiii_87", "jsCall_viiiii_88", "jsCall_viiiii_89", "jsCall_viiiii_90", "jsCall_viiiii_91", "jsCall_viiiii_92", "jsCall_viiiii_93", "jsCall_viiiii_94", "jsCall_viiiii_95", "jsCall_viiiii_96", "jsCall_viiiii_97", "jsCall_viiiii_98", "jsCall_viiiii_99", "_conv_AV_SAMPLE_FMT_U8_to_AV_SAMPLE_FMT_U8", "_conv_AV_SAMPLE_FMT_U8_to_AV_SAMPLE_FMT_S16", "_conv_AV_SAMPLE_FMT_U8_to_AV_SAMPLE_FMT_S32", "_conv_AV_SAMPLE_FMT_U8_to_AV_SAMPLE_FMT_FLT", "_conv_AV_SAMPLE_FMT_U8_to_AV_SAMPLE_FMT_DBL", "_conv_AV_SAMPLE_FMT_U8_to_AV_SAMPLE_FMT_S64", "_conv_AV_SAMPLE_FMT_S16_to_AV_SAMPLE_FMT_U8", "_conv_AV_SAMPLE_FMT_S16_to_AV_SAMPLE_FMT_S16", "_conv_AV_SAMPLE_FMT_S16_to_AV_SAMPLE_FMT_S32", "_conv_AV_SAMPLE_FMT_S16_to_AV_SAMPLE_FMT_FLT", "_conv_AV_SAMPLE_FMT_S16_to_AV_SAMPLE_FMT_DBL", "_conv_AV_SAMPLE_FMT_S16_to_AV_SAMPLE_FMT_S64", "_conv_AV_SAMPLE_FMT_S32_to_AV_SAMPLE_FMT_U8", "_conv_AV_SAMPLE_FMT_S32_to_AV_SAMPLE_FMT_S16", "_conv_AV_SAMPLE_FMT_S32_to_AV_SAMPLE_FMT_S32", "_conv_AV_SAMPLE_FMT_S32_to_AV_SAMPLE_FMT_FLT", "_conv_AV_SAMPLE_FMT_S32_to_AV_SAMPLE_FMT_DBL", "_conv_AV_SAMPLE_FMT_S32_to_AV_SAMPLE_FMT_S64", "_conv_AV_SAMPLE_FMT_FLT_to_AV_SAMPLE_FMT_U8", "_conv_AV_SAMPLE_FMT_FLT_to_AV_SAMPLE_FMT_S16", "_conv_AV_SAMPLE_FMT_FLT_to_AV_SAMPLE_FMT_S32", "_conv_AV_SAMPLE_FMT_FLT_to_AV_SAMPLE_FMT_FLT", "_conv_AV_SAMPLE_FMT_FLT_to_AV_SAMPLE_FMT_DBL", "_conv_AV_SAMPLE_FMT_FLT_to_AV_SAMPLE_FMT_S64", "_conv_AV_SAMPLE_FMT_DBL_to_AV_SAMPLE_FMT_U8", "_conv_AV_SAMPLE_FMT_DBL_to_AV_SAMPLE_FMT_S16", "_conv_AV_SAMPLE_FMT_DBL_to_AV_SAMPLE_FMT_S32", "_conv_AV_SAMPLE_FMT_DBL_to_AV_SAMPLE_FMT_FLT", "_conv_AV_SAMPLE_FMT_DBL_to_AV_SAMPLE_FMT_DBL", "_conv_AV_SAMPLE_FMT_DBL_to_AV_SAMPLE_FMT_S64", "_conv_AV_SAMPLE_FMT_S64_to_AV_SAMPLE_FMT_U8", "_conv_AV_SAMPLE_FMT_S64_to_AV_SAMPLE_FMT_S16", "_conv_AV_SAMPLE_FMT_S64_to_AV_SAMPLE_FMT_S32", "_conv_AV_SAMPLE_FMT_S64_to_AV_SAMPLE_FMT_FLT", "_conv_AV_SAMPLE_FMT_S64_to_AV_SAMPLE_FMT_DBL", "_conv_AV_SAMPLE_FMT_S64_to_AV_SAMPLE_FMT_S64", "_planar_rgb9le_to_uv", "_planar_rgb10le_to_uv", "_planar_rgb12le_to_uv", "_planar_rgb14le_to_uv", "_planar_rgb16le_to_uv", "_planar_rgb9be_to_uv", "_planar_rgb10be_to_uv", "_planar_rgb12be_to_uv", "_planar_rgb14be_to_uv", "_planar_rgb16be_to_uv", "_planar_rgb_to_uv", "_yuv2p010l1_LE_c", "_yuv2p010l1_BE_c", "_yuv2plane1_16LE_c", "_yuv2plane1_16BE_c", "_yuv2plane1_9LE_c", "_yuv2plane1_9BE_c", "_yuv2plane1_10LE_c", "_yuv2plane1_10BE_c", "_yuv2plane1_12LE_c", "_yuv2plane1_12BE_c", "_yuv2plane1_14LE_c", "_yuv2plane1_14BE_c", "_yuv2plane1_floatBE_c", "_yuv2plane1_floatLE_c", "_yuv2plane1_8_c", "_bayer_bggr8_to_rgb24_copy", "_bayer_bggr8_to_rgb24_interpolate", "_bayer_bggr16le_to_rgb24_copy", "_bayer_bggr16le_to_rgb24_interpolate", "_bayer_bggr16be_to_rgb24_copy", "_bayer_bggr16be_to_rgb24_interpolate", "_bayer_rggb8_to_rgb24_copy", "_bayer_rggb8_to_rgb24_interpolate", "_bayer_rggb16le_to_rgb24_copy", "_bayer_rggb16le_to_rgb24_interpolate", "_bayer_rggb16be_to_rgb24_copy", "_bayer_rggb16be_to_rgb24_interpolate", "_bayer_gbrg8_to_rgb24_copy", "_bayer_gbrg8_to_rgb24_interpolate", "_bayer_gbrg16le_to_rgb24_copy", "_bayer_gbrg16le_to_rgb24_interpolate", "_bayer_gbrg16be_to_rgb24_copy", "_bayer_gbrg16be_to_rgb24_interpolate", "_bayer_grbg8_to_rgb24_copy", "_bayer_grbg8_to_rgb24_interpolate", "_bayer_grbg16le_to_rgb24_copy", "_bayer_grbg16le_to_rgb24_interpolate", "_bayer_grbg16be_to_rgb24_copy", "_bayer_grbg16be_to_rgb24_interpolate", "_hevc_h_loop_filter_chroma_9", "_hevc_v_loop_filter_chroma_9", "_hevc_h_loop_filter_chroma_10", "_hevc_v_loop_filter_chroma_10", "_hevc_h_loop_filter_chroma_12", "_hevc_v_loop_filter_chroma_12", "_hevc_h_loop_filter_chroma_8", "_hevc_v_loop_filter_chroma_8", "_ff_mpadsp_apply_window_float", "_ff_mpadsp_apply_window_fixed", "_worker_func", "_sbr_hf_assemble", "_sbr_hf_inverse_filter", "_ff_h264_idct_add16_9_c", "_ff_h264_idct8_add4_9_c", "_ff_h264_idct_add8_9_c", "_ff_h264_idct_add8_422_9_c", "_ff_h264_idct_add16intra_9_c", "_h264_v_loop_filter_luma_9_c", "_h264_h_loop_filter_luma_9_c", "_h264_h_loop_filter_luma_mbaff_9_c", "_h264_v_loop_filter_chroma_9_c", "_h264_h_loop_filter_chroma_9_c", "_h264_h_loop_filter_chroma422_9_c", "_h264_h_loop_filter_chroma_mbaff_9_c", "_h264_h_loop_filter_chroma422_mbaff_9_c", "_ff_h264_idct_add16_10_c", "_ff_h264_idct8_add4_10_c", "_ff_h264_idct_add8_10_c", "_ff_h264_idct_add8_422_10_c", "_ff_h264_idct_add16intra_10_c", "_h264_v_loop_filter_luma_10_c", "_h264_h_loop_filter_luma_10_c", "_h264_h_loop_filter_luma_mbaff_10_c", "_h264_v_loop_filter_chroma_10_c", "_h264_h_loop_filter_chroma_10_c", "_h264_h_loop_filter_chroma422_10_c", "_h264_h_loop_filter_chroma_mbaff_10_c", "_h264_h_loop_filter_chroma422_mbaff_10_c", "_ff_h264_idct_add16_12_c", "_ff_h264_idct8_add4_12_c", "_ff_h264_idct_add8_12_c", "_ff_h264_idct_add8_422_12_c", "_ff_h264_idct_add16intra_12_c", "_h264_v_loop_filter_luma_12_c", "_h264_h_loop_filter_luma_12_c", "_h264_h_loop_filter_luma_mbaff_12_c", "_h264_v_loop_filter_chroma_12_c", "_h264_h_loop_filter_chroma_12_c", "_h264_h_loop_filter_chroma422_12_c", "_h264_h_loop_filter_chroma_mbaff_12_c", "_h264_h_loop_filter_chroma422_mbaff_12_c", "_ff_h264_idct_add16_14_c", "_ff_h264_idct8_add4_14_c", "_ff_h264_idct_add8_14_c", "_ff_h264_idct_add8_422_14_c", "_ff_h264_idct_add16intra_14_c", "_h264_v_loop_filter_luma_14_c", "_h264_h_loop_filter_luma_14_c", "_h264_h_loop_filter_luma_mbaff_14_c", "_h264_v_loop_filter_chroma_14_c", "_h264_h_loop_filter_chroma_14_c", "_h264_h_loop_filter_chroma422_14_c", "_h264_h_loop_filter_chroma_mbaff_14_c", "_h264_h_loop_filter_chroma422_mbaff_14_c", "_ff_h264_idct_add16_8_c", "_ff_h264_idct8_add4_8_c", "_ff_h264_idct_add8_8_c", "_ff_h264_idct_add8_422_8_c", "_ff_h264_idct_add16intra_8_c", "_h264_v_loop_filter_luma_8_c", "_h264_h_loop_filter_luma_8_c", "_h264_h_loop_filter_luma_mbaff_8_c", "_h264_v_loop_filter_chroma_8_c", "_h264_h_loop_filter_chroma_8_c", "_h264_h_loop_filter_chroma422_8_c", "_h264_h_loop_filter_chroma_mbaff_8_c", "_h264_h_loop_filter_chroma422_mbaff_8_c", "_postrotate_c", "_sbr_hf_g_filt_c", "_ps_hybrid_analysis_c", "_ps_stereo_interpolate_c", "_ps_stereo_interpolate_ipdopd_c", "_vector_fmul_window_c", "_vector_fmul_add_c", "_copy_s16", "_copy_clip_s16", "_copy_float", "_copy_double", "_copy_s32", 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
var debug_table_viiiiidd = [0, "jsCall_viiiiidd_0", "jsCall_viiiiidd_1", "jsCall_viiiiidd_2", "jsCall_viiiiidd_3", "jsCall_viiiiidd_4", "jsCall_viiiiidd_5", "jsCall_viiiiidd_6", "jsCall_viiiiidd_7", "jsCall_viiiiidd_8", "jsCall_viiiiidd_9", "jsCall_viiiiidd_10", "jsCall_viiiiidd_11", "jsCall_viiiiidd_12", "jsCall_viiiiidd_13", "jsCall_viiiiidd_14", "jsCall_viiiiidd_15", "jsCall_viiiiidd_16", "jsCall_viiiiidd_17", "jsCall_viiiiidd_18", "jsCall_viiiiidd_19", "jsCall_viiiiidd_20", "jsCall_viiiiidd_21", "jsCall_viiiiidd_22", "jsCall_viiiiidd_23", "jsCall_viiiiidd_24", "jsCall_viiiiidd_25", "jsCall_viiiiidd_26", "jsCall_viiiiidd_27", "jsCall_viiiiidd_28", "jsCall_viiiiidd_29", "jsCall_viiiiidd_30", "jsCall_viiiiidd_31", "jsCall_viiiiidd_32", "jsCall_viiiiidd_33", "jsCall_viiiiidd_34", "jsCall_viiiiidd_35", "jsCall_viiiiidd_36", "jsCall_viiiiidd_37", "jsCall_viiiiidd_38", "jsCall_viiiiidd_39", "jsCall_viiiiidd_40", "jsCall_viiiiidd_41", "jsCall_viiiiidd_42", "jsCall_viiiiidd_43", "jsCall_viiiiidd_44", "jsCall_viiiiidd_45", "jsCall_viiiiidd_46", "jsCall_viiiiidd_47", "jsCall_viiiiidd_48", "jsCall_viiiiidd_49", "jsCall_viiiiidd_50", "jsCall_viiiiidd_51", "jsCall_viiiiidd_52", "jsCall_viiiiidd_53", "jsCall_viiiiidd_54", "jsCall_viiiiidd_55", "jsCall_viiiiidd_56", "jsCall_viiiiidd_57", "jsCall_viiiiidd_58", "jsCall_viiiiidd_59", "jsCall_viiiiidd_60", "jsCall_viiiiidd_61", "jsCall_viiiiidd_62", "jsCall_viiiiidd_63", "jsCall_viiiiidd_64", "jsCall_viiiiidd_65", "jsCall_viiiiidd_66", "jsCall_viiiiidd_67", "jsCall_viiiiidd_68", "jsCall_viiiiidd_69", "jsCall_viiiiidd_70", "jsCall_viiiiidd_71", "jsCall_viiiiidd_72", "jsCall_viiiiidd_73", "jsCall_viiiiidd_74", "jsCall_viiiiidd_75", "jsCall_viiiiidd_76", "jsCall_viiiiidd_77", "jsCall_viiiiidd_78", "jsCall_viiiiidd_79", "jsCall_viiiiidd_80", "jsCall_viiiiidd_81", "jsCall_viiiiidd_82", "jsCall_viiiiidd_83", "jsCall_viiiiidd_84", "jsCall_viiiiidd_85", "jsCall_viiiiidd_86", "jsCall_viiiiidd_87", "jsCall_viiiiidd_88", "jsCall_viiiiidd_89", "jsCall_viiiiidd_90", "jsCall_viiiiidd_91", "jsCall_viiiiidd_92", "jsCall_viiiiidd_93", "jsCall_viiiiidd_94", "jsCall_viiiiidd_95", "jsCall_viiiiidd_96", "jsCall_viiiiidd_97", "jsCall_viiiiidd_98", "jsCall_viiiiidd_99", 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
var debug_table_viiiiiddi = [0, "jsCall_viiiiiddi_0", "jsCall_viiiiiddi_1", "jsCall_viiiiiddi_2", "jsCall_viiiiiddi_3", "jsCall_viiiiiddi_4", "jsCall_viiiiiddi_5", "jsCall_viiiiiddi_6", "jsCall_viiiiiddi_7", "jsCall_viiiiiddi_8", "jsCall_viiiiiddi_9", "jsCall_viiiiiddi_10", "jsCall_viiiiiddi_11", "jsCall_viiiiiddi_12", "jsCall_viiiiiddi_13", "jsCall_viiiiiddi_14", "jsCall_viiiiiddi_15", "jsCall_viiiiiddi_16", "jsCall_viiiiiddi_17", "jsCall_viiiiiddi_18", "jsCall_viiiiiddi_19", "jsCall_viiiiiddi_20", "jsCall_viiiiiddi_21", "jsCall_viiiiiddi_22", "jsCall_viiiiiddi_23", "jsCall_viiiiiddi_24", "jsCall_viiiiiddi_25", "jsCall_viiiiiddi_26", "jsCall_viiiiiddi_27", "jsCall_viiiiiddi_28", "jsCall_viiiiiddi_29", "jsCall_viiiiiddi_30", "jsCall_viiiiiddi_31", "jsCall_viiiiiddi_32", "jsCall_viiiiiddi_33", "jsCall_viiiiiddi_34", "jsCall_viiiiiddi_35", "jsCall_viiiiiddi_36", "jsCall_viiiiiddi_37", "jsCall_viiiiiddi_38", "jsCall_viiiiiddi_39", "jsCall_viiiiiddi_40", "jsCall_viiiiiddi_41", "jsCall_viiiiiddi_42", "jsCall_viiiiiddi_43", "jsCall_viiiiiddi_44", "jsCall_viiiiiddi_45", "jsCall_viiiiiddi_46", "jsCall_viiiiiddi_47", "jsCall_viiiiiddi_48", "jsCall_viiiiiddi_49", "jsCall_viiiiiddi_50", "jsCall_viiiiiddi_51", "jsCall_viiiiiddi_52", "jsCall_viiiiiddi_53", "jsCall_viiiiiddi_54", "jsCall_viiiiiddi_55", "jsCall_viiiiiddi_56", "jsCall_viiiiiddi_57", "jsCall_viiiiiddi_58", "jsCall_viiiiiddi_59", "jsCall_viiiiiddi_60", "jsCall_viiiiiddi_61", "jsCall_viiiiiddi_62", "jsCall_viiiiiddi_63", "jsCall_viiiiiddi_64", "jsCall_viiiiiddi_65", "jsCall_viiiiiddi_66", "jsCall_viiiiiddi_67", "jsCall_viiiiiddi_68", "jsCall_viiiiiddi_69", "jsCall_viiiiiddi_70", "jsCall_viiiiiddi_71", "jsCall_viiiiiddi_72", "jsCall_viiiiiddi_73", "jsCall_viiiiiddi_74", "jsCall_viiiiiddi_75", "jsCall_viiiiiddi_76", "jsCall_viiiiiddi_77", "jsCall_viiiiiddi_78", "jsCall_viiiiiddi_79", "jsCall_viiiiiddi_80", "jsCall_viiiiiddi_81", "jsCall_viiiiiddi_82", "jsCall_viiiiiddi_83", "jsCall_viiiiiddi_84", "jsCall_viiiiiddi_85", "jsCall_viiiiiddi_86", "jsCall_viiiiiddi_87", "jsCall_viiiiiddi_88", "jsCall_viiiiiddi_89", "jsCall_viiiiiddi_90", "jsCall_viiiiiddi_91", "jsCall_viiiiiddi_92", "jsCall_viiiiiddi_93", "jsCall_viiiiiddi_94", "jsCall_viiiiiddi_95", "jsCall_viiiiiddi_96", "jsCall_viiiiiddi_97", "jsCall_viiiiiddi_98", "jsCall_viiiiiddi_99", 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
var debug_table_viiiiii = [0, "jsCall_viiiiii_0", "jsCall_viiiiii_1", "jsCall_viiiiii_2", "jsCall_viiiiii_3", "jsCall_viiiiii_4", "jsCall_viiiiii_5", "jsCall_viiiiii_6", "jsCall_viiiiii_7", "jsCall_viiiiii_8", "jsCall_viiiiii_9", "jsCall_viiiiii_10", "jsCall_viiiiii_11", "jsCall_viiiiii_12", "jsCall_viiiiii_13", "jsCall_viiiiii_14", "jsCall_viiiiii_15", "jsCall_viiiiii_16", "jsCall_viiiiii_17", "jsCall_viiiiii_18", "jsCall_viiiiii_19", "jsCall_viiiiii_20", "jsCall_viiiiii_21", "jsCall_viiiiii_22", "jsCall_viiiiii_23", "jsCall_viiiiii_24", "jsCall_viiiiii_25", "jsCall_viiiiii_26", "jsCall_viiiiii_27", "jsCall_viiiiii_28", "jsCall_viiiiii_29", "jsCall_viiiiii_30", "jsCall_viiiiii_31", "jsCall_viiiiii_32", "jsCall_viiiiii_33", "jsCall_viiiiii_34", "jsCall_viiiiii_35", "jsCall_viiiiii_36", "jsCall_viiiiii_37", "jsCall_viiiiii_38", "jsCall_viiiiii_39", "jsCall_viiiiii_40", "jsCall_viiiiii_41", "jsCall_viiiiii_42", "jsCall_viiiiii_43", "jsCall_viiiiii_44", "jsCall_viiiiii_45", "jsCall_viiiiii_46", "jsCall_viiiiii_47", "jsCall_viiiiii_48", "jsCall_viiiiii_49", "jsCall_viiiiii_50", "jsCall_viiiiii_51", "jsCall_viiiiii_52", "jsCall_viiiiii_53", "jsCall_viiiiii_54", "jsCall_viiiiii_55", "jsCall_viiiiii_56", "jsCall_viiiiii_57", "jsCall_viiiiii_58", "jsCall_viiiiii_59", "jsCall_viiiiii_60", "jsCall_viiiiii_61", "jsCall_viiiiii_62", "jsCall_viiiiii_63", "jsCall_viiiiii_64", "jsCall_viiiiii_65", "jsCall_viiiiii_66", "jsCall_viiiiii_67", "jsCall_viiiiii_68", "jsCall_viiiiii_69", "jsCall_viiiiii_70", "jsCall_viiiiii_71", "jsCall_viiiiii_72", "jsCall_viiiiii_73", "jsCall_viiiiii_74", "jsCall_viiiiii_75", "jsCall_viiiiii_76", "jsCall_viiiiii_77", "jsCall_viiiiii_78", "jsCall_viiiiii_79", "jsCall_viiiiii_80", "jsCall_viiiiii_81", "jsCall_viiiiii_82", "jsCall_viiiiii_83", "jsCall_viiiiii_84", "jsCall_viiiiii_85", "jsCall_viiiiii_86", "jsCall_viiiiii_87", "jsCall_viiiiii_88", "jsCall_viiiiii_89", "jsCall_viiiiii_90", "jsCall_viiiiii_91", "jsCall_viiiiii_92", "jsCall_viiiiii_93", "jsCall_viiiiii_94", "jsCall_viiiiii_95", "jsCall_viiiiii_96", "jsCall_viiiiii_97", "jsCall_viiiiii_98", "jsCall_viiiiii_99", "_read_geobtag", "_read_apic", "_read_chapter", "_read_priv", "_ff_hyscale_fast_c", "_bswap16Y_c", "_read_ya16le_gray_c", "_read_ya16be_gray_c", "_read_ayuv64le_Y_c", "_yuy2ToY_c", "_uyvyToY_c", "_bgr24ToY_c", "_bgr16leToY_c", "_bgr16beToY_c", "_bgr15leToY_c", "_bgr15beToY_c", "_bgr12leToY_c", "_bgr12beToY_c", "_rgb24ToY_c", "_rgb16leToY_c", "_rgb16beToY_c", "_rgb15leToY_c", "_rgb15beToY_c", "_rgb12leToY_c", "_rgb12beToY_c", "_palToY_c", "_monoblack2Y_c", "_monowhite2Y_c", "_bgr32ToY_c", "_bgr321ToY_c", "_rgb32ToY_c", "_rgb321ToY_c", "_rgb48BEToY_c", "_rgb48LEToY_c", "_bgr48BEToY_c", "_bgr48LEToY_c", "_rgb64BEToY_c", "_rgb64LEToY_c", "_bgr64BEToY_c", "_bgr64LEToY_c", "_p010LEToY_c", "_p010BEToY_c", "_grayf32ToY16_c", "_grayf32ToY16_bswap_c", "_rgba64leToA_c", "_rgba64beToA_c", "_rgbaToA_c", "_abgrToA_c", "_read_ya16le_alpha_c", "_read_ya16be_alpha_c", "_read_ayuv64le_A_c", "_palToA_c", "_put_pcm_9", "_hevc_h_loop_filter_luma_9", "_hevc_v_loop_filter_luma_9", "_put_pcm_10", "_hevc_h_loop_filter_luma_10", "_hevc_v_loop_filter_luma_10", "_put_pcm_12", "_hevc_h_loop_filter_luma_12", "_hevc_v_loop_filter_luma_12", "_put_pcm_8", "_hevc_h_loop_filter_luma_8", "_hevc_v_loop_filter_luma_8", "_pred_dc_9", "_pred_angular_0_9", "_pred_angular_1_9", "_pred_angular_2_9", "_pred_angular_3_9", "_pred_dc_10", "_pred_angular_0_10", "_pred_angular_1_10", "_pred_angular_2_10", "_pred_angular_3_10", "_pred_dc_12", "_pred_angular_0_12", "_pred_angular_1_12", "_pred_angular_2_12", "_pred_angular_3_12", "_pred_dc_8", "_pred_angular_0_8", "_pred_angular_1_8", "_pred_angular_2_8", "_pred_angular_3_8", "_ff_imdct36_blocks_float", "_ff_imdct36_blocks_fixed", "_weight_h264_pixels16_9_c", "_weight_h264_pixels8_9_c", "_weight_h264_pixels4_9_c", "_weight_h264_pixels2_9_c", "_weight_h264_pixels16_10_c", "_weight_h264_pixels8_10_c", "_weight_h264_pixels4_10_c", "_weight_h264_pixels2_10_c", "_weight_h264_pixels16_12_c", "_weight_h264_pixels8_12_c", "_weight_h264_pixels4_12_c", "_weight_h264_pixels2_12_c", "_weight_h264_pixels16_14_c", "_weight_h264_pixels8_14_c", "_weight_h264_pixels4_14_c", "_weight_h264_pixels2_14_c", "_weight_h264_pixels16_8_c", "_weight_h264_pixels8_8_c", "_weight_h264_pixels4_8_c", "_weight_h264_pixels2_8_c", "_sbr_hf_apply_noise_0", "_sbr_hf_apply_noise_1", "_sbr_hf_apply_noise_2", "_sbr_hf_apply_noise_3", "_aes_decrypt", "_aes_encrypt", "_image_copy_plane", 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
var debug_table_viiiiiifi = [0, "jsCall_viiiiiifi_0", "jsCall_viiiiiifi_1", "jsCall_viiiiiifi_2", "jsCall_viiiiiifi_3", "jsCall_viiiiiifi_4", "jsCall_viiiiiifi_5", "jsCall_viiiiiifi_6", "jsCall_viiiiiifi_7", "jsCall_viiiiiifi_8", "jsCall_viiiiiifi_9", "jsCall_viiiiiifi_10", "jsCall_viiiiiifi_11", "jsCall_viiiiiifi_12", "jsCall_viiiiiifi_13", "jsCall_viiiiiifi_14", "jsCall_viiiiiifi_15", "jsCall_viiiiiifi_16", "jsCall_viiiiiifi_17", "jsCall_viiiiiifi_18", "jsCall_viiiiiifi_19", "jsCall_viiiiiifi_20", "jsCall_viiiiiifi_21", "jsCall_viiiiiifi_22", "jsCall_viiiiiifi_23", "jsCall_viiiiiifi_24", "jsCall_viiiiiifi_25", "jsCall_viiiiiifi_26", "jsCall_viiiiiifi_27", "jsCall_viiiiiifi_28", "jsCall_viiiiiifi_29", "jsCall_viiiiiifi_30", "jsCall_viiiiiifi_31", "jsCall_viiiiiifi_32", "jsCall_viiiiiifi_33", "jsCall_viiiiiifi_34", "jsCall_viiiiiifi_35", "jsCall_viiiiiifi_36", "jsCall_viiiiiifi_37", "jsCall_viiiiiifi_38", "jsCall_viiiiiifi_39", "jsCall_viiiiiifi_40", "jsCall_viiiiiifi_41", "jsCall_viiiiiifi_42", "jsCall_viiiiiifi_43", "jsCall_viiiiiifi_44", "jsCall_viiiiiifi_45", "jsCall_viiiiiifi_46", "jsCall_viiiiiifi_47", "jsCall_viiiiiifi_48", "jsCall_viiiiiifi_49", "jsCall_viiiiiifi_50", "jsCall_viiiiiifi_51", "jsCall_viiiiiifi_52", "jsCall_viiiiiifi_53", "jsCall_viiiiiifi_54", "jsCall_viiiiiifi_55", "jsCall_viiiiiifi_56", "jsCall_viiiiiifi_57", "jsCall_viiiiiifi_58", "jsCall_viiiiiifi_59", "jsCall_viiiiiifi_60", "jsCall_viiiiiifi_61", "jsCall_viiiiiifi_62", "jsCall_viiiiiifi_63", "jsCall_viiiiiifi_64", "jsCall_viiiiiifi_65", "jsCall_viiiiiifi_66", "jsCall_viiiiiifi_67", "jsCall_viiiiiifi_68", "jsCall_viiiiiifi_69", "jsCall_viiiiiifi_70", "jsCall_viiiiiifi_71", "jsCall_viiiiiifi_72", "jsCall_viiiiiifi_73", "jsCall_viiiiiifi_74", "jsCall_viiiiiifi_75", "jsCall_viiiiiifi_76", "jsCall_viiiiiifi_77", "jsCall_viiiiiifi_78", "jsCall_viiiiiifi_79", "jsCall_viiiiiifi_80", "jsCall_viiiiiifi_81", "jsCall_viiiiiifi_82", "jsCall_viiiiiifi_83", "jsCall_viiiiiifi_84", "jsCall_viiiiiifi_85", "jsCall_viiiiiifi_86", "jsCall_viiiiiifi_87", "jsCall_viiiiiifi_88", "jsCall_viiiiiifi_89", "jsCall_viiiiiifi_90", "jsCall_viiiiiifi_91", "jsCall_viiiiiifi_92", "jsCall_viiiiiifi_93", "jsCall_viiiiiifi_94", "jsCall_viiiiiifi_95", "jsCall_viiiiiifi_96", "jsCall_viiiiiifi_97", "jsCall_viiiiiifi_98", "jsCall_viiiiiifi_99", "_ps_decorrelate_c", 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
var debug_table_viiiiiii = [0, "jsCall_viiiiiii_0", "jsCall_viiiiiii_1", "jsCall_viiiiiii_2", "jsCall_viiiiiii_3", "jsCall_viiiiiii_4", "jsCall_viiiiiii_5", "jsCall_viiiiiii_6", "jsCall_viiiiiii_7", "jsCall_viiiiiii_8", "jsCall_viiiiiii_9", "jsCall_viiiiiii_10", "jsCall_viiiiiii_11", "jsCall_viiiiiii_12", "jsCall_viiiiiii_13", "jsCall_viiiiiii_14", "jsCall_viiiiiii_15", "jsCall_viiiiiii_16", "jsCall_viiiiiii_17", "jsCall_viiiiiii_18", "jsCall_viiiiiii_19", "jsCall_viiiiiii_20", "jsCall_viiiiiii_21", "jsCall_viiiiiii_22", "jsCall_viiiiiii_23", "jsCall_viiiiiii_24", "jsCall_viiiiiii_25", "jsCall_viiiiiii_26", "jsCall_viiiiiii_27", "jsCall_viiiiiii_28", "jsCall_viiiiiii_29", "jsCall_viiiiiii_30", "jsCall_viiiiiii_31", "jsCall_viiiiiii_32", "jsCall_viiiiiii_33", "jsCall_viiiiiii_34", "jsCall_viiiiiii_35", "jsCall_viiiiiii_36", "jsCall_viiiiiii_37", "jsCall_viiiiiii_38", "jsCall_viiiiiii_39", "jsCall_viiiiiii_40", "jsCall_viiiiiii_41", "jsCall_viiiiiii_42", "jsCall_viiiiiii_43", "jsCall_viiiiiii_44", "jsCall_viiiiiii_45", "jsCall_viiiiiii_46", "jsCall_viiiiiii_47", "jsCall_viiiiiii_48", "jsCall_viiiiiii_49", "jsCall_viiiiiii_50", "jsCall_viiiiiii_51", "jsCall_viiiiiii_52", "jsCall_viiiiiii_53", "jsCall_viiiiiii_54", "jsCall_viiiiiii_55", "jsCall_viiiiiii_56", "jsCall_viiiiiii_57", "jsCall_viiiiiii_58", "jsCall_viiiiiii_59", "jsCall_viiiiiii_60", "jsCall_viiiiiii_61", "jsCall_viiiiiii_62", "jsCall_viiiiiii_63", "jsCall_viiiiiii_64", "jsCall_viiiiiii_65", "jsCall_viiiiiii_66", "jsCall_viiiiiii_67", "jsCall_viiiiiii_68", "jsCall_viiiiiii_69", "jsCall_viiiiiii_70", "jsCall_viiiiiii_71", "jsCall_viiiiiii_72", "jsCall_viiiiiii_73", "jsCall_viiiiiii_74", "jsCall_viiiiiii_75", "jsCall_viiiiiii_76", "jsCall_viiiiiii_77", "jsCall_viiiiiii_78", "jsCall_viiiiiii_79", "jsCall_viiiiiii_80", "jsCall_viiiiiii_81", "jsCall_viiiiiii_82", "jsCall_viiiiiii_83", "jsCall_viiiiiii_84", "jsCall_viiiiiii_85", "jsCall_viiiiiii_86", "jsCall_viiiiiii_87", "jsCall_viiiiiii_88", "jsCall_viiiiiii_89", "jsCall_viiiiiii_90", "jsCall_viiiiiii_91", "jsCall_viiiiiii_92", "jsCall_viiiiiii_93", "jsCall_viiiiiii_94", "jsCall_viiiiiii_95", "jsCall_viiiiiii_96", "jsCall_viiiiiii_97", "jsCall_viiiiiii_98", "jsCall_viiiiiii_99", "_hScale8To15_c", "_hScale8To19_c", "_hScale16To19_c", "_hScale16To15_c", "_yuy2ToUV_c", "_yvy2ToUV_c", "_uyvyToUV_c", "_nv12ToUV_c", "_nv21ToUV_c", "_palToUV_c", "_bswap16UV_c", "_read_ayuv64le_UV_c", "_p010LEToUV_c", "_p010BEToUV_c", "_p016LEToUV_c", "_p016BEToUV_c", "_gbr24pToUV_half_c", "_rgb64BEToUV_half_c", "_rgb64LEToUV_half_c", "_bgr64BEToUV_half_c", "_bgr64LEToUV_half_c", "_rgb48BEToUV_half_c", "_rgb48LEToUV_half_c", "_bgr48BEToUV_half_c", "_bgr48LEToUV_half_c", "_bgr32ToUV_half_c", "_bgr321ToUV_half_c", "_bgr24ToUV_half_c", "_bgr16leToUV_half_c", "_bgr16beToUV_half_c", "_bgr15leToUV_half_c", "_bgr15beToUV_half_c", "_bgr12leToUV_half_c", "_bgr12beToUV_half_c", "_rgb32ToUV_half_c", "_rgb321ToUV_half_c", "_rgb24ToUV_half_c", "_rgb16leToUV_half_c", "_rgb16beToUV_half_c", "_rgb15leToUV_half_c", "_rgb15beToUV_half_c", "_rgb12leToUV_half_c", "_rgb12beToUV_half_c", "_rgb64BEToUV_c", "_rgb64LEToUV_c", "_bgr64BEToUV_c", "_bgr64LEToUV_c", "_rgb48BEToUV_c", "_rgb48LEToUV_c", "_bgr48BEToUV_c", "_bgr48LEToUV_c", "_bgr32ToUV_c", "_bgr321ToUV_c", "_bgr24ToUV_c", "_bgr16leToUV_c", "_bgr16beToUV_c", "_bgr15leToUV_c", "_bgr15beToUV_c", "_bgr12leToUV_c", "_bgr12beToUV_c", "_rgb32ToUV_c", "_rgb321ToUV_c", "_rgb24ToUV_c", "_rgb16leToUV_c", "_rgb16beToUV_c", "_rgb15leToUV_c", "_rgb15beToUV_c", "_rgb12leToUV_c", "_rgb12beToUV_c", "_yuv2p010lX_LE_c", "_yuv2p010lX_BE_c", "_yuv2p010cX_c", "_yuv2planeX_16LE_c", "_yuv2planeX_16BE_c", "_yuv2p016cX_c", "_yuv2planeX_9LE_c", "_yuv2planeX_9BE_c", "_yuv2planeX_10LE_c", "_yuv2planeX_10BE_c", "_yuv2planeX_12LE_c", "_yuv2planeX_12BE_c", "_yuv2planeX_14LE_c", "_yuv2planeX_14BE_c", "_yuv2planeX_floatBE_c", "_yuv2planeX_floatLE_c", "_yuv2planeX_8_c", "_yuv2nv12cX_c", "_sao_edge_filter_9", "_put_hevc_pel_pixels_9", "_put_hevc_qpel_h_9", "_put_hevc_qpel_v_9", "_put_hevc_qpel_hv_9", "_put_hevc_epel_h_9", "_put_hevc_epel_v_9", "_put_hevc_epel_hv_9", "_sao_edge_filter_10", "_put_hevc_pel_pixels_10", "_put_hevc_qpel_h_10", "_put_hevc_qpel_v_10", "_put_hevc_qpel_hv_10", "_put_hevc_epel_h_10", "_put_hevc_epel_v_10", "_put_hevc_epel_hv_10", "_sao_edge_filter_12", "_put_hevc_pel_pixels_12", "_put_hevc_qpel_h_12", "_put_hevc_qpel_v_12", "_put_hevc_qpel_hv_12", "_put_hevc_epel_h_12", "_put_hevc_epel_v_12", "_put_hevc_epel_hv_12", "_sao_edge_filter_8", "_put_hevc_pel_pixels_8", "_put_hevc_qpel_h_8", "_put_hevc_qpel_v_8", "_put_hevc_qpel_hv_8", "_put_hevc_epel_h_8", "_put_hevc_epel_v_8", "_put_hevc_epel_hv_8", "_sum2_s16", "_sum2_clip_s16", "_sum2_float", "_sum2_double", "_sum2_s32", 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
var debug_table_viiiiiiii = [0, "jsCall_viiiiiiii_0", "jsCall_viiiiiiii_1", "jsCall_viiiiiiii_2", "jsCall_viiiiiiii_3", "jsCall_viiiiiiii_4", "jsCall_viiiiiiii_5", "jsCall_viiiiiiii_6", "jsCall_viiiiiiii_7", "jsCall_viiiiiiii_8", "jsCall_viiiiiiii_9", "jsCall_viiiiiiii_10", "jsCall_viiiiiiii_11", "jsCall_viiiiiiii_12", "jsCall_viiiiiiii_13", "jsCall_viiiiiiii_14", "jsCall_viiiiiiii_15", "jsCall_viiiiiiii_16", "jsCall_viiiiiiii_17", "jsCall_viiiiiiii_18", "jsCall_viiiiiiii_19", "jsCall_viiiiiiii_20", "jsCall_viiiiiiii_21", "jsCall_viiiiiiii_22", "jsCall_viiiiiiii_23", "jsCall_viiiiiiii_24", "jsCall_viiiiiiii_25", "jsCall_viiiiiiii_26", "jsCall_viiiiiiii_27", "jsCall_viiiiiiii_28", "jsCall_viiiiiiii_29", "jsCall_viiiiiiii_30", "jsCall_viiiiiiii_31", "jsCall_viiiiiiii_32", "jsCall_viiiiiiii_33", "jsCall_viiiiiiii_34", "jsCall_viiiiiiii_35", "jsCall_viiiiiiii_36", "jsCall_viiiiiiii_37", "jsCall_viiiiiiii_38", "jsCall_viiiiiiii_39", "jsCall_viiiiiiii_40", "jsCall_viiiiiiii_41", "jsCall_viiiiiiii_42", "jsCall_viiiiiiii_43", "jsCall_viiiiiiii_44", "jsCall_viiiiiiii_45", "jsCall_viiiiiiii_46", "jsCall_viiiiiiii_47", "jsCall_viiiiiiii_48", "jsCall_viiiiiiii_49", "jsCall_viiiiiiii_50", "jsCall_viiiiiiii_51", "jsCall_viiiiiiii_52", "jsCall_viiiiiiii_53", "jsCall_viiiiiiii_54", "jsCall_viiiiiiii_55", "jsCall_viiiiiiii_56", "jsCall_viiiiiiii_57", "jsCall_viiiiiiii_58", "jsCall_viiiiiiii_59", "jsCall_viiiiiiii_60", "jsCall_viiiiiiii_61", "jsCall_viiiiiiii_62", "jsCall_viiiiiiii_63", "jsCall_viiiiiiii_64", "jsCall_viiiiiiii_65", "jsCall_viiiiiiii_66", "jsCall_viiiiiiii_67", "jsCall_viiiiiiii_68", "jsCall_viiiiiiii_69", "jsCall_viiiiiiii_70", "jsCall_viiiiiiii_71", "jsCall_viiiiiiii_72", "jsCall_viiiiiiii_73", "jsCall_viiiiiiii_74", "jsCall_viiiiiiii_75", "jsCall_viiiiiiii_76", "jsCall_viiiiiiii_77", "jsCall_viiiiiiii_78", "jsCall_viiiiiiii_79", "jsCall_viiiiiiii_80", "jsCall_viiiiiiii_81", "jsCall_viiiiiiii_82", "jsCall_viiiiiiii_83", "jsCall_viiiiiiii_84", "jsCall_viiiiiiii_85", "jsCall_viiiiiiii_86", "jsCall_viiiiiiii_87", "jsCall_viiiiiiii_88", "jsCall_viiiiiiii_89", "jsCall_viiiiiiii_90", "jsCall_viiiiiiii_91", "jsCall_viiiiiiii_92", "jsCall_viiiiiiii_93", "jsCall_viiiiiiii_94", "jsCall_viiiiiiii_95", "jsCall_viiiiiiii_96", "jsCall_viiiiiiii_97", "jsCall_viiiiiiii_98", "jsCall_viiiiiiii_99", "_ff_hcscale_fast_c", "_bayer_bggr8_to_yv12_copy", "_bayer_bggr8_to_yv12_interpolate", "_bayer_bggr16le_to_yv12_copy", "_bayer_bggr16le_to_yv12_interpolate", "_bayer_bggr16be_to_yv12_copy", "_bayer_bggr16be_to_yv12_interpolate", "_bayer_rggb8_to_yv12_copy", "_bayer_rggb8_to_yv12_interpolate", "_bayer_rggb16le_to_yv12_copy", "_bayer_rggb16le_to_yv12_interpolate", "_bayer_rggb16be_to_yv12_copy", "_bayer_rggb16be_to_yv12_interpolate", "_bayer_gbrg8_to_yv12_copy", "_bayer_gbrg8_to_yv12_interpolate", "_bayer_gbrg16le_to_yv12_copy", "_bayer_gbrg16le_to_yv12_interpolate", "_bayer_gbrg16be_to_yv12_copy", "_bayer_gbrg16be_to_yv12_interpolate", "_bayer_grbg8_to_yv12_copy", "_bayer_grbg8_to_yv12_interpolate", "_bayer_grbg16le_to_yv12_copy", "_bayer_grbg16le_to_yv12_interpolate", "_bayer_grbg16be_to_yv12_copy", "_bayer_grbg16be_to_yv12_interpolate", "_sao_band_filter_9", "_put_hevc_pel_uni_pixels_9", "_put_hevc_qpel_uni_h_9", "_put_hevc_qpel_uni_v_9", "_put_hevc_qpel_uni_hv_9", "_put_hevc_epel_uni_h_9", "_put_hevc_epel_uni_v_9", "_put_hevc_epel_uni_hv_9", "_sao_band_filter_10", "_put_hevc_pel_uni_pixels_10", "_put_hevc_qpel_uni_h_10", "_put_hevc_qpel_uni_v_10", "_put_hevc_qpel_uni_hv_10", "_put_hevc_epel_uni_h_10", "_put_hevc_epel_uni_v_10", "_put_hevc_epel_uni_hv_10", "_sao_band_filter_12", "_put_hevc_pel_uni_pixels_12", "_put_hevc_qpel_uni_h_12", "_put_hevc_qpel_uni_v_12", "_put_hevc_qpel_uni_hv_12", "_put_hevc_epel_uni_h_12", "_put_hevc_epel_uni_v_12", "_put_hevc_epel_uni_hv_12", "_sao_band_filter_8", "_put_hevc_pel_uni_pixels_8", "_put_hevc_qpel_uni_h_8", "_put_hevc_qpel_uni_v_8", "_put_hevc_qpel_uni_hv_8", "_put_hevc_epel_uni_h_8", "_put_hevc_epel_uni_v_8", "_put_hevc_epel_uni_hv_8", "_biweight_h264_pixels16_9_c", "_biweight_h264_pixels8_9_c", "_biweight_h264_pixels4_9_c", "_biweight_h264_pixels2_9_c", "_biweight_h264_pixels16_10_c", "_biweight_h264_pixels8_10_c", "_biweight_h264_pixels4_10_c", "_biweight_h264_pixels2_10_c", "_biweight_h264_pixels16_12_c", "_biweight_h264_pixels8_12_c", "_biweight_h264_pixels4_12_c", "_biweight_h264_pixels2_12_c", "_biweight_h264_pixels16_14_c", "_biweight_h264_pixels8_14_c", "_biweight_h264_pixels4_14_c", "_biweight_h264_pixels2_14_c", "_biweight_h264_pixels16_8_c", "_biweight_h264_pixels8_8_c", "_biweight_h264_pixels4_8_c", "_biweight_h264_pixels2_8_c", 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
var debug_table_viiiiiiiid = [0, "jsCall_viiiiiiiid_0", "jsCall_viiiiiiiid_1", "jsCall_viiiiiiiid_2", "jsCall_viiiiiiiid_3", "jsCall_viiiiiiiid_4", "jsCall_viiiiiiiid_5", "jsCall_viiiiiiiid_6", "jsCall_viiiiiiiid_7", "jsCall_viiiiiiiid_8", "jsCall_viiiiiiiid_9", "jsCall_viiiiiiiid_10", "jsCall_viiiiiiiid_11", "jsCall_viiiiiiiid_12", "jsCall_viiiiiiiid_13", "jsCall_viiiiiiiid_14", "jsCall_viiiiiiiid_15", "jsCall_viiiiiiiid_16", "jsCall_viiiiiiiid_17", "jsCall_viiiiiiiid_18", "jsCall_viiiiiiiid_19", "jsCall_viiiiiiiid_20", "jsCall_viiiiiiiid_21", "jsCall_viiiiiiiid_22", "jsCall_viiiiiiiid_23", "jsCall_viiiiiiiid_24", "jsCall_viiiiiiiid_25", "jsCall_viiiiiiiid_26", "jsCall_viiiiiiiid_27", "jsCall_viiiiiiiid_28", "jsCall_viiiiiiiid_29", "jsCall_viiiiiiiid_30", "jsCall_viiiiiiiid_31", "jsCall_viiiiiiiid_32", "jsCall_viiiiiiiid_33", "jsCall_viiiiiiiid_34", "jsCall_viiiiiiiid_35", "jsCall_viiiiiiiid_36", "jsCall_viiiiiiiid_37", "jsCall_viiiiiiiid_38", "jsCall_viiiiiiiid_39", "jsCall_viiiiiiiid_40", "jsCall_viiiiiiiid_41", "jsCall_viiiiiiiid_42", "jsCall_viiiiiiiid_43", "jsCall_viiiiiiiid_44", "jsCall_viiiiiiiid_45", "jsCall_viiiiiiiid_46", "jsCall_viiiiiiiid_47", "jsCall_viiiiiiiid_48", "jsCall_viiiiiiiid_49", "jsCall_viiiiiiiid_50", "jsCall_viiiiiiiid_51", "jsCall_viiiiiiiid_52", "jsCall_viiiiiiiid_53", "jsCall_viiiiiiiid_54", "jsCall_viiiiiiiid_55", "jsCall_viiiiiiiid_56", "jsCall_viiiiiiiid_57", "jsCall_viiiiiiiid_58", "jsCall_viiiiiiiid_59", "jsCall_viiiiiiiid_60", "jsCall_viiiiiiiid_61", "jsCall_viiiiiiiid_62", "jsCall_viiiiiiiid_63", "jsCall_viiiiiiiid_64", "jsCall_viiiiiiiid_65", "jsCall_viiiiiiiid_66", "jsCall_viiiiiiiid_67", "jsCall_viiiiiiiid_68", "jsCall_viiiiiiiid_69", "jsCall_viiiiiiiid_70", "jsCall_viiiiiiiid_71", "jsCall_viiiiiiiid_72", "jsCall_viiiiiiiid_73", "jsCall_viiiiiiiid_74", "jsCall_viiiiiiiid_75", "jsCall_viiiiiiiid_76", "jsCall_viiiiiiiid_77", "jsCall_viiiiiiiid_78", "jsCall_viiiiiiiid_79", "jsCall_viiiiiiiid_80", "jsCall_viiiiiiiid_81", "jsCall_viiiiiiiid_82", "jsCall_viiiiiiiid_83", "jsCall_viiiiiiiid_84", "jsCall_viiiiiiiid_85", "jsCall_viiiiiiiid_86", "jsCall_viiiiiiiid_87", "jsCall_viiiiiiiid_88", "jsCall_viiiiiiiid_89", "jsCall_viiiiiiiid_90", "jsCall_viiiiiiiid_91", "jsCall_viiiiiiiid_92", "jsCall_viiiiiiiid_93", "jsCall_viiiiiiiid_94", "jsCall_viiiiiiiid_95", "jsCall_viiiiiiiid_96", "jsCall_viiiiiiiid_97", "jsCall_viiiiiiiid_98", "jsCall_viiiiiiiid_99", 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
var debug_table_viiiiiiiidi = [0, "jsCall_viiiiiiiidi_0", "jsCall_viiiiiiiidi_1", "jsCall_viiiiiiiidi_2", "jsCall_viiiiiiiidi_3", "jsCall_viiiiiiiidi_4", "jsCall_viiiiiiiidi_5", "jsCall_viiiiiiiidi_6", "jsCall_viiiiiiiidi_7", "jsCall_viiiiiiiidi_8", "jsCall_viiiiiiiidi_9", "jsCall_viiiiiiiidi_10", "jsCall_viiiiiiiidi_11", "jsCall_viiiiiiiidi_12", "jsCall_viiiiiiiidi_13", "jsCall_viiiiiiiidi_14", "jsCall_viiiiiiiidi_15", "jsCall_viiiiiiiidi_16", "jsCall_viiiiiiiidi_17", "jsCall_viiiiiiiidi_18", "jsCall_viiiiiiiidi_19", "jsCall_viiiiiiiidi_20", "jsCall_viiiiiiiidi_21", "jsCall_viiiiiiiidi_22", "jsCall_viiiiiiiidi_23", "jsCall_viiiiiiiidi_24", "jsCall_viiiiiiiidi_25", "jsCall_viiiiiiiidi_26", "jsCall_viiiiiiiidi_27", "jsCall_viiiiiiiidi_28", "jsCall_viiiiiiiidi_29", "jsCall_viiiiiiiidi_30", "jsCall_viiiiiiiidi_31", "jsCall_viiiiiiiidi_32", "jsCall_viiiiiiiidi_33", "jsCall_viiiiiiiidi_34", "jsCall_viiiiiiiidi_35", "jsCall_viiiiiiiidi_36", "jsCall_viiiiiiiidi_37", "jsCall_viiiiiiiidi_38", "jsCall_viiiiiiiidi_39", "jsCall_viiiiiiiidi_40", "jsCall_viiiiiiiidi_41", "jsCall_viiiiiiiidi_42", "jsCall_viiiiiiiidi_43", "jsCall_viiiiiiiidi_44", "jsCall_viiiiiiiidi_45", "jsCall_viiiiiiiidi_46", "jsCall_viiiiiiiidi_47", "jsCall_viiiiiiiidi_48", "jsCall_viiiiiiiidi_49", "jsCall_viiiiiiiidi_50", "jsCall_viiiiiiiidi_51", "jsCall_viiiiiiiidi_52", "jsCall_viiiiiiiidi_53", "jsCall_viiiiiiiidi_54", "jsCall_viiiiiiiidi_55", "jsCall_viiiiiiiidi_56", "jsCall_viiiiiiiidi_57", "jsCall_viiiiiiiidi_58", "jsCall_viiiiiiiidi_59", "jsCall_viiiiiiiidi_60", "jsCall_viiiiiiiidi_61", "jsCall_viiiiiiiidi_62", "jsCall_viiiiiiiidi_63", "jsCall_viiiiiiiidi_64", "jsCall_viiiiiiiidi_65", "jsCall_viiiiiiiidi_66", "jsCall_viiiiiiiidi_67", "jsCall_viiiiiiiidi_68", "jsCall_viiiiiiiidi_69", "jsCall_viiiiiiiidi_70", "jsCall_viiiiiiiidi_71", "jsCall_viiiiiiiidi_72", "jsCall_viiiiiiiidi_73", "jsCall_viiiiiiiidi_74", "jsCall_viiiiiiiidi_75", "jsCall_viiiiiiiidi_76", "jsCall_viiiiiiiidi_77", "jsCall_viiiiiiiidi_78", "jsCall_viiiiiiiidi_79", "jsCall_viiiiiiiidi_80", "jsCall_viiiiiiiidi_81", "jsCall_viiiiiiiidi_82", "jsCall_viiiiiiiidi_83", "jsCall_viiiiiiiidi_84", "jsCall_viiiiiiiidi_85", "jsCall_viiiiiiiidi_86", "jsCall_viiiiiiiidi_87", "jsCall_viiiiiiiidi_88", "jsCall_viiiiiiiidi_89", "jsCall_viiiiiiiidi_90", "jsCall_viiiiiiiidi_91", "jsCall_viiiiiiiidi_92", "jsCall_viiiiiiiidi_93", "jsCall_viiiiiiiidi_94", "jsCall_viiiiiiiidi_95", "jsCall_viiiiiiiidi_96", "jsCall_viiiiiiiidi_97", "jsCall_viiiiiiiidi_98", "jsCall_viiiiiiiidi_99", 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
var debug_table_viiiiiiiii = [0, "jsCall_viiiiiiiii_0", "jsCall_viiiiiiiii_1", "jsCall_viiiiiiiii_2", "jsCall_viiiiiiiii_3", "jsCall_viiiiiiiii_4", "jsCall_viiiiiiiii_5", "jsCall_viiiiiiiii_6", "jsCall_viiiiiiiii_7", "jsCall_viiiiiiiii_8", "jsCall_viiiiiiiii_9", "jsCall_viiiiiiiii_10", "jsCall_viiiiiiiii_11", "jsCall_viiiiiiiii_12", "jsCall_viiiiiiiii_13", "jsCall_viiiiiiiii_14", "jsCall_viiiiiiiii_15", "jsCall_viiiiiiiii_16", "jsCall_viiiiiiiii_17", "jsCall_viiiiiiiii_18", "jsCall_viiiiiiiii_19", "jsCall_viiiiiiiii_20", "jsCall_viiiiiiiii_21", "jsCall_viiiiiiiii_22", "jsCall_viiiiiiiii_23", "jsCall_viiiiiiiii_24", "jsCall_viiiiiiiii_25", "jsCall_viiiiiiiii_26", "jsCall_viiiiiiiii_27", "jsCall_viiiiiiiii_28", "jsCall_viiiiiiiii_29", "jsCall_viiiiiiiii_30", "jsCall_viiiiiiiii_31", "jsCall_viiiiiiiii_32", "jsCall_viiiiiiiii_33", "jsCall_viiiiiiiii_34", "jsCall_viiiiiiiii_35", "jsCall_viiiiiiiii_36", "jsCall_viiiiiiiii_37", "jsCall_viiiiiiiii_38", "jsCall_viiiiiiiii_39", "jsCall_viiiiiiiii_40", "jsCall_viiiiiiiii_41", "jsCall_viiiiiiiii_42", "jsCall_viiiiiiiii_43", "jsCall_viiiiiiiii_44", "jsCall_viiiiiiiii_45", "jsCall_viiiiiiiii_46", "jsCall_viiiiiiiii_47", "jsCall_viiiiiiiii_48", "jsCall_viiiiiiiii_49", "jsCall_viiiiiiiii_50", "jsCall_viiiiiiiii_51", "jsCall_viiiiiiiii_52", "jsCall_viiiiiiiii_53", "jsCall_viiiiiiiii_54", "jsCall_viiiiiiiii_55", "jsCall_viiiiiiiii_56", "jsCall_viiiiiiiii_57", "jsCall_viiiiiiiii_58", "jsCall_viiiiiiiii_59", "jsCall_viiiiiiiii_60", "jsCall_viiiiiiiii_61", "jsCall_viiiiiiiii_62", "jsCall_viiiiiiiii_63", "jsCall_viiiiiiiii_64", "jsCall_viiiiiiiii_65", "jsCall_viiiiiiiii_66", "jsCall_viiiiiiiii_67", "jsCall_viiiiiiiii_68", "jsCall_viiiiiiiii_69", "jsCall_viiiiiiiii_70", "jsCall_viiiiiiiii_71", "jsCall_viiiiiiiii_72", "jsCall_viiiiiiiii_73", "jsCall_viiiiiiiii_74", "jsCall_viiiiiiiii_75", "jsCall_viiiiiiiii_76", "jsCall_viiiiiiiii_77", "jsCall_viiiiiiiii_78", "jsCall_viiiiiiiii_79", "jsCall_viiiiiiiii_80", "jsCall_viiiiiiiii_81", "jsCall_viiiiiiiii_82", "jsCall_viiiiiiiii_83", "jsCall_viiiiiiiii_84", "jsCall_viiiiiiiii_85", "jsCall_viiiiiiiii_86", "jsCall_viiiiiiiii_87", "jsCall_viiiiiiiii_88", "jsCall_viiiiiiiii_89", "jsCall_viiiiiiiii_90", "jsCall_viiiiiiiii_91", "jsCall_viiiiiiiii_92", "jsCall_viiiiiiiii_93", "jsCall_viiiiiiiii_94", "jsCall_viiiiiiiii_95", "jsCall_viiiiiiiii_96", "jsCall_viiiiiiiii_97", "jsCall_viiiiiiiii_98", "jsCall_viiiiiiiii_99", "_yuv2rgba32_full_1_c", "_yuv2rgbx32_full_1_c", "_yuv2argb32_full_1_c", "_yuv2xrgb32_full_1_c", "_yuv2bgra32_full_1_c", "_yuv2bgrx32_full_1_c", "_yuv2abgr32_full_1_c", "_yuv2xbgr32_full_1_c", "_yuv2rgba64le_full_1_c", "_yuv2rgbx64le_full_1_c", "_yuv2rgba64be_full_1_c", "_yuv2rgbx64be_full_1_c", "_yuv2bgra64le_full_1_c", "_yuv2bgrx64le_full_1_c", "_yuv2bgra64be_full_1_c", "_yuv2bgrx64be_full_1_c", "_yuv2rgb24_full_1_c", "_yuv2bgr24_full_1_c", "_yuv2rgb48le_full_1_c", "_yuv2bgr48le_full_1_c", "_yuv2rgb48be_full_1_c", "_yuv2bgr48be_full_1_c", "_yuv2bgr4_byte_full_1_c", "_yuv2rgb4_byte_full_1_c", "_yuv2bgr8_full_1_c", "_yuv2rgb8_full_1_c", "_yuv2rgbx64le_1_c", "_yuv2rgba64le_1_c", "_yuv2rgbx64be_1_c", "_yuv2rgba64be_1_c", "_yuv2bgrx64le_1_c", "_yuv2bgra64le_1_c", "_yuv2bgrx64be_1_c", "_yuv2bgra64be_1_c", "_yuv2rgba32_1_c", "_yuv2rgbx32_1_c", "_yuv2rgba32_1_1_c", "_yuv2rgbx32_1_1_c", "_yuv2rgb16_1_c", "_yuv2rgb15_1_c", "_yuv2rgb12_1_c", "_yuv2rgb8_1_c", "_yuv2rgb4_1_c", "_yuv2rgb4b_1_c", "_yuv2rgb48le_1_c", "_yuv2rgb48be_1_c", "_yuv2bgr48le_1_c", "_yuv2bgr48be_1_c", "_yuv2rgb24_1_c", "_yuv2bgr24_1_c", "_yuv2monowhite_1_c", "_yuv2monoblack_1_c", "_yuv2yuyv422_1_c", "_yuv2yvyu422_1_c", "_yuv2uyvy422_1_c", "_yuv2ya8_1_c", "_yuv2ya16le_1_c", "_yuv2ya16be_1_c", "_yuy2toyv12_c", "_put_hevc_pel_bi_pixels_9", "_put_hevc_qpel_bi_h_9", "_put_hevc_qpel_bi_v_9", "_put_hevc_qpel_bi_hv_9", "_put_hevc_epel_bi_h_9", "_put_hevc_epel_bi_v_9", "_put_hevc_epel_bi_hv_9", "_put_hevc_pel_bi_pixels_10", "_put_hevc_qpel_bi_h_10", "_put_hevc_qpel_bi_v_10", "_put_hevc_qpel_bi_hv_10", "_put_hevc_epel_bi_h_10", "_put_hevc_epel_bi_v_10", "_put_hevc_epel_bi_hv_10", "_put_hevc_pel_bi_pixels_12", "_put_hevc_qpel_bi_h_12", "_put_hevc_qpel_bi_v_12", "_put_hevc_qpel_bi_hv_12", "_put_hevc_epel_bi_h_12", "_put_hevc_epel_bi_v_12", "_put_hevc_epel_bi_hv_12", "_put_hevc_pel_bi_pixels_8", "_put_hevc_qpel_bi_h_8", "_put_hevc_qpel_bi_v_8", "_put_hevc_qpel_bi_hv_8", "_put_hevc_epel_bi_h_8", "_put_hevc_epel_bi_v_8", "_put_hevc_epel_bi_hv_8", 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
var debug_table_viiiiiiiiii = [0, "jsCall_viiiiiiiiii_0", "jsCall_viiiiiiiiii_1", "jsCall_viiiiiiiiii_2", "jsCall_viiiiiiiiii_3", "jsCall_viiiiiiiiii_4", "jsCall_viiiiiiiiii_5", "jsCall_viiiiiiiiii_6", "jsCall_viiiiiiiiii_7", "jsCall_viiiiiiiiii_8", "jsCall_viiiiiiiiii_9", "jsCall_viiiiiiiiii_10", "jsCall_viiiiiiiiii_11", "jsCall_viiiiiiiiii_12", "jsCall_viiiiiiiiii_13", "jsCall_viiiiiiiiii_14", "jsCall_viiiiiiiiii_15", "jsCall_viiiiiiiiii_16", "jsCall_viiiiiiiiii_17", "jsCall_viiiiiiiiii_18", "jsCall_viiiiiiiiii_19", "jsCall_viiiiiiiiii_20", "jsCall_viiiiiiiiii_21", "jsCall_viiiiiiiiii_22", "jsCall_viiiiiiiiii_23", "jsCall_viiiiiiiiii_24", "jsCall_viiiiiiiiii_25", "jsCall_viiiiiiiiii_26", "jsCall_viiiiiiiiii_27", "jsCall_viiiiiiiiii_28", "jsCall_viiiiiiiiii_29", "jsCall_viiiiiiiiii_30", "jsCall_viiiiiiiiii_31", "jsCall_viiiiiiiiii_32", "jsCall_viiiiiiiiii_33", "jsCall_viiiiiiiiii_34", "jsCall_viiiiiiiiii_35", "jsCall_viiiiiiiiii_36", "jsCall_viiiiiiiiii_37", "jsCall_viiiiiiiiii_38", "jsCall_viiiiiiiiii_39", "jsCall_viiiiiiiiii_40", "jsCall_viiiiiiiiii_41", "jsCall_viiiiiiiiii_42", "jsCall_viiiiiiiiii_43", "jsCall_viiiiiiiiii_44", "jsCall_viiiiiiiiii_45", "jsCall_viiiiiiiiii_46", "jsCall_viiiiiiiiii_47", "jsCall_viiiiiiiiii_48", "jsCall_viiiiiiiiii_49", "jsCall_viiiiiiiiii_50", "jsCall_viiiiiiiiii_51", "jsCall_viiiiiiiiii_52", "jsCall_viiiiiiiiii_53", "jsCall_viiiiiiiiii_54", "jsCall_viiiiiiiiii_55", "jsCall_viiiiiiiiii_56", "jsCall_viiiiiiiiii_57", "jsCall_viiiiiiiiii_58", "jsCall_viiiiiiiiii_59", "jsCall_viiiiiiiiii_60", "jsCall_viiiiiiiiii_61", "jsCall_viiiiiiiiii_62", "jsCall_viiiiiiiiii_63", "jsCall_viiiiiiiiii_64", "jsCall_viiiiiiiiii_65", "jsCall_viiiiiiiiii_66", "jsCall_viiiiiiiiii_67", "jsCall_viiiiiiiiii_68", "jsCall_viiiiiiiiii_69", "jsCall_viiiiiiiiii_70", "jsCall_viiiiiiiiii_71", "jsCall_viiiiiiiiii_72", "jsCall_viiiiiiiiii_73", "jsCall_viiiiiiiiii_74", "jsCall_viiiiiiiiii_75", "jsCall_viiiiiiiiii_76", "jsCall_viiiiiiiiii_77", "jsCall_viiiiiiiiii_78", "jsCall_viiiiiiiiii_79", "jsCall_viiiiiiiiii_80", "jsCall_viiiiiiiiii_81", "jsCall_viiiiiiiiii_82", "jsCall_viiiiiiiiii_83", "jsCall_viiiiiiiiii_84", "jsCall_viiiiiiiiii_85", "jsCall_viiiiiiiiii_86", "jsCall_viiiiiiiiii_87", "jsCall_viiiiiiiiii_88", "jsCall_viiiiiiiiii_89", "jsCall_viiiiiiiiii_90", "jsCall_viiiiiiiiii_91", "jsCall_viiiiiiiiii_92", "jsCall_viiiiiiiiii_93", "jsCall_viiiiiiiiii_94", "jsCall_viiiiiiiiii_95", "jsCall_viiiiiiiiii_96", "jsCall_viiiiiiiiii_97", "jsCall_viiiiiiiiii_98", "jsCall_viiiiiiiiii_99", "_yuv2rgba32_full_2_c", "_yuv2rgbx32_full_2_c", "_yuv2argb32_full_2_c", "_yuv2xrgb32_full_2_c", "_yuv2bgra32_full_2_c", "_yuv2bgrx32_full_2_c", "_yuv2abgr32_full_2_c", "_yuv2xbgr32_full_2_c", "_yuv2rgba64le_full_2_c", "_yuv2rgbx64le_full_2_c", "_yuv2rgba64be_full_2_c", "_yuv2rgbx64be_full_2_c", "_yuv2bgra64le_full_2_c", "_yuv2bgrx64le_full_2_c", "_yuv2bgra64be_full_2_c", "_yuv2bgrx64be_full_2_c", "_yuv2rgb24_full_2_c", "_yuv2bgr24_full_2_c", "_yuv2rgb48le_full_2_c", "_yuv2bgr48le_full_2_c", "_yuv2rgb48be_full_2_c", "_yuv2bgr48be_full_2_c", "_yuv2bgr4_byte_full_2_c", "_yuv2rgb4_byte_full_2_c", "_yuv2bgr8_full_2_c", "_yuv2rgb8_full_2_c", "_yuv2rgbx64le_2_c", "_yuv2rgba64le_2_c", "_yuv2rgbx64be_2_c", "_yuv2rgba64be_2_c", "_yuv2bgrx64le_2_c", "_yuv2bgra64le_2_c", "_yuv2bgrx64be_2_c", "_yuv2bgra64be_2_c", "_yuv2rgba32_2_c", "_yuv2rgbx32_2_c", "_yuv2rgba32_1_2_c", "_yuv2rgbx32_1_2_c", "_yuv2rgb16_2_c", "_yuv2rgb15_2_c", "_yuv2rgb12_2_c", "_yuv2rgb8_2_c", "_yuv2rgb4_2_c", "_yuv2rgb4b_2_c", "_yuv2rgb48le_2_c", "_yuv2rgb48be_2_c", "_yuv2bgr48le_2_c", "_yuv2bgr48be_2_c", "_yuv2rgb24_2_c", "_yuv2bgr24_2_c", "_yuv2monowhite_2_c", "_yuv2monoblack_2_c", "_yuv2yuyv422_2_c", "_yuv2yvyu422_2_c", "_yuv2uyvy422_2_c", "_yuv2ya8_2_c", "_yuv2ya16le_2_c", "_yuv2ya16be_2_c", "_vu9_to_vu12_c", "_yvu9_to_yuy2_c", "_ff_emulated_edge_mc_8", "_ff_emulated_edge_mc_16", 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
var debug_table_viiiiiiiiiii = [0, "jsCall_viiiiiiiiiii_0", "jsCall_viiiiiiiiiii_1", "jsCall_viiiiiiiiiii_2", "jsCall_viiiiiiiiiii_3", "jsCall_viiiiiiiiiii_4", "jsCall_viiiiiiiiiii_5", "jsCall_viiiiiiiiiii_6", "jsCall_viiiiiiiiiii_7", "jsCall_viiiiiiiiiii_8", "jsCall_viiiiiiiiiii_9", "jsCall_viiiiiiiiiii_10", "jsCall_viiiiiiiiiii_11", "jsCall_viiiiiiiiiii_12", "jsCall_viiiiiiiiiii_13", "jsCall_viiiiiiiiiii_14", "jsCall_viiiiiiiiiii_15", "jsCall_viiiiiiiiiii_16", "jsCall_viiiiiiiiiii_17", "jsCall_viiiiiiiiiii_18", "jsCall_viiiiiiiiiii_19", "jsCall_viiiiiiiiiii_20", "jsCall_viiiiiiiiiii_21", "jsCall_viiiiiiiiiii_22", "jsCall_viiiiiiiiiii_23", "jsCall_viiiiiiiiiii_24", "jsCall_viiiiiiiiiii_25", "jsCall_viiiiiiiiiii_26", "jsCall_viiiiiiiiiii_27", "jsCall_viiiiiiiiiii_28", "jsCall_viiiiiiiiiii_29", "jsCall_viiiiiiiiiii_30", "jsCall_viiiiiiiiiii_31", "jsCall_viiiiiiiiiii_32", "jsCall_viiiiiiiiiii_33", "jsCall_viiiiiiiiiii_34", "jsCall_viiiiiiiiiii_35", "jsCall_viiiiiiiiiii_36", "jsCall_viiiiiiiiiii_37", "jsCall_viiiiiiiiiii_38", "jsCall_viiiiiiiiiii_39", "jsCall_viiiiiiiiiii_40", "jsCall_viiiiiiiiiii_41", "jsCall_viiiiiiiiiii_42", "jsCall_viiiiiiiiiii_43", "jsCall_viiiiiiiiiii_44", "jsCall_viiiiiiiiiii_45", "jsCall_viiiiiiiiiii_46", "jsCall_viiiiiiiiiii_47", "jsCall_viiiiiiiiiii_48", "jsCall_viiiiiiiiiii_49", "jsCall_viiiiiiiiiii_50", "jsCall_viiiiiiiiiii_51", "jsCall_viiiiiiiiiii_52", "jsCall_viiiiiiiiiii_53", "jsCall_viiiiiiiiiii_54", "jsCall_viiiiiiiiiii_55", "jsCall_viiiiiiiiiii_56", "jsCall_viiiiiiiiiii_57", "jsCall_viiiiiiiiiii_58", "jsCall_viiiiiiiiiii_59", "jsCall_viiiiiiiiiii_60", "jsCall_viiiiiiiiiii_61", "jsCall_viiiiiiiiiii_62", "jsCall_viiiiiiiiiii_63", "jsCall_viiiiiiiiiii_64", "jsCall_viiiiiiiiiii_65", "jsCall_viiiiiiiiiii_66", "jsCall_viiiiiiiiiii_67", "jsCall_viiiiiiiiiii_68", "jsCall_viiiiiiiiiii_69", "jsCall_viiiiiiiiiii_70", "jsCall_viiiiiiiiiii_71", "jsCall_viiiiiiiiiii_72", "jsCall_viiiiiiiiiii_73", "jsCall_viiiiiiiiiii_74", "jsCall_viiiiiiiiiii_75", "jsCall_viiiiiiiiiii_76", "jsCall_viiiiiiiiiii_77", "jsCall_viiiiiiiiiii_78", "jsCall_viiiiiiiiiii_79", "jsCall_viiiiiiiiiii_80", "jsCall_viiiiiiiiiii_81", "jsCall_viiiiiiiiiii_82", "jsCall_viiiiiiiiiii_83", "jsCall_viiiiiiiiiii_84", "jsCall_viiiiiiiiiii_85", "jsCall_viiiiiiiiiii_86", "jsCall_viiiiiiiiiii_87", "jsCall_viiiiiiiiiii_88", "jsCall_viiiiiiiiiii_89", "jsCall_viiiiiiiiiii_90", "jsCall_viiiiiiiiiii_91", "jsCall_viiiiiiiiiii_92", "jsCall_viiiiiiiiiii_93", "jsCall_viiiiiiiiiii_94", "jsCall_viiiiiiiiiii_95", "jsCall_viiiiiiiiiii_96", "jsCall_viiiiiiiiiii_97", "jsCall_viiiiiiiiiii_98", "jsCall_viiiiiiiiiii_99", "_put_hevc_pel_uni_w_pixels_9", "_put_hevc_qpel_uni_w_h_9", "_put_hevc_qpel_uni_w_v_9", "_put_hevc_qpel_uni_w_hv_9", "_put_hevc_epel_uni_w_h_9", "_put_hevc_epel_uni_w_v_9", "_put_hevc_epel_uni_w_hv_9", "_put_hevc_pel_uni_w_pixels_10", "_put_hevc_qpel_uni_w_h_10", "_put_hevc_qpel_uni_w_v_10", "_put_hevc_qpel_uni_w_hv_10", "_put_hevc_epel_uni_w_h_10", "_put_hevc_epel_uni_w_v_10", "_put_hevc_epel_uni_w_hv_10", "_put_hevc_pel_uni_w_pixels_12", "_put_hevc_qpel_uni_w_h_12", "_put_hevc_qpel_uni_w_v_12", "_put_hevc_qpel_uni_w_hv_12", "_put_hevc_epel_uni_w_h_12", "_put_hevc_epel_uni_w_v_12", "_put_hevc_epel_uni_w_hv_12", "_put_hevc_pel_uni_w_pixels_8", "_put_hevc_qpel_uni_w_h_8", "_put_hevc_qpel_uni_w_v_8", "_put_hevc_qpel_uni_w_hv_8", "_put_hevc_epel_uni_w_h_8", "_put_hevc_epel_uni_w_v_8", "_put_hevc_epel_uni_w_hv_8", 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
var debug_table_viiiiiiiiiiii = [0, "jsCall_viiiiiiiiiiii_0", "jsCall_viiiiiiiiiiii_1", "jsCall_viiiiiiiiiiii_2", "jsCall_viiiiiiiiiiii_3", "jsCall_viiiiiiiiiiii_4", "jsCall_viiiiiiiiiiii_5", "jsCall_viiiiiiiiiiii_6", "jsCall_viiiiiiiiiiii_7", "jsCall_viiiiiiiiiiii_8", "jsCall_viiiiiiiiiiii_9", "jsCall_viiiiiiiiiiii_10", "jsCall_viiiiiiiiiiii_11", "jsCall_viiiiiiiiiiii_12", "jsCall_viiiiiiiiiiii_13", "jsCall_viiiiiiiiiiii_14", "jsCall_viiiiiiiiiiii_15", "jsCall_viiiiiiiiiiii_16", "jsCall_viiiiiiiiiiii_17", "jsCall_viiiiiiiiiiii_18", "jsCall_viiiiiiiiiiii_19", "jsCall_viiiiiiiiiiii_20", "jsCall_viiiiiiiiiiii_21", "jsCall_viiiiiiiiiiii_22", "jsCall_viiiiiiiiiiii_23", "jsCall_viiiiiiiiiiii_24", "jsCall_viiiiiiiiiiii_25", "jsCall_viiiiiiiiiiii_26", "jsCall_viiiiiiiiiiii_27", "jsCall_viiiiiiiiiiii_28", "jsCall_viiiiiiiiiiii_29", "jsCall_viiiiiiiiiiii_30", "jsCall_viiiiiiiiiiii_31", "jsCall_viiiiiiiiiiii_32", "jsCall_viiiiiiiiiiii_33", "jsCall_viiiiiiiiiiii_34", "jsCall_viiiiiiiiiiii_35", "jsCall_viiiiiiiiiiii_36", "jsCall_viiiiiiiiiiii_37", "jsCall_viiiiiiiiiiii_38", "jsCall_viiiiiiiiiiii_39", "jsCall_viiiiiiiiiiii_40", "jsCall_viiiiiiiiiiii_41", "jsCall_viiiiiiiiiiii_42", "jsCall_viiiiiiiiiiii_43", "jsCall_viiiiiiiiiiii_44", "jsCall_viiiiiiiiiiii_45", "jsCall_viiiiiiiiiiii_46", "jsCall_viiiiiiiiiiii_47", "jsCall_viiiiiiiiiiii_48", "jsCall_viiiiiiiiiiii_49", "jsCall_viiiiiiiiiiii_50", "jsCall_viiiiiiiiiiii_51", "jsCall_viiiiiiiiiiii_52", "jsCall_viiiiiiiiiiii_53", "jsCall_viiiiiiiiiiii_54", "jsCall_viiiiiiiiiiii_55", "jsCall_viiiiiiiiiiii_56", "jsCall_viiiiiiiiiiii_57", "jsCall_viiiiiiiiiiii_58", "jsCall_viiiiiiiiiiii_59", "jsCall_viiiiiiiiiiii_60", "jsCall_viiiiiiiiiiii_61", "jsCall_viiiiiiiiiiii_62", "jsCall_viiiiiiiiiiii_63", "jsCall_viiiiiiiiiiii_64", "jsCall_viiiiiiiiiiii_65", "jsCall_viiiiiiiiiiii_66", "jsCall_viiiiiiiiiiii_67", "jsCall_viiiiiiiiiiii_68", "jsCall_viiiiiiiiiiii_69", "jsCall_viiiiiiiiiiii_70", "jsCall_viiiiiiiiiiii_71", "jsCall_viiiiiiiiiiii_72", "jsCall_viiiiiiiiiiii_73", "jsCall_viiiiiiiiiiii_74", "jsCall_viiiiiiiiiiii_75", "jsCall_viiiiiiiiiiii_76", "jsCall_viiiiiiiiiiii_77", "jsCall_viiiiiiiiiiii_78", "jsCall_viiiiiiiiiiii_79", "jsCall_viiiiiiiiiiii_80", "jsCall_viiiiiiiiiiii_81", "jsCall_viiiiiiiiiiii_82", "jsCall_viiiiiiiiiiii_83", "jsCall_viiiiiiiiiiii_84", "jsCall_viiiiiiiiiiii_85", "jsCall_viiiiiiiiiiii_86", "jsCall_viiiiiiiiiiii_87", "jsCall_viiiiiiiiiiii_88", "jsCall_viiiiiiiiiiii_89", "jsCall_viiiiiiiiiiii_90", "jsCall_viiiiiiiiiiii_91", "jsCall_viiiiiiiiiiii_92", "jsCall_viiiiiiiiiiii_93", "jsCall_viiiiiiiiiiii_94", "jsCall_viiiiiiiiiiii_95", "jsCall_viiiiiiiiiiii_96", "jsCall_viiiiiiiiiiii_97", "jsCall_viiiiiiiiiiii_98", "jsCall_viiiiiiiiiiii_99", "_yuv2rgba32_full_X_c", "_yuv2rgbx32_full_X_c", "_yuv2argb32_full_X_c", "_yuv2xrgb32_full_X_c", "_yuv2bgra32_full_X_c", "_yuv2bgrx32_full_X_c", "_yuv2abgr32_full_X_c", "_yuv2xbgr32_full_X_c", "_yuv2rgba64le_full_X_c", "_yuv2rgbx64le_full_X_c", "_yuv2rgba64be_full_X_c", "_yuv2rgbx64be_full_X_c", "_yuv2bgra64le_full_X_c", "_yuv2bgrx64le_full_X_c", "_yuv2bgra64be_full_X_c", "_yuv2bgrx64be_full_X_c", "_yuv2rgb24_full_X_c", "_yuv2bgr24_full_X_c", "_yuv2rgb48le_full_X_c", "_yuv2bgr48le_full_X_c", "_yuv2rgb48be_full_X_c", "_yuv2bgr48be_full_X_c", "_yuv2bgr4_byte_full_X_c", "_yuv2rgb4_byte_full_X_c", "_yuv2bgr8_full_X_c", "_yuv2rgb8_full_X_c", "_yuv2gbrp_full_X_c", "_yuv2gbrp16_full_X_c", "_yuv2rgbx64le_X_c", "_yuv2rgba64le_X_c", "_yuv2rgbx64be_X_c", "_yuv2rgba64be_X_c", "_yuv2bgrx64le_X_c", "_yuv2bgra64le_X_c", "_yuv2bgrx64be_X_c", "_yuv2bgra64be_X_c", "_yuv2rgba32_X_c", "_yuv2rgbx32_X_c", "_yuv2rgba32_1_X_c", "_yuv2rgbx32_1_X_c", "_yuv2rgb16_X_c", "_yuv2rgb15_X_c", "_yuv2rgb12_X_c", "_yuv2rgb8_X_c", "_yuv2rgb4_X_c", "_yuv2rgb4b_X_c", "_yuv2rgb48le_X_c", "_yuv2rgb48be_X_c", "_yuv2bgr48le_X_c", "_yuv2bgr48be_X_c", "_yuv2rgb24_X_c", "_yuv2bgr24_X_c", "_yuv2monowhite_X_c", "_yuv2ayuv64le_X_c", "_yuv2monoblack_X_c", "_yuv2yuyv422_X_c", "_yuv2yvyu422_X_c", "_yuv2uyvy422_X_c", "_yuv2ya8_X_c", "_yuv2ya16le_X_c", "_yuv2ya16be_X_c", "_sao_edge_restore_0_9", "_sao_edge_restore_1_9", "_sao_edge_restore_0_10", "_sao_edge_restore_1_10", "_sao_edge_restore_0_12", "_sao_edge_restore_1_12", "_sao_edge_restore_0_8", "_sao_edge_restore_1_8", 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
var debug_table_viiiiiiiiiiiiii = [0, "jsCall_viiiiiiiiiiiiii_0", "jsCall_viiiiiiiiiiiiii_1", "jsCall_viiiiiiiiiiiiii_2", "jsCall_viiiiiiiiiiiiii_3", "jsCall_viiiiiiiiiiiiii_4", "jsCall_viiiiiiiiiiiiii_5", "jsCall_viiiiiiiiiiiiii_6", "jsCall_viiiiiiiiiiiiii_7", "jsCall_viiiiiiiiiiiiii_8", "jsCall_viiiiiiiiiiiiii_9", "jsCall_viiiiiiiiiiiiii_10", "jsCall_viiiiiiiiiiiiii_11", "jsCall_viiiiiiiiiiiiii_12", "jsCall_viiiiiiiiiiiiii_13", "jsCall_viiiiiiiiiiiiii_14", "jsCall_viiiiiiiiiiiiii_15", "jsCall_viiiiiiiiiiiiii_16", "jsCall_viiiiiiiiiiiiii_17", "jsCall_viiiiiiiiiiiiii_18", "jsCall_viiiiiiiiiiiiii_19", "jsCall_viiiiiiiiiiiiii_20", "jsCall_viiiiiiiiiiiiii_21", "jsCall_viiiiiiiiiiiiii_22", "jsCall_viiiiiiiiiiiiii_23", "jsCall_viiiiiiiiiiiiii_24", "jsCall_viiiiiiiiiiiiii_25", "jsCall_viiiiiiiiiiiiii_26", "jsCall_viiiiiiiiiiiiii_27", "jsCall_viiiiiiiiiiiiii_28", "jsCall_viiiiiiiiiiiiii_29", "jsCall_viiiiiiiiiiiiii_30", "jsCall_viiiiiiiiiiiiii_31", "jsCall_viiiiiiiiiiiiii_32", "jsCall_viiiiiiiiiiiiii_33", "jsCall_viiiiiiiiiiiiii_34", "jsCall_viiiiiiiiiiiiii_35", "jsCall_viiiiiiiiiiiiii_36", "jsCall_viiiiiiiiiiiiii_37", "jsCall_viiiiiiiiiiiiii_38", "jsCall_viiiiiiiiiiiiii_39", "jsCall_viiiiiiiiiiiiii_40", "jsCall_viiiiiiiiiiiiii_41", "jsCall_viiiiiiiiiiiiii_42", "jsCall_viiiiiiiiiiiiii_43", "jsCall_viiiiiiiiiiiiii_44", "jsCall_viiiiiiiiiiiiii_45", "jsCall_viiiiiiiiiiiiii_46", "jsCall_viiiiiiiiiiiiii_47", "jsCall_viiiiiiiiiiiiii_48", "jsCall_viiiiiiiiiiiiii_49", "jsCall_viiiiiiiiiiiiii_50", "jsCall_viiiiiiiiiiiiii_51", "jsCall_viiiiiiiiiiiiii_52", "jsCall_viiiiiiiiiiiiii_53", "jsCall_viiiiiiiiiiiiii_54", "jsCall_viiiiiiiiiiiiii_55", "jsCall_viiiiiiiiiiiiii_56", "jsCall_viiiiiiiiiiiiii_57", "jsCall_viiiiiiiiiiiiii_58", "jsCall_viiiiiiiiiiiiii_59", "jsCall_viiiiiiiiiiiiii_60", "jsCall_viiiiiiiiiiiiii_61", "jsCall_viiiiiiiiiiiiii_62", "jsCall_viiiiiiiiiiiiii_63", "jsCall_viiiiiiiiiiiiii_64", "jsCall_viiiiiiiiiiiiii_65", "jsCall_viiiiiiiiiiiiii_66", "jsCall_viiiiiiiiiiiiii_67", "jsCall_viiiiiiiiiiiiii_68", "jsCall_viiiiiiiiiiiiii_69", "jsCall_viiiiiiiiiiiiii_70", "jsCall_viiiiiiiiiiiiii_71", "jsCall_viiiiiiiiiiiiii_72", "jsCall_viiiiiiiiiiiiii_73", "jsCall_viiiiiiiiiiiiii_74", "jsCall_viiiiiiiiiiiiii_75", "jsCall_viiiiiiiiiiiiii_76", "jsCall_viiiiiiiiiiiiii_77", "jsCall_viiiiiiiiiiiiii_78", "jsCall_viiiiiiiiiiiiii_79", "jsCall_viiiiiiiiiiiiii_80", "jsCall_viiiiiiiiiiiiii_81", "jsCall_viiiiiiiiiiiiii_82", "jsCall_viiiiiiiiiiiiii_83", "jsCall_viiiiiiiiiiiiii_84", "jsCall_viiiiiiiiiiiiii_85", "jsCall_viiiiiiiiiiiiii_86", "jsCall_viiiiiiiiiiiiii_87", "jsCall_viiiiiiiiiiiiii_88", "jsCall_viiiiiiiiiiiiii_89", "jsCall_viiiiiiiiiiiiii_90", "jsCall_viiiiiiiiiiiiii_91", "jsCall_viiiiiiiiiiiiii_92", "jsCall_viiiiiiiiiiiiii_93", "jsCall_viiiiiiiiiiiiii_94", "jsCall_viiiiiiiiiiiiii_95", "jsCall_viiiiiiiiiiiiii_96", "jsCall_viiiiiiiiiiiiii_97", "jsCall_viiiiiiiiiiiiii_98", "jsCall_viiiiiiiiiiiiii_99", "_put_hevc_pel_bi_w_pixels_9", "_put_hevc_qpel_bi_w_h_9", "_put_hevc_qpel_bi_w_v_9", "_put_hevc_qpel_bi_w_hv_9", "_put_hevc_epel_bi_w_h_9", "_put_hevc_epel_bi_w_v_9", "_put_hevc_epel_bi_w_hv_9", "_put_hevc_pel_bi_w_pixels_10", "_put_hevc_qpel_bi_w_h_10", "_put_hevc_qpel_bi_w_v_10", "_put_hevc_qpel_bi_w_hv_10", "_put_hevc_epel_bi_w_h_10", "_put_hevc_epel_bi_w_v_10", "_put_hevc_epel_bi_w_hv_10", "_put_hevc_pel_bi_w_pixels_12", "_put_hevc_qpel_bi_w_h_12", "_put_hevc_qpel_bi_w_v_12", "_put_hevc_qpel_bi_w_hv_12", "_put_hevc_epel_bi_w_h_12", "_put_hevc_epel_bi_w_v_12", "_put_hevc_epel_bi_w_hv_12", "_put_hevc_pel_bi_w_pixels_8", "_put_hevc_qpel_bi_w_h_8", "_put_hevc_qpel_bi_w_v_8", "_put_hevc_qpel_bi_w_hv_8", "_put_hevc_epel_bi_w_h_8", "_put_hevc_epel_bi_w_v_8", "_put_hevc_epel_bi_w_hv_8", 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
var debug_table_viiijj = [0, "jsCall_viiijj_0", "jsCall_viiijj_1", "jsCall_viiijj_2", "jsCall_viiijj_3", "jsCall_viiijj_4", "jsCall_viiijj_5", "jsCall_viiijj_6", "jsCall_viiijj_7", "jsCall_viiijj_8", "jsCall_viiijj_9", "jsCall_viiijj_10", "jsCall_viiijj_11", "jsCall_viiijj_12", "jsCall_viiijj_13", "jsCall_viiijj_14", "jsCall_viiijj_15", "jsCall_viiijj_16", "jsCall_viiijj_17", "jsCall_viiijj_18", "jsCall_viiijj_19", "jsCall_viiijj_20", "jsCall_viiijj_21", "jsCall_viiijj_22", "jsCall_viiijj_23", "jsCall_viiijj_24", "jsCall_viiijj_25", "jsCall_viiijj_26", "jsCall_viiijj_27", "jsCall_viiijj_28", "jsCall_viiijj_29", "jsCall_viiijj_30", "jsCall_viiijj_31", "jsCall_viiijj_32", "jsCall_viiijj_33", "jsCall_viiijj_34", "jsCall_viiijj_35", "jsCall_viiijj_36", "jsCall_viiijj_37", "jsCall_viiijj_38", "jsCall_viiijj_39", "jsCall_viiijj_40", "jsCall_viiijj_41", "jsCall_viiijj_42", "jsCall_viiijj_43", "jsCall_viiijj_44", "jsCall_viiijj_45", "jsCall_viiijj_46", "jsCall_viiijj_47", "jsCall_viiijj_48", "jsCall_viiijj_49", "jsCall_viiijj_50", "jsCall_viiijj_51", "jsCall_viiijj_52", "jsCall_viiijj_53", "jsCall_viiijj_54", "jsCall_viiijj_55", "jsCall_viiijj_56", "jsCall_viiijj_57", "jsCall_viiijj_58", "jsCall_viiijj_59", "jsCall_viiijj_60", "jsCall_viiijj_61", "jsCall_viiijj_62", "jsCall_viiijj_63", "jsCall_viiijj_64", "jsCall_viiijj_65", "jsCall_viiijj_66", "jsCall_viiijj_67", "jsCall_viiijj_68", "jsCall_viiijj_69", "jsCall_viiijj_70", "jsCall_viiijj_71", "jsCall_viiijj_72", "jsCall_viiijj_73", "jsCall_viiijj_74", "jsCall_viiijj_75", "jsCall_viiijj_76", "jsCall_viiijj_77", "jsCall_viiijj_78", "jsCall_viiijj_79", "jsCall_viiijj_80", "jsCall_viiijj_81", "jsCall_viiijj_82", "jsCall_viiijj_83", "jsCall_viiijj_84", "jsCall_viiijj_85", "jsCall_viiijj_86", "jsCall_viiijj_87", "jsCall_viiijj_88", "jsCall_viiijj_89", "jsCall_viiijj_90", "jsCall_viiijj_91", "jsCall_viiijj_92", "jsCall_viiijj_93", "jsCall_viiijj_94", "jsCall_viiijj_95", "jsCall_viiijj_96", "jsCall_viiijj_97", "jsCall_viiijj_98", "jsCall_viiijj_99", "_resample_one_int16", "_resample_one_int32", "_resample_one_float", "_resample_one_double", 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
var debug_tables = {
    "dd": debug_table_dd,
    "did": debug_table_did,
    "didd": debug_table_didd,
    "fii": debug_table_fii,
    "fiii": debug_table_fiii,
    "ii": debug_table_ii,
    "iid": debug_table_iid,
    "iidiiii": debug_table_iidiiii,
    "iii": debug_table_iii,
    "iiii": debug_table_iiii,
    "iiiii": debug_table_iiiii,
    "iiiiii": debug_table_iiiiii,
    "iiiiiii": debug_table_iiiiiii,
    "iiiiiiidiiddii": debug_table_iiiiiiidiiddii,
    "iiiiiiii": debug_table_iiiiiiii,
    "iiiiiiiid": debug_table_iiiiiiiid,
    "iiiiij": debug_table_iiiiij,
    "iiiji": debug_table_iiiji,
    "iiijjji": debug_table_iiijjji,
    "jii": debug_table_jii,
    "jiiij": debug_table_jiiij,
    "jiiji": debug_table_jiiji,
    "jij": debug_table_jij,
    "jiji": debug_table_jiji,
    "v": debug_table_v,
    "vdiidiiiii": debug_table_vdiidiiiii,
    "vdiidiiiiii": debug_table_vdiidiiiiii,
    "vi": debug_table_vi,
    "vii": debug_table_vii,
    "viidi": debug_table_viidi,
    "viifi": debug_table_viifi,
    "viii": debug_table_viii,
    "viiid": debug_table_viiid,
    "viiii": debug_table_viiii,
    "viiiifii": debug_table_viiiifii,
    "viiiii": debug_table_viiiii,
    "viiiiidd": debug_table_viiiiidd,
    "viiiiiddi": debug_table_viiiiiddi,
    "viiiiii": debug_table_viiiiii,
    "viiiiiifi": debug_table_viiiiiifi,
    "viiiiiii": debug_table_viiiiiii,
    "viiiiiiii": debug_table_viiiiiiii,
    "viiiiiiiid": debug_table_viiiiiiiid,
    "viiiiiiiidi": debug_table_viiiiiiiidi,
    "viiiiiiiii": debug_table_viiiiiiiii,
    "viiiiiiiiii": debug_table_viiiiiiiiii,
    "viiiiiiiiiii": debug_table_viiiiiiiiiii,
    "viiiiiiiiiiii": debug_table_viiiiiiiiiiii,
    "viiiiiiiiiiiiii": debug_table_viiiiiiiiiiiiii,
    "viiijj": debug_table_viiijj
};

function nullFunc_dd(x) {
    abortFnPtrError(x, "dd")
}

function nullFunc_did(x) {
    abortFnPtrError(x, "did")
}

function nullFunc_didd(x) {
    abortFnPtrError(x, "didd")
}

function nullFunc_fii(x) {
    abortFnPtrError(x, "fii")
}

function nullFunc_fiii(x) {
    abortFnPtrError(x, "fiii")
}

function nullFunc_ii(x) {
    abortFnPtrError(x, "ii")
}

function nullFunc_iid(x) {
    abortFnPtrError(x, "iid")
}

function nullFunc_iidiiii(x) {
    abortFnPtrError(x, "iidiiii")
}

function nullFunc_iii(x) {
    abortFnPtrError(x, "iii")
}

function nullFunc_iiii(x) {
    abortFnPtrError(x, "iiii")
}

function nullFunc_iiiii(x) {
    abortFnPtrError(x, "iiiii")
}

function nullFunc_iiiiii(x) {
    abortFnPtrError(x, "iiiiii")
}

function nullFunc_iiiiiii(x) {
    abortFnPtrError(x, "iiiiiii")
}

function nullFunc_iiiiiiidiiddii(x) {
    abortFnPtrError(x, "iiiiiiidiiddii")
}

function nullFunc_iiiiiiii(x) {
    abortFnPtrError(x, "iiiiiiii")
}

function nullFunc_iiiiiiiid(x) {
    abortFnPtrError(x, "iiiiiiiid")
}

function nullFunc_iiiiij(x) {
    abortFnPtrError(x, "iiiiij")
}

function nullFunc_iiiji(x) {
    abortFnPtrError(x, "iiiji")
}

function nullFunc_iiijjji(x) {
    abortFnPtrError(x, "iiijjji")
}

function nullFunc_jii(x) {
    abortFnPtrError(x, "jii")
}

function nullFunc_jiiij(x) {
    abortFnPtrError(x, "jiiij")
}

function nullFunc_jiiji(x) {
    abortFnPtrError(x, "jiiji")
}

function nullFunc_jij(x) {
    abortFnPtrError(x, "jij")
}

function nullFunc_jiji(x) {
    abortFnPtrError(x, "jiji")
}

function nullFunc_v(x) {
    abortFnPtrError(x, "v")
}

function nullFunc_vdiidiiiii(x) {
    abortFnPtrError(x, "vdiidiiiii")
}

function nullFunc_vdiidiiiiii(x) {
    abortFnPtrError(x, "vdiidiiiiii")
}

function nullFunc_vi(x) {
    abortFnPtrError(x, "vi")
}

function nullFunc_vii(x) {
    abortFnPtrError(x, "vii")
}

function nullFunc_viidi(x) {
    abortFnPtrError(x, "viidi")
}

function nullFunc_viifi(x) {
    abortFnPtrError(x, "viifi")
}

function nullFunc_viii(x) {
    abortFnPtrError(x, "viii")
}

function nullFunc_viiid(x) {
    abortFnPtrError(x, "viiid")
}

function nullFunc_viiii(x) {
    abortFnPtrError(x, "viiii")
}

function nullFunc_viiiifii(x) {
    abortFnPtrError(x, "viiiifii")
}

function nullFunc_viiiii(x) {
    abortFnPtrError(x, "viiiii")
}

function nullFunc_viiiiidd(x) {
    abortFnPtrError(x, "viiiiidd")
}

function nullFunc_viiiiiddi(x) {
    abortFnPtrError(x, "viiiiiddi")
}

function nullFunc_viiiiii(x) {
    abortFnPtrError(x, "viiiiii")
}

function nullFunc_viiiiiifi(x) {
    abortFnPtrError(x, "viiiiiifi")
}

function nullFunc_viiiiiii(x) {
    abortFnPtrError(x, "viiiiiii")
}

function nullFunc_viiiiiiii(x) {
    abortFnPtrError(x, "viiiiiiii")
}

function nullFunc_viiiiiiiid(x) {
    abortFnPtrError(x, "viiiiiiiid")
}

function nullFunc_viiiiiiiidi(x) {
    abortFnPtrError(x, "viiiiiiiidi")
}

function nullFunc_viiiiiiiii(x) {
    abortFnPtrError(x, "viiiiiiiii")
}

function nullFunc_viiiiiiiiii(x) {
    abortFnPtrError(x, "viiiiiiiiii")
}

function nullFunc_viiiiiiiiiii(x) {
    abortFnPtrError(x, "viiiiiiiiiii")
}

function nullFunc_viiiiiiiiiiii(x) {
    abortFnPtrError(x, "viiiiiiiiiiii")
}

function nullFunc_viiiiiiiiiiiiii(x) {
    abortFnPtrError(x, "viiiiiiiiiiiiii")
}

function nullFunc_viiijj(x) {
    abortFnPtrError(x, "viiijj")
}

function jsCall_dd(index, a1) {
    return functionPointers[index](a1)
}

function jsCall_did(index, a1, a2) {
    return functionPointers[index](a1, a2)
}

function jsCall_didd(index, a1, a2, a3) {
    return functionPointers[index](a1, a2, a3)
}

function jsCall_fii(index, a1, a2) {
    return functionPointers[index](a1, a2)
}

function jsCall_fiii(index, a1, a2, a3) {
    return functionPointers[index](a1, a2, a3)
}

function jsCall_ii(index, a1) {
    return functionPointers[index](a1)
}

function jsCall_iid(index, a1, a2) {
    return functionPointers[index](a1, a2)
}

function jsCall_iidiiii(index, a1, a2, a3, a4, a5, a6) {
    return functionPointers[index](a1, a2, a3, a4, a5, a6)
}

function jsCall_iii(index, a1, a2) {
    return functionPointers[index](a1, a2)
}

function jsCall_iiii(index, a1, a2, a3) {
    return functionPointers[index](a1, a2, a3)
}

function jsCall_iiiii(index, a1, a2, a3, a4) {
    return functionPointers[index](a1, a2, a3, a4)
}

function jsCall_iiiiii(index, a1, a2, a3, a4, a5) {
    return functionPointers[index](a1, a2, a3, a4, a5)
}

function jsCall_iiiiiii(index, a1, a2, a3, a4, a5, a6) {
    return functionPointers[index](a1, a2, a3, a4, a5, a6)
}

function jsCall_iiiiiiidiiddii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13) {
    return functionPointers[index](a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13)
}

function jsCall_iiiiiiii(index, a1, a2, a3, a4, a5, a6, a7) {
    return functionPointers[index](a1, a2, a3, a4, a5, a6, a7)
}

function jsCall_iiiiiiiid(index, a1, a2, a3, a4, a5, a6, a7, a8) {
    return functionPointers[index](a1, a2, a3, a4, a5, a6, a7, a8)
}

function jsCall_iiiiij(index, a1, a2, a3, a4, a5) {
    return functionPointers[index](a1, a2, a3, a4, a5)
}

function jsCall_iiiji(index, a1, a2, a3, a4) {
    return functionPointers[index](a1, a2, a3, a4)
}

function jsCall_iiijjji(index, a1, a2, a3, a4, a5, a6) {
    return functionPointers[index](a1, a2, a3, a4, a5, a6)
}

function jsCall_jii(index, a1, a2) {
    return functionPointers[index](a1, a2)
}

function jsCall_jiiij(index, a1, a2, a3, a4) {
    return functionPointers[index](a1, a2, a3, a4)
}

function jsCall_jiiji(index, a1, a2, a3, a4) {
    return functionPointers[index](a1, a2, a3, a4)
}

function jsCall_jij(index, a1, a2) {
    return functionPointers[index](a1, a2)
}

function jsCall_jiji(index, a1, a2, a3) {
    return functionPointers[index](a1, a2, a3)
}

function jsCall_v(index) {
    functionPointers[index]()
}

function jsCall_vdiidiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9) {
    functionPointers[index](a1, a2, a3, a4, a5, a6, a7, a8, a9)
}

function jsCall_vdiidiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10) {
    functionPointers[index](a1, a2, a3, a4, a5, a6, a7, a8, a9, a10)
}

function jsCall_vi(index, a1) {
    functionPointers[index](a1)
}

function jsCall_vii(index, a1, a2) {
    functionPointers[index](a1, a2)
}

function jsCall_viidi(index, a1, a2, a3, a4) {
    functionPointers[index](a1, a2, a3, a4)
}

function jsCall_viifi(index, a1, a2, a3, a4) {
    functionPointers[index](a1, a2, a3, a4)
}

function jsCall_viii(index, a1, a2, a3) {
    functionPointers[index](a1, a2, a3)
}

function jsCall_viiid(index, a1, a2, a3, a4) {
    functionPointers[index](a1, a2, a3, a4)
}

function jsCall_viiii(index, a1, a2, a3, a4) {
    functionPointers[index](a1, a2, a3, a4)
}

function jsCall_viiiifii(index, a1, a2, a3, a4, a5, a6, a7) {
    functionPointers[index](a1, a2, a3, a4, a5, a6, a7)
}

function jsCall_viiiii(index, a1, a2, a3, a4, a5) {
    functionPointers[index](a1, a2, a3, a4, a5)
}

function jsCall_viiiiidd(index, a1, a2, a3, a4, a5, a6, a7) {
    functionPointers[index](a1, a2, a3, a4, a5, a6, a7)
}

function jsCall_viiiiiddi(index, a1, a2, a3, a4, a5, a6, a7, a8) {
    functionPointers[index](a1, a2, a3, a4, a5, a6, a7, a8)
}

function jsCall_viiiiii(index, a1, a2, a3, a4, a5, a6) {
    functionPointers[index](a1, a2, a3, a4, a5, a6)
}

function jsCall_viiiiiifi(index, a1, a2, a3, a4, a5, a6, a7, a8) {
    functionPointers[index](a1, a2, a3, a4, a5, a6, a7, a8)
}

function jsCall_viiiiiii(index, a1, a2, a3, a4, a5, a6, a7) {
    functionPointers[index](a1, a2, a3, a4, a5, a6, a7)
}

function jsCall_viiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8) {
    functionPointers[index](a1, a2, a3, a4, a5, a6, a7, a8)
}

function jsCall_viiiiiiiid(index, a1, a2, a3, a4, a5, a6, a7, a8, a9) {
    functionPointers[index](a1, a2, a3, a4, a5, a6, a7, a8, a9)
}

function jsCall_viiiiiiiidi(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10) {
    functionPointers[index](a1, a2, a3, a4, a5, a6, a7, a8, a9, a10)
}

function jsCall_viiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9) {
    functionPointers[index](a1, a2, a3, a4, a5, a6, a7, a8, a9)
}

function jsCall_viiiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10) {
    functionPointers[index](a1, a2, a3, a4, a5, a6, a7, a8, a9, a10)
}

function jsCall_viiiiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11) {
    functionPointers[index](a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11)
}

function jsCall_viiiiiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12) {
    functionPointers[index](a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12)
}

function jsCall_viiiiiiiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14) {
    functionPointers[index](a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14)
}

function jsCall_viiijj(index, a1, a2, a3, a4, a5) {
    functionPointers[index](a1, a2, a3, a4, a5)
}
var asmGlobalArg = {};
var asmLibraryArg = {
    "___buildEnvironment": ___buildEnvironment,
    "___lock": ___lock,
    "___syscall221": ___syscall221,
    "___syscall3": ___syscall3,
    "___syscall5": ___syscall5,
    "___unlock": ___unlock,
    "___wasi_fd_close": ___wasi_fd_close,
    "___wasi_fd_fdstat_get": ___wasi_fd_fdstat_get,
    "___wasi_fd_seek": ___wasi_fd_seek,
    "___wasi_fd_write": ___wasi_fd_write,
    "__emscripten_fetch_free": __emscripten_fetch_free,
    "__memory_base": 1024,
    "__table_base": 0,
    "_abort": _abort,
    "_clock": _clock,
    "_clock_gettime": _clock_gettime,
    "_emscripten_asm_const_i": _emscripten_asm_const_i,
    "_emscripten_get_heap_size": _emscripten_get_heap_size,
    "_emscripten_is_main_browser_thread": _emscripten_is_main_browser_thread,
    "_emscripten_memcpy_big": _emscripten_memcpy_big,
    "_emscripten_resize_heap": _emscripten_resize_heap,
    "_emscripten_start_fetch": _emscripten_start_fetch,
    "_fabs": _fabs,
    "_getenv": _getenv,
    "_gettimeofday": _gettimeofday,
    "_gmtime_r": _gmtime_r,
    "_llvm_exp2_f64": _llvm_exp2_f64,
    "_llvm_log2_f32": _llvm_log2_f32,
    "_llvm_stackrestore": _llvm_stackrestore,
    "_llvm_stacksave": _llvm_stacksave,
    "_llvm_trunc_f64": _llvm_trunc_f64,
    "_localtime_r": _localtime_r,
    "_nanosleep": _nanosleep,
    "_pthread_cond_destroy": _pthread_cond_destroy,
    "_pthread_cond_init": _pthread_cond_init,
    "_pthread_create": _pthread_create,
    "_pthread_join": _pthread_join,
    "_strftime": _strftime,
    "_sysconf": _sysconf,
    "_time": _time,
    "abortStackOverflow": abortStackOverflow,
    "getTempRet0": getTempRet0,
    "jsCall_dd": jsCall_dd,
    "jsCall_did": jsCall_did,
    "jsCall_didd": jsCall_didd,
    "jsCall_fii": jsCall_fii,
    "jsCall_fiii": jsCall_fiii,
    "jsCall_ii": jsCall_ii,
    "jsCall_iid": jsCall_iid,
    "jsCall_iidiiii": jsCall_iidiiii,
    "jsCall_iii": jsCall_iii,
    "jsCall_iiii": jsCall_iiii,
    "jsCall_iiiii": jsCall_iiiii,
    "jsCall_iiiiii": jsCall_iiiiii,
    "jsCall_iiiiiii": jsCall_iiiiiii,
    "jsCall_iiiiiiidiiddii": jsCall_iiiiiiidiiddii,
    "jsCall_iiiiiiii": jsCall_iiiiiiii,
    "jsCall_iiiiiiiid": jsCall_iiiiiiiid,
    "jsCall_iiiiij": jsCall_iiiiij,
    "jsCall_iiiji": jsCall_iiiji,
    "jsCall_iiijjji": jsCall_iiijjji,
    "jsCall_jii": jsCall_jii,
    "jsCall_jiiij": jsCall_jiiij,
    "jsCall_jiiji": jsCall_jiiji,
    "jsCall_jij": jsCall_jij,
    "jsCall_jiji": jsCall_jiji,
    "jsCall_v": jsCall_v,
    "jsCall_vdiidiiiii": jsCall_vdiidiiiii,
    "jsCall_vdiidiiiiii": jsCall_vdiidiiiiii,
    "jsCall_vi": jsCall_vi,
    "jsCall_vii": jsCall_vii,
    "jsCall_viidi": jsCall_viidi,
    "jsCall_viifi": jsCall_viifi,
    "jsCall_viii": jsCall_viii,
    "jsCall_viiid": jsCall_viiid,
    "jsCall_viiii": jsCall_viiii,
    "jsCall_viiiifii": jsCall_viiiifii,
    "jsCall_viiiii": jsCall_viiiii,
    "jsCall_viiiiidd": jsCall_viiiiidd,
    "jsCall_viiiiiddi": jsCall_viiiiiddi,
    "jsCall_viiiiii": jsCall_viiiiii,
    "jsCall_viiiiiifi": jsCall_viiiiiifi,
    "jsCall_viiiiiii": jsCall_viiiiiii,
    "jsCall_viiiiiiii": jsCall_viiiiiiii,
    "jsCall_viiiiiiiid": jsCall_viiiiiiiid,
    "jsCall_viiiiiiiidi": jsCall_viiiiiiiidi,
    "jsCall_viiiiiiiii": jsCall_viiiiiiiii,
    "jsCall_viiiiiiiiii": jsCall_viiiiiiiiii,
    "jsCall_viiiiiiiiiii": jsCall_viiiiiiiiiii,
    "jsCall_viiiiiiiiiiii": jsCall_viiiiiiiiiiii,
    "jsCall_viiiiiiiiiiiiii": jsCall_viiiiiiiiiiiiii,
    "jsCall_viiijj": jsCall_viiijj,
    "memory": wasmMemory,
    "nullFunc_dd": nullFunc_dd,
    "nullFunc_did": nullFunc_did,
    "nullFunc_didd": nullFunc_didd,
    "nullFunc_fii": nullFunc_fii,
    "nullFunc_fiii": nullFunc_fiii,
    "nullFunc_ii": nullFunc_ii,
    "nullFunc_iid": nullFunc_iid,
    "nullFunc_iidiiii": nullFunc_iidiiii,
    "nullFunc_iii": nullFunc_iii,
    "nullFunc_iiii": nullFunc_iiii,
    "nullFunc_iiiii": nullFunc_iiiii,
    "nullFunc_iiiiii": nullFunc_iiiiii,
    "nullFunc_iiiiiii": nullFunc_iiiiiii,
    "nullFunc_iiiiiiidiiddii": nullFunc_iiiiiiidiiddii,
    "nullFunc_iiiiiiii": nullFunc_iiiiiiii,
    "nullFunc_iiiiiiiid": nullFunc_iiiiiiiid,
    "nullFunc_iiiiij": nullFunc_iiiiij,
    "nullFunc_iiiji": nullFunc_iiiji,
    "nullFunc_iiijjji": nullFunc_iiijjji,
    "nullFunc_jii": nullFunc_jii,
    "nullFunc_jiiij": nullFunc_jiiij,
    "nullFunc_jiiji": nullFunc_jiiji,
    "nullFunc_jij": nullFunc_jij,
    "nullFunc_jiji": nullFunc_jiji,
    "nullFunc_v": nullFunc_v,
    "nullFunc_vdiidiiiii": nullFunc_vdiidiiiii,
    "nullFunc_vdiidiiiiii": nullFunc_vdiidiiiiii,
    "nullFunc_vi": nullFunc_vi,
    "nullFunc_vii": nullFunc_vii,
    "nullFunc_viidi": nullFunc_viidi,
    "nullFunc_viifi": nullFunc_viifi,
    "nullFunc_viii": nullFunc_viii,
    "nullFunc_viiid": nullFunc_viiid,
    "nullFunc_viiii": nullFunc_viiii,
    "nullFunc_viiiifii": nullFunc_viiiifii,
    "nullFunc_viiiii": nullFunc_viiiii,
    "nullFunc_viiiiidd": nullFunc_viiiiidd,
    "nullFunc_viiiiiddi": nullFunc_viiiiiddi,
    "nullFunc_viiiiii": nullFunc_viiiiii,
    "nullFunc_viiiiiifi": nullFunc_viiiiiifi,
    "nullFunc_viiiiiii": nullFunc_viiiiiii,
    "nullFunc_viiiiiiii": nullFunc_viiiiiiii,
    "nullFunc_viiiiiiiid": nullFunc_viiiiiiiid,
    "nullFunc_viiiiiiiidi": nullFunc_viiiiiiiidi,
    "nullFunc_viiiiiiiii": nullFunc_viiiiiiiii,
    "nullFunc_viiiiiiiiii": nullFunc_viiiiiiiiii,
    "nullFunc_viiiiiiiiiii": nullFunc_viiiiiiiiiii,
    "nullFunc_viiiiiiiiiiii": nullFunc_viiiiiiiiiiii,
    "nullFunc_viiiiiiiiiiiiii": nullFunc_viiiiiiiiiiiiii,
    "nullFunc_viiijj": nullFunc_viiijj,
    "table": wasmTable
};
var asm = Module["asm"](asmGlobalArg, asmLibraryArg, buffer);
Module["asm"] = asm;
var _AVPlayerInit = Module["_AVPlayerInit"] = function() {
    assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
    assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
    return Module["asm"]["_AVPlayerInit"].apply(null, arguments)
};
var _AVSniffHttpFlvInit = Module["_AVSniffHttpFlvInit"] = function() {
    assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
    assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
    return Module["asm"]["_AVSniffHttpFlvInit"].apply(null, arguments)
};
var _AVSniffHttpG711Init = Module["_AVSniffHttpG711Init"] = function() {
    assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
    assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
    return Module["asm"]["_AVSniffHttpG711Init"].apply(null, arguments)
};
var _AVSniffStreamInit = Module["_AVSniffStreamInit"] = function() {
    assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
    assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
    return Module["asm"]["_AVSniffStreamInit"].apply(null, arguments)
};
var ___emscripten_environ_constructor = Module["___emscripten_environ_constructor"] = function() {
    assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
    assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
    return Module["asm"]["___emscripten_environ_constructor"].apply(null, arguments)
};
var ___errno_location = Module["___errno_location"] = function() {
    assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
    assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
    return Module["asm"]["___errno_location"].apply(null, arguments)
};
var __get_daylight = Module["__get_daylight"] = function() {
    assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
    assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
    return Module["asm"]["__get_daylight"].apply(null, arguments)
};
var __get_timezone = Module["__get_timezone"] = function() {
    assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
    assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
    return Module["asm"]["__get_timezone"].apply(null, arguments)
};
var __get_tzname = Module["__get_tzname"] = function() {
    assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
    assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
    return Module["asm"]["__get_tzname"].apply(null, arguments)
};
var _closeVideo = Module["_closeVideo"] = function() {
    assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
    assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
    return Module["asm"]["_closeVideo"].apply(null, arguments)
};
var _decodeCodecContext = Module["_decodeCodecContext"] = function() {
    assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
    assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
    return Module["asm"]["_decodeCodecContext"].apply(null, arguments)
};
var _decodeG711Frame = Module["_decodeG711Frame"] = function() {
    assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
    assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
    return Module["asm"]["_decodeG711Frame"].apply(null, arguments)
};
var _decodeHttpFlvVideoFrame = Module["_decodeHttpFlvVideoFrame"] = function() {
    assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
    assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
    return Module["asm"]["_decodeHttpFlvVideoFrame"].apply(null, arguments)
};
var _decodeVideoFrame = Module["_decodeVideoFrame"] = function() {
    assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
    assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
    return Module["asm"]["_decodeVideoFrame"].apply(null, arguments)
};
var _demuxBox = Module["_demuxBox"] = function() {
    assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
    assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
    return Module["asm"]["_demuxBox"].apply(null, arguments)
};
var _exitMissile = Module["_exitMissile"] = function() {
    assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
    assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
    return Module["asm"]["_exitMissile"].apply(null, arguments)
};
var _exitTsMissile = Module["_exitTsMissile"] = function() {
    assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
    assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
    return Module["asm"]["_exitTsMissile"].apply(null, arguments)
};
var _fflush = Module["_fflush"] = function() {
    assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
    assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
    return Module["asm"]["_fflush"].apply(null, arguments)
};
var _free = Module["_free"] = function() {
    assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
    assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
    return Module["asm"]["_free"].apply(null, arguments)
};
var _getAudioCodecID = Module["_getAudioCodecID"] = function() {
    assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
    assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
    return Module["asm"]["_getAudioCodecID"].apply(null, arguments)
};
var _getBufferLengthApi = Module["_getBufferLengthApi"] = function() {
    assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
    assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
    return Module["asm"]["_getBufferLengthApi"].apply(null, arguments)
};
var _getExtensionInfo = Module["_getExtensionInfo"] = function() {
    assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
    assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
    return Module["asm"]["_getExtensionInfo"].apply(null, arguments)
};
var _getG711BufferLengthApi = Module["_getG711BufferLengthApi"] = function() {
    assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
    assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
    return Module["asm"]["_getG711BufferLengthApi"].apply(null, arguments)
};
var _getMediaInfo = Module["_getMediaInfo"] = function() {
    assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
    assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
    return Module["asm"]["_getMediaInfo"].apply(null, arguments)
};
var _getPPS = Module["_getPPS"] = function() {
    assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
    assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
    return Module["asm"]["_getPPS"].apply(null, arguments)
};
var _getPPSLen = Module["_getPPSLen"] = function() {
    assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
    assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
    return Module["asm"]["_getPPSLen"].apply(null, arguments)
};
var _getPacket = Module["_getPacket"] = function() {
    assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
    assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
    return Module["asm"]["_getPacket"].apply(null, arguments)
};
var _getSEI = Module["_getSEI"] = function() {
    assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
    assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
    return Module["asm"]["_getSEI"].apply(null, arguments)
};
var _getSEILen = Module["_getSEILen"] = function() {
    assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
    assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
    return Module["asm"]["_getSEILen"].apply(null, arguments)
};
var _getSPS = Module["_getSPS"] = function() {
    assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
    assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
    return Module["asm"]["_getSPS"].apply(null, arguments)
};
var _getSPSLen = Module["_getSPSLen"] = function() {
    assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
    assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
    return Module["asm"]["_getSPSLen"].apply(null, arguments)
};
var _getSniffHttpFlvPkg = Module["_getSniffHttpFlvPkg"] = function() {
    assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
    assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
    return Module["asm"]["_getSniffHttpFlvPkg"].apply(null, arguments)
};
var _getSniffHttpFlvPkgNoCheckProbe = Module["_getSniffHttpFlvPkgNoCheckProbe"] = function() {
    assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
    assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
    return Module["asm"]["_getSniffHttpFlvPkgNoCheckProbe"].apply(null, arguments)
};
var _getSniffStreamPkg = Module["_getSniffStreamPkg"] = function() {
    assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
    assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
    return Module["asm"]["_getSniffStreamPkg"].apply(null, arguments)
};
var _getSniffStreamPkgNoCheckProbe = Module["_getSniffStreamPkgNoCheckProbe"] = function() {
    assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
    assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
    return Module["asm"]["_getSniffStreamPkgNoCheckProbe"].apply(null, arguments)
};
var _getVLC = Module["_getVLC"] = function() {
    assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
    assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
    return Module["asm"]["_getVLC"].apply(null, arguments)
};
var _getVLCLen = Module["_getVLCLen"] = function() {
    assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
    assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
    return Module["asm"]["_getVLCLen"].apply(null, arguments)
};
var _getVPS = Module["_getVPS"] = function() {
    assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
    assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
    return Module["asm"]["_getVPS"].apply(null, arguments)
};
var _getVPSLen = Module["_getVPSLen"] = function() {
    assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
    assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
    return Module["asm"]["_getVPSLen"].apply(null, arguments)
};
var _getVideoCodecID = Module["_getVideoCodecID"] = function() {
    assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
    assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
    return Module["asm"]["_getVideoCodecID"].apply(null, arguments)
};
var _initTsMissile = Module["_initTsMissile"] = function() {
    assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
    assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
    return Module["asm"]["_initTsMissile"].apply(null, arguments)
};
var _initializeDecoder = Module["_initializeDecoder"] = function() {
    assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
    assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
    return Module["asm"]["_initializeDecoder"].apply(null, arguments)
};
var _initializeDemuxer = Module["_initializeDemuxer"] = function() {
    assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
    assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
    return Module["asm"]["_initializeDemuxer"].apply(null, arguments)
};
var _initializeSniffG711Module = Module["_initializeSniffG711Module"] = function() {
    assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
    assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
    return Module["asm"]["_initializeSniffG711Module"].apply(null, arguments)
};
var _initializeSniffHttpFlvModule = Module["_initializeSniffHttpFlvModule"] = function() {
    assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
    assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
    return Module["asm"]["_initializeSniffHttpFlvModule"].apply(null, arguments)
};
var _initializeSniffHttpFlvModuleWithAOpt = Module["_initializeSniffHttpFlvModuleWithAOpt"] = function() {
    assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
    assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
    return Module["asm"]["_initializeSniffHttpFlvModuleWithAOpt"].apply(null, arguments)
};
var _initializeSniffStreamModule = Module["_initializeSniffStreamModule"] = function() {
    assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
    assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
    return Module["asm"]["_initializeSniffStreamModule"].apply(null, arguments)
};
var _initializeSniffStreamModuleWithAOpt = Module["_initializeSniffStreamModuleWithAOpt"] = function() {
    assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
    assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
    return Module["asm"]["_initializeSniffStreamModuleWithAOpt"].apply(null, arguments)
};
var _main = Module["_main"] = function() {
    assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
    assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
    return Module["asm"]["_main"].apply(null, arguments)
};
var _malloc = Module["_malloc"] = function() {
    assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
    assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
    return Module["asm"]["_malloc"].apply(null, arguments)
};
var _naluLListLength = Module["_naluLListLength"] = function() {
    assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
    assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
    return Module["asm"]["_naluLListLength"].apply(null, arguments)
};
var _pushSniffG711FlvData = Module["_pushSniffG711FlvData"] = function() {
    assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
    assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
    return Module["asm"]["_pushSniffG711FlvData"].apply(null, arguments)
};
var _pushSniffHttpFlvData = Module["_pushSniffHttpFlvData"] = function() {
    assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
    assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
    return Module["asm"]["_pushSniffHttpFlvData"].apply(null, arguments)
};
var _pushSniffStreamData = Module["_pushSniffStreamData"] = function() {
    assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
    assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
    return Module["asm"]["_pushSniffStreamData"].apply(null, arguments)
};
var _registerPlayer = Module["_registerPlayer"] = function() {
    assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
    assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
    return Module["asm"]["_registerPlayer"].apply(null, arguments)
};
var _release = Module["_release"] = function() {
    assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
    assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
    return Module["asm"]["_release"].apply(null, arguments)
};
var _releaseG711 = Module["_releaseG711"] = function() {
    assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
    assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
    return Module["asm"]["_releaseG711"].apply(null, arguments)
};
var _releaseHttpFLV = Module["_releaseHttpFLV"] = function() {
    assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
    assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
    return Module["asm"]["_releaseHttpFLV"].apply(null, arguments)
};
var _releaseSniffHttpFlv = Module["_releaseSniffHttpFlv"] = function() {
    assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
    assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
    return Module["asm"]["_releaseSniffHttpFlv"].apply(null, arguments)
};
var _releaseSniffStream = Module["_releaseSniffStream"] = function() {
    assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
    assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
    return Module["asm"]["_releaseSniffStream"].apply(null, arguments)
};
var _setCodecType = Module["_setCodecType"] = function() {
    assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
    assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
    return Module["asm"]["_setCodecType"].apply(null, arguments)
};
var establishStackSpace = Module["establishStackSpace"] = function() {
    assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
    assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
    return Module["asm"]["establishStackSpace"].apply(null, arguments)
};
var stackAlloc = Module["stackAlloc"] = function() {
    assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
    assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
    return Module["asm"]["stackAlloc"].apply(null, arguments)
};
var stackRestore = Module["stackRestore"] = function() {
    assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
    assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
    return Module["asm"]["stackRestore"].apply(null, arguments)
};
var stackSave = Module["stackSave"] = function() {
    assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
    assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
    return Module["asm"]["stackSave"].apply(null, arguments)
};
var dynCall_v = Module["dynCall_v"] = function() {
    assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
    assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
    return Module["asm"]["dynCall_v"].apply(null, arguments)
};
var dynCall_vi = Module["dynCall_vi"] = function() {
    assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
    assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
    return Module["asm"]["dynCall_vi"].apply(null, arguments)
};
Module["asm"] = asm;
if (!Object.getOwnPropertyDescriptor(Module, "intArrayFromString")) Module["intArrayFromString"] = function() {
    abort("'intArrayFromString' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")
};
if (!Object.getOwnPropertyDescriptor(Module, "intArrayToString")) Module["intArrayToString"] = function() {
    abort("'intArrayToString' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")
};
Module["ccall"] = ccall;
Module["cwrap"] = cwrap;
if (!Object.getOwnPropertyDescriptor(Module, "setValue")) Module["setValue"] = function() {
    abort("'setValue' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")
};
if (!Object.getOwnPropertyDescriptor(Module, "getValue")) Module["getValue"] = function() {
    abort("'getValue' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")
};
if (!Object.getOwnPropertyDescriptor(Module, "allocate")) Module["allocate"] = function() {
    abort("'allocate' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")
};
if (!Object.getOwnPropertyDescriptor(Module, "getMemory")) Module["getMemory"] = function() {
    abort("'getMemory' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you")
};
if (!Object.getOwnPropertyDescriptor(Module, "AsciiToString")) Module["AsciiToString"] = function() {
    abort("'AsciiToString' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")
};
if (!Object.getOwnPropertyDescriptor(Module, "stringToAscii")) Module["stringToAscii"] = function() {
    abort("'stringToAscii' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")
};
if (!Object.getOwnPropertyDescriptor(Module, "UTF8ArrayToString")) Module["UTF8ArrayToString"] = function() {
    abort("'UTF8ArrayToString' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")
};
if (!Object.getOwnPropertyDescriptor(Module, "UTF8ToString")) Module["UTF8ToString"] = function() {
    abort("'UTF8ToString' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")
};
if (!Object.getOwnPropertyDescriptor(Module, "stringToUTF8Array")) Module["stringToUTF8Array"] = function() {
    abort("'stringToUTF8Array' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")
};
if (!Object.getOwnPropertyDescriptor(Module, "stringToUTF8")) Module["stringToUTF8"] = function() {
    abort("'stringToUTF8' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")
};
if (!Object.getOwnPropertyDescriptor(Module, "lengthBytesUTF8")) Module["lengthBytesUTF8"] = function() {
    abort("'lengthBytesUTF8' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")
};
if (!Object.getOwnPropertyDescriptor(Module, "UTF16ToString")) Module["UTF16ToString"] = function() {
    abort("'UTF16ToString' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")
};
if (!Object.getOwnPropertyDescriptor(Module, "stringToUTF16")) Module["stringToUTF16"] = function() {
    abort("'stringToUTF16' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")
};
if (!Object.getOwnPropertyDescriptor(Module, "lengthBytesUTF16")) Module["lengthBytesUTF16"] = function() {
    abort("'lengthBytesUTF16' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")
};
if (!Object.getOwnPropertyDescriptor(Module, "UTF32ToString")) Module["UTF32ToString"] = function() {
    abort("'UTF32ToString' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")
};
if (!Object.getOwnPropertyDescriptor(Module, "stringToUTF32")) Module["stringToUTF32"] = function() {
    abort("'stringToUTF32' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")
};
if (!Object.getOwnPropertyDescriptor(Module, "lengthBytesUTF32")) Module["lengthBytesUTF32"] = function() {
    abort("'lengthBytesUTF32' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")
};
if (!Object.getOwnPropertyDescriptor(Module, "allocateUTF8")) Module["allocateUTF8"] = function() {
    abort("'allocateUTF8' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")
};
if (!Object.getOwnPropertyDescriptor(Module, "stackTrace")) Module["stackTrace"] = function() {
    abort("'stackTrace' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")
};
if (!Object.getOwnPropertyDescriptor(Module, "addOnPreRun")) Module["addOnPreRun"] = function() {
    abort("'addOnPreRun' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")
};
if (!Object.getOwnPropertyDescriptor(Module, "addOnInit")) Module["addOnInit"] = function() {
    abort("'addOnInit' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")
};
if (!Object.getOwnPropertyDescriptor(Module, "addOnPreMain")) Module["addOnPreMain"] = function() {
    abort("'addOnPreMain' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")
};
if (!Object.getOwnPropertyDescriptor(Module, "addOnExit")) Module["addOnExit"] = function() {
    abort("'addOnExit' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")
};
if (!Object.getOwnPropertyDescriptor(Module, "addOnPostRun")) Module["addOnPostRun"] = function() {
    abort("'addOnPostRun' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")
};
if (!Object.getOwnPropertyDescriptor(Module, "writeStringToMemory")) Module["writeStringToMemory"] = function() {
    abort("'writeStringToMemory' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")
};
if (!Object.getOwnPropertyDescriptor(Module, "writeArrayToMemory")) Module["writeArrayToMemory"] = function() {
    abort("'writeArrayToMemory' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")
};
if (!Object.getOwnPropertyDescriptor(Module, "writeAsciiToMemory")) Module["writeAsciiToMemory"] = function() {
    abort("'writeAsciiToMemory' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")
};
if (!Object.getOwnPropertyDescriptor(Module, "addRunDependency")) Module["addRunDependency"] = function() {
    abort("'addRunDependency' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you")
};
if (!Object.getOwnPropertyDescriptor(Module, "removeRunDependency")) Module["removeRunDependency"] = function() {
    abort("'removeRunDependency' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you")
};
if (!Object.getOwnPropertyDescriptor(Module, "ENV")) Module["ENV"] = function() {
    abort("'ENV' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")
};
if (!Object.getOwnPropertyDescriptor(Module, "FS")) Module["FS"] = function() {
    abort("'FS' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")
};
if (!Object.getOwnPropertyDescriptor(Module, "FS_createFolder")) Module["FS_createFolder"] = function() {
    abort("'FS_createFolder' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you")
};
if (!Object.getOwnPropertyDescriptor(Module, "FS_createPath")) Module["FS_createPath"] = function() {
    abort("'FS_createPath' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you")
};
if (!Object.getOwnPropertyDescriptor(Module, "FS_createDataFile")) Module["FS_createDataFile"] = function() {
    abort("'FS_createDataFile' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you")
};
if (!Object.getOwnPropertyDescriptor(Module, "FS_createPreloadedFile")) Module["FS_createPreloadedFile"] = function() {
    abort("'FS_createPreloadedFile' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you")
};
if (!Object.getOwnPropertyDescriptor(Module, "FS_createLazyFile")) Module["FS_createLazyFile"] = function() {
    abort("'FS_createLazyFile' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you")
};
if (!Object.getOwnPropertyDescriptor(Module, "FS_createLink")) Module["FS_createLink"] = function() {
    abort("'FS_createLink' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you")
};
if (!Object.getOwnPropertyDescriptor(Module, "FS_createDevice")) Module["FS_createDevice"] = function() {
    abort("'FS_createDevice' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you")
};
if (!Object.getOwnPropertyDescriptor(Module, "FS_unlink")) Module["FS_unlink"] = function() {
    abort("'FS_unlink' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you")
};
if (!Object.getOwnPropertyDescriptor(Module, "GL")) Module["GL"] = function() {
    abort("'GL' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")
};
if (!Object.getOwnPropertyDescriptor(Module, "dynamicAlloc")) Module["dynamicAlloc"] = function() {
    abort("'dynamicAlloc' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")
};
if (!Object.getOwnPropertyDescriptor(Module, "loadDynamicLibrary")) Module["loadDynamicLibrary"] = function() {
    abort("'loadDynamicLibrary' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")
};
if (!Object.getOwnPropertyDescriptor(Module, "loadWebAssemblyModule")) Module["loadWebAssemblyModule"] = function() {
    abort("'loadWebAssemblyModule' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")
};
if (!Object.getOwnPropertyDescriptor(Module, "getLEB")) Module["getLEB"] = function() {
    abort("'getLEB' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")
};
if (!Object.getOwnPropertyDescriptor(Module, "getFunctionTables")) Module["getFunctionTables"] = function() {
    abort("'getFunctionTables' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")
};
if (!Object.getOwnPropertyDescriptor(Module, "alignFunctionTables")) Module["alignFunctionTables"] = function() {
    abort("'alignFunctionTables' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")
};
if (!Object.getOwnPropertyDescriptor(Module, "registerFunctions")) Module["registerFunctions"] = function() {
    abort("'registerFunctions' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")
};
Module["addFunction"] = addFunction;
Module["removeFunction"] = removeFunction;
if (!Object.getOwnPropertyDescriptor(Module, "getFuncWrapper")) Module["getFuncWrapper"] = function() {
    abort("'getFuncWrapper' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")
};
if (!Object.getOwnPropertyDescriptor(Module, "prettyPrint")) Module["prettyPrint"] = function() {
    abort("'prettyPrint' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")
};
if (!Object.getOwnPropertyDescriptor(Module, "makeBigInt")) Module["makeBigInt"] = function() {
    abort("'makeBigInt' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")
};
if (!Object.getOwnPropertyDescriptor(Module, "dynCall")) Module["dynCall"] = function() {
    abort("'dynCall' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")
};
if (!Object.getOwnPropertyDescriptor(Module, "getCompilerSetting")) Module["getCompilerSetting"] = function() {
    abort("'getCompilerSetting' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")
};
if (!Object.getOwnPropertyDescriptor(Module, "stackSave")) Module["stackSave"] = function() {
    abort("'stackSave' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")
};
if (!Object.getOwnPropertyDescriptor(Module, "stackRestore")) Module["stackRestore"] = function() {
    abort("'stackRestore' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")
};
if (!Object.getOwnPropertyDescriptor(Module, "stackAlloc")) Module["stackAlloc"] = function() {
    abort("'stackAlloc' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")
};
if (!Object.getOwnPropertyDescriptor(Module, "establishStackSpace")) Module["establishStackSpace"] = function() {
    abort("'establishStackSpace' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")
};
if (!Object.getOwnPropertyDescriptor(Module, "print")) Module["print"] = function() {
    abort("'print' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")
};
if (!Object.getOwnPropertyDescriptor(Module, "printErr")) Module["printErr"] = function() {
    abort("'printErr' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")
};
if (!Object.getOwnPropertyDescriptor(Module, "getTempRet0")) Module["getTempRet0"] = function() {
    abort("'getTempRet0' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")
};
if (!Object.getOwnPropertyDescriptor(Module, "setTempRet0")) Module["setTempRet0"] = function() {
    abort("'setTempRet0' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")
};
if (!Object.getOwnPropertyDescriptor(Module, "callMain")) Module["callMain"] = function() {
    abort("'callMain' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")
};
if (!Object.getOwnPropertyDescriptor(Module, "abort")) Module["abort"] = function() {
    abort("'abort' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")
};
if (!Object.getOwnPropertyDescriptor(Module, "Pointer_stringify")) Module["Pointer_stringify"] = function() {
    abort("'Pointer_stringify' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")
};
if (!Object.getOwnPropertyDescriptor(Module, "warnOnce")) Module["warnOnce"] = function() {
    abort("'warnOnce' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")
};
if (!Object.getOwnPropertyDescriptor(Module, "ALLOC_NORMAL")) Object.defineProperty(Module, "ALLOC_NORMAL", {
    configurable: true,
    get: function() {
        abort("'ALLOC_NORMAL' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")
    }
});
if (!Object.getOwnPropertyDescriptor(Module, "ALLOC_STACK")) Object.defineProperty(Module, "ALLOC_STACK", {
    configurable: true,
    get: function() {
        abort("'ALLOC_STACK' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")
    }
});
if (!Object.getOwnPropertyDescriptor(Module, "ALLOC_DYNAMIC")) Object.defineProperty(Module, "ALLOC_DYNAMIC", {
    configurable: true,
    get: function() {
        abort("'ALLOC_DYNAMIC' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")
    }
});
if (!Object.getOwnPropertyDescriptor(Module, "ALLOC_NONE")) Object.defineProperty(Module, "ALLOC_NONE", {
    configurable: true,
    get: function() {
        abort("'ALLOC_NONE' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")
    }
});
if (!Object.getOwnPropertyDescriptor(Module, "calledRun")) Object.defineProperty(Module, "calledRun", {
    configurable: true,
    get: function() {
        abort("'calledRun' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you")
    }
});
var calledRun;

function ExitStatus(status) {
    this.name = "ExitStatus";
    this.message = "Program terminated with exit(" + status + ")";
    this.status = status
}
var calledMain = false;
dependenciesFulfilled = function runCaller() {
    if (!calledRun) run();
    if (!calledRun) dependenciesFulfilled = runCaller
};

function callMain(args) {
    assert(runDependencies == 0, 'cannot call main when async dependencies remain! (listen on Module["onRuntimeInitialized"])');
    assert(__ATPRERUN__.length == 0, "cannot call main when preRun functions remain to be called");
    args = args || [];
    var argc = args.length + 1;
    var argv = stackAlloc((argc + 1) * 4);
    HEAP32[argv >> 2] = allocateUTF8OnStack(thisProgram);
    for (var i = 1; i < argc; i++) {
        HEAP32[(argv >> 2) + i] = allocateUTF8OnStack(args[i - 1])
    }
    HEAP32[(argv >> 2) + argc] = 0;
    try {
        var ret = Module["_main"](argc, argv);
        exit(ret, true)
    } catch (e) {
        if (e instanceof ExitStatus) {
            return
        } else if (e == "SimulateInfiniteLoop") {
            noExitRuntime = true;
            return
        } else {
            var toLog = e;
            if (e && typeof e === "object" && e.stack) {
                toLog = [e, e.stack]
            }
            err("exception thrown: " + toLog);
            quit_(1, e)
        }
    } finally {
        calledMain = true
    }
}

function run(args) {
    args = args || arguments_;
    if (runDependencies > 0) {
        return
    }
    writeStackCookie();
    preRun();
    if (runDependencies > 0) return;

    function doRun() {
        if (calledRun) return;
        calledRun = true;
        if (ABORT) return;
        initRuntime();
        preMain();
        if (Module["onRuntimeInitialized"]) Module["onRuntimeInitialized"]();
        if (shouldRunNow) callMain(args);
        postRun()
    }
    if (Module["setStatus"]) {
        Module["setStatus"]("Running...");
        setTimeout(function() {
            setTimeout(function() {
                Module["setStatus"]("")
            }, 1);
            doRun()
        }, 1)
    } else {
        doRun()
    }
    checkStackCookie()
}
Module["run"] = run;

function checkUnflushedContent() {
    var print = out;
    var printErr = err;
    var has = false;
    out = err = function(x) {
        has = true
    };
    try {
        var flush = Module["_fflush"];
        if (flush) flush(0);
        ["stdout", "stderr"].forEach(function(name) {
            var info = FS.analyzePath("/dev/" + name);
            if (!info) return;
            var stream = info.object;
            var rdev = stream.rdev;
            var tty = TTY.ttys[rdev];
            if (tty && tty.output && tty.output.length) {
                has = true
            }
        })
    } catch (e) {}
    out = print;
    err = printErr;
    if (has) {
        warnOnce("stdio streams had content in them that was not flushed. you should set EXIT_RUNTIME to 1 (see the FAQ), or make sure to emit a newline when you printf etc.")
    }
}

function exit(status, implicit) {
    checkUnflushedContent();
    if (implicit && noExitRuntime && status === 0) {
        return
    }
    if (noExitRuntime) {
        if (!implicit) {
            err("exit(" + status + ") called, but EXIT_RUNTIME is not set, so halting execution but not exiting the runtime or preventing further async execution (build with EXIT_RUNTIME=1, if you want a true shutdown)")
        }
    } else {
        ABORT = true;
        EXITSTATUS = status;
        exitRuntime();
        if (Module["onExit"]) Module["onExit"](status)
    }
    quit_(status, new ExitStatus(status))
}
if (Module["preInit"]) {
    if (typeof Module["preInit"] == "function") Module["preInit"] = [Module["preInit"]];
    while (Module["preInit"].length > 0) {
        Module["preInit"].pop()()
    }
}
var shouldRunNow = true;
if (Module["noInitialRun"]) shouldRunNow = false;
noExitRuntime = true;
run();