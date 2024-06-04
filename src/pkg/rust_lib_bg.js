let wasm;
export function __wbg_set_wasm(val) {
    wasm = val;
}


const heap = new Array(128).fill(undefined);

heap.push(undefined, null, true, false);

function getObject(idx) { return heap[idx]; }

let heap_next = heap.length;

function addHeapObject(obj) {
    if (heap_next === heap.length) heap.push(heap.length + 1);
    const idx = heap_next;
    heap_next = heap[idx];

    heap[idx] = obj;
    return idx;
}

function dropObject(idx) {
    if (idx < 132) return;
    heap[idx] = heap_next;
    heap_next = idx;
}

function takeObject(idx) {
    const ret = getObject(idx);
    dropObject(idx);
    return ret;
}

const lTextDecoder = typeof TextDecoder === 'undefined' ? (0, module.require)('util').TextDecoder : TextDecoder;

let cachedTextDecoder = new lTextDecoder('utf-8', { ignoreBOM: true, fatal: true });

cachedTextDecoder.decode();

let cachedUint8Memory0 = null;

function getUint8Memory0() {
    if (cachedUint8Memory0 === null || cachedUint8Memory0.byteLength === 0) {
        cachedUint8Memory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachedUint8Memory0;
}

function getStringFromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return cachedTextDecoder.decode(getUint8Memory0().subarray(ptr, ptr + len));
}
/**
* @param {number} a
* @returns {number}
*/
export function times_two(a) {
    const ret = wasm.times_two(a);
    return ret;
}

let WASM_VECTOR_LEN = 0;

const lTextEncoder = typeof TextEncoder === 'undefined' ? (0, module.require)('util').TextEncoder : TextEncoder;

let cachedTextEncoder = new lTextEncoder('utf-8');

const encodeString = (typeof cachedTextEncoder.encodeInto === 'function'
    ? function (arg, view) {
    return cachedTextEncoder.encodeInto(arg, view);
}
    : function (arg, view) {
    const buf = cachedTextEncoder.encode(arg);
    view.set(buf);
    return {
        read: arg.length,
        written: buf.length
    };
});

function passStringToWasm0(arg, malloc, realloc) {

    if (realloc === undefined) {
        const buf = cachedTextEncoder.encode(arg);
        const ptr = malloc(buf.length, 1) >>> 0;
        getUint8Memory0().subarray(ptr, ptr + buf.length).set(buf);
        WASM_VECTOR_LEN = buf.length;
        return ptr;
    }

    let len = arg.length;
    let ptr = malloc(len, 1) >>> 0;

    const mem = getUint8Memory0();

    let offset = 0;

    for (; offset < len; offset++) {
        const code = arg.charCodeAt(offset);
        if (code > 0x7F) break;
        mem[ptr + offset] = code;
    }

    if (offset !== len) {
        if (offset !== 0) {
            arg = arg.slice(offset);
        }
        ptr = realloc(ptr, len, len = offset + arg.length * 3, 1) >>> 0;
        const view = getUint8Memory0().subarray(ptr + offset, ptr + len);
        const ret = encodeString(arg, view);

        offset += ret.written;
        ptr = realloc(ptr, len, offset, 1) >>> 0;
    }

    WASM_VECTOR_LEN = offset;
    return ptr;
}

let cachedInt32Memory0 = null;

function getInt32Memory0() {
    if (cachedInt32Memory0 === null || cachedInt32Memory0.byteLength === 0) {
        cachedInt32Memory0 = new Int32Array(wasm.memory.buffer);
    }
    return cachedInt32Memory0;
}
/**
* @param {string} _keye
* @param {string} _ive
* @param {string} _pte
* @returns {string}
*/
export function encrypt(_keye, _ive, _pte) {
    let deferred4_0;
    let deferred4_1;
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        const ptr0 = passStringToWasm0(_keye, wasm.__wbindgen_export_0, wasm.__wbindgen_export_1);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(_ive, wasm.__wbindgen_export_0, wasm.__wbindgen_export_1);
        const len1 = WASM_VECTOR_LEN;
        const ptr2 = passStringToWasm0(_pte, wasm.__wbindgen_export_0, wasm.__wbindgen_export_1);
        const len2 = WASM_VECTOR_LEN;
        wasm.encrypt(retptr, ptr0, len0, ptr1, len1, ptr2, len2);
        var r0 = getInt32Memory0()[retptr / 4 + 0];
        var r1 = getInt32Memory0()[retptr / 4 + 1];
        deferred4_0 = r0;
        deferred4_1 = r1;
        return getStringFromWasm0(r0, r1);
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
        wasm.__wbindgen_export_2(deferred4_0, deferred4_1, 1);
    }
}

/**
* @param {string} _keyd
* @param {string} _ivd
* @param {string} _ctd_
* @returns {string}
*/
export function decrypt(_keyd, _ivd, _ctd_) {
    let deferred4_0;
    let deferred4_1;
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        const ptr0 = passStringToWasm0(_keyd, wasm.__wbindgen_export_0, wasm.__wbindgen_export_1);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(_ivd, wasm.__wbindgen_export_0, wasm.__wbindgen_export_1);
        const len1 = WASM_VECTOR_LEN;
        const ptr2 = passStringToWasm0(_ctd_, wasm.__wbindgen_export_0, wasm.__wbindgen_export_1);
        const len2 = WASM_VECTOR_LEN;
        wasm.decrypt(retptr, ptr0, len0, ptr1, len1, ptr2, len2);
        var r0 = getInt32Memory0()[retptr / 4 + 0];
        var r1 = getInt32Memory0()[retptr / 4 + 1];
        deferred4_0 = r0;
        deferred4_1 = r1;
        return getStringFromWasm0(r0, r1);
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
        wasm.__wbindgen_export_2(deferred4_0, deferred4_1, 1);
    }
}

/**
* @param {string} input
* @returns {string}
*/
export function count_characters(input) {
    let deferred2_0;
    let deferred2_1;
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        const ptr0 = passStringToWasm0(input, wasm.__wbindgen_export_0, wasm.__wbindgen_export_1);
        const len0 = WASM_VECTOR_LEN;
        wasm.count_characters(retptr, ptr0, len0);
        var r0 = getInt32Memory0()[retptr / 4 + 0];
        var r1 = getInt32Memory0()[retptr / 4 + 1];
        deferred2_0 = r0;
        deferred2_1 = r1;
        return getStringFromWasm0(r0, r1);
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
        wasm.__wbindgen_export_2(deferred2_0, deferred2_1, 1);
    }
}

/**
* @param {number} password_length
* @param {boolean} add_special_char
* @param {boolean} add_number
* @param {boolean} capitalize_first_letter
* @returns {string}
*/
export function generate_password(password_length, add_special_char, add_number, capitalize_first_letter) {
    let deferred1_0;
    let deferred1_1;
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        wasm.generate_password(retptr, password_length, add_special_char, add_number, capitalize_first_letter);
        var r0 = getInt32Memory0()[retptr / 4 + 0];
        var r1 = getInt32Memory0()[retptr / 4 + 1];
        deferred1_0 = r0;
        deferred1_1 = r1;
        return getStringFromWasm0(r0, r1);
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
        wasm.__wbindgen_export_2(deferred1_0, deferred1_1, 1);
    }
}

/**
* @param {string} password
* @returns {string}
*/
export function guessable(password) {
    let deferred2_0;
    let deferred2_1;
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        const ptr0 = passStringToWasm0(password, wasm.__wbindgen_export_0, wasm.__wbindgen_export_1);
        const len0 = WASM_VECTOR_LEN;
        wasm.guessable(retptr, ptr0, len0);
        var r0 = getInt32Memory0()[retptr / 4 + 0];
        var r1 = getInt32Memory0()[retptr / 4 + 1];
        deferred2_0 = r0;
        deferred2_1 = r1;
        return getStringFromWasm0(r0, r1);
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
        wasm.__wbindgen_export_2(deferred2_0, deferred2_1, 1);
    }
}

/**
* @param {string} password
* @returns {string}
*/
export function calculate_password_strength(password) {
    let deferred2_0;
    let deferred2_1;
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        const ptr0 = passStringToWasm0(password, wasm.__wbindgen_export_0, wasm.__wbindgen_export_1);
        const len0 = WASM_VECTOR_LEN;
        wasm.calculate_password_strength(retptr, ptr0, len0);
        var r0 = getInt32Memory0()[retptr / 4 + 0];
        var r1 = getInt32Memory0()[retptr / 4 + 1];
        deferred2_0 = r0;
        deferred2_1 = r1;
        return getStringFromWasm0(r0, r1);
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
        wasm.__wbindgen_export_2(deferred2_0, deferred2_1, 1);
    }
}

/**
* @param {string} password
* @returns {string}
*/
export function calculate_password_strength2(password) {
    let deferred2_0;
    let deferred2_1;
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        const ptr0 = passStringToWasm0(password, wasm.__wbindgen_export_0, wasm.__wbindgen_export_1);
        const len0 = WASM_VECTOR_LEN;
        wasm.calculate_password_strength2(retptr, ptr0, len0);
        var r0 = getInt32Memory0()[retptr / 4 + 0];
        var r1 = getInt32Memory0()[retptr / 4 + 1];
        deferred2_0 = r0;
        deferred2_1 = r1;
        return getStringFromWasm0(r0, r1);
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
        wasm.__wbindgen_export_2(deferred2_0, deferred2_1, 1);
    }
}

function handleError(f, args) {
    try {
        return f.apply(this, args);
    } catch (e) {
        wasm.__wbindgen_export_3(addHeapObject(e));
    }
}

export function __wbindgen_object_clone_ref(arg0) {
    const ret = getObject(arg0);
    return addHeapObject(ret);
};

export function __wbg_crypto_d05b68a3572bb8ca(arg0) {
    const ret = getObject(arg0).crypto;
    return addHeapObject(ret);
};

export function __wbindgen_is_object(arg0) {
    const val = getObject(arg0);
    const ret = typeof(val) === 'object' && val !== null;
    return ret;
};

export function __wbg_process_b02b3570280d0366(arg0) {
    const ret = getObject(arg0).process;
    return addHeapObject(ret);
};

export function __wbg_versions_c1cb42213cedf0f5(arg0) {
    const ret = getObject(arg0).versions;
    return addHeapObject(ret);
};

export function __wbg_node_43b1089f407e4ec2(arg0) {
    const ret = getObject(arg0).node;
    return addHeapObject(ret);
};

export function __wbindgen_is_string(arg0) {
    const ret = typeof(getObject(arg0)) === 'string';
    return ret;
};

export function __wbindgen_object_drop_ref(arg0) {
    takeObject(arg0);
};

export function __wbg_msCrypto_10fc94afee92bd76(arg0) {
    const ret = getObject(arg0).msCrypto;
    return addHeapObject(ret);
};

export function __wbg_newwithlength_0d03cef43b68a530(arg0) {
    const ret = new Uint8Array(arg0 >>> 0);
    return addHeapObject(ret);
};

export function __wbg_require_9a7e0f667ead4995() { return handleError(function () {
    const ret = module.require;
    return addHeapObject(ret);
}, arguments) };

export function __wbindgen_is_function(arg0) {
    const ret = typeof(getObject(arg0)) === 'function';
    return ret;
};

export function __wbindgen_string_new(arg0, arg1) {
    const ret = getStringFromWasm0(arg0, arg1);
    return addHeapObject(ret);
};

export function __wbg_call_67f2111acd2dfdb6() { return handleError(function (arg0, arg1, arg2) {
    const ret = getObject(arg0).call(getObject(arg1), getObject(arg2));
    return addHeapObject(ret);
}, arguments) };

export function __wbindgen_memory() {
    const ret = wasm.memory;
    return addHeapObject(ret);
};

export function __wbg_buffer_b914fb8b50ebbc3e(arg0) {
    const ret = getObject(arg0).buffer;
    return addHeapObject(ret);
};

export function __wbg_newwithbyteoffsetandlength_0de9ee56e9f6ee6e(arg0, arg1, arg2) {
    const ret = new Uint8Array(getObject(arg0), arg1 >>> 0, arg2 >>> 0);
    return addHeapObject(ret);
};

export function __wbg_randomFillSync_b70ccbdf4926a99d() { return handleError(function (arg0, arg1) {
    getObject(arg0).randomFillSync(takeObject(arg1));
}, arguments) };

export function __wbg_subarray_adc418253d76e2f1(arg0, arg1, arg2) {
    const ret = getObject(arg0).subarray(arg1 >>> 0, arg2 >>> 0);
    return addHeapObject(ret);
};

export function __wbg_getRandomValues_7e42b4fb8779dc6d() { return handleError(function (arg0, arg1) {
    getObject(arg0).getRandomValues(getObject(arg1));
}, arguments) };

export function __wbg_new_b1f2d6842d615181(arg0) {
    const ret = new Uint8Array(getObject(arg0));
    return addHeapObject(ret);
};

export function __wbg_set_7d988c98e6ced92d(arg0, arg1, arg2) {
    getObject(arg0).set(getObject(arg1), arg2 >>> 0);
};

export function __wbg_self_05040bd9523805b9() { return handleError(function () {
    const ret = self.self;
    return addHeapObject(ret);
}, arguments) };

export function __wbg_window_adc720039f2cb14f() { return handleError(function () {
    const ret = window.window;
    return addHeapObject(ret);
}, arguments) };

export function __wbg_globalThis_622105db80c1457d() { return handleError(function () {
    const ret = globalThis.globalThis;
    return addHeapObject(ret);
}, arguments) };

export function __wbg_global_f56b013ed9bcf359() { return handleError(function () {
    const ret = global.global;
    return addHeapObject(ret);
}, arguments) };

export function __wbindgen_is_undefined(arg0) {
    const ret = getObject(arg0) === undefined;
    return ret;
};

export function __wbg_newnoargs_cfecb3965268594c(arg0, arg1) {
    const ret = new Function(getStringFromWasm0(arg0, arg1));
    return addHeapObject(ret);
};

export function __wbg_call_3f093dd26d5569f8() { return handleError(function (arg0, arg1) {
    const ret = getObject(arg0).call(getObject(arg1));
    return addHeapObject(ret);
}, arguments) };

export function __wbindgen_throw(arg0, arg1) {
    throw new Error(getStringFromWasm0(arg0, arg1));
};

export function __wbg_new0_7a6141101f2206da() {
    const ret = new Date();
    return addHeapObject(ret);
};

export function __wbg_getFullYear_58caf6b282c65af0(arg0) {
    const ret = getObject(arg0).getFullYear();
    return ret;
};

export function __wbg_getTime_0e03c3f524be31ef(arg0) {
    const ret = getObject(arg0).getTime();
    return ret;
};

