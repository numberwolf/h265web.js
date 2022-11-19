this.onerror = function(e) {
  console.error(e);
}


function alignUp(x, multiple) {
  if (x % multiple > 0) {
    x += multiple - (x % multiple);
  }
  return x;
}
function _emscripten_get_heap_size() {
      return HEAP8.length;
    }
function _emscripten_resize_heap(requestedSize) {
      abortOnCannotGrowMemory(requestedSize);
    }
function stringToUTF8(str, outPtr, maxBytesToWrite) {
  assert(typeof maxBytesToWrite == 'number', 'stringToUTF8(str, outPtr, maxBytesToWrite) is missing the third parameter that specifies the length of the output buffer!');
  return stringToUTF8Array(str, HEAPU8,outPtr, maxBytesToWrite);
}
function UTF8ToString(ptr, maxBytesToRead) {
  return ptr ? UTF8ArrayToString(HEAPU8, ptr, maxBytesToRead) : '';
}
function UTF8ArrayToString(u8Array, idx, maxBytesToRead) {
  var endIdx = idx + maxBytesToRead;

    var str = '';
    while (!(idx >= endIdx)) {
      // For UTF8 byte structure, see:
      // http://en.wikipedia.org/wiki/UTF-8#Description
      // https://www.ietf.org/rfc/rfc2279.txt
      // https://tools.ietf.org/html/rfc3629
      var u0 = u8Array[idx++];
      // If not building with TextDecoder enabled, we don't know the string length, so scan for \0 byte.
      // If building with TextDecoder, we know exactly at what byte index the string ends, so checking for nulls here would be redundant.
      if (!u0) return str;
      if (!(u0 & 0x80)) { str += String.fromCharCode(u0); continue; }
      var u1 = u8Array[idx++] & 63;
      if ((u0 & 0xE0) == 0xC0) { str += String.fromCharCode(((u0 & 31) << 6) | u1); continue; }
      var u2 = u8Array[idx++] & 63;
      if ((u0 & 0xF0) == 0xE0) {
        u0 = ((u0 & 15) << 12) | (u1 << 6) | u2;
      } else {
        if ((u0 & 0xF8) != 0xF0) warnOnce('Invalid UTF-8 leading byte 0x' + u0.toString(16) + ' encountered when deserializing a UTF-8 string on the asm.js/wasm heap to a JS string!');
        u0 = ((u0 & 7) << 18) | (u1 << 12) | (u2 << 6) | (u8Array[idx++] & 63);
      }

      if (u0 < 0x10000) {
        str += String.fromCharCode(u0);
      } else {
        var ch = u0 - 0x10000;
        str += String.fromCharCode(0xD800 | (ch >> 10), 0xDC00 | (ch & 0x3FF));
      }
    }
  return str;
}
function intArrayFromString(stringy, dontAddNull, length) {
  var len = length > 0 ? length : lengthBytesUTF8(stringy)+1;
  var u8array = new Array(len);
  var numBytesWritten = stringToUTF8Array(stringy, u8array, 0, u8array.length);
  if (dontAddNull) u8array.length = numBytesWritten;
  return u8array;
}
function lengthBytesUTF8(str) {
  var len = 0;
  for (var i = 0; i < str.length; ++i) {
    // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! So decode UTF16->UTF32->UTF8.
    // See http://unicode.org/faq/utf_bom.html#utf16-3
    var u = str.charCodeAt(i); // possibly a lead surrogate
    if (u >= 0xD800 && u <= 0xDFFF) u = 0x10000 + ((u & 0x3FF) << 10) | (str.charCodeAt(++i) & 0x3FF);
    if (u <= 0x7F) ++len;
    else if (u <= 0x7FF) len += 2;
    else if (u <= 0xFFFF) len += 3;
    else len += 4;
  }
  return len;
}
function stringToUTF8Array(str, outU8Array, outIdx, maxBytesToWrite) {
  if (!(maxBytesToWrite > 0)) // Parameter maxBytesToWrite is not optional. Negative values, 0, null, undefined and false each don't write out any bytes.
    return 0;

  var startIdx = outIdx;
  var endIdx = outIdx + maxBytesToWrite - 1; // -1 for string null terminator.
  for (var i = 0; i < str.length; ++i) {
    // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! So decode UTF16->UTF32->UTF8.
    // See http://unicode.org/faq/utf_bom.html#utf16-3
    // For UTF8 byte structure, see http://en.wikipedia.org/wiki/UTF-8#Description and https://www.ietf.org/rfc/rfc2279.txt and https://tools.ietf.org/html/rfc3629
    var u = str.charCodeAt(i); // possibly a lead surrogate
    if (u >= 0xD800 && u <= 0xDFFF) {
      var u1 = str.charCodeAt(++i);
      u = 0x10000 + ((u & 0x3FF) << 10) | (u1 & 0x3FF);
    }
    if (u <= 0x7F) {
      if (outIdx >= endIdx) break;
      outU8Array[outIdx++] = u;
    } else if (u <= 0x7FF) {
      if (outIdx + 1 >= endIdx) break;
      outU8Array[outIdx++] = 0xC0 | (u >> 6);
      outU8Array[outIdx++] = 0x80 | (u & 63);
    } else if (u <= 0xFFFF) {
      if (outIdx + 2 >= endIdx) break;
      outU8Array[outIdx++] = 0xE0 | (u >> 12);
      outU8Array[outIdx++] = 0x80 | ((u >> 6) & 63);
      outU8Array[outIdx++] = 0x80 | (u & 63);
    } else {
      if (outIdx + 3 >= endIdx) break;
      if (u >= 0x200000) warnOnce('Invalid Unicode code point 0x' + u.toString(16) + ' encountered when serializing a JS string to an UTF-8 string on the asm.js/wasm heap! (Valid unicode code points should be in range 0-0x1FFFFF).');
      outU8Array[outIdx++] = 0xF0 | (u >> 18);
      outU8Array[outIdx++] = 0x80 | ((u >> 12) & 63);
      outU8Array[outIdx++] = 0x80 | ((u >> 6) & 63);
      outU8Array[outIdx++] = 0x80 | (u & 63);
    }
  }
  // Null-terminate the pointer to the buffer.
  outU8Array[outIdx] = 0;
  return outIdx - startIdx;
}
function _emscripten_is_main_runtime_thread() {
    return __pthread_is_main_runtime_thread|0; // Semantically the same as testing "!ENVIRONMENT_IS_PTHREAD" outside the asm.js scope
}
function _emscripten_futex_wait(addr, val, timeout) {
      if (addr <= 0 || addr > HEAP8.length || addr&3 != 0) return -28;
  //    dump('futex_wait addr:' + addr + ' by thread: ' + _pthread_self() + (ENVIRONMENT_IS_PTHREAD?'(pthread)':'') + '\n');
      if (ENVIRONMENT_IS_WORKER) {
        var ret = Atomics.wait(HEAP32, addr >> 2, val, timeout);
  //    dump('futex_wait done by thread: ' + _pthread_self() + (ENVIRONMENT_IS_PTHREAD?'(pthread)':'') + '\n');
        if (ret === 'timed-out') return -73;
        if (ret === 'not-equal') return -6;
        if (ret === 'ok') return 0;
        throw 'Atomics.wait returned an unexpected value ' + ret;
      } else {
        // Atomics.wait is not available in the main browser thread, so simulate it via busy spinning.
        var loadedVal = Atomics.load(HEAP32, addr >> 2);
        if (val != loadedVal) return -6;
  
        var tNow = performance.now();
        var tEnd = tNow + timeout;
  
  
        // Register globally which address the main thread is simulating to be waiting on. When zero, main thread is not waiting on anything,
        // and on nonzero, the contents of address pointed by __main_thread_futex_wait_address tell which address the main thread is simulating its wait on.
        Atomics.store(HEAP32, __main_thread_futex_wait_address >> 2, addr);
        var ourWaitAddress = addr; // We may recursively re-enter this function while processing queued calls, in which case we'll do a spurious wakeup of the older wait operation.
        while (addr == ourWaitAddress) {
          tNow = performance.now();
          if (tNow > tEnd) {
            return -73;
          }
          _emscripten_main_thread_process_queued_calls(); // We are performing a blocking loop here, so must pump any pthreads if they want to perform operations that are proxied.
          addr = Atomics.load(HEAP32, __main_thread_futex_wait_address >> 2); // Look for a worker thread waking us up.
        }
        return 0;
      }
    }
function _emscripten_get_sbrk_ptr() {
    return 1401408;
}
function _malloc($bytes) {
 $bytes = $bytes|0;
 var $$pre = 0, $$pre$i = 0, $$pre$i$i = 0, $$pre$i171 = 0, $$pre$i50$i = 0, $$pre$phi$i$iZ2D = 0, $$pre$phi$i172Z2D = 0, $$pre$phi$i51$iZ2D = 0, $$pre$phi$iZ2D = 0, $$pre$phiZ2D = 0, $0 = 0, $1 = 0, $10 = 0, $100 = 0, $101 = 0, $102 = 0, $103 = 0, $104 = 0, $105 = 0, $106 = 0;
 var $107 = 0, $108 = 0, $109 = 0, $11 = 0, $110 = 0, $111 = 0, $112 = 0, $113 = 0, $114 = 0, $115 = 0, $116 = 0, $117 = 0, $118 = 0, $119 = 0, $12 = 0, $120 = 0, $121 = 0, $122 = 0, $123 = 0, $124 = 0;
 var $125 = 0, $126 = 0, $127 = 0, $128 = 0, $129 = 0, $13 = 0, $130 = 0, $131 = 0, $132 = 0, $133 = 0, $134 = 0, $135 = 0, $136 = 0, $137 = 0, $138 = 0, $139 = 0, $14 = 0, $140 = 0, $141 = 0, $142 = 0;
 var $143 = 0, $144 = 0, $145 = 0, $146 = 0, $147 = 0, $148 = 0, $149 = 0, $15 = 0, $150 = 0, $151 = 0, $152 = 0, $153 = 0, $154 = 0, $155 = 0, $156 = 0, $157 = 0, $158 = 0, $159 = 0, $16 = 0, $160 = 0;
 var $161 = 0, $162 = 0, $163 = 0, $164 = 0, $165 = 0, $166 = 0, $167 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0, $27 = 0, $28 = 0;
 var $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0, $45 = 0, $46 = 0;
 var $47 = 0, $48 = 0, $49 = 0, $5 = 0, $50 = 0, $51 = 0, $52 = 0, $53 = 0, $54 = 0, $55 = 0, $56 = 0, $57 = 0, $58 = 0, $59 = 0, $6 = 0, $60 = 0, $61 = 0, $62 = 0, $63 = 0, $64 = 0;
 var $65 = 0, $66 = 0, $67 = 0, $68 = 0, $69 = 0, $7 = 0, $70 = 0, $71 = 0, $72 = 0, $73 = 0, $74 = 0, $75 = 0, $76 = 0, $77 = 0, $78 = 0, $79 = 0, $8 = 0, $80 = 0, $81 = 0, $82 = 0;
 var $83 = 0, $84 = 0, $85 = 0, $86 = 0, $87 = 0, $88 = 0, $89 = 0, $9 = 0, $90 = 0, $91 = 0, $92 = 0, $93 = 0, $94 = 0, $95 = 0, $96 = 0, $97 = 0, $98 = 0, $99 = 0, $F$0$i$i = 0, $F113$0 = 0;
 var $F197$0$i = 0, $F224$0$i$i = 0, $F290$0$i = 0, $I252$0$i$i = 0, $I316$0$i = 0, $I57$0$i$i = 0, $K105$010$i$i = 0, $K305$08$i$i = 0, $K373$015$i = 0, $R$1$i = 0, $R$1$i$be = 0, $R$1$i$i = 0, $R$1$i$i$be = 0, $R$1$i$i$ph = 0, $R$1$i$ph = 0, $R$1$i162 = 0, $R$1$i162$be = 0, $R$1$i162$ph = 0, $R$3$i = 0, $R$3$i$i = 0;
 var $R$3$i166 = 0, $RP$1$i = 0, $RP$1$i$be = 0, $RP$1$i$i = 0, $RP$1$i$i$be = 0, $RP$1$i$i$ph = 0, $RP$1$i$ph = 0, $RP$1$i161 = 0, $RP$1$i161$be = 0, $RP$1$i161$ph = 0, $T$0$lcssa$i = 0, $T$0$lcssa$i$i = 0, $T$0$lcssa$i57$i = 0, $T$014$i = 0, $T$07$i$i = 0, $T$09$i$i = 0, $add$i = 0, $add$i$i = 0, $add$i141 = 0, $add$i176 = 0;
 var $add$ptr = 0, $add$ptr$i = 0, $add$ptr$i$i = 0, $add$ptr$i$i$i = 0, $add$ptr$i13$i = 0, $add$ptr$i15$i = 0, $add$ptr$i154 = 0, $add$ptr$i187 = 0, $add$ptr$i2$i$i = 0, $add$ptr$i27$i = 0, $add$ptr104 = 0, $add$ptr107 = 0, $add$ptr14$i$i = 0, $add$ptr15$i$i = 0, $add$ptr16$i$i = 0, $add$ptr17$i$i = 0, $add$ptr176 = 0, $add$ptr179 = 0, $add$ptr181$i = 0, $add$ptr188 = 0;
 var $add$ptr190$i = 0, $add$ptr192 = 0, $add$ptr193$i = 0, $add$ptr2$i$i = 0, $add$ptr203 = 0, $add$ptr205$i$i = 0, $add$ptr209 = 0, $add$ptr212$i$i = 0, $add$ptr225$i = 0, $add$ptr231$i = 0, $add$ptr24$i$i = 0, $add$ptr266$i = 0, $add$ptr273$i = 0, $add$ptr273$i198 = 0, $add$ptr282$i = 0, $add$ptr3$i$i = 0, $add$ptr30$i$i = 0, $add$ptr369$i$i = 0, $add$ptr4$i$i = 0, $add$ptr4$i$i$i = 0;
 var $add$ptr4$i21$i = 0, $add$ptr4$i33$i = 0, $add$ptr441$i = 0, $add$ptr5$i$i = 0, $add$ptr6$i$i = 0, $add$ptr6$i$i$i = 0, $add$ptr6$i25$i = 0, $add$ptr7$i$i = 0, $add$ptr81$i$i = 0, $add10$i = 0, $add102$i = 0, $add111$i = 0, $add13$i = 0, $add14$i = 0, $add144$i = 0, $add154 = 0, $add154$i = 0, $add16 = 0, $add17$i = 0, $add17$i179 = 0;
 var $add177$i = 0, $add18$i = 0, $add19$i = 0, $add20$i = 0, $add206$i$i = 0, $add216$i = 0, $add219$i = 0, $add22$i = 0, $add250$i = 0, $add26$i$i = 0, $add268$i = 0, $add269$i$i = 0, $add274$i$i = 0, $add278$i$i = 0, $add280$i$i = 0, $add283$i$i = 0, $add337$i = 0, $add342$i = 0, $add346$i = 0, $add348$i = 0;
 var $add351$i = 0, $add47$i = 0, $add52$i = 0, $add55$i = 0, $add59 = 0, $add63 = 0, $add67 = 0, $add71 = 0, $add73 = 0, $add74$i$i = 0, $add78$i = 0, $add78$i184 = 0, $add79$i$i = 0, $add82$i = 0, $add83$i$i = 0, $add85$i$i = 0, $add86$i = 0, $add88$i$i = 0, $add9 = 0, $add9$i = 0;
 var $add90$i = 0, $add92$i = 0, $and = 0, $and$i = 0, $and$i$i = 0, $and$i$i$i = 0, $and$i138 = 0, $and$i16$i = 0, $and$i28$i = 0, $and$i38$i = 0, $and10 = 0, $and100$i = 0, $and103$i = 0, $and105$i = 0, $and11$i = 0, $and115 = 0, $and119$i$i = 0, $and1197$i$i = 0, $and12 = 0, $and12$i = 0;
 var $and13$i = 0, $and13$i$i = 0, $and133$i$i = 0, $and15 = 0, $and155 = 0, $and17$i = 0, $and194$i = 0, $and198$i = 0, $and199$i = 0, $and209$i$i = 0, $and21$i = 0, $and21$i144 = 0, $and218 = 0, $and22 = 0, $and227$i$i = 0, $and240$i = 0, $and264$i$i = 0, $and268$i$i = 0, $and273$i$i = 0, $and282$i$i = 0;
 var $and29$i = 0, $and292$i = 0, $and295$i$i = 0, $and3$i = 0, $and3$i$i = 0, $and3$i$i$i = 0, $and3$i19$i = 0, $and3$i31$i = 0, $and30$i = 0, $and318$i$i = 0, $and3185$i$i = 0, $and32$i = 0, $and32$i$i = 0, $and33$i$i = 0, $and331$i = 0, $and336$i = 0, $and341$i = 0, $and350$i = 0, $and363$i = 0, $and37$i$i = 0;
 var $and387$i = 0, $and38712$i = 0, $and40$i$i = 0, $and43$i = 0, $and49$i$i = 0, $and50 = 0, $and50$i = 0, $and52 = 0, $and55 = 0, $and58 = 0, $and6$i = 0, $and6$i$i = 0, $and6$i41$i = 0, $and62 = 0, $and64$i = 0, $and66 = 0, $and68$i = 0, $and69$i$i = 0, $and7$i = 0, $and7$i$i = 0;
 var $and70 = 0, $and73$i = 0, $and73$i$i = 0, $and77$i = 0, $and78$i$i = 0, $and8$i = 0, $and81$i = 0, $and81$i185 = 0, $and83 = 0, $and85$i = 0, $and87$i$i = 0, $and89$i = 0, $and9$i = 0, $and96$i$i = 0, $arrayidx = 0, $arrayidx$i = 0, $arrayidx$i$i = 0, $arrayidx$i145 = 0, $arrayidx103$i$i = 0, $arrayidx106$i = 0;
 var $arrayidx107$i$i = 0, $arrayidx112 = 0, $arrayidx113$i = 0, $arrayidx113$i153 = 0, $arrayidx121$i = 0, $arrayidx121$i$sink = 0, $arrayidx123$i$i = 0, $arrayidx126$i$i = 0, $arrayidx137$i = 0, $arrayidx143$i$i = 0, $arrayidx148$i = 0, $arrayidx151$i = 0, $arrayidx151$i$i = 0, $arrayidx151$i$i$sink = 0, $arrayidx154$i = 0, $arrayidx155$i = 0, $arrayidx161$i = 0, $arrayidx165$i = 0, $arrayidx165$i163 = 0, $arrayidx178$i$i = 0;
 var $arrayidx184$i = 0, $arrayidx184$i$i = 0, $arrayidx195$i$i = 0, $arrayidx196$i = 0, $arrayidx204$i = 0, $arrayidx212$i = 0, $arrayidx212$i$sink = 0, $arrayidx223$i$i = 0, $arrayidx228$i = 0, $arrayidx23$i = 0, $arrayidx239$i = 0, $arrayidx245$i = 0, $arrayidx256$i = 0, $arrayidx27$i = 0, $arrayidx287$i$i = 0, $arrayidx289$i = 0, $arrayidx290$i$i = 0, $arrayidx325$i$i = 0, $arrayidx355$i = 0, $arrayidx358$i = 0;
 var $arrayidx394$i = 0, $arrayidx40$i = 0, $arrayidx44$i = 0, $arrayidx61$i = 0, $arrayidx65$i = 0, $arrayidx71$i = 0, $arrayidx75 = 0, $arrayidx75$i = 0, $arrayidx91$i$i = 0, $arrayidx92$i$i = 0, $arrayidx94$i = 0, $arrayidx94$i150 = 0, $arrayidx96$i$i = 0, $attr$i$i$i = 0, $bk$i = 0, $bk$i$i = 0, $bk$i156 = 0, $bk$i52$i = 0, $bk102$i$i = 0, $bk131 = 0;
 var $bk133 = 0, $bk139$i$i = 0, $bk145$i = 0, $bk158$i$i = 0, $bk161$i$i = 0, $bk218$i = 0, $bk220$i = 0, $bk246$i$i = 0, $bk248$i$i = 0, $bk27 = 0, $bk302$i$i = 0, $bk311$i = 0, $bk313$i = 0, $bk338$i$i = 0, $bk357$i$i = 0, $bk360$i$i = 0, $bk370$i = 0, $bk407$i = 0, $bk429$i = 0, $bk432$i = 0;
 var $bk55$i$i = 0, $bk56$i = 0, $bk67$i$i = 0, $bk74$i$i = 0, $bk91$i$i = 0, $bk94 = 0, $br$2$ph$i = 0, $call$i$i = 0, $call$i$i$i = 0, $call1$i$i = 0, $call1$i$i$i = 0, $call108$i = 0, $call134$i = 0, $call135$i = 0, $call2 = 0, $call279$i = 0, $call38$i = 0, $call69$i = 0, $call84$i = 0, $child$i$i = 0;
 var $child166$i$i = 0, $child289$i$i = 0, $child357$i = 0, $cmp = 0, $cmp$i = 0, $cmp$i$i = 0, $cmp$i$i$i = 0, $cmp$i12$i = 0, $cmp$i133 = 0, $cmp$i136 = 0, $cmp$i14$i = 0, $cmp$i17$i = 0, $cmp$i173 = 0, $cmp$i29$i = 0, $cmp$i3$i$i = 0, $cmp$i39$i = 0, $cmp1$i = 0, $cmp100$i$i = 0, $cmp102$i = 0, $cmp104$i$i = 0;
 var $cmp106$i = 0, $cmp106$i$i = 0, $cmp107$i = 0, $cmp108 = 0, $cmp108$i$i = 0, $cmp109$i = 0, $cmp114$i = 0, $cmp116$i = 0, $cmp119$i = 0, $cmp119$i191 = 0, $cmp12$i = 0, $cmp120$i$i = 0, $cmp120$i55$i = 0, $cmp1208$i$i = 0, $cmp123$i = 0, $cmp124$i$i = 0, $cmp126$i = 0, $cmp127$i = 0, $cmp128$i = 0, $cmp128$i$i = 0;
 var $cmp129$i = 0, $cmp13 = 0, $cmp137 = 0, $cmp137$i = 0, $cmp138$i = 0, $cmp139$i = 0, $cmp141$i = 0, $cmp144$i$i = 0, $cmp145$i = 0, $cmp149 = 0, $cmp15$i = 0, $cmp151$i = 0, $cmp152$i = 0, $cmp155$i = 0, $cmp155$i194 = 0, $cmp156 = 0, $cmp156$i = 0, $cmp156$i$i = 0, $cmp161$i = 0, $cmp162$i = 0;
 var $cmp163$i = 0, $cmp166 = 0, $cmp166$i = 0, $cmp166$i195 = 0, $cmp168$i$i = 0, $cmp172 = 0, $cmp174$i = 0, $cmp18 = 0, $cmp180$i = 0, $cmp185$i = 0, $cmp185$i$i = 0, $cmp19$i = 0, $cmp190$i = 0, $cmp191$i = 0, $cmp194$i = 0, $cmp196 = 0, $cmp2$i$i = 0, $cmp2$i$i$i = 0, $cmp20$i$i = 0, $cmp205$i = 0;
 var $cmp207$i = 0, $cmp21$i = 0, $cmp213$i = 0, $cmp215$i$i = 0, $cmp217$i = 0, $cmp222$i = 0, $cmp228$i = 0, $cmp229$i = 0, $cmp232$i = 0, $cmp24$i = 0, $cmp24$i$i = 0, $cmp246$i = 0, $cmp254$i$i = 0, $cmp258$i$i = 0, $cmp26$i = 0, $cmp261$i = 0, $cmp265$i = 0, $cmp27$i$i = 0, $cmp28$i = 0, $cmp28$i$i = 0;
 var $cmp284$i = 0, $cmp3$i$i = 0, $cmp306$i$i = 0, $cmp319$i = 0, $cmp319$i$i = 0, $cmp3196$i$i = 0, $cmp32$i = 0, $cmp32$i181 = 0, $cmp323$i = 0, $cmp327$i$i = 0, $cmp34$i = 0, $cmp34$i$i = 0, $cmp35$i = 0, $cmp36$i = 0, $cmp36$i$i = 0, $cmp374$i = 0, $cmp38 = 0, $cmp38$i$i = 0, $cmp388$i = 0, $cmp38813$i = 0;
 var $cmp39$i = 0, $cmp396$i = 0, $cmp4 = 0, $cmp40 = 0, $cmp40$i = 0, $cmp44$i = 0, $cmp45$i = 0, $cmp46$i = 0, $cmp46$i$i = 0, $cmp49$i = 0, $cmp55$i = 0, $cmp56$i = 0, $cmp57$i = 0, $cmp58$i = 0, $cmp59$i$i = 0, $cmp6 = 0, $cmp61$i = 0, $cmp62$i = 0, $cmp63$i$i = 0, $cmp64$i = 0;
 var $cmp65$i = 0, $cmp66$i = 0, $cmp67$i = 0, $cmp7$i$i = 0, $cmp70$i = 0, $cmp72$i = 0, $cmp75$i$i = 0, $cmp76$i = 0, $cmp79 = 0, $cmp82$i = 0, $cmp86$i = 0, $cmp9$i$i = 0, $cmp90$i = 0, $cmp90$i188 = 0, $cmp92$i = 0, $cmp94$i = 0, $cmp95$i = 0, $cmp97$i = 0, $cmp97$i$i = 0, $cmp97$i190 = 0;
 var $cmp9716$i = 0, $cond = 0, $cond$i = 0, $cond$i$i = 0, $cond$i$i$i = 0, $cond$i20$i = 0, $cond$i32$i = 0, $cond$i42$i = 0, $cond1$i$i = 0, $cond115$i = 0, $cond115$i$i = 0, $cond13$i$i = 0, $cond15$i$i = 0, $cond2$i = 0, $cond3$i = 0, $cond315$i$i = 0, $cond383$i = 0, $cond4$i = 0, $fd$i = 0, $fd$i$i = 0;
 var $fd$i157 = 0, $fd103$i$i = 0, $fd132 = 0, $fd140$i$i = 0, $fd146$i = 0, $fd148$i$i = 0, $fd160$i$i = 0, $fd17 = 0, $fd219$i = 0, $fd247$i$i = 0, $fd303$i$i = 0, $fd312$i = 0, $fd339$i$i = 0, $fd344$i$i = 0, $fd359$i$i = 0, $fd371$i = 0, $fd408$i = 0, $fd416$i = 0, $fd431$i = 0, $fd54$i$i = 0;
 var $fd57$i = 0, $fd68$i$i = 0, $fd78 = 0, $fd78$i$i = 0, $fd92$i$i = 0, $head = 0, $head$i = 0, $head$i$i = 0, $head$i$i$i = 0, $head$i149 = 0, $head$i24$i = 0, $head$i34$i = 0, $head$i43$i = 0, $head103 = 0, $head106 = 0, $head118$i$i = 0, $head1186$i$i = 0, $head178 = 0, $head179$i = 0, $head182$i = 0;
 var $head183 = 0, $head187 = 0, $head187$i = 0, $head189 = 0, $head189$i = 0, $head205 = 0, $head208 = 0, $head208$i$i = 0, $head211$i$i = 0, $head23$i$i = 0, $head26$i$i = 0, $head269$i = 0, $head271$i = 0, $head272$i = 0, $head274$i = 0, $head279$i = 0, $head281$i = 0, $head29$i = 0, $head29$i$i = 0, $head317$i$i = 0;
 var $head3174$i$i = 0, $head32$i$i = 0, $head34 = 0, $head34$i$i = 0, $head386$i = 0, $head38611$i = 0, $head7$i$i = 0, $head7$i$i$i = 0, $head7$i26$i = 0, $head99$i = 0, $idx$0$i = 0, $index$i = 0, $index$i$i = 0, $index$i167 = 0, $index$i53$i = 0, $index288$i$i = 0, $index356$i = 0, $magic$i$i = 0, $mem$2 = 0, $nb$0 = 0;
 var $neg = 0, $neg$i = 0, $neg$i$i = 0, $neg$i168 = 0, $neg$i178 = 0, $neg104$i = 0, $neg132$i$i = 0, $neg21 = 0, $neg49$i = 0, $neg80$i = 0, $neg82 = 0, $next$i = 0, $next$i$i = 0, $next$i$i$i = 0, $next235$i = 0, $oldfirst$0$i$i = 0, $or$cond$i = 0, $or$cond$i183 = 0, $or$cond1$i = 0, $or$cond1$i180 = 0;
 var $or$cond11$i = 0, $or$cond2$i = 0, $or$cond4$i = 0, $or$cond5$i = 0, $or$cond6$i = 0, $or$cond7$i = 0, $or$cond8$i = 0, $or$cond90$i = 0, $or$i = 0, $or$i$i = 0, $or$i$i$i = 0, $or$i192 = 0, $or$i23$i = 0, $or101$i$i = 0, $or102 = 0, $or105 = 0, $or119 = 0, $or177 = 0, $or178$i = 0, $or182 = 0;
 var $or183$i = 0, $or186 = 0, $or186$i = 0, $or188$i = 0, $or19$i$i = 0, $or190 = 0, $or204 = 0, $or204$i = 0, $or207 = 0, $or210$i$i = 0, $or22$i$i = 0, $or232$i$i = 0, $or268$i = 0, $or270$i = 0, $or271$i = 0, $or275$i = 0, $or278$i = 0, $or28$i$i = 0, $or280$i = 0, $or297$i = 0;
 var $or300$i$i = 0, $or32 = 0, $or33$i$i = 0, $or35 = 0, $or368$i = 0, $or44$i$i = 0, $or49 = 0, $parent$i = 0, $parent$i$i = 0, $parent$i155 = 0, $parent$i54$i = 0, $parent135$i = 0, $parent138$i$i = 0, $parent149$i = 0, $parent162$i$i = 0, $parent165$i$i = 0, $parent166$i = 0, $parent179$i$i = 0, $parent196$i$i = 0, $parent226$i = 0;
 var $parent240$i = 0, $parent257$i = 0, $parent301$i$i = 0, $parent337$i$i = 0, $parent361$i$i = 0, $parent369$i = 0, $parent406$i = 0, $parent433$i = 0, $qsize$0$i$i = 0, $retval$1 = 0, $rsize$0$i = 0, $rsize$0$i147 = 0, $rsize$1$i = 0, $rsize$3$i = 0, $rsize$4$lcssa$i = 0, $rsize$418$i = 0, $rsize$418$i$ph = 0, $rst$0$i = 0, $rst$1$i = 0, $sflags197$i = 0;
 var $sflags239$i = 0, $shl = 0, $shl$i = 0, $shl$i$i = 0, $shl$i139 = 0, $shl111 = 0, $shl114 = 0, $shl116$i$i = 0, $shl127$i$i = 0, $shl131$i$i = 0, $shl15$i = 0, $shl18$i = 0, $shl192$i = 0, $shl195$i = 0, $shl198$i = 0, $shl20 = 0, $shl222$i$i = 0, $shl226$i$i = 0, $shl265$i$i = 0, $shl270$i$i = 0;
 var $shl276$i$i = 0, $shl279$i$i = 0, $shl288$i = 0, $shl291$i = 0, $shl294$i$i = 0, $shl31 = 0, $shl31$i = 0, $shl316$i$i = 0, $shl326$i$i = 0, $shl333$i = 0, $shl338$i = 0, $shl344$i = 0, $shl347$i = 0, $shl362$i = 0, $shl384$i = 0, $shl39$i$i = 0, $shl395$i = 0, $shl44 = 0, $shl46 = 0, $shl48$i$i = 0;
 var $shl60$i = 0, $shl70$i$i = 0, $shl74 = 0, $shl75$i$i = 0, $shl81 = 0, $shl81$i$i = 0, $shl84$i$i = 0, $shl9$i = 0, $shl95$i$i = 0, $shl99 = 0, $shr = 0, $shr$i = 0, $shr$i$i = 0, $shr$i135 = 0, $shr$i49$i = 0, $shr11 = 0, $shr11$i = 0, $shr11$i142 = 0, $shr110 = 0, $shr110$i$i = 0;
 var $shr12$i = 0, $shr124$i$i = 0, $shr15$i = 0, $shr16$i = 0, $shr16$i143 = 0, $shr19$i = 0, $shr194$i = 0, $shr20$i = 0, $shr214$i$i = 0, $shr253$i$i = 0, $shr263$i$i = 0, $shr267$i$i = 0, $shr27$i = 0, $shr272$i$i = 0, $shr277$i$i = 0, $shr281$i$i = 0, $shr283$i = 0, $shr310$i$i = 0, $shr318$i = 0, $shr323$i$i = 0;
 var $shr330$i = 0, $shr335$i = 0, $shr340$i = 0, $shr345$i = 0, $shr349$i = 0, $shr378$i = 0, $shr392$i = 0, $shr4$i = 0, $shr42$i = 0, $shr5$i = 0, $shr5$i137 = 0, $shr54 = 0, $shr56 = 0, $shr57 = 0, $shr58$i$i = 0, $shr60 = 0, $shr61 = 0, $shr64 = 0, $shr65 = 0, $shr68 = 0;
 var $shr68$i$i = 0, $shr69 = 0, $shr7$i = 0, $shr7$i140 = 0, $shr72 = 0, $shr72$i = 0, $shr72$i$i = 0, $shr75$i = 0, $shr76$i = 0, $shr77$i$i = 0, $shr79$i = 0, $shr8$i = 0, $shr80$i = 0, $shr82$i$i = 0, $shr83$i = 0, $shr84$i = 0, $shr86$i$i = 0, $shr87$i = 0, $shr88$i = 0, $shr91$i = 0;
 var $size$i$i = 0, $size$i$i$i = 0, $size$i$i$le = 0, $size192$i = 0, $size192$i$le = 0, $size249$i = 0, $sizebits$0$i = 0, $sp$0$i$i = 0, $sp$0$i$i$i = 0, $sp$0103$i = 0, $sp$1102$i = 0, $spec$select$i = 0, $spec$select$i151 = 0, $spec$select1$i = 0, $spec$select10$i = 0, $spec$select2$i = 0, $spec$select5$i = 0, $spec$select89$i = 0, $spec$select9$i = 0, $ssize$2$ph$i = 0;
 var $sub = 0, $sub$i = 0, $sub$i$i = 0, $sub$i$i$i = 0, $sub$i134 = 0, $sub$i177 = 0, $sub$i18$i = 0, $sub$i30$i = 0, $sub$i40$i = 0, $sub$ptr$lhs$cast$i = 0, $sub$ptr$lhs$cast$i$i = 0, $sub$ptr$lhs$cast$i45$i = 0, $sub$ptr$rhs$cast$i = 0, $sub$ptr$rhs$cast$i$i = 0, $sub$ptr$rhs$cast$i46$i = 0, $sub$ptr$sub$i = 0, $sub$ptr$sub$i$i = 0, $sub$ptr$sub$i47$i = 0, $sub10$i = 0, $sub100 = 0;
 var $sub100$i = 0, $sub101$i = 0, $sub113$i = 0, $sub113$i$i = 0, $sub118$i = 0, $sub12$i$i = 0, $sub14$i = 0, $sub16$i$i = 0, $sub170 = 0, $sub176$i = 0, $sub18$i$i = 0, $sub2$i = 0, $sub200 = 0, $sub22$i = 0, $sub262$i$i = 0, $sub264$i = 0, $sub266$i$i = 0, $sub271$i$i = 0, $sub275$i$i = 0, $sub30$i = 0;
 var $sub31$i = 0, $sub313$i$i = 0, $sub329$i = 0, $sub33$i = 0, $sub334$i = 0, $sub339$i = 0, $sub343$i = 0, $sub381$i = 0, $sub4$i = 0, $sub42$i = 0, $sub5$i$i = 0, $sub5$i$i$i = 0, $sub5$i22$i = 0, $sub51 = 0, $sub51$i = 0, $sub53 = 0, $sub6$i = 0, $sub63$i = 0, $sub67$i = 0, $sub67$i$i = 0;
 var $sub70$i = 0, $sub71$i$i = 0, $sub76$i$i = 0, $sub77$i = 0, $sub80$i$i = 0, $t$0$i = 0, $t$0$i146 = 0, $t$2$i = 0, $t$4$i = 0, $t$517$i = 0, $t$517$i$ph = 0, $tbase$3$i = 0, $tbase$4$i = 0, $tbase$7$i = 0, $tobool$i$i = 0, $tobool$i$i$i = 0, $tobool$i$i197 = 0, $tobool1 = 0, $tobool116 = 0, $tobool199$i = 0;
 var $tobool2$i$i = 0, $tobool2$i$i$i = 0, $tobool200$i = 0, $tobool219 = 0, $tobool228$i$i = 0, $tobool241$i = 0, $tobool293$i = 0, $tobool296$i$i = 0, $tobool3 = 0, $tobool30$i = 0, $tobool364$i = 0, $tobool97$i$i = 0, $tsize$2647482$i = 0, $tsize$3$i = 0, $tsize$4$i = 0, $tsize$7$i = 0, $v$0$i = 0, $v$0$i148 = 0, $v$1$i = 0, $v$3$i = 0;
 var $v$3$i207 = 0, $v$4$lcssa$i = 0, $v$419$i = 0, $v$419$i$ph = 0, $xor$i = 0, $xor$i$i = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $attr$i$i$i = sp + 4|0;
 $magic$i$i = sp;
 $0 = load4(1399808);
 $cmp = ($0|0)==(0);
 if ($cmp) {
  (___pthread_mutex_lock(1399832)|0);
  $1 = load4(1399808);
  $cmp$i = ($1|0)==(0);
  if ($cmp$i) {
   store4((1399816),4096);
   store4((1399812),4096);
   store4((1399820),-1);
   store4((1399824),-1);
   store4((1399828),2);
   store4((1400304),2);
   $call$i$i = (_pthread_mutexattr_init($attr$i$i$i)|0);
   $tobool$i$i = ($call$i$i|0)==(0);
   if ($tobool$i$i) {
    $call1$i$i = (_pthread_mutex_init((1400308),$attr$i$i$i)|0);
    $tobool2$i$i = ($call1$i$i|0)==(0);
    if ($tobool2$i$i) {
    }
   }
   $2 = $magic$i$i;
   $xor$i = $2 & -16;
   $and7$i = $xor$i ^ 1431655768;
   Atomics_store(HEAP32,349952,$and7$i)|0;
  }
  (___pthread_mutex_unlock(1399832)|0);
 }
 $3 = load4((1400304));
 $and = $3 & 2;
 $tobool1 = ($and|0)==(0);
 if (!($tobool1)) {
  $call2 = (___pthread_mutex_lock((1400308))|0);
  $tobool3 = ($call2|0)==(0);
  if (!($tobool3)) {
   $retval$1 = 0;
   STACKTOP = sp;return ($retval$1|0);
  }
 }
 $cmp4 = ($bytes>>>0)<(245);
 do {
  if ($cmp4) {
   $cmp6 = ($bytes>>>0)<(11);
   $add9 = (($bytes) + 11)|0;
   $and10 = $add9 & -8;
   $cond = $cmp6 ? 16 : $and10;
   $shr = $cond >>> 3;
   $4 = load4(1399860);
   $shr11 = $4 >>> $shr;
   $and12 = $shr11 & 3;
   $cmp13 = ($and12|0)==(0);
   if (!($cmp13)) {
    $neg = $shr11 & 1;
    $and15 = $neg ^ 1;
    $add16 = (($and15) + ($shr))|0;
    $shl = $add16 << 1;
    $arrayidx = (1399900 + ($shl<<2)|0);
    $5 = ((($arrayidx)) + 8|0);
    $6 = load4($5);
    $fd17 = ((($6)) + 8|0);
    $7 = load4($fd17);
    $cmp18 = ($7|0)==($arrayidx|0);
    if ($cmp18) {
     $shl20 = 1 << $add16;
     $neg21 = $shl20 ^ -1;
     $and22 = $4 & $neg21;
     store4(1399860,$and22);
    } else {
     $bk27 = ((($7)) + 12|0);
     store4($bk27,$arrayidx);
     store4($5,$7);
    }
    $shl31 = $add16 << 3;
    $or32 = $shl31 | 3;
    $head = ((($6)) + 4|0);
    store4($head,$or32);
    $add$ptr = (($6) + ($shl31)|0);
    $head34 = ((($add$ptr)) + 4|0);
    $8 = load4($head34);
    $or35 = $8 | 1;
    store4($head34,$or35);
    $mem$2 = $fd17;
    break;
   }
   $9 = load4((1399868));
   $cmp38 = ($cond>>>0)>($9>>>0);
   if ($cmp38) {
    $cmp40 = ($shr11|0)==(0);
    if (!($cmp40)) {
     $shl44 = $shr11 << $shr;
     $shl46 = 2 << $shr;
     $sub = (0 - ($shl46))|0;
     $or49 = $shl46 | $sub;
     $and50 = $shl44 & $or49;
     $sub51 = (0 - ($and50))|0;
     $and52 = $and50 & $sub51;
     $sub53 = (($and52) + -1)|0;
     $shr54 = $sub53 >>> 12;
     $and55 = $shr54 & 16;
     $shr56 = $sub53 >>> $and55;
     $shr57 = $shr56 >>> 5;
     $and58 = $shr57 & 8;
     $add59 = $and58 | $and55;
     $shr60 = $shr56 >>> $and58;
     $shr61 = $shr60 >>> 2;
     $and62 = $shr61 & 4;
     $add63 = $add59 | $and62;
     $shr64 = $shr60 >>> $and62;
     $shr65 = $shr64 >>> 1;
     $and66 = $shr65 & 2;
     $add67 = $add63 | $and66;
     $shr68 = $shr64 >>> $and66;
     $shr69 = $shr68 >>> 1;
     $and70 = $shr69 & 1;
     $add71 = $add67 | $and70;
     $shr72 = $shr68 >>> $and70;
     $add73 = (($add71) + ($shr72))|0;
     $shl74 = $add73 << 1;
     $arrayidx75 = (1399900 + ($shl74<<2)|0);
     $10 = ((($arrayidx75)) + 8|0);
     $11 = load4($10);
     $fd78 = ((($11)) + 8|0);
     $12 = load4($fd78);
     $cmp79 = ($12|0)==($arrayidx75|0);
     if ($cmp79) {
      $shl81 = 1 << $add73;
      $neg82 = $shl81 ^ -1;
      $and83 = $4 & $neg82;
      store4(1399860,$and83);
      $14 = $and83;
     } else {
      $bk94 = ((($12)) + 12|0);
      store4($bk94,$arrayidx75);
      store4($10,$12);
      $14 = $4;
     }
     $shl99 = $add73 << 3;
     $sub100 = (($shl99) - ($cond))|0;
     $or102 = $cond | 3;
     $head103 = ((($11)) + 4|0);
     store4($head103,$or102);
     $add$ptr104 = (($11) + ($cond)|0);
     $or105 = $sub100 | 1;
     $head106 = ((($add$ptr104)) + 4|0);
     store4($head106,$or105);
     $add$ptr107 = (($11) + ($shl99)|0);
     store4($add$ptr107,$sub100);
     $cmp108 = ($9|0)==(0);
     if (!($cmp108)) {
      $13 = load4((1399880));
      $shr110 = $9 >>> 3;
      $shl111 = $shr110 << 1;
      $arrayidx112 = (1399900 + ($shl111<<2)|0);
      $shl114 = 1 << $shr110;
      $and115 = $14 & $shl114;
      $tobool116 = ($and115|0)==(0);
      if ($tobool116) {
       $or119 = $14 | $shl114;
       store4(1399860,$or119);
       $$pre = ((($arrayidx112)) + 8|0);
       $$pre$phiZ2D = $$pre;$F113$0 = $arrayidx112;
      } else {
       $15 = ((($arrayidx112)) + 8|0);
       $16 = load4($15);
       $$pre$phiZ2D = $15;$F113$0 = $16;
      }
      store4($$pre$phiZ2D,$13);
      $bk131 = ((($F113$0)) + 12|0);
      store4($bk131,$13);
      $fd132 = ((($13)) + 8|0);
      store4($fd132,$F113$0);
      $bk133 = ((($13)) + 12|0);
      store4($bk133,$arrayidx112);
     }
     store4((1399868),$sub100);
     store4((1399880),$add$ptr104);
     $mem$2 = $fd78;
     break;
    }
    $17 = load4((1399864));
    $cmp137 = ($17|0)==(0);
    if ($cmp137) {
     $nb$0 = $cond;
     label = 118;
    } else {
     $sub$i = (0 - ($17))|0;
     $and$i = $17 & $sub$i;
     $sub2$i = (($and$i) + -1)|0;
     $shr$i = $sub2$i >>> 12;
     $and3$i = $shr$i & 16;
     $shr4$i = $sub2$i >>> $and3$i;
     $shr5$i = $shr4$i >>> 5;
     $and6$i = $shr5$i & 8;
     $add$i = $and6$i | $and3$i;
     $shr7$i = $shr4$i >>> $and6$i;
     $shr8$i = $shr7$i >>> 2;
     $and9$i = $shr8$i & 4;
     $add10$i = $add$i | $and9$i;
     $shr11$i = $shr7$i >>> $and9$i;
     $shr12$i = $shr11$i >>> 1;
     $and13$i = $shr12$i & 2;
     $add14$i = $add10$i | $and13$i;
     $shr15$i = $shr11$i >>> $and13$i;
     $shr16$i = $shr15$i >>> 1;
     $and17$i = $shr16$i & 1;
     $add18$i = $add14$i | $and17$i;
     $shr19$i = $shr15$i >>> $and17$i;
     $add20$i = (($add18$i) + ($shr19$i))|0;
     $arrayidx$i = (1400164 + ($add20$i<<2)|0);
     $18 = load4($arrayidx$i);
     $head$i = ((($18)) + 4|0);
     $19 = load4($head$i);
     $and21$i = $19 & -8;
     $sub22$i = (($and21$i) - ($cond))|0;
     $rsize$0$i = $sub22$i;$t$0$i = $18;$v$0$i = $18;
     while(1) {
      $arrayidx23$i = ((($t$0$i)) + 16|0);
      $20 = load4($arrayidx23$i);
      $cmp$i133 = ($20|0)==(0|0);
      if ($cmp$i133) {
       $arrayidx27$i = ((($t$0$i)) + 20|0);
       $21 = load4($arrayidx27$i);
       $cmp28$i = ($21|0)==(0|0);
       if ($cmp28$i) {
        break;
       } else {
        $cond4$i = $21;
       }
      } else {
       $cond4$i = $20;
      }
      $head29$i = ((($cond4$i)) + 4|0);
      $22 = load4($head29$i);
      $and30$i = $22 & -8;
      $sub31$i = (($and30$i) - ($cond))|0;
      $cmp32$i = ($sub31$i>>>0)<($rsize$0$i>>>0);
      $spec$select$i = $cmp32$i ? $sub31$i : $rsize$0$i;
      $spec$select1$i = $cmp32$i ? $cond4$i : $v$0$i;
      $rsize$0$i = $spec$select$i;$t$0$i = $cond4$i;$v$0$i = $spec$select1$i;
     }
     $add$ptr$i = (($v$0$i) + ($cond)|0);
     $cmp35$i = ($add$ptr$i>>>0)>($v$0$i>>>0);
     if ($cmp35$i) {
      $parent$i = ((($v$0$i)) + 24|0);
      $23 = load4($parent$i);
      $bk$i = ((($v$0$i)) + 12|0);
      $24 = load4($bk$i);
      $cmp40$i = ($24|0)==($v$0$i|0);
      do {
       if ($cmp40$i) {
        $arrayidx61$i = ((($v$0$i)) + 20|0);
        $26 = load4($arrayidx61$i);
        $cmp62$i = ($26|0)==(0|0);
        if ($cmp62$i) {
         $arrayidx65$i = ((($v$0$i)) + 16|0);
         $27 = load4($arrayidx65$i);
         $cmp66$i = ($27|0)==(0|0);
         if ($cmp66$i) {
          $R$3$i = 0;
          break;
         } else {
          $R$1$i$ph = $27;$RP$1$i$ph = $arrayidx65$i;
         }
        } else {
         $R$1$i$ph = $26;$RP$1$i$ph = $arrayidx61$i;
        }
        $R$1$i = $R$1$i$ph;$RP$1$i = $RP$1$i$ph;
        while(1) {
         $arrayidx71$i = ((($R$1$i)) + 20|0);
         $28 = load4($arrayidx71$i);
         $cmp72$i = ($28|0)==(0|0);
         if ($cmp72$i) {
          $arrayidx75$i = ((($R$1$i)) + 16|0);
          $29 = load4($arrayidx75$i);
          $cmp76$i = ($29|0)==(0|0);
          if ($cmp76$i) {
           break;
          } else {
           $R$1$i$be = $29;$RP$1$i$be = $arrayidx75$i;
          }
         } else {
          $R$1$i$be = $28;$RP$1$i$be = $arrayidx71$i;
         }
         $R$1$i = $R$1$i$be;$RP$1$i = $RP$1$i$be;
        }
        store4($RP$1$i,0);
        $R$3$i = $R$1$i;
       } else {
        $fd$i = ((($v$0$i)) + 8|0);
        $25 = load4($fd$i);
        $bk56$i = ((($25)) + 12|0);
        store4($bk56$i,$24);
        $fd57$i = ((($24)) + 8|0);
        store4($fd57$i,$25);
        $R$3$i = $24;
       }
      } while(0);
      $cmp90$i = ($23|0)==(0|0);
      do {
       if (!($cmp90$i)) {
        $index$i = ((($v$0$i)) + 28|0);
        $30 = load4($index$i);
        $arrayidx94$i = (1400164 + ($30<<2)|0);
        $31 = load4($arrayidx94$i);
        $cmp95$i = ($v$0$i|0)==($31|0);
        if ($cmp95$i) {
         store4($arrayidx94$i,$R$3$i);
         $cond2$i = ($R$3$i|0)==(0|0);
         if ($cond2$i) {
          $shl$i = 1 << $30;
          $neg$i = $shl$i ^ -1;
          $and103$i = $17 & $neg$i;
          store4((1399864),$and103$i);
          break;
         }
        } else {
         $arrayidx113$i = ((($23)) + 16|0);
         $32 = load4($arrayidx113$i);
         $cmp114$i = ($32|0)==($v$0$i|0);
         $arrayidx121$i = ((($23)) + 20|0);
         $arrayidx121$i$sink = $cmp114$i ? $arrayidx113$i : $arrayidx121$i;
         store4($arrayidx121$i$sink,$R$3$i);
         $cmp126$i = ($R$3$i|0)==(0|0);
         if ($cmp126$i) {
          break;
         }
        }
        $parent135$i = ((($R$3$i)) + 24|0);
        store4($parent135$i,$23);
        $arrayidx137$i = ((($v$0$i)) + 16|0);
        $33 = load4($arrayidx137$i);
        $cmp138$i = ($33|0)==(0|0);
        if (!($cmp138$i)) {
         $arrayidx148$i = ((($R$3$i)) + 16|0);
         store4($arrayidx148$i,$33);
         $parent149$i = ((($33)) + 24|0);
         store4($parent149$i,$R$3$i);
        }
        $arrayidx154$i = ((($v$0$i)) + 20|0);
        $34 = load4($arrayidx154$i);
        $cmp155$i = ($34|0)==(0|0);
        if (!($cmp155$i)) {
         $arrayidx165$i = ((($R$3$i)) + 20|0);
         store4($arrayidx165$i,$34);
         $parent166$i = ((($34)) + 24|0);
         store4($parent166$i,$R$3$i);
        }
       }
      } while(0);
      $cmp174$i = ($rsize$0$i>>>0)<(16);
      if ($cmp174$i) {
       $add177$i = (($rsize$0$i) + ($cond))|0;
       $or178$i = $add177$i | 3;
       $head179$i = ((($v$0$i)) + 4|0);
       store4($head179$i,$or178$i);
       $add$ptr181$i = (($v$0$i) + ($add177$i)|0);
       $head182$i = ((($add$ptr181$i)) + 4|0);
       $35 = load4($head182$i);
       $or183$i = $35 | 1;
       store4($head182$i,$or183$i);
      } else {
       $or186$i = $cond | 3;
       $head187$i = ((($v$0$i)) + 4|0);
       store4($head187$i,$or186$i);
       $or188$i = $rsize$0$i | 1;
       $head189$i = ((($add$ptr$i)) + 4|0);
       store4($head189$i,$or188$i);
       $add$ptr190$i = (($add$ptr$i) + ($rsize$0$i)|0);
       store4($add$ptr190$i,$rsize$0$i);
       $cmp191$i = ($9|0)==(0);
       if (!($cmp191$i)) {
        $36 = load4((1399880));
        $shr194$i = $9 >>> 3;
        $shl195$i = $shr194$i << 1;
        $arrayidx196$i = (1399900 + ($shl195$i<<2)|0);
        $shl198$i = 1 << $shr194$i;
        $and199$i = $shl198$i & $4;
        $tobool200$i = ($and199$i|0)==(0);
        if ($tobool200$i) {
         $or204$i = $shl198$i | $4;
         store4(1399860,$or204$i);
         $$pre$i = ((($arrayidx196$i)) + 8|0);
         $$pre$phi$iZ2D = $$pre$i;$F197$0$i = $arrayidx196$i;
        } else {
         $37 = ((($arrayidx196$i)) + 8|0);
         $38 = load4($37);
         $$pre$phi$iZ2D = $37;$F197$0$i = $38;
        }
        store4($$pre$phi$iZ2D,$36);
        $bk218$i = ((($F197$0$i)) + 12|0);
        store4($bk218$i,$36);
        $fd219$i = ((($36)) + 8|0);
        store4($fd219$i,$F197$0$i);
        $bk220$i = ((($36)) + 12|0);
        store4($bk220$i,$arrayidx196$i);
       }
       store4((1399868),$rsize$0$i);
       store4((1399880),$add$ptr$i);
      }
      $add$ptr225$i = ((($v$0$i)) + 8|0);
      $mem$2 = $add$ptr225$i;
     } else {
      $nb$0 = $cond;
      label = 118;
     }
    }
   } else {
    $nb$0 = $cond;
    label = 118;
   }
  } else {
   $cmp149 = ($bytes>>>0)>(4294967231);
   if ($cmp149) {
    $nb$0 = -1;
    label = 118;
   } else {
    $add154 = (($bytes) + 11)|0;
    $and155 = $add154 & -8;
    $39 = load4((1399864));
    $cmp156 = ($39|0)==(0);
    if ($cmp156) {
     $nb$0 = $and155;
     label = 118;
    } else {
     $sub$i134 = (0 - ($and155))|0;
     $shr$i135 = $add154 >>> 8;
     $cmp$i136 = ($shr$i135|0)==(0);
     if ($cmp$i136) {
      $idx$0$i = 0;
     } else {
      $cmp1$i = ($and155>>>0)>(16777215);
      if ($cmp1$i) {
       $idx$0$i = 31;
      } else {
       $sub4$i = (($shr$i135) + 1048320)|0;
       $shr5$i137 = $sub4$i >>> 16;
       $and$i138 = $shr5$i137 & 8;
       $shl$i139 = $shr$i135 << $and$i138;
       $sub6$i = (($shl$i139) + 520192)|0;
       $shr7$i140 = $sub6$i >>> 16;
       $and8$i = $shr7$i140 & 4;
       $add$i141 = $and8$i | $and$i138;
       $shl9$i = $shl$i139 << $and8$i;
       $sub10$i = (($shl9$i) + 245760)|0;
       $shr11$i142 = $sub10$i >>> 16;
       $and12$i = $shr11$i142 & 2;
       $add13$i = $add$i141 | $and12$i;
       $sub14$i = (14 - ($add13$i))|0;
       $shl15$i = $shl9$i << $and12$i;
       $shr16$i143 = $shl15$i >>> 15;
       $add17$i = (($sub14$i) + ($shr16$i143))|0;
       $shl18$i = $add17$i << 1;
       $add19$i = (($add17$i) + 7)|0;
       $shr20$i = $and155 >>> $add19$i;
       $and21$i144 = $shr20$i & 1;
       $add22$i = $and21$i144 | $shl18$i;
       $idx$0$i = $add22$i;
      }
     }
     $arrayidx$i145 = (1400164 + ($idx$0$i<<2)|0);
     $40 = load4($arrayidx$i145);
     $cmp24$i = ($40|0)==(0|0);
     L90: do {
      if ($cmp24$i) {
       $rsize$3$i = $sub$i134;$t$2$i = 0;$v$3$i = 0;
       label = 70;
      } else {
       $cmp26$i = ($idx$0$i|0)==(31);
       $shr27$i = $idx$0$i >>> 1;
       $sub30$i = (25 - ($shr27$i))|0;
       $cond$i = $cmp26$i ? 0 : $sub30$i;
       $shl31$i = $and155 << $cond$i;
       $rsize$0$i147 = $sub$i134;$rst$0$i = 0;$sizebits$0$i = $shl31$i;$t$0$i146 = $40;$v$0$i148 = 0;
       while(1) {
        $head$i149 = ((($t$0$i146)) + 4|0);
        $41 = load4($head$i149);
        $and32$i = $41 & -8;
        $sub33$i = (($and32$i) - ($and155))|0;
        $cmp34$i = ($sub33$i>>>0)<($rsize$0$i147>>>0);
        if ($cmp34$i) {
         $cmp36$i = ($sub33$i|0)==(0);
         if ($cmp36$i) {
          $rsize$418$i$ph = 0;$t$517$i$ph = $t$0$i146;$v$419$i$ph = $t$0$i146;
          label = 74;
          break L90;
         } else {
          $rsize$1$i = $sub33$i;$v$1$i = $t$0$i146;
         }
        } else {
         $rsize$1$i = $rsize$0$i147;$v$1$i = $v$0$i148;
        }
        $arrayidx40$i = ((($t$0$i146)) + 20|0);
        $42 = load4($arrayidx40$i);
        $shr42$i = $sizebits$0$i >>> 31;
        $arrayidx44$i = (((($t$0$i146)) + 16|0) + ($shr42$i<<2)|0);
        $43 = load4($arrayidx44$i);
        $cmp45$i = ($42|0)==(0|0);
        $cmp46$i = ($42|0)==($43|0);
        $or$cond1$i = $cmp45$i | $cmp46$i;
        $rst$1$i = $or$cond1$i ? $rst$0$i : $42;
        $cmp49$i = ($43|0)==(0|0);
        $spec$select5$i = $sizebits$0$i << 1;
        if ($cmp49$i) {
         $rsize$3$i = $rsize$1$i;$t$2$i = $rst$1$i;$v$3$i = $v$1$i;
         label = 70;
         break;
        } else {
         $rsize$0$i147 = $rsize$1$i;$rst$0$i = $rst$1$i;$sizebits$0$i = $spec$select5$i;$t$0$i146 = $43;$v$0$i148 = $v$1$i;
        }
       }
      }
     } while(0);
     if ((label|0) == 70) {
      $cmp55$i = ($t$2$i|0)==(0|0);
      $cmp57$i = ($v$3$i|0)==(0|0);
      $or$cond$i = $cmp55$i & $cmp57$i;
      if ($or$cond$i) {
       $shl60$i = 2 << $idx$0$i;
       $sub63$i = (0 - ($shl60$i))|0;
       $or$i = $shl60$i | $sub63$i;
       $and64$i = $or$i & $39;
       $cmp65$i = ($and64$i|0)==(0);
       if ($cmp65$i) {
        $nb$0 = $and155;
        label = 118;
        break;
       }
       $sub67$i = (0 - ($and64$i))|0;
       $and68$i = $and64$i & $sub67$i;
       $sub70$i = (($and68$i) + -1)|0;
       $shr72$i = $sub70$i >>> 12;
       $and73$i = $shr72$i & 16;
       $shr75$i = $sub70$i >>> $and73$i;
       $shr76$i = $shr75$i >>> 5;
       $and77$i = $shr76$i & 8;
       $add78$i = $and77$i | $and73$i;
       $shr79$i = $shr75$i >>> $and77$i;
       $shr80$i = $shr79$i >>> 2;
       $and81$i = $shr80$i & 4;
       $add82$i = $add78$i | $and81$i;
       $shr83$i = $shr79$i >>> $and81$i;
       $shr84$i = $shr83$i >>> 1;
       $and85$i = $shr84$i & 2;
       $add86$i = $add82$i | $and85$i;
       $shr87$i = $shr83$i >>> $and85$i;
       $shr88$i = $shr87$i >>> 1;
       $and89$i = $shr88$i & 1;
       $add90$i = $add86$i | $and89$i;
       $shr91$i = $shr87$i >>> $and89$i;
       $add92$i = (($add90$i) + ($shr91$i))|0;
       $arrayidx94$i150 = (1400164 + ($add92$i<<2)|0);
       $44 = load4($arrayidx94$i150);
       $t$4$i = $44;$v$3$i207 = 0;
      } else {
       $t$4$i = $t$2$i;$v$3$i207 = $v$3$i;
      }
      $cmp9716$i = ($t$4$i|0)==(0|0);
      if ($cmp9716$i) {
       $rsize$4$lcssa$i = $rsize$3$i;$v$4$lcssa$i = $v$3$i207;
      } else {
       $rsize$418$i$ph = $rsize$3$i;$t$517$i$ph = $t$4$i;$v$419$i$ph = $v$3$i207;
       label = 74;
      }
     }
     if ((label|0) == 74) {
      $rsize$418$i = $rsize$418$i$ph;$t$517$i = $t$517$i$ph;$v$419$i = $v$419$i$ph;
      while(1) {
       $head99$i = ((($t$517$i)) + 4|0);
       $45 = load4($head99$i);
       $and100$i = $45 & -8;
       $sub101$i = (($and100$i) - ($and155))|0;
       $cmp102$i = ($sub101$i>>>0)<($rsize$418$i>>>0);
       $spec$select$i151 = $cmp102$i ? $sub101$i : $rsize$418$i;
       $spec$select2$i = $cmp102$i ? $t$517$i : $v$419$i;
       $arrayidx106$i = ((($t$517$i)) + 16|0);
       $46 = load4($arrayidx106$i);
       $cmp107$i = ($46|0)==(0|0);
       if ($cmp107$i) {
        $arrayidx113$i153 = ((($t$517$i)) + 20|0);
        $47 = load4($arrayidx113$i153);
        $cond115$i = $47;
       } else {
        $cond115$i = $46;
       }
       $cmp97$i = ($cond115$i|0)==(0|0);
       if ($cmp97$i) {
        $rsize$4$lcssa$i = $spec$select$i151;$v$4$lcssa$i = $spec$select2$i;
        break;
       } else {
        $rsize$418$i = $spec$select$i151;$t$517$i = $cond115$i;$v$419$i = $spec$select2$i;
       }
      }
     }
     $cmp116$i = ($v$4$lcssa$i|0)==(0|0);
     if ($cmp116$i) {
      $nb$0 = $and155;
      label = 118;
     } else {
      $48 = load4((1399868));
      $sub118$i = (($48) - ($and155))|0;
      $cmp119$i = ($rsize$4$lcssa$i>>>0)<($sub118$i>>>0);
      if ($cmp119$i) {
       $add$ptr$i154 = (($v$4$lcssa$i) + ($and155)|0);
       $cmp123$i = ($add$ptr$i154>>>0)>($v$4$lcssa$i>>>0);
       if ($cmp123$i) {
        $parent$i155 = ((($v$4$lcssa$i)) + 24|0);
        $49 = load4($parent$i155);
        $bk$i156 = ((($v$4$lcssa$i)) + 12|0);
        $50 = load4($bk$i156);
        $cmp128$i = ($50|0)==($v$4$lcssa$i|0);
        do {
         if ($cmp128$i) {
          $arrayidx151$i = ((($v$4$lcssa$i)) + 20|0);
          $52 = load4($arrayidx151$i);
          $cmp152$i = ($52|0)==(0|0);
          if ($cmp152$i) {
           $arrayidx155$i = ((($v$4$lcssa$i)) + 16|0);
           $53 = load4($arrayidx155$i);
           $cmp156$i = ($53|0)==(0|0);
           if ($cmp156$i) {
            $R$3$i166 = 0;
            break;
           } else {
            $R$1$i162$ph = $53;$RP$1$i161$ph = $arrayidx155$i;
           }
          } else {
           $R$1$i162$ph = $52;$RP$1$i161$ph = $arrayidx151$i;
          }
          $R$1$i162 = $R$1$i162$ph;$RP$1$i161 = $RP$1$i161$ph;
          while(1) {
           $arrayidx161$i = ((($R$1$i162)) + 20|0);
           $54 = load4($arrayidx161$i);
           $cmp162$i = ($54|0)==(0|0);
           if ($cmp162$i) {
            $arrayidx165$i163 = ((($R$1$i162)) + 16|0);
            $55 = load4($arrayidx165$i163);
            $cmp166$i = ($55|0)==(0|0);
            if ($cmp166$i) {
             break;
            } else {
             $R$1$i162$be = $55;$RP$1$i161$be = $arrayidx165$i163;
            }
           } else {
            $R$1$i162$be = $54;$RP$1$i161$be = $arrayidx161$i;
           }
           $R$1$i162 = $R$1$i162$be;$RP$1$i161 = $RP$1$i161$be;
          }
          store4($RP$1$i161,0);
          $R$3$i166 = $R$1$i162;
         } else {
          $fd$i157 = ((($v$4$lcssa$i)) + 8|0);
          $51 = load4($fd$i157);
          $bk145$i = ((($51)) + 12|0);
          store4($bk145$i,$50);
          $fd146$i = ((($50)) + 8|0);
          store4($fd146$i,$51);
          $R$3$i166 = $50;
         }
        } while(0);
        $cmp180$i = ($49|0)==(0|0);
        do {
         if ($cmp180$i) {
          $65 = $39;
         } else {
          $index$i167 = ((($v$4$lcssa$i)) + 28|0);
          $56 = load4($index$i167);
          $arrayidx184$i = (1400164 + ($56<<2)|0);
          $57 = load4($arrayidx184$i);
          $cmp185$i = ($v$4$lcssa$i|0)==($57|0);
          if ($cmp185$i) {
           store4($arrayidx184$i,$R$3$i166);
           $cond3$i = ($R$3$i166|0)==(0|0);
           if ($cond3$i) {
            $shl192$i = 1 << $56;
            $neg$i168 = $shl192$i ^ -1;
            $and194$i = $39 & $neg$i168;
            store4((1399864),$and194$i);
            $65 = $and194$i;
            break;
           }
          } else {
           $arrayidx204$i = ((($49)) + 16|0);
           $58 = load4($arrayidx204$i);
           $cmp205$i = ($58|0)==($v$4$lcssa$i|0);
           $arrayidx212$i = ((($49)) + 20|0);
           $arrayidx212$i$sink = $cmp205$i ? $arrayidx204$i : $arrayidx212$i;
           store4($arrayidx212$i$sink,$R$3$i166);
           $cmp217$i = ($R$3$i166|0)==(0|0);
           if ($cmp217$i) {
            $65 = $39;
            break;
           }
          }
          $parent226$i = ((($R$3$i166)) + 24|0);
          store4($parent226$i,$49);
          $arrayidx228$i = ((($v$4$lcssa$i)) + 16|0);
          $59 = load4($arrayidx228$i);
          $cmp229$i = ($59|0)==(0|0);
          if (!($cmp229$i)) {
           $arrayidx239$i = ((($R$3$i166)) + 16|0);
           store4($arrayidx239$i,$59);
           $parent240$i = ((($59)) + 24|0);
           store4($parent240$i,$R$3$i166);
          }
          $arrayidx245$i = ((($v$4$lcssa$i)) + 20|0);
          $60 = load4($arrayidx245$i);
          $cmp246$i = ($60|0)==(0|0);
          if ($cmp246$i) {
           $65 = $39;
          } else {
           $arrayidx256$i = ((($R$3$i166)) + 20|0);
           store4($arrayidx256$i,$60);
           $parent257$i = ((($60)) + 24|0);
           store4($parent257$i,$R$3$i166);
           $65 = $39;
          }
         }
        } while(0);
        $cmp265$i = ($rsize$4$lcssa$i>>>0)<(16);
        L139: do {
         if ($cmp265$i) {
          $add268$i = (($rsize$4$lcssa$i) + ($and155))|0;
          $or270$i = $add268$i | 3;
          $head271$i = ((($v$4$lcssa$i)) + 4|0);
          store4($head271$i,$or270$i);
          $add$ptr273$i = (($v$4$lcssa$i) + ($add268$i)|0);
          $head274$i = ((($add$ptr273$i)) + 4|0);
          $61 = load4($head274$i);
          $or275$i = $61 | 1;
          store4($head274$i,$or275$i);
         } else {
          $or278$i = $and155 | 3;
          $head279$i = ((($v$4$lcssa$i)) + 4|0);
          store4($head279$i,$or278$i);
          $or280$i = $rsize$4$lcssa$i | 1;
          $head281$i = ((($add$ptr$i154)) + 4|0);
          store4($head281$i,$or280$i);
          $add$ptr282$i = (($add$ptr$i154) + ($rsize$4$lcssa$i)|0);
          store4($add$ptr282$i,$rsize$4$lcssa$i);
          $shr283$i = $rsize$4$lcssa$i >>> 3;
          $cmp284$i = ($rsize$4$lcssa$i>>>0)<(256);
          if ($cmp284$i) {
           $shl288$i = $shr283$i << 1;
           $arrayidx289$i = (1399900 + ($shl288$i<<2)|0);
           $62 = load4(1399860);
           $shl291$i = 1 << $shr283$i;
           $and292$i = $62 & $shl291$i;
           $tobool293$i = ($and292$i|0)==(0);
           if ($tobool293$i) {
            $or297$i = $62 | $shl291$i;
            store4(1399860,$or297$i);
            $$pre$i171 = ((($arrayidx289$i)) + 8|0);
            $$pre$phi$i172Z2D = $$pre$i171;$F290$0$i = $arrayidx289$i;
           } else {
            $63 = ((($arrayidx289$i)) + 8|0);
            $64 = load4($63);
            $$pre$phi$i172Z2D = $63;$F290$0$i = $64;
           }
           store4($$pre$phi$i172Z2D,$add$ptr$i154);
           $bk311$i = ((($F290$0$i)) + 12|0);
           store4($bk311$i,$add$ptr$i154);
           $fd312$i = ((($add$ptr$i154)) + 8|0);
           store4($fd312$i,$F290$0$i);
           $bk313$i = ((($add$ptr$i154)) + 12|0);
           store4($bk313$i,$arrayidx289$i);
           break;
          }
          $shr318$i = $rsize$4$lcssa$i >>> 8;
          $cmp319$i = ($shr318$i|0)==(0);
          if ($cmp319$i) {
           $I316$0$i = 0;
          } else {
           $cmp323$i = ($rsize$4$lcssa$i>>>0)>(16777215);
           if ($cmp323$i) {
            $I316$0$i = 31;
           } else {
            $sub329$i = (($shr318$i) + 1048320)|0;
            $shr330$i = $sub329$i >>> 16;
            $and331$i = $shr330$i & 8;
            $shl333$i = $shr318$i << $and331$i;
            $sub334$i = (($shl333$i) + 520192)|0;
            $shr335$i = $sub334$i >>> 16;
            $and336$i = $shr335$i & 4;
            $add337$i = $and336$i | $and331$i;
            $shl338$i = $shl333$i << $and336$i;
            $sub339$i = (($shl338$i) + 245760)|0;
            $shr340$i = $sub339$i >>> 16;
            $and341$i = $shr340$i & 2;
            $add342$i = $add337$i | $and341$i;
            $sub343$i = (14 - ($add342$i))|0;
            $shl344$i = $shl338$i << $and341$i;
            $shr345$i = $shl344$i >>> 15;
            $add346$i = (($sub343$i) + ($shr345$i))|0;
            $shl347$i = $add346$i << 1;
            $add348$i = (($add346$i) + 7)|0;
            $shr349$i = $rsize$4$lcssa$i >>> $add348$i;
            $and350$i = $shr349$i & 1;
            $add351$i = $and350$i | $shl347$i;
            $I316$0$i = $add351$i;
           }
          }
          $arrayidx355$i = (1400164 + ($I316$0$i<<2)|0);
          $index356$i = ((($add$ptr$i154)) + 28|0);
          store4($index356$i,$I316$0$i);
          $child357$i = ((($add$ptr$i154)) + 16|0);
          $arrayidx358$i = ((($child357$i)) + 4|0);
          store4($arrayidx358$i,0);
          store4($child357$i,0);
          $shl362$i = 1 << $I316$0$i;
          $and363$i = $65 & $shl362$i;
          $tobool364$i = ($and363$i|0)==(0);
          if ($tobool364$i) {
           $or368$i = $65 | $shl362$i;
           store4((1399864),$or368$i);
           store4($arrayidx355$i,$add$ptr$i154);
           $parent369$i = ((($add$ptr$i154)) + 24|0);
           store4($parent369$i,$arrayidx355$i);
           $bk370$i = ((($add$ptr$i154)) + 12|0);
           store4($bk370$i,$add$ptr$i154);
           $fd371$i = ((($add$ptr$i154)) + 8|0);
           store4($fd371$i,$add$ptr$i154);
           break;
          }
          $66 = load4($arrayidx355$i);
          $head38611$i = ((($66)) + 4|0);
          $67 = load4($head38611$i);
          $and38712$i = $67 & -8;
          $cmp38813$i = ($and38712$i|0)==($rsize$4$lcssa$i|0);
          L156: do {
           if ($cmp38813$i) {
            $T$0$lcssa$i = $66;
           } else {
            $cmp374$i = ($I316$0$i|0)==(31);
            $shr378$i = $I316$0$i >>> 1;
            $sub381$i = (25 - ($shr378$i))|0;
            $cond383$i = $cmp374$i ? 0 : $sub381$i;
            $shl384$i = $rsize$4$lcssa$i << $cond383$i;
            $K373$015$i = $shl384$i;$T$014$i = $66;
            while(1) {
             $shr392$i = $K373$015$i >>> 31;
             $arrayidx394$i = (((($T$014$i)) + 16|0) + ($shr392$i<<2)|0);
             $68 = load4($arrayidx394$i);
             $cmp396$i = ($68|0)==(0|0);
             if ($cmp396$i) {
              break;
             }
             $shl395$i = $K373$015$i << 1;
             $head386$i = ((($68)) + 4|0);
             $69 = load4($head386$i);
             $and387$i = $69 & -8;
             $cmp388$i = ($and387$i|0)==($rsize$4$lcssa$i|0);
             if ($cmp388$i) {
              $T$0$lcssa$i = $68;
              break L156;
             } else {
              $K373$015$i = $shl395$i;$T$014$i = $68;
             }
            }
            store4($arrayidx394$i,$add$ptr$i154);
            $parent406$i = ((($add$ptr$i154)) + 24|0);
            store4($parent406$i,$T$014$i);
            $bk407$i = ((($add$ptr$i154)) + 12|0);
            store4($bk407$i,$add$ptr$i154);
            $fd408$i = ((($add$ptr$i154)) + 8|0);
            store4($fd408$i,$add$ptr$i154);
            break L139;
           }
          } while(0);
          $fd416$i = ((($T$0$lcssa$i)) + 8|0);
          $70 = load4($fd416$i);
          $bk429$i = ((($70)) + 12|0);
          store4($bk429$i,$add$ptr$i154);
          store4($fd416$i,$add$ptr$i154);
          $fd431$i = ((($add$ptr$i154)) + 8|0);
          store4($fd431$i,$70);
          $bk432$i = ((($add$ptr$i154)) + 12|0);
          store4($bk432$i,$T$0$lcssa$i);
          $parent433$i = ((($add$ptr$i154)) + 24|0);
          store4($parent433$i,0);
         }
        } while(0);
        $add$ptr441$i = ((($v$4$lcssa$i)) + 8|0);
        $mem$2 = $add$ptr441$i;
       } else {
        $nb$0 = $and155;
        label = 118;
       }
      } else {
       $nb$0 = $and155;
       label = 118;
      }
     }
    }
   }
  }
 } while(0);
 L164: do {
  if ((label|0) == 118) {
   $71 = load4((1399868));
   $cmp166 = ($71>>>0)<($nb$0>>>0);
   if (!($cmp166)) {
    $sub170 = (($71) - ($nb$0))|0;
    $72 = load4((1399880));
    $cmp172 = ($sub170>>>0)>(15);
    if ($cmp172) {
     $add$ptr176 = (($72) + ($nb$0)|0);
     store4((1399880),$add$ptr176);
     store4((1399868),$sub170);
     $or177 = $sub170 | 1;
     $head178 = ((($add$ptr176)) + 4|0);
     store4($head178,$or177);
     $add$ptr179 = (($72) + ($71)|0);
     store4($add$ptr179,$sub170);
     $or182 = $nb$0 | 3;
     $head183 = ((($72)) + 4|0);
     store4($head183,$or182);
    } else {
     store4((1399868),0);
     store4((1399880),0);
     $or186 = $71 | 3;
     $head187 = ((($72)) + 4|0);
     store4($head187,$or186);
     $add$ptr188 = (($72) + ($71)|0);
     $head189 = ((($add$ptr188)) + 4|0);
     $73 = load4($head189);
     $or190 = $73 | 1;
     store4($head189,$or190);
    }
    $add$ptr192 = ((($72)) + 8|0);
    $mem$2 = $add$ptr192;
    break;
   }
   $74 = load4((1399872));
   $cmp196 = ($74>>>0)>($nb$0>>>0);
   if ($cmp196) {
    $sub200 = (($74) - ($nb$0))|0;
    store4((1399872),$sub200);
    $75 = load4((1399884));
    $add$ptr203 = (($75) + ($nb$0)|0);
    store4((1399884),$add$ptr203);
    $or204 = $sub200 | 1;
    $head205 = ((($add$ptr203)) + 4|0);
    store4($head205,$or204);
    $or207 = $nb$0 | 3;
    $head208 = ((($75)) + 4|0);
    store4($head208,$or207);
    $add$ptr209 = ((($75)) + 8|0);
    $mem$2 = $add$ptr209;
    break;
   }
   $76 = load4(1399808);
   $cmp$i173 = ($76|0)==(0);
   if ($cmp$i173) {
    (___pthread_mutex_lock(1399832)|0);
    $77 = load4(1399808);
    $cmp$i$i = ($77|0)==(0);
    if ($cmp$i$i) {
     store4((1399816),4096);
     store4((1399812),4096);
     store4((1399820),-1);
     store4((1399824),-1);
     store4((1399828),2);
     store4((1400304),2);
     $call$i$i$i = (_pthread_mutexattr_init($attr$i$i$i)|0);
     $tobool$i$i$i = ($call$i$i$i|0)==(0);
     if ($tobool$i$i$i) {
      $call1$i$i$i = (_pthread_mutex_init((1400308),$attr$i$i$i)|0);
      $tobool2$i$i$i = ($call1$i$i$i|0)==(0);
      if ($tobool2$i$i$i) {
      }
     }
     $78 = $magic$i$i;
     $xor$i$i = $78 & -16;
     $and7$i$i = $xor$i$i ^ 1431655768;
     Atomics_store(HEAP32,349952,$and7$i$i)|0;
    }
    (___pthread_mutex_unlock(1399832)|0);
   }
   $add$i176 = (($nb$0) + 48)|0;
   $79 = load4((1399816));
   $sub$i177 = (($nb$0) + 47)|0;
   $add9$i = (($79) + ($sub$i177))|0;
   $neg$i178 = (0 - ($79))|0;
   $and11$i = $add9$i & $neg$i178;
   $cmp12$i = ($and11$i>>>0)>($nb$0>>>0);
   if ($cmp12$i) {
    $80 = load4((1400300));
    $cmp15$i = ($80|0)==(0);
    if (!($cmp15$i)) {
     $81 = load4((1400292));
     $add17$i179 = (($81) + ($and11$i))|0;
     $cmp19$i = ($add17$i179>>>0)<=($81>>>0);
     $cmp21$i = ($add17$i179>>>0)>($80>>>0);
     $or$cond1$i180 = $cmp19$i | $cmp21$i;
     if ($or$cond1$i180) {
      $mem$2 = 0;
      break;
     }
    }
    $82 = load4((1400304));
    $and29$i = $82 & 4;
    $tobool30$i = ($and29$i|0)==(0);
    if ($tobool30$i) {
     $83 = load4((1399884));
     $cmp32$i181 = ($83|0)==(0|0);
     L192: do {
      if ($cmp32$i181) {
       label = 141;
      } else {
       $sp$0$i$i = (1400336);
       while(1) {
        $84 = load4($sp$0$i$i);
        $cmp$i12$i = ($84>>>0)>($83>>>0);
        if (!($cmp$i12$i)) {
         $size$i$i = ((($sp$0$i$i)) + 4|0);
         $85 = load4($size$i$i);
         $add$ptr$i$i = (($84) + ($85)|0);
         $cmp2$i$i = ($add$ptr$i$i>>>0)>($83>>>0);
         if ($cmp2$i$i) {
          break;
         }
        }
        $next$i$i = ((($sp$0$i$i)) + 8|0);
        $86 = load4($next$i$i);
        $cmp3$i$i = ($86|0)==(0|0);
        if ($cmp3$i$i) {
         label = 141;
         break L192;
        } else {
         $sp$0$i$i = $86;
        }
       }
       (___pthread_mutex_lock(1399832)|0);
       $91 = load4((1399872));
       $92 = load4((1399816));
       $sub77$i = (($sub$i177) - ($91))|0;
       $add78$i184 = (($sub77$i) + ($92))|0;
       $neg80$i = (0 - ($92))|0;
       $and81$i185 = $add78$i184 & $neg80$i;
       $cmp82$i = ($and81$i185>>>0)<(2147483647);
       if ($cmp82$i) {
        $size$i$i$le = ((($sp$0$i$i)) + 4|0);
        $call84$i = (_sbrk($and81$i185)|0);
        $93 = load4($sp$0$i$i);
        $94 = load4($size$i$i$le);
        $add$ptr$i187 = (($93) + ($94)|0);
        $cmp86$i = ($call84$i|0)==($add$ptr$i187|0);
        if ($cmp86$i) {
         $cmp90$i188 = ($call84$i|0)==((-1)|0);
         if ($cmp90$i188) {
          $tsize$2647482$i = $and81$i185;
          label = 155;
         } else {
          $tbase$3$i = $call84$i;$tsize$3$i = $and81$i185;
         }
        } else {
         $br$2$ph$i = $call84$i;$ssize$2$ph$i = $and81$i185;
         label = 149;
        }
       } else {
        $tsize$2647482$i = 0;
        label = 155;
       }
      }
     } while(0);
     do {
      if ((label|0) == 141) {
       (___pthread_mutex_lock(1399832)|0);
       $call38$i = (_sbrk(0)|0);
       $cmp39$i = ($call38$i|0)==((-1)|0);
       if ($cmp39$i) {
        $tsize$2647482$i = 0;
        label = 155;
       } else {
        $87 = $call38$i;
        $88 = load4((1399812));
        $sub42$i = (($88) + -1)|0;
        $and43$i = $sub42$i & $87;
        $cmp44$i = ($and43$i|0)==(0);
        $add47$i = (($sub42$i) + ($87))|0;
        $neg49$i = (0 - ($88))|0;
        $and50$i = $add47$i & $neg49$i;
        $sub51$i = (($and50$i) - ($87))|0;
        $add52$i = $cmp44$i ? 0 : $sub51$i;
        $spec$select89$i = (($add52$i) + ($and11$i))|0;
        $89 = load4((1400292));
        $add55$i = (($spec$select89$i) + ($89))|0;
        $cmp56$i = ($spec$select89$i>>>0)>($nb$0>>>0);
        $cmp58$i = ($spec$select89$i>>>0)<(2147483647);
        $or$cond$i183 = $cmp56$i & $cmp58$i;
        if ($or$cond$i183) {
         $90 = load4((1400300));
         $cmp61$i = ($90|0)==(0);
         if (!($cmp61$i)) {
          $cmp64$i = ($add55$i>>>0)<=($89>>>0);
          $cmp67$i = ($add55$i>>>0)>($90>>>0);
          $or$cond2$i = $cmp64$i | $cmp67$i;
          if ($or$cond2$i) {
           $tsize$2647482$i = 0;
           label = 155;
           break;
          }
         }
         $call69$i = (_sbrk($spec$select89$i)|0);
         $cmp70$i = ($call69$i|0)==($call38$i|0);
         if ($cmp70$i) {
          $tbase$3$i = $call38$i;$tsize$3$i = $spec$select89$i;
         } else {
          $br$2$ph$i = $call69$i;$ssize$2$ph$i = $spec$select89$i;
          label = 149;
         }
        } else {
         $tsize$2647482$i = 0;
         label = 155;
        }
       }
      }
     } while(0);
     do {
      if ((label|0) == 149) {
       $sub113$i = (0 - ($ssize$2$ph$i))|0;
       $cmp92$i = ($br$2$ph$i|0)!=((-1)|0);
       $cmp94$i = ($ssize$2$ph$i>>>0)<(2147483647);
       $or$cond5$i = $cmp94$i & $cmp92$i;
       $cmp97$i190 = ($add$i176>>>0)>($ssize$2$ph$i>>>0);
       $or$cond7$i = $cmp97$i190 & $or$cond5$i;
       if (!($or$cond7$i)) {
        $cmp119$i191 = ($br$2$ph$i|0)==((-1)|0);
        if ($cmp119$i191) {
         $tsize$2647482$i = 0;
         label = 155;
         break;
        } else {
         $tbase$3$i = $br$2$ph$i;$tsize$3$i = $ssize$2$ph$i;
         break;
        }
       }
       $95 = load4((1399816));
       $sub100$i = (($sub$i177) - ($ssize$2$ph$i))|0;
       $add102$i = (($sub100$i) + ($95))|0;
       $neg104$i = (0 - ($95))|0;
       $and105$i = $add102$i & $neg104$i;
       $cmp106$i = ($and105$i>>>0)<(2147483647);
       if ($cmp106$i) {
        $call108$i = (_sbrk($and105$i)|0);
        $cmp109$i = ($call108$i|0)==((-1)|0);
        if ($cmp109$i) {
         (_sbrk($sub113$i)|0);
         $tsize$2647482$i = 0;
         label = 155;
         break;
        } else {
         $add111$i = (($and105$i) + ($ssize$2$ph$i))|0;
         $tbase$3$i = $br$2$ph$i;$tsize$3$i = $add111$i;
         break;
        }
       } else {
        $tbase$3$i = $br$2$ph$i;$tsize$3$i = $ssize$2$ph$i;
       }
      }
     } while(0);
     if ((label|0) == 155) {
      $96 = load4((1400304));
      $or$i192 = $96 | 4;
      store4((1400304),$or$i192);
      $tbase$3$i = (-1);$tsize$3$i = $tsize$2647482$i;
     }
     (___pthread_mutex_unlock(1399832)|0);
     $tbase$4$i = $tbase$3$i;$tsize$4$i = $tsize$3$i;
    } else {
     $tbase$4$i = (-1);$tsize$4$i = 0;
    }
    $cmp127$i = ($tbase$4$i|0)==((-1)|0);
    $cmp129$i = ($and11$i>>>0)<(2147483647);
    $or$cond6$i = $cmp129$i & $cmp127$i;
    if ($or$cond6$i) {
     (___pthread_mutex_lock(1399832)|0);
     $call134$i = (_sbrk($and11$i)|0);
     $call135$i = (_sbrk(0)|0);
     (___pthread_mutex_unlock(1399832)|0);
     $cmp137$i = ($call134$i|0)!=((-1)|0);
     $cmp139$i = ($call135$i|0)!=((-1)|0);
     $or$cond4$i = $cmp137$i & $cmp139$i;
     $cmp141$i = ($call134$i>>>0)<($call135$i>>>0);
     $or$cond8$i = $cmp141$i & $or$cond4$i;
     $sub$ptr$lhs$cast$i = $call135$i;
     $sub$ptr$rhs$cast$i = $call134$i;
     $sub$ptr$sub$i = (($sub$ptr$lhs$cast$i) - ($sub$ptr$rhs$cast$i))|0;
     $add144$i = (($nb$0) + 40)|0;
     $cmp145$i = ($sub$ptr$sub$i>>>0)>($add144$i>>>0);
     $spec$select9$i = $cmp145$i ? $sub$ptr$sub$i : $tsize$4$i;
     $spec$select10$i = $cmp145$i ? $call134$i : (-1);
     if ($or$cond8$i) {
      $tbase$7$i = $spec$select10$i;$tsize$7$i = $spec$select9$i;
      label = 159;
     }
    } else {
     $tbase$7$i = $tbase$4$i;$tsize$7$i = $tsize$4$i;
     label = 159;
    }
    if ((label|0) == 159) {
     $cmp151$i = ($tbase$7$i|0)==((-1)|0);
     if (!($cmp151$i)) {
      $97 = load4((1400292));
      $add154$i = (($97) + ($tsize$7$i))|0;
      store4((1400292),$add154$i);
      $98 = load4((1400296));
      $cmp155$i194 = ($add154$i>>>0)>($98>>>0);
      if ($cmp155$i194) {
       store4((1400296),$add154$i);
      }
      $99 = load4((1399884));
      $cmp161$i = ($99|0)==(0|0);
      L230: do {
       if ($cmp161$i) {
        $100 = load4((1399876));
        $cmp163$i = ($100|0)==(0|0);
        $cmp166$i195 = ($tbase$7$i>>>0)<($100>>>0);
        $or$cond11$i = $cmp163$i | $cmp166$i195;
        if ($or$cond11$i) {
         store4((1399876),$tbase$7$i);
        }
        store4((1400336),$tbase$7$i);
        store4((1400340),$tsize$7$i);
        store4((1400348),0);
        $101 = load4(1399808);
        store4((1399896),$101);
        store4((1399892),-1);
        store4((1399912),(1399900));
        store4((1399908),(1399900));
        store4((1399920),(1399908));
        store4((1399916),(1399908));
        store4((1399928),(1399916));
        store4((1399924),(1399916));
        store4((1399936),(1399924));
        store4((1399932),(1399924));
        store4((1399944),(1399932));
        store4((1399940),(1399932));
        store4((1399952),(1399940));
        store4((1399948),(1399940));
        store4((1399960),(1399948));
        store4((1399956),(1399948));
        store4((1399968),(1399956));
        store4((1399964),(1399956));
        store4((1399976),(1399964));
        store4((1399972),(1399964));
        store4((1399984),(1399972));
        store4((1399980),(1399972));
        store4((1399992),(1399980));
        store4((1399988),(1399980));
        store4((1400000),(1399988));
        store4((1399996),(1399988));
        store4((1400008),(1399996));
        store4((1400004),(1399996));
        store4((1400016),(1400004));
        store4((1400012),(1400004));
        store4((1400024),(1400012));
        store4((1400020),(1400012));
        store4((1400032),(1400020));
        store4((1400028),(1400020));
        store4((1400040),(1400028));
        store4((1400036),(1400028));
        store4((1400048),(1400036));
        store4((1400044),(1400036));
        store4((1400056),(1400044));
        store4((1400052),(1400044));
        store4((1400064),(1400052));
        store4((1400060),(1400052));
        store4((1400072),(1400060));
        store4((1400068),(1400060));
        store4((1400080),(1400068));
        store4((1400076),(1400068));
        store4((1400088),(1400076));
        store4((1400084),(1400076));
        store4((1400096),(1400084));
        store4((1400092),(1400084));
        store4((1400104),(1400092));
        store4((1400100),(1400092));
        store4((1400112),(1400100));
        store4((1400108),(1400100));
        store4((1400120),(1400108));
        store4((1400116),(1400108));
        store4((1400128),(1400116));
        store4((1400124),(1400116));
        store4((1400136),(1400124));
        store4((1400132),(1400124));
        store4((1400144),(1400132));
        store4((1400140),(1400132));
        store4((1400152),(1400140));
        store4((1400148),(1400140));
        store4((1400160),(1400148));
        store4((1400156),(1400148));
        $sub176$i = (($tsize$7$i) + -40)|0;
        $add$ptr$i13$i = ((($tbase$7$i)) + 8|0);
        $102 = $add$ptr$i13$i;
        $and$i$i = $102 & 7;
        $cmp$i14$i = ($and$i$i|0)==(0);
        $sub$i$i = (0 - ($102))|0;
        $and3$i$i = $sub$i$i & 7;
        $cond$i$i = $cmp$i14$i ? 0 : $and3$i$i;
        $add$ptr4$i$i = (($tbase$7$i) + ($cond$i$i)|0);
        $sub5$i$i = (($sub176$i) - ($cond$i$i))|0;
        store4((1399884),$add$ptr4$i$i);
        store4((1399872),$sub5$i$i);
        $or$i$i = $sub5$i$i | 1;
        $head$i$i = ((($add$ptr4$i$i)) + 4|0);
        store4($head$i$i,$or$i$i);
        $add$ptr6$i$i = (($tbase$7$i) + ($sub176$i)|0);
        $head7$i$i = ((($add$ptr6$i$i)) + 4|0);
        store4($head7$i$i,40);
        $103 = load4((1399824));
        store4((1399888),$103);
       } else {
        $sp$0103$i = (1400336);
        while(1) {
         $104 = load4($sp$0103$i);
         $size192$i = ((($sp$0103$i)) + 4|0);
         $105 = load4($size192$i);
         $add$ptr193$i = (($104) + ($105)|0);
         $cmp194$i = ($tbase$7$i|0)==($add$ptr193$i|0);
         if ($cmp194$i) {
          label = 169;
          break;
         }
         $next$i = ((($sp$0103$i)) + 8|0);
         $106 = load4($next$i);
         $cmp190$i = ($106|0)==(0|0);
         if ($cmp190$i) {
          break;
         } else {
          $sp$0103$i = $106;
         }
        }
        if ((label|0) == 169) {
         $size192$i$le = ((($sp$0103$i)) + 4|0);
         $sflags197$i = ((($sp$0103$i)) + 12|0);
         $107 = load4($sflags197$i);
         $and198$i = $107 & 8;
         $tobool199$i = ($and198$i|0)==(0);
         if ($tobool199$i) {
          $cmp207$i = ($104>>>0)<=($99>>>0);
          $cmp213$i = ($tbase$7$i>>>0)>($99>>>0);
          $or$cond90$i = $cmp213$i & $cmp207$i;
          if ($or$cond90$i) {
           $add216$i = (($105) + ($tsize$7$i))|0;
           store4($size192$i$le,$add216$i);
           $108 = load4((1399872));
           $add219$i = (($108) + ($tsize$7$i))|0;
           $add$ptr$i15$i = ((($99)) + 8|0);
           $109 = $add$ptr$i15$i;
           $and$i16$i = $109 & 7;
           $cmp$i17$i = ($and$i16$i|0)==(0);
           $sub$i18$i = (0 - ($109))|0;
           $and3$i19$i = $sub$i18$i & 7;
           $cond$i20$i = $cmp$i17$i ? 0 : $and3$i19$i;
           $add$ptr4$i21$i = (($99) + ($cond$i20$i)|0);
           $sub5$i22$i = (($add219$i) - ($cond$i20$i))|0;
           store4((1399884),$add$ptr4$i21$i);
           store4((1399872),$sub5$i22$i);
           $or$i23$i = $sub5$i22$i | 1;
           $head$i24$i = ((($add$ptr4$i21$i)) + 4|0);
           store4($head$i24$i,$or$i23$i);
           $add$ptr6$i25$i = (($99) + ($add219$i)|0);
           $head7$i26$i = ((($add$ptr6$i25$i)) + 4|0);
           store4($head7$i26$i,40);
           $110 = load4((1399824));
           store4((1399888),$110);
           break;
          }
         }
        }
        $111 = load4((1399876));
        $cmp222$i = ($tbase$7$i>>>0)<($111>>>0);
        if ($cmp222$i) {
         store4((1399876),$tbase$7$i);
        }
        $add$ptr231$i = (($tbase$7$i) + ($tsize$7$i)|0);
        $sp$1102$i = (1400336);
        while(1) {
         $112 = load4($sp$1102$i);
         $cmp232$i = ($112|0)==($add$ptr231$i|0);
         if ($cmp232$i) {
          label = 177;
          break;
         }
         $next235$i = ((($sp$1102$i)) + 8|0);
         $113 = load4($next235$i);
         $cmp228$i = ($113|0)==(0|0);
         if ($cmp228$i) {
          break;
         } else {
          $sp$1102$i = $113;
         }
        }
        if ((label|0) == 177) {
         $sflags239$i = ((($sp$1102$i)) + 12|0);
         $114 = load4($sflags239$i);
         $and240$i = $114 & 8;
         $tobool241$i = ($and240$i|0)==(0);
         if ($tobool241$i) {
          store4($sp$1102$i,$tbase$7$i);
          $size249$i = ((($sp$1102$i)) + 4|0);
          $115 = load4($size249$i);
          $add250$i = (($115) + ($tsize$7$i))|0;
          store4($size249$i,$add250$i);
          $add$ptr$i27$i = ((($tbase$7$i)) + 8|0);
          $116 = $add$ptr$i27$i;
          $and$i28$i = $116 & 7;
          $cmp$i29$i = ($and$i28$i|0)==(0);
          $sub$i30$i = (0 - ($116))|0;
          $and3$i31$i = $sub$i30$i & 7;
          $cond$i32$i = $cmp$i29$i ? 0 : $and3$i31$i;
          $add$ptr4$i33$i = (($tbase$7$i) + ($cond$i32$i)|0);
          $add$ptr5$i$i = ((($add$ptr231$i)) + 8|0);
          $117 = $add$ptr5$i$i;
          $and6$i$i = $117 & 7;
          $cmp7$i$i = ($and6$i$i|0)==(0);
          $sub12$i$i = (0 - ($117))|0;
          $and13$i$i = $sub12$i$i & 7;
          $cond15$i$i = $cmp7$i$i ? 0 : $and13$i$i;
          $add$ptr16$i$i = (($add$ptr231$i) + ($cond15$i$i)|0);
          $sub$ptr$lhs$cast$i$i = $add$ptr16$i$i;
          $sub$ptr$rhs$cast$i$i = $add$ptr4$i33$i;
          $sub$ptr$sub$i$i = (($sub$ptr$lhs$cast$i$i) - ($sub$ptr$rhs$cast$i$i))|0;
          $add$ptr17$i$i = (($add$ptr4$i33$i) + ($nb$0)|0);
          $sub18$i$i = (($sub$ptr$sub$i$i) - ($nb$0))|0;
          $or19$i$i = $nb$0 | 3;
          $head$i34$i = ((($add$ptr4$i33$i)) + 4|0);
          store4($head$i34$i,$or19$i$i);
          $cmp20$i$i = ($99|0)==($add$ptr16$i$i|0);
          L253: do {
           if ($cmp20$i$i) {
            $118 = load4((1399872));
            $add$i$i = (($118) + ($sub18$i$i))|0;
            store4((1399872),$add$i$i);
            store4((1399884),$add$ptr17$i$i);
            $or22$i$i = $add$i$i | 1;
            $head23$i$i = ((($add$ptr17$i$i)) + 4|0);
            store4($head23$i$i,$or22$i$i);
           } else {
            $119 = load4((1399880));
            $cmp24$i$i = ($119|0)==($add$ptr16$i$i|0);
            if ($cmp24$i$i) {
             $120 = load4((1399868));
             $add26$i$i = (($120) + ($sub18$i$i))|0;
             store4((1399868),$add26$i$i);
             store4((1399880),$add$ptr17$i$i);
             $or28$i$i = $add26$i$i | 1;
             $head29$i$i = ((($add$ptr17$i$i)) + 4|0);
             store4($head29$i$i,$or28$i$i);
             $add$ptr30$i$i = (($add$ptr17$i$i) + ($add26$i$i)|0);
             store4($add$ptr30$i$i,$add26$i$i);
             break;
            }
            $head32$i$i = ((($add$ptr16$i$i)) + 4|0);
            $121 = load4($head32$i$i);
            $and33$i$i = $121 & 3;
            $cmp34$i$i = ($and33$i$i|0)==(1);
            if ($cmp34$i$i) {
             $and37$i$i = $121 & -8;
             $shr$i$i = $121 >>> 3;
             $cmp38$i$i = ($121>>>0)<(256);
             L261: do {
              if ($cmp38$i$i) {
               $fd$i$i = ((($add$ptr16$i$i)) + 8|0);
               $122 = load4($fd$i$i);
               $bk$i$i = ((($add$ptr16$i$i)) + 12|0);
               $123 = load4($bk$i$i);
               $cmp46$i$i = ($123|0)==($122|0);
               if ($cmp46$i$i) {
                $shl48$i$i = 1 << $shr$i$i;
                $neg$i$i = $shl48$i$i ^ -1;
                $124 = load4(1399860);
                $and49$i$i = $124 & $neg$i$i;
                store4(1399860,$and49$i$i);
                break;
               } else {
                $bk67$i$i = ((($122)) + 12|0);
                store4($bk67$i$i,$123);
                $fd68$i$i = ((($123)) + 8|0);
                store4($fd68$i$i,$122);
                break;
               }
              } else {
               $parent$i$i = ((($add$ptr16$i$i)) + 24|0);
               $125 = load4($parent$i$i);
               $bk74$i$i = ((($add$ptr16$i$i)) + 12|0);
               $126 = load4($bk74$i$i);
               $cmp75$i$i = ($126|0)==($add$ptr16$i$i|0);
               do {
                if ($cmp75$i$i) {
                 $child$i$i = ((($add$ptr16$i$i)) + 16|0);
                 $arrayidx96$i$i = ((($child$i$i)) + 4|0);
                 $128 = load4($arrayidx96$i$i);
                 $cmp97$i$i = ($128|0)==(0|0);
                 if ($cmp97$i$i) {
                  $129 = load4($child$i$i);
                  $cmp100$i$i = ($129|0)==(0|0);
                  if ($cmp100$i$i) {
                   $R$3$i$i = 0;
                   break;
                  } else {
                   $R$1$i$i$ph = $129;$RP$1$i$i$ph = $child$i$i;
                  }
                 } else {
                  $R$1$i$i$ph = $128;$RP$1$i$i$ph = $arrayidx96$i$i;
                 }
                 $R$1$i$i = $R$1$i$i$ph;$RP$1$i$i = $RP$1$i$i$ph;
                 while(1) {
                  $arrayidx103$i$i = ((($R$1$i$i)) + 20|0);
                  $130 = load4($arrayidx103$i$i);
                  $cmp104$i$i = ($130|0)==(0|0);
                  if ($cmp104$i$i) {
                   $arrayidx107$i$i = ((($R$1$i$i)) + 16|0);
                   $131 = load4($arrayidx107$i$i);
                   $cmp108$i$i = ($131|0)==(0|0);
                   if ($cmp108$i$i) {
                    break;
                   } else {
                    $R$1$i$i$be = $131;$RP$1$i$i$be = $arrayidx107$i$i;
                   }
                  } else {
                   $R$1$i$i$be = $130;$RP$1$i$i$be = $arrayidx103$i$i;
                  }
                  $R$1$i$i = $R$1$i$i$be;$RP$1$i$i = $RP$1$i$i$be;
                 }
                 store4($RP$1$i$i,0);
                 $R$3$i$i = $R$1$i$i;
                } else {
                 $fd78$i$i = ((($add$ptr16$i$i)) + 8|0);
                 $127 = load4($fd78$i$i);
                 $bk91$i$i = ((($127)) + 12|0);
                 store4($bk91$i$i,$126);
                 $fd92$i$i = ((($126)) + 8|0);
                 store4($fd92$i$i,$127);
                 $R$3$i$i = $126;
                }
               } while(0);
               $cmp120$i$i = ($125|0)==(0|0);
               if ($cmp120$i$i) {
                break;
               }
               $index$i$i = ((($add$ptr16$i$i)) + 28|0);
               $132 = load4($index$i$i);
               $arrayidx123$i$i = (1400164 + ($132<<2)|0);
               $133 = load4($arrayidx123$i$i);
               $cmp124$i$i = ($133|0)==($add$ptr16$i$i|0);
               do {
                if ($cmp124$i$i) {
                 store4($arrayidx123$i$i,$R$3$i$i);
                 $cond1$i$i = ($R$3$i$i|0)==(0|0);
                 if (!($cond1$i$i)) {
                  break;
                 }
                 $shl131$i$i = 1 << $132;
                 $neg132$i$i = $shl131$i$i ^ -1;
                 $134 = load4((1399864));
                 $and133$i$i = $134 & $neg132$i$i;
                 store4((1399864),$and133$i$i);
                 break L261;
                } else {
                 $arrayidx143$i$i = ((($125)) + 16|0);
                 $135 = load4($arrayidx143$i$i);
                 $cmp144$i$i = ($135|0)==($add$ptr16$i$i|0);
                 $arrayidx151$i$i = ((($125)) + 20|0);
                 $arrayidx151$i$i$sink = $cmp144$i$i ? $arrayidx143$i$i : $arrayidx151$i$i;
                 store4($arrayidx151$i$i$sink,$R$3$i$i);
                 $cmp156$i$i = ($R$3$i$i|0)==(0|0);
                 if ($cmp156$i$i) {
                  break L261;
                 }
                }
               } while(0);
               $parent165$i$i = ((($R$3$i$i)) + 24|0);
               store4($parent165$i$i,$125);
               $child166$i$i = ((($add$ptr16$i$i)) + 16|0);
               $136 = load4($child166$i$i);
               $cmp168$i$i = ($136|0)==(0|0);
               if (!($cmp168$i$i)) {
                $arrayidx178$i$i = ((($R$3$i$i)) + 16|0);
                store4($arrayidx178$i$i,$136);
                $parent179$i$i = ((($136)) + 24|0);
                store4($parent179$i$i,$R$3$i$i);
               }
               $arrayidx184$i$i = ((($child166$i$i)) + 4|0);
               $137 = load4($arrayidx184$i$i);
               $cmp185$i$i = ($137|0)==(0|0);
               if ($cmp185$i$i) {
                break;
               }
               $arrayidx195$i$i = ((($R$3$i$i)) + 20|0);
               store4($arrayidx195$i$i,$137);
               $parent196$i$i = ((($137)) + 24|0);
               store4($parent196$i$i,$R$3$i$i);
              }
             } while(0);
             $add$ptr205$i$i = (($add$ptr16$i$i) + ($and37$i$i)|0);
             $add206$i$i = (($and37$i$i) + ($sub18$i$i))|0;
             $oldfirst$0$i$i = $add$ptr205$i$i;$qsize$0$i$i = $add206$i$i;
            } else {
             $oldfirst$0$i$i = $add$ptr16$i$i;$qsize$0$i$i = $sub18$i$i;
            }
            $head208$i$i = ((($oldfirst$0$i$i)) + 4|0);
            $138 = load4($head208$i$i);
            $and209$i$i = $138 & -2;
            store4($head208$i$i,$and209$i$i);
            $or210$i$i = $qsize$0$i$i | 1;
            $head211$i$i = ((($add$ptr17$i$i)) + 4|0);
            store4($head211$i$i,$or210$i$i);
            $add$ptr212$i$i = (($add$ptr17$i$i) + ($qsize$0$i$i)|0);
            store4($add$ptr212$i$i,$qsize$0$i$i);
            $shr214$i$i = $qsize$0$i$i >>> 3;
            $cmp215$i$i = ($qsize$0$i$i>>>0)<(256);
            if ($cmp215$i$i) {
             $shl222$i$i = $shr214$i$i << 1;
             $arrayidx223$i$i = (1399900 + ($shl222$i$i<<2)|0);
             $139 = load4(1399860);
             $shl226$i$i = 1 << $shr214$i$i;
             $and227$i$i = $139 & $shl226$i$i;
             $tobool228$i$i = ($and227$i$i|0)==(0);
             if ($tobool228$i$i) {
              $or232$i$i = $139 | $shl226$i$i;
              store4(1399860,$or232$i$i);
              $$pre$i$i = ((($arrayidx223$i$i)) + 8|0);
              $$pre$phi$i$iZ2D = $$pre$i$i;$F224$0$i$i = $arrayidx223$i$i;
             } else {
              $140 = ((($arrayidx223$i$i)) + 8|0);
              $141 = load4($140);
              $$pre$phi$i$iZ2D = $140;$F224$0$i$i = $141;
             }
             store4($$pre$phi$i$iZ2D,$add$ptr17$i$i);
             $bk246$i$i = ((($F224$0$i$i)) + 12|0);
             store4($bk246$i$i,$add$ptr17$i$i);
             $fd247$i$i = ((($add$ptr17$i$i)) + 8|0);
             store4($fd247$i$i,$F224$0$i$i);
             $bk248$i$i = ((($add$ptr17$i$i)) + 12|0);
             store4($bk248$i$i,$arrayidx223$i$i);
             break;
            }
            $shr253$i$i = $qsize$0$i$i >>> 8;
            $cmp254$i$i = ($shr253$i$i|0)==(0);
            do {
             if ($cmp254$i$i) {
              $I252$0$i$i = 0;
             } else {
              $cmp258$i$i = ($qsize$0$i$i>>>0)>(16777215);
              if ($cmp258$i$i) {
               $I252$0$i$i = 31;
               break;
              }
              $sub262$i$i = (($shr253$i$i) + 1048320)|0;
              $shr263$i$i = $sub262$i$i >>> 16;
              $and264$i$i = $shr263$i$i & 8;
              $shl265$i$i = $shr253$i$i << $and264$i$i;
              $sub266$i$i = (($shl265$i$i) + 520192)|0;
              $shr267$i$i = $sub266$i$i >>> 16;
              $and268$i$i = $shr267$i$i & 4;
              $add269$i$i = $and268$i$i | $and264$i$i;
              $shl270$i$i = $shl265$i$i << $and268$i$i;
              $sub271$i$i = (($shl270$i$i) + 245760)|0;
              $shr272$i$i = $sub271$i$i >>> 16;
              $and273$i$i = $shr272$i$i & 2;
              $add274$i$i = $add269$i$i | $and273$i$i;
              $sub275$i$i = (14 - ($add274$i$i))|0;
              $shl276$i$i = $shl270$i$i << $and273$i$i;
              $shr277$i$i = $shl276$i$i >>> 15;
              $add278$i$i = (($sub275$i$i) + ($shr277$i$i))|0;
              $shl279$i$i = $add278$i$i << 1;
              $add280$i$i = (($add278$i$i) + 7)|0;
              $shr281$i$i = $qsize$0$i$i >>> $add280$i$i;
              $and282$i$i = $shr281$i$i & 1;
              $add283$i$i = $and282$i$i | $shl279$i$i;
              $I252$0$i$i = $add283$i$i;
             }
            } while(0);
            $arrayidx287$i$i = (1400164 + ($I252$0$i$i<<2)|0);
            $index288$i$i = ((($add$ptr17$i$i)) + 28|0);
            store4($index288$i$i,$I252$0$i$i);
            $child289$i$i = ((($add$ptr17$i$i)) + 16|0);
            $arrayidx290$i$i = ((($child289$i$i)) + 4|0);
            store4($arrayidx290$i$i,0);
            store4($child289$i$i,0);
            $142 = load4((1399864));
            $shl294$i$i = 1 << $I252$0$i$i;
            $and295$i$i = $142 & $shl294$i$i;
            $tobool296$i$i = ($and295$i$i|0)==(0);
            if ($tobool296$i$i) {
             $or300$i$i = $142 | $shl294$i$i;
             store4((1399864),$or300$i$i);
             store4($arrayidx287$i$i,$add$ptr17$i$i);
             $parent301$i$i = ((($add$ptr17$i$i)) + 24|0);
             store4($parent301$i$i,$arrayidx287$i$i);
             $bk302$i$i = ((($add$ptr17$i$i)) + 12|0);
             store4($bk302$i$i,$add$ptr17$i$i);
             $fd303$i$i = ((($add$ptr17$i$i)) + 8|0);
             store4($fd303$i$i,$add$ptr17$i$i);
             break;
            }
            $143 = load4($arrayidx287$i$i);
            $head3174$i$i = ((($143)) + 4|0);
            $144 = load4($head3174$i$i);
            $and3185$i$i = $144 & -8;
            $cmp3196$i$i = ($and3185$i$i|0)==($qsize$0$i$i|0);
            L306: do {
             if ($cmp3196$i$i) {
              $T$0$lcssa$i$i = $143;
             } else {
              $cmp306$i$i = ($I252$0$i$i|0)==(31);
              $shr310$i$i = $I252$0$i$i >>> 1;
              $sub313$i$i = (25 - ($shr310$i$i))|0;
              $cond315$i$i = $cmp306$i$i ? 0 : $sub313$i$i;
              $shl316$i$i = $qsize$0$i$i << $cond315$i$i;
              $K305$08$i$i = $shl316$i$i;$T$07$i$i = $143;
              while(1) {
               $shr323$i$i = $K305$08$i$i >>> 31;
               $arrayidx325$i$i = (((($T$07$i$i)) + 16|0) + ($shr323$i$i<<2)|0);
               $145 = load4($arrayidx325$i$i);
               $cmp327$i$i = ($145|0)==(0|0);
               if ($cmp327$i$i) {
                break;
               }
               $shl326$i$i = $K305$08$i$i << 1;
               $head317$i$i = ((($145)) + 4|0);
               $146 = load4($head317$i$i);
               $and318$i$i = $146 & -8;
               $cmp319$i$i = ($and318$i$i|0)==($qsize$0$i$i|0);
               if ($cmp319$i$i) {
                $T$0$lcssa$i$i = $145;
                break L306;
               } else {
                $K305$08$i$i = $shl326$i$i;$T$07$i$i = $145;
               }
              }
              store4($arrayidx325$i$i,$add$ptr17$i$i);
              $parent337$i$i = ((($add$ptr17$i$i)) + 24|0);
              store4($parent337$i$i,$T$07$i$i);
              $bk338$i$i = ((($add$ptr17$i$i)) + 12|0);
              store4($bk338$i$i,$add$ptr17$i$i);
              $fd339$i$i = ((($add$ptr17$i$i)) + 8|0);
              store4($fd339$i$i,$add$ptr17$i$i);
              break L253;
             }
            } while(0);
            $fd344$i$i = ((($T$0$lcssa$i$i)) + 8|0);
            $147 = load4($fd344$i$i);
            $bk357$i$i = ((($147)) + 12|0);
            store4($bk357$i$i,$add$ptr17$i$i);
            store4($fd344$i$i,$add$ptr17$i$i);
            $fd359$i$i = ((($add$ptr17$i$i)) + 8|0);
            store4($fd359$i$i,$147);
            $bk360$i$i = ((($add$ptr17$i$i)) + 12|0);
            store4($bk360$i$i,$T$0$lcssa$i$i);
            $parent361$i$i = ((($add$ptr17$i$i)) + 24|0);
            store4($parent361$i$i,0);
           }
          } while(0);
          $add$ptr369$i$i = ((($add$ptr4$i33$i)) + 8|0);
          $mem$2 = $add$ptr369$i$i;
          break L164;
         }
        }
        $sp$0$i$i$i = (1400336);
        while(1) {
         $148 = load4($sp$0$i$i$i);
         $cmp$i$i$i = ($148>>>0)>($99>>>0);
         if (!($cmp$i$i$i)) {
          $size$i$i$i = ((($sp$0$i$i$i)) + 4|0);
          $149 = load4($size$i$i$i);
          $add$ptr$i$i$i = (($148) + ($149)|0);
          $cmp2$i$i$i = ($add$ptr$i$i$i>>>0)>($99>>>0);
          if ($cmp2$i$i$i) {
           break;
          }
         }
         $next$i$i$i = ((($sp$0$i$i$i)) + 8|0);
         $150 = load4($next$i$i$i);
         $sp$0$i$i$i = $150;
        }
        $add$ptr2$i$i = ((($add$ptr$i$i$i)) + -47|0);
        $add$ptr3$i$i = ((($add$ptr2$i$i)) + 8|0);
        $151 = $add$ptr3$i$i;
        $and$i38$i = $151 & 7;
        $cmp$i39$i = ($and$i38$i|0)==(0);
        $sub$i40$i = (0 - ($151))|0;
        $and6$i41$i = $sub$i40$i & 7;
        $cond$i42$i = $cmp$i39$i ? 0 : $and6$i41$i;
        $add$ptr7$i$i = (($add$ptr2$i$i) + ($cond$i42$i)|0);
        $add$ptr81$i$i = ((($99)) + 16|0);
        $cmp9$i$i = ($add$ptr7$i$i>>>0)<($add$ptr81$i$i>>>0);
        $cond13$i$i = $cmp9$i$i ? $99 : $add$ptr7$i$i;
        $add$ptr14$i$i = ((($cond13$i$i)) + 8|0);
        $add$ptr15$i$i = ((($cond13$i$i)) + 24|0);
        $sub16$i$i = (($tsize$7$i) + -40)|0;
        $add$ptr$i2$i$i = ((($tbase$7$i)) + 8|0);
        $152 = $add$ptr$i2$i$i;
        $and$i$i$i = $152 & 7;
        $cmp$i3$i$i = ($and$i$i$i|0)==(0);
        $sub$i$i$i = (0 - ($152))|0;
        $and3$i$i$i = $sub$i$i$i & 7;
        $cond$i$i$i = $cmp$i3$i$i ? 0 : $and3$i$i$i;
        $add$ptr4$i$i$i = (($tbase$7$i) + ($cond$i$i$i)|0);
        $sub5$i$i$i = (($sub16$i$i) - ($cond$i$i$i))|0;
        store4((1399884),$add$ptr4$i$i$i);
        store4((1399872),$sub5$i$i$i);
        $or$i$i$i = $sub5$i$i$i | 1;
        $head$i$i$i = ((($add$ptr4$i$i$i)) + 4|0);
        store4($head$i$i$i,$or$i$i$i);
        $add$ptr6$i$i$i = (($tbase$7$i) + ($sub16$i$i)|0);
        $head7$i$i$i = ((($add$ptr6$i$i$i)) + 4|0);
        store4($head7$i$i$i,40);
        $153 = load4((1399824));
        store4((1399888),$153);
        $head$i43$i = ((($cond13$i$i)) + 4|0);
        store4($head$i43$i,27);
        ; store8($add$ptr14$i$i,load8((1400336),4),4); store8($add$ptr14$i$i+8 | 0,load8((1400336)+8 | 0,4),4);
        store4((1400336),$tbase$7$i);
        store4((1400340),$tsize$7$i);
        store4((1400348),0);
        store4((1400344),$add$ptr14$i$i);
        $154 = $add$ptr15$i$i;
        while(1) {
         $add$ptr24$i$i = ((($154)) + 4|0);
         store4($add$ptr24$i$i,7);
         $head26$i$i = ((($154)) + 8|0);
         $cmp27$i$i = ($head26$i$i>>>0)<($add$ptr$i$i$i>>>0);
         if ($cmp27$i$i) {
          $154 = $add$ptr24$i$i;
         } else {
          break;
         }
        }
        $cmp28$i$i = ($cond13$i$i|0)==($99|0);
        if (!($cmp28$i$i)) {
         $sub$ptr$lhs$cast$i45$i = $cond13$i$i;
         $sub$ptr$rhs$cast$i46$i = $99;
         $sub$ptr$sub$i47$i = (($sub$ptr$lhs$cast$i45$i) - ($sub$ptr$rhs$cast$i46$i))|0;
         $155 = load4($head$i43$i);
         $and32$i$i = $155 & -2;
         store4($head$i43$i,$and32$i$i);
         $or33$i$i = $sub$ptr$sub$i47$i | 1;
         $head34$i$i = ((($99)) + 4|0);
         store4($head34$i$i,$or33$i$i);
         store4($cond13$i$i,$sub$ptr$sub$i47$i);
         $shr$i49$i = $sub$ptr$sub$i47$i >>> 3;
         $cmp36$i$i = ($sub$ptr$sub$i47$i>>>0)<(256);
         if ($cmp36$i$i) {
          $shl$i$i = $shr$i49$i << 1;
          $arrayidx$i$i = (1399900 + ($shl$i$i<<2)|0);
          $156 = load4(1399860);
          $shl39$i$i = 1 << $shr$i49$i;
          $and40$i$i = $156 & $shl39$i$i;
          $tobool$i$i197 = ($and40$i$i|0)==(0);
          if ($tobool$i$i197) {
           $or44$i$i = $156 | $shl39$i$i;
           store4(1399860,$or44$i$i);
           $$pre$i50$i = ((($arrayidx$i$i)) + 8|0);
           $$pre$phi$i51$iZ2D = $$pre$i50$i;$F$0$i$i = $arrayidx$i$i;
          } else {
           $157 = ((($arrayidx$i$i)) + 8|0);
           $158 = load4($157);
           $$pre$phi$i51$iZ2D = $157;$F$0$i$i = $158;
          }
          store4($$pre$phi$i51$iZ2D,$99);
          $bk$i52$i = ((($F$0$i$i)) + 12|0);
          store4($bk$i52$i,$99);
          $fd54$i$i = ((($99)) + 8|0);
          store4($fd54$i$i,$F$0$i$i);
          $bk55$i$i = ((($99)) + 12|0);
          store4($bk55$i$i,$arrayidx$i$i);
          break;
         }
         $shr58$i$i = $sub$ptr$sub$i47$i >>> 8;
         $cmp59$i$i = ($shr58$i$i|0)==(0);
         do {
          if ($cmp59$i$i) {
           $I57$0$i$i = 0;
          } else {
           $cmp63$i$i = ($sub$ptr$sub$i47$i>>>0)>(16777215);
           if ($cmp63$i$i) {
            $I57$0$i$i = 31;
            break;
           }
           $sub67$i$i = (($shr58$i$i) + 1048320)|0;
           $shr68$i$i = $sub67$i$i >>> 16;
           $and69$i$i = $shr68$i$i & 8;
           $shl70$i$i = $shr58$i$i << $and69$i$i;
           $sub71$i$i = (($shl70$i$i) + 520192)|0;
           $shr72$i$i = $sub71$i$i >>> 16;
           $and73$i$i = $shr72$i$i & 4;
           $add74$i$i = $and73$i$i | $and69$i$i;
           $shl75$i$i = $shl70$i$i << $and73$i$i;
           $sub76$i$i = (($shl75$i$i) + 245760)|0;
           $shr77$i$i = $sub76$i$i >>> 16;
           $and78$i$i = $shr77$i$i & 2;
           $add79$i$i = $add74$i$i | $and78$i$i;
           $sub80$i$i = (14 - ($add79$i$i))|0;
           $shl81$i$i = $shl75$i$i << $and78$i$i;
           $shr82$i$i = $shl81$i$i >>> 15;
           $add83$i$i = (($sub80$i$i) + ($shr82$i$i))|0;
           $shl84$i$i = $add83$i$i << 1;
           $add85$i$i = (($add83$i$i) + 7)|0;
           $shr86$i$i = $sub$ptr$sub$i47$i >>> $add85$i$i;
           $and87$i$i = $shr86$i$i & 1;
           $add88$i$i = $and87$i$i | $shl84$i$i;
           $I57$0$i$i = $add88$i$i;
          }
         } while(0);
         $arrayidx91$i$i = (1400164 + ($I57$0$i$i<<2)|0);
         $index$i53$i = ((($99)) + 28|0);
         store4($index$i53$i,$I57$0$i$i);
         $arrayidx92$i$i = ((($99)) + 20|0);
         store4($arrayidx92$i$i,0);
         store4($add$ptr81$i$i,0);
         $159 = load4((1399864));
         $shl95$i$i = 1 << $I57$0$i$i;
         $and96$i$i = $159 & $shl95$i$i;
         $tobool97$i$i = ($and96$i$i|0)==(0);
         if ($tobool97$i$i) {
          $or101$i$i = $159 | $shl95$i$i;
          store4((1399864),$or101$i$i);
          store4($arrayidx91$i$i,$99);
          $parent$i54$i = ((($99)) + 24|0);
          store4($parent$i54$i,$arrayidx91$i$i);
          $bk102$i$i = ((($99)) + 12|0);
          store4($bk102$i$i,$99);
          $fd103$i$i = ((($99)) + 8|0);
          store4($fd103$i$i,$99);
          break;
         }
         $160 = load4($arrayidx91$i$i);
         $head1186$i$i = ((($160)) + 4|0);
         $161 = load4($head1186$i$i);
         $and1197$i$i = $161 & -8;
         $cmp1208$i$i = ($and1197$i$i|0)==($sub$ptr$sub$i47$i|0);
         L339: do {
          if ($cmp1208$i$i) {
           $T$0$lcssa$i57$i = $160;
          } else {
           $cmp106$i$i = ($I57$0$i$i|0)==(31);
           $shr110$i$i = $I57$0$i$i >>> 1;
           $sub113$i$i = (25 - ($shr110$i$i))|0;
           $cond115$i$i = $cmp106$i$i ? 0 : $sub113$i$i;
           $shl116$i$i = $sub$ptr$sub$i47$i << $cond115$i$i;
           $K105$010$i$i = $shl116$i$i;$T$09$i$i = $160;
           while(1) {
            $shr124$i$i = $K105$010$i$i >>> 31;
            $arrayidx126$i$i = (((($T$09$i$i)) + 16|0) + ($shr124$i$i<<2)|0);
            $162 = load4($arrayidx126$i$i);
            $cmp128$i$i = ($162|0)==(0|0);
            if ($cmp128$i$i) {
             break;
            }
            $shl127$i$i = $K105$010$i$i << 1;
            $head118$i$i = ((($162)) + 4|0);
            $163 = load4($head118$i$i);
            $and119$i$i = $163 & -8;
            $cmp120$i55$i = ($and119$i$i|0)==($sub$ptr$sub$i47$i|0);
            if ($cmp120$i55$i) {
             $T$0$lcssa$i57$i = $162;
             break L339;
            } else {
             $K105$010$i$i = $shl127$i$i;$T$09$i$i = $162;
            }
           }
           store4($arrayidx126$i$i,$99);
           $parent138$i$i = ((($99)) + 24|0);
           store4($parent138$i$i,$T$09$i$i);
           $bk139$i$i = ((($99)) + 12|0);
           store4($bk139$i$i,$99);
           $fd140$i$i = ((($99)) + 8|0);
           store4($fd140$i$i,$99);
           break L230;
          }
         } while(0);
         $fd148$i$i = ((($T$0$lcssa$i57$i)) + 8|0);
         $164 = load4($fd148$i$i);
         $bk158$i$i = ((($164)) + 12|0);
         store4($bk158$i$i,$99);
         store4($fd148$i$i,$99);
         $fd160$i$i = ((($99)) + 8|0);
         store4($fd160$i$i,$164);
         $bk161$i$i = ((($99)) + 12|0);
         store4($bk161$i$i,$T$0$lcssa$i57$i);
         $parent162$i$i = ((($99)) + 24|0);
         store4($parent162$i$i,0);
        }
       }
      } while(0);
      $165 = load4((1399872));
      $cmp261$i = ($165>>>0)>($nb$0>>>0);
      if ($cmp261$i) {
       $sub264$i = (($165) - ($nb$0))|0;
       store4((1399872),$sub264$i);
       $166 = load4((1399884));
       $add$ptr266$i = (($166) + ($nb$0)|0);
       store4((1399884),$add$ptr266$i);
       $or268$i = $sub264$i | 1;
       $head269$i = ((($add$ptr266$i)) + 4|0);
       store4($head269$i,$or268$i);
       $or271$i = $nb$0 | 3;
       $head272$i = ((($166)) + 4|0);
       store4($head272$i,$or271$i);
       $add$ptr273$i198 = ((($166)) + 8|0);
       $mem$2 = $add$ptr273$i198;
       break;
      }
     }
    }
    $call279$i = (___errno_location()|0);
    store4($call279$i,48);
    $mem$2 = 0;
   } else {
    $mem$2 = 0;
   }
  }
 } while(0);
 $167 = load4((1400304));
 $and218 = $167 & 2;
 $tobool219 = ($and218|0)==(0);
 if ($tobool219) {
  $retval$1 = $mem$2;
  STACKTOP = sp;return ($retval$1|0);
 }
 (___pthread_mutex_unlock((1400308))|0);
 $retval$1 = $mem$2;
 STACKTOP = sp;return ($retval$1|0);
}
function _free($mem) {
 $mem = $mem|0;
 var $$pre = 0, $$pre$phiZ2D = 0, $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0;
 var $25 = 0, $26 = 0, $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0;
 var $43 = 0, $44 = 0, $45 = 0, $46 = 0, $47 = 0, $48 = 0, $49 = 0, $5 = 0, $50 = 0, $51 = 0, $52 = 0, $53 = 0, $54 = 0, $55 = 0, $56 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $F514$0 = 0;
 var $I538$0 = 0, $K587$0266 = 0, $R$1 = 0, $R$1$be = 0, $R$1$ph = 0, $R$3 = 0, $R336$1 = 0, $R336$1$be = 0, $R336$1$ph = 0, $R336$3 = 0, $RP$1 = 0, $RP$1$be = 0, $RP$1$ph = 0, $RP364$1 = 0, $RP364$1$be = 0, $RP364$1$ph = 0, $T$0$lcssa = 0, $T$0265 = 0, $add$ptr = 0, $add$ptr10 = 0;
 var $add$ptr20 = 0, $add$ptr221 = 0, $add$ptr265 = 0, $add$ptr486 = 0, $add$ptr502 = 0, $add21 = 0, $add250 = 0, $add262 = 0, $add271 = 0, $add554 = 0, $add559 = 0, $add563 = 0, $add565 = 0, $add568 = 0, $and = 0, $and12 = 0, $and144 = 0, $and16 = 0, $and214 = 0, $and219 = 0;
 var $and236 = 0, $and244 = 0, $and270 = 0, $and305 = 0, $and414 = 0, $and499 = 0, $and50 = 0, $and516 = 0, $and549 = 0, $and553 = 0, $and558 = 0, $and567 = 0, $and578 = 0, $and598 = 0, $and598263 = 0, $and658 = 0, $and9 = 0, $arrayidx103 = 0, $arrayidx112 = 0, $arrayidx117 = 0;
 var $arrayidx134 = 0, $arrayidx153 = 0, $arrayidx161 = 0, $arrayidx161$sink = 0, $arrayidx186 = 0, $arrayidx192 = 0, $arrayidx202 = 0, $arrayidx366 = 0, $arrayidx378 = 0, $arrayidx383 = 0, $arrayidx404 = 0, $arrayidx423 = 0, $arrayidx431 = 0, $arrayidx431$sink = 0, $arrayidx458 = 0, $arrayidx464 = 0, $arrayidx474 = 0, $arrayidx513 = 0, $arrayidx571 = 0, $arrayidx574 = 0;
 var $arrayidx605 = 0, $bk = 0, $bk279 = 0, $bk325 = 0, $bk337 = 0, $bk359 = 0, $bk533 = 0, $bk535 = 0, $bk584 = 0, $bk617 = 0, $bk637 = 0, $bk640 = 0, $bk70 = 0, $bk77 = 0, $bk98 = 0, $call = 0, $child = 0, $child175 = 0, $child365 = 0, $child447 = 0;
 var $child573 = 0, $cmp = 0, $cmp$i = 0, $cmp104 = 0, $cmp108 = 0, $cmp113 = 0, $cmp118 = 0, $cmp131 = 0, $cmp135 = 0, $cmp154 = 0, $cmp166 = 0, $cmp17 = 0, $cmp177 = 0, $cmp193 = 0, $cmp215 = 0, $cmp22 = 0, $cmp232 = 0, $cmp247 = 0, $cmp253 = 0, $cmp259 = 0;
 var $cmp26 = 0, $cmp273 = 0, $cmp29 = 0, $cmp300 = 0, $cmp338 = 0, $cmp367 = 0, $cmp372 = 0, $cmp379 = 0, $cmp384 = 0, $cmp399 = 0, $cmp405 = 0, $cmp424 = 0, $cmp436 = 0, $cmp449 = 0, $cmp46 = 0, $cmp465 = 0, $cmp488 = 0, $cmp506 = 0, $cmp540 = 0, $cmp544 = 0;
 var $cmp588 = 0, $cmp599 = 0, $cmp599264 = 0, $cmp607 = 0, $cmp646 = 0, $cmp78 = 0, $cond = 0, $cond254 = 0, $cond255 = 0, $dec = 0, $fd = 0, $fd277 = 0, $fd326 = 0, $fd342 = 0, $fd360 = 0, $fd534 = 0, $fd585 = 0, $fd618 = 0, $fd626 = 0, $fd639 = 0;
 var $fd71 = 0, $fd82 = 0, $fd99 = 0, $head213 = 0, $head220 = 0, $head235 = 0, $head252 = 0, $head264 = 0, $head485 = 0, $head501 = 0, $head597 = 0, $head597262 = 0, $head8 = 0, $idx$neg = 0, $index = 0, $index403 = 0, $index572 = 0, $neg = 0, $neg143 = 0, $neg304 = 0;
 var $neg413 = 0, $next4$i = 0, $or = 0, $or251 = 0, $or263 = 0, $or484 = 0, $or500 = 0, $or520 = 0, $or582 = 0, $p$1 = 0, $parent = 0, $parent174 = 0, $parent187 = 0, $parent203 = 0, $parent335 = 0, $parent446 = 0, $parent459 = 0, $parent475 = 0, $parent583 = 0, $parent616 = 0;
 var $parent641 = 0, $psize$1 = 0, $psize$2 = 0, $shl142 = 0, $shl303 = 0, $shl412 = 0, $shl49 = 0, $shl512 = 0, $shl515 = 0, $shl550 = 0, $shl555 = 0, $shl561 = 0, $shl564 = 0, $shl577 = 0, $shl596 = 0, $shl606 = 0, $shr = 0, $shr272 = 0, $shr505 = 0, $shr539 = 0;
 var $shr548 = 0, $shr552 = 0, $shr557 = 0, $shr562 = 0, $shr566 = 0, $shr592 = 0, $shr603 = 0, $sp$0$i = 0, $sp$0$in$i = 0, $sub = 0, $sub551 = 0, $sub556 = 0, $sub560 = 0, $sub595 = 0, $tobool = 0, $tobool1 = 0, $tobool13 = 0, $tobool237 = 0, $tobool245 = 0, $tobool517 = 0;
 var $tobool579 = 0, $tobool659 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $cmp = ($mem|0)==(0|0);
 if ($cmp) {
  return;
 }
 $add$ptr = ((($mem)) + -8|0);
 $0 = load4((1400304));
 $and = $0 & 2;
 $tobool = ($and|0)==(0);
 if (!($tobool)) {
  $call = (___pthread_mutex_lock((1400308))|0);
  $tobool1 = ($call|0)==(0);
  if (!($tobool1)) {
   return;
  }
 }
 $1 = load4((1399876));
 $head8 = ((($mem)) + -4|0);
 $2 = load4($head8);
 $and9 = $2 & -8;
 $add$ptr10 = (($add$ptr) + ($and9)|0);
 $and12 = $2 & 1;
 $tobool13 = ($and12|0)==(0);
 do {
  if ($tobool13) {
   $3 = load4($add$ptr);
   $and16 = $2 & 3;
   $cmp17 = ($and16|0)==(0);
   if (!($cmp17)) {
    $idx$neg = (0 - ($3))|0;
    $add$ptr20 = (($add$ptr) + ($idx$neg)|0);
    $add21 = (($3) + ($and9))|0;
    $cmp22 = ($add$ptr20>>>0)<($1>>>0);
    if (!($cmp22)) {
     $4 = load4((1399880));
     $cmp26 = ($4|0)==($add$ptr20|0);
     if ($cmp26) {
      $head213 = ((($add$ptr10)) + 4|0);
      $21 = load4($head213);
      $and214 = $21 & 3;
      $cmp215 = ($and214|0)==(3);
      if (!($cmp215)) {
       $22 = $add$ptr20;$p$1 = $add$ptr20;$psize$1 = $add21;
       label = 32;
       break;
      }
      $add$ptr221 = (($add$ptr20) + ($add21)|0);
      $head220 = ((($add$ptr20)) + 4|0);
      $or = $add21 | 1;
      $and219 = $21 & -2;
      store4((1399868),$add21);
      store4($head213,$and219);
      store4($head220,$or);
      store4($add$ptr221,$add21);
      break;
     }
     $shr = $3 >>> 3;
     $cmp29 = ($3>>>0)<(256);
     if ($cmp29) {
      $fd = ((($add$ptr20)) + 8|0);
      $5 = load4($fd);
      $bk = ((($add$ptr20)) + 12|0);
      $6 = load4($bk);
      $cmp46 = ($6|0)==($5|0);
      if ($cmp46) {
       $shl49 = 1 << $shr;
       $neg = $shl49 ^ -1;
       $7 = load4(1399860);
       $and50 = $7 & $neg;
       store4(1399860,$and50);
       $22 = $add$ptr20;$p$1 = $add$ptr20;$psize$1 = $add21;
       label = 32;
       break;
      } else {
       $bk70 = ((($5)) + 12|0);
       store4($bk70,$6);
       $fd71 = ((($6)) + 8|0);
       store4($fd71,$5);
       $22 = $add$ptr20;$p$1 = $add$ptr20;$psize$1 = $add21;
       label = 32;
       break;
      }
     }
     $parent = ((($add$ptr20)) + 24|0);
     $8 = load4($parent);
     $bk77 = ((($add$ptr20)) + 12|0);
     $9 = load4($bk77);
     $cmp78 = ($9|0)==($add$ptr20|0);
     do {
      if ($cmp78) {
       $child = ((($add$ptr20)) + 16|0);
       $arrayidx103 = ((($child)) + 4|0);
       $11 = load4($arrayidx103);
       $cmp104 = ($11|0)==(0|0);
       if ($cmp104) {
        $12 = load4($child);
        $cmp108 = ($12|0)==(0|0);
        if ($cmp108) {
         $R$3 = 0;
         break;
        } else {
         $R$1$ph = $12;$RP$1$ph = $child;
        }
       } else {
        $R$1$ph = $11;$RP$1$ph = $arrayidx103;
       }
       $R$1 = $R$1$ph;$RP$1 = $RP$1$ph;
       while(1) {
        $arrayidx112 = ((($R$1)) + 20|0);
        $13 = load4($arrayidx112);
        $cmp113 = ($13|0)==(0|0);
        if ($cmp113) {
         $arrayidx117 = ((($R$1)) + 16|0);
         $14 = load4($arrayidx117);
         $cmp118 = ($14|0)==(0|0);
         if ($cmp118) {
          break;
         } else {
          $R$1$be = $14;$RP$1$be = $arrayidx117;
         }
        } else {
         $R$1$be = $13;$RP$1$be = $arrayidx112;
        }
        $R$1 = $R$1$be;$RP$1 = $RP$1$be;
       }
       store4($RP$1,0);
       $R$3 = $R$1;
      } else {
       $fd82 = ((($add$ptr20)) + 8|0);
       $10 = load4($fd82);
       $bk98 = ((($10)) + 12|0);
       store4($bk98,$9);
       $fd99 = ((($9)) + 8|0);
       store4($fd99,$10);
       $R$3 = $9;
      }
     } while(0);
     $cmp131 = ($8|0)==(0|0);
     if ($cmp131) {
      $22 = $add$ptr20;$p$1 = $add$ptr20;$psize$1 = $add21;
      label = 32;
     } else {
      $index = ((($add$ptr20)) + 28|0);
      $15 = load4($index);
      $arrayidx134 = (1400164 + ($15<<2)|0);
      $16 = load4($arrayidx134);
      $cmp135 = ($16|0)==($add$ptr20|0);
      if ($cmp135) {
       store4($arrayidx134,$R$3);
       $cond254 = ($R$3|0)==(0|0);
       if ($cond254) {
        $shl142 = 1 << $15;
        $neg143 = $shl142 ^ -1;
        $17 = load4((1399864));
        $and144 = $17 & $neg143;
        store4((1399864),$and144);
        $22 = $add$ptr20;$p$1 = $add$ptr20;$psize$1 = $add21;
        label = 32;
        break;
       }
      } else {
       $arrayidx153 = ((($8)) + 16|0);
       $18 = load4($arrayidx153);
       $cmp154 = ($18|0)==($add$ptr20|0);
       $arrayidx161 = ((($8)) + 20|0);
       $arrayidx161$sink = $cmp154 ? $arrayidx153 : $arrayidx161;
       store4($arrayidx161$sink,$R$3);
       $cmp166 = ($R$3|0)==(0|0);
       if ($cmp166) {
        $22 = $add$ptr20;$p$1 = $add$ptr20;$psize$1 = $add21;
        label = 32;
        break;
       }
      }
      $parent174 = ((($R$3)) + 24|0);
      store4($parent174,$8);
      $child175 = ((($add$ptr20)) + 16|0);
      $19 = load4($child175);
      $cmp177 = ($19|0)==(0|0);
      if (!($cmp177)) {
       $arrayidx186 = ((($R$3)) + 16|0);
       store4($arrayidx186,$19);
       $parent187 = ((($19)) + 24|0);
       store4($parent187,$R$3);
      }
      $arrayidx192 = ((($child175)) + 4|0);
      $20 = load4($arrayidx192);
      $cmp193 = ($20|0)==(0|0);
      if ($cmp193) {
       $22 = $add$ptr20;$p$1 = $add$ptr20;$psize$1 = $add21;
       label = 32;
      } else {
       $arrayidx202 = ((($R$3)) + 20|0);
       store4($arrayidx202,$20);
       $parent203 = ((($20)) + 24|0);
       store4($parent203,$R$3);
       $22 = $add$ptr20;$p$1 = $add$ptr20;$psize$1 = $add21;
       label = 32;
      }
     }
    }
   }
  } else {
   $22 = $add$ptr;$p$1 = $add$ptr;$psize$1 = $and9;
   label = 32;
  }
 } while(0);
 do {
  if ((label|0) == 32) {
   $cmp232 = ($22>>>0)<($add$ptr10>>>0);
   if ($cmp232) {
    $head235 = ((($add$ptr10)) + 4|0);
    $23 = load4($head235);
    $and236 = $23 & 1;
    $tobool237 = ($and236|0)==(0);
    if (!($tobool237)) {
     $and244 = $23 & 2;
     $tobool245 = ($and244|0)==(0);
     if ($tobool245) {
      $24 = load4((1399884));
      $cmp247 = ($24|0)==($add$ptr10|0);
      if ($cmp247) {
       $25 = load4((1399872));
       $add250 = (($25) + ($psize$1))|0;
       store4((1399872),$add250);
       store4((1399884),$p$1);
       $or251 = $add250 | 1;
       $head252 = ((($p$1)) + 4|0);
       store4($head252,$or251);
       $26 = load4((1399880));
       $cmp253 = ($p$1|0)==($26|0);
       if (!($cmp253)) {
        break;
       }
       store4((1399880),0);
       store4((1399868),0);
       break;
      }
      $27 = load4((1399880));
      $cmp259 = ($27|0)==($add$ptr10|0);
      if ($cmp259) {
       $28 = load4((1399868));
       $add262 = (($28) + ($psize$1))|0;
       store4((1399868),$add262);
       store4((1399880),$22);
       $or263 = $add262 | 1;
       $head264 = ((($p$1)) + 4|0);
       store4($head264,$or263);
       $add$ptr265 = (($22) + ($add262)|0);
       store4($add$ptr265,$add262);
       break;
      }
      $and270 = $23 & -8;
      $add271 = (($and270) + ($psize$1))|0;
      $shr272 = $23 >>> 3;
      $cmp273 = ($23>>>0)<(256);
      do {
       if ($cmp273) {
        $fd277 = ((($add$ptr10)) + 8|0);
        $29 = load4($fd277);
        $bk279 = ((($add$ptr10)) + 12|0);
        $30 = load4($bk279);
        $cmp300 = ($30|0)==($29|0);
        if ($cmp300) {
         $shl303 = 1 << $shr272;
         $neg304 = $shl303 ^ -1;
         $31 = load4(1399860);
         $and305 = $31 & $neg304;
         store4(1399860,$and305);
         break;
        } else {
         $bk325 = ((($29)) + 12|0);
         store4($bk325,$30);
         $fd326 = ((($30)) + 8|0);
         store4($fd326,$29);
         break;
        }
       } else {
        $parent335 = ((($add$ptr10)) + 24|0);
        $32 = load4($parent335);
        $bk337 = ((($add$ptr10)) + 12|0);
        $33 = load4($bk337);
        $cmp338 = ($33|0)==($add$ptr10|0);
        do {
         if ($cmp338) {
          $child365 = ((($add$ptr10)) + 16|0);
          $arrayidx366 = ((($child365)) + 4|0);
          $35 = load4($arrayidx366);
          $cmp367 = ($35|0)==(0|0);
          if ($cmp367) {
           $36 = load4($child365);
           $cmp372 = ($36|0)==(0|0);
           if ($cmp372) {
            $R336$3 = 0;
            break;
           } else {
            $R336$1$ph = $36;$RP364$1$ph = $child365;
           }
          } else {
           $R336$1$ph = $35;$RP364$1$ph = $arrayidx366;
          }
          $R336$1 = $R336$1$ph;$RP364$1 = $RP364$1$ph;
          while(1) {
           $arrayidx378 = ((($R336$1)) + 20|0);
           $37 = load4($arrayidx378);
           $cmp379 = ($37|0)==(0|0);
           if ($cmp379) {
            $arrayidx383 = ((($R336$1)) + 16|0);
            $38 = load4($arrayidx383);
            $cmp384 = ($38|0)==(0|0);
            if ($cmp384) {
             break;
            } else {
             $R336$1$be = $38;$RP364$1$be = $arrayidx383;
            }
           } else {
            $R336$1$be = $37;$RP364$1$be = $arrayidx378;
           }
           $R336$1 = $R336$1$be;$RP364$1 = $RP364$1$be;
          }
          store4($RP364$1,0);
          $R336$3 = $R336$1;
         } else {
          $fd342 = ((($add$ptr10)) + 8|0);
          $34 = load4($fd342);
          $bk359 = ((($34)) + 12|0);
          store4($bk359,$33);
          $fd360 = ((($33)) + 8|0);
          store4($fd360,$34);
          $R336$3 = $33;
         }
        } while(0);
        $cmp399 = ($32|0)==(0|0);
        if (!($cmp399)) {
         $index403 = ((($add$ptr10)) + 28|0);
         $39 = load4($index403);
         $arrayidx404 = (1400164 + ($39<<2)|0);
         $40 = load4($arrayidx404);
         $cmp405 = ($40|0)==($add$ptr10|0);
         if ($cmp405) {
          store4($arrayidx404,$R336$3);
          $cond255 = ($R336$3|0)==(0|0);
          if ($cond255) {
           $shl412 = 1 << $39;
           $neg413 = $shl412 ^ -1;
           $41 = load4((1399864));
           $and414 = $41 & $neg413;
           store4((1399864),$and414);
           break;
          }
         } else {
          $arrayidx423 = ((($32)) + 16|0);
          $42 = load4($arrayidx423);
          $cmp424 = ($42|0)==($add$ptr10|0);
          $arrayidx431 = ((($32)) + 20|0);
          $arrayidx431$sink = $cmp424 ? $arrayidx423 : $arrayidx431;
          store4($arrayidx431$sink,$R336$3);
          $cmp436 = ($R336$3|0)==(0|0);
          if ($cmp436) {
           break;
          }
         }
         $parent446 = ((($R336$3)) + 24|0);
         store4($parent446,$32);
         $child447 = ((($add$ptr10)) + 16|0);
         $43 = load4($child447);
         $cmp449 = ($43|0)==(0|0);
         if (!($cmp449)) {
          $arrayidx458 = ((($R336$3)) + 16|0);
          store4($arrayidx458,$43);
          $parent459 = ((($43)) + 24|0);
          store4($parent459,$R336$3);
         }
         $arrayidx464 = ((($child447)) + 4|0);
         $44 = load4($arrayidx464);
         $cmp465 = ($44|0)==(0|0);
         if (!($cmp465)) {
          $arrayidx474 = ((($R336$3)) + 20|0);
          store4($arrayidx474,$44);
          $parent475 = ((($44)) + 24|0);
          store4($parent475,$R336$3);
         }
        }
       }
      } while(0);
      $or484 = $add271 | 1;
      $head485 = ((($p$1)) + 4|0);
      store4($head485,$or484);
      $add$ptr486 = (($22) + ($add271)|0);
      store4($add$ptr486,$add271);
      $45 = load4((1399880));
      $cmp488 = ($p$1|0)==($45|0);
      if ($cmp488) {
       store4((1399868),$add271);
       break;
      } else {
       $psize$2 = $add271;
      }
     } else {
      $and499 = $23 & -2;
      store4($head235,$and499);
      $or500 = $psize$1 | 1;
      $head501 = ((($p$1)) + 4|0);
      store4($head501,$or500);
      $add$ptr502 = (($22) + ($psize$1)|0);
      store4($add$ptr502,$psize$1);
      $psize$2 = $psize$1;
     }
     $shr505 = $psize$2 >>> 3;
     $cmp506 = ($psize$2>>>0)<(256);
     if ($cmp506) {
      $shl512 = $shr505 << 1;
      $arrayidx513 = (1399900 + ($shl512<<2)|0);
      $46 = load4(1399860);
      $shl515 = 1 << $shr505;
      $and516 = $46 & $shl515;
      $tobool517 = ($and516|0)==(0);
      if ($tobool517) {
       $or520 = $46 | $shl515;
       store4(1399860,$or520);
       $$pre = ((($arrayidx513)) + 8|0);
       $$pre$phiZ2D = $$pre;$F514$0 = $arrayidx513;
      } else {
       $47 = ((($arrayidx513)) + 8|0);
       $48 = load4($47);
       $$pre$phiZ2D = $47;$F514$0 = $48;
      }
      store4($$pre$phiZ2D,$p$1);
      $bk533 = ((($F514$0)) + 12|0);
      store4($bk533,$p$1);
      $fd534 = ((($p$1)) + 8|0);
      store4($fd534,$F514$0);
      $bk535 = ((($p$1)) + 12|0);
      store4($bk535,$arrayidx513);
      break;
     }
     $shr539 = $psize$2 >>> 8;
     $cmp540 = ($shr539|0)==(0);
     if ($cmp540) {
      $I538$0 = 0;
     } else {
      $cmp544 = ($psize$2>>>0)>(16777215);
      if ($cmp544) {
       $I538$0 = 31;
      } else {
       $sub = (($shr539) + 1048320)|0;
       $shr548 = $sub >>> 16;
       $and549 = $shr548 & 8;
       $shl550 = $shr539 << $and549;
       $sub551 = (($shl550) + 520192)|0;
       $shr552 = $sub551 >>> 16;
       $and553 = $shr552 & 4;
       $add554 = $and553 | $and549;
       $shl555 = $shl550 << $and553;
       $sub556 = (($shl555) + 245760)|0;
       $shr557 = $sub556 >>> 16;
       $and558 = $shr557 & 2;
       $add559 = $add554 | $and558;
       $sub560 = (14 - ($add559))|0;
       $shl561 = $shl555 << $and558;
       $shr562 = $shl561 >>> 15;
       $add563 = (($sub560) + ($shr562))|0;
       $shl564 = $add563 << 1;
       $add565 = (($add563) + 7)|0;
       $shr566 = $psize$2 >>> $add565;
       $and567 = $shr566 & 1;
       $add568 = $and567 | $shl564;
       $I538$0 = $add568;
      }
     }
     $arrayidx571 = (1400164 + ($I538$0<<2)|0);
     $index572 = ((($p$1)) + 28|0);
     store4($index572,$I538$0);
     $child573 = ((($p$1)) + 16|0);
     $arrayidx574 = ((($p$1)) + 20|0);
     store4($arrayidx574,0);
     store4($child573,0);
     $49 = load4((1399864));
     $shl577 = 1 << $I538$0;
     $and578 = $49 & $shl577;
     $tobool579 = ($and578|0)==(0);
     L102: do {
      if ($tobool579) {
       $or582 = $49 | $shl577;
       store4((1399864),$or582);
       store4($arrayidx571,$p$1);
       $parent583 = ((($p$1)) + 24|0);
       store4($parent583,$arrayidx571);
       $bk584 = ((($p$1)) + 12|0);
       store4($bk584,$p$1);
       $fd585 = ((($p$1)) + 8|0);
       store4($fd585,$p$1);
      } else {
       $50 = load4($arrayidx571);
       $head597262 = ((($50)) + 4|0);
       $51 = load4($head597262);
       $and598263 = $51 & -8;
       $cmp599264 = ($and598263|0)==($psize$2|0);
       L105: do {
        if ($cmp599264) {
         $T$0$lcssa = $50;
        } else {
         $cmp588 = ($I538$0|0)==(31);
         $shr592 = $I538$0 >>> 1;
         $sub595 = (25 - ($shr592))|0;
         $cond = $cmp588 ? 0 : $sub595;
         $shl596 = $psize$2 << $cond;
         $K587$0266 = $shl596;$T$0265 = $50;
         while(1) {
          $shr603 = $K587$0266 >>> 31;
          $arrayidx605 = (((($T$0265)) + 16|0) + ($shr603<<2)|0);
          $52 = load4($arrayidx605);
          $cmp607 = ($52|0)==(0|0);
          if ($cmp607) {
           break;
          }
          $shl606 = $K587$0266 << 1;
          $head597 = ((($52)) + 4|0);
          $53 = load4($head597);
          $and598 = $53 & -8;
          $cmp599 = ($and598|0)==($psize$2|0);
          if ($cmp599) {
           $T$0$lcssa = $52;
           break L105;
          } else {
           $K587$0266 = $shl606;$T$0265 = $52;
          }
         }
         store4($arrayidx605,$p$1);
         $parent616 = ((($p$1)) + 24|0);
         store4($parent616,$T$0265);
         $bk617 = ((($p$1)) + 12|0);
         store4($bk617,$p$1);
         $fd618 = ((($p$1)) + 8|0);
         store4($fd618,$p$1);
         break L102;
        }
       } while(0);
       $fd626 = ((($T$0$lcssa)) + 8|0);
       $54 = load4($fd626);
       $bk637 = ((($54)) + 12|0);
       store4($bk637,$p$1);
       store4($fd626,$p$1);
       $fd639 = ((($p$1)) + 8|0);
       store4($fd639,$54);
       $bk640 = ((($p$1)) + 12|0);
       store4($bk640,$T$0$lcssa);
       $parent641 = ((($p$1)) + 24|0);
       store4($parent641,0);
      }
     } while(0);
     $55 = load4((1399892));
     $dec = (($55) + -1)|0;
     store4((1399892),$dec);
     $cmp646 = ($dec|0)==(0);
     if ($cmp646) {
      $sp$0$in$i = (1400344);
      while(1) {
       $sp$0$i = load4($sp$0$in$i);
       $cmp$i = ($sp$0$i|0)==(0|0);
       $next4$i = ((($sp$0$i)) + 8|0);
       if ($cmp$i) {
        break;
       } else {
        $sp$0$in$i = $next4$i;
       }
      }
      store4((1399892),-1);
     }
    }
   }
  }
 } while(0);
 $56 = load4((1400304));
 $and658 = $56 & 2;
 $tobool659 = ($and658|0)==(0);
 if ($tobool659) {
  return;
 }
 (___pthread_mutex_unlock((1400308))|0);
 return;
}
function _sbrk($increment) {
 $increment = $increment|0;
 var $0 = 0, $1 = 0, $2 = 0, $add = 0, $call = 0, $call1 = 0, $call2 = 0, $call4 = 0, $cmp = 0, $retval$4$ph = 0, $success = 0, $tobool = 0, label = 0, sp = 0;
 sp = STACKTOP;
 while(1) {
  $call = (_emscripten_get_sbrk_ptr()|0);
  $0 = load4($call);
  $add = (($0) + ($increment))|0;
  $call1 = (_emscripten_get_heap_size()|0);
  $cmp = ($add>>>0)>($call1>>>0);
  if ($cmp) {
   $call2 = (_emscripten_resize_heap(($add|0))|0);
   $tobool = ($call2|0)==(0);
   if ($tobool) {
    label = 4;
    break;
   }
  }
  $1 = (Atomics_compareExchange(HEAP32, $call>>2,$0,$add)|0);
  $success = ($1|0)==($0|0);
  if ($success) {
   label = 6;
   break;
  }
 }
 if ((label|0) == 4) {
  $call4 = (___errno_location()|0);
  store4($call4,48);
  $retval$4$ph = (-1);
  return ($retval$4$ph|0);
 }
 else if ((label|0) == 6) {
  $2 = $0;
  $retval$4$ph = $2;
  return ($retval$4$ph|0);
 }
 return (0)|0;
}
function ___pthread_mutex_lock($m) {
 $m = $m|0;
 var $0 = 0, $and = 0, $arrayidx2 = 0, $call$i = 0, $call3 = 0, $cmp = 0, $retval$0 = 0, $tobool = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = load4($m);
 $and = $0 & 15;
 $cmp = ($and|0)==(0);
 if ($cmp) {
  $arrayidx2 = ((($m)) + 4|0);
  $call$i = (Atomics_compareExchange(HEAP32, $arrayidx2>>2,0,10)|0);
  $tobool = ($call$i|0)==(0);
  if ($tobool) {
   $retval$0 = 0;
   return ($retval$0|0);
  }
 }
 $call3 = (___pthread_mutex_timedlock($m,0)|0);
 $retval$0 = $call3;
 return ($retval$0|0);
}
function ___pthread_mutex_unlock($m) {
 $m = $m|0;
 var $$pre = 0, $0 = 0, $1 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $add$ptr = 0, $and = 0, $and10 = 0, $and13 = 0, $and42 = 0, $and6 = 0, $arrayidx = 0, $arrayidx17 = 0, $arrayidx26 = 0, $arrayidx30 = 0, $arrayidx41$pre$phiZ2D = 0, $arrayidx9 = 0;
 var $call$i = 0, $call$i30 = 0, $call1$i = 0, $cmp = 0, $cmp$i = 0, $cmp11 = 0, $cmp14 = 0, $cmp35 = 0, $cmp53 = 0, $cond = 0, $dec = 0, $head = 0, $or$cond = 0, $or$cond1 = 0, $pending = 0, $pending50 = 0, $retval$0 = 0, $self$0 = 0, $tid = 0, $tobool = 0;
 var $tobool23 = 0, $tobool43 = 0, $tobool47 = 0, $tobool52 = 0, $xor = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $arrayidx = ((($m)) + 8|0);
 $0 = (Atomics_load(HEAP32,$arrayidx>>2)|0);
 $1 = load4($m);
 $and = $1 & 15;
 $and6 = $1 & 128;
 $xor = $and6 ^ 128;
 $cmp = ($and|0)==(0);
 if ($cmp) {
  $$pre = ((($m)) + 4|0);
  $arrayidx41$pre$phiZ2D = $$pre;$self$0 = 0;
 } else {
  $call$i = (_pthread_self()|0);
  $arrayidx9 = ((($m)) + 4|0);
  $2 = (Atomics_load(HEAP32,$arrayidx9>>2)|0);
  $and10 = $2 & 2147483647;
  $tid = ((($call$i)) + 52|0);
  $3 = load4($tid);
  $cmp11 = ($and10|0)==($3|0);
  if (!($cmp11)) {
   $retval$0 = 63;
   return ($retval$0|0);
  }
  $and13 = $1 & 3;
  $cmp14 = ($and13|0)==(1);
  if ($cmp14) {
   $arrayidx17 = ((($m)) + 20|0);
   $4 = load4($arrayidx17);
   $tobool = ($4|0)==(0);
   if (!($tobool)) {
    $dec = (($4) + -1)|0;
    store4($arrayidx17,$dec);
    $retval$0 = 0;
    return ($retval$0|0);
   }
  }
  $tobool23 = ($xor|0)==(0);
  $arrayidx26 = ((($m)) + 16|0);
  if ($tobool23) {
   $pending = ((($call$i)) + 176|0);
   Atomics_store(HEAP32,$pending>>2,$arrayidx26)|0;
   ___vm_lock();
  }
  $arrayidx30 = ((($m)) + 12|0);
  $5 = load4($arrayidx30);
  $6 = load4($arrayidx26);
  Atomics_store(HEAP32,$5>>2,$6)|0;
  $head = ((($call$i)) + 168|0);
  $cmp35 = ($6|0)==($head|0);
  if ($cmp35) {
   $arrayidx41$pre$phiZ2D = $arrayidx9;$self$0 = $call$i;
  } else {
   $add$ptr = ((($6)) + -4|0);
   Atomics_store(HEAP32,$add$ptr>>2,$5)|0;
   $arrayidx41$pre$phiZ2D = $arrayidx9;$self$0 = $call$i;
  }
 }
 $and42 = $1 & 8;
 $tobool43 = ($and42|0)==(0);
 $cond = $tobool43 ? 0 : 2147483647;
 while(1) {
  $call$i30 = (Atomics_load(HEAP32, $arrayidx41$pre$phiZ2D>>2)|0);
  $call1$i = (Atomics_compareExchange(HEAP32, $arrayidx41$pre$phiZ2D>>2,$call$i30,$cond)|0);
  $cmp$i = ($call1$i|0)==($call$i30|0);
  if ($cmp$i) {
   break;
  }
 }
 $tobool47 = ($xor|0)!=(0);
 $or$cond = $cmp | $tobool47;
 if (!($or$cond)) {
  $pending50 = ((($self$0)) + 176|0);
  Atomics_store(HEAP32,$pending50>>2,0)|0;
  ___vm_unlock();
 }
 $tobool52 = ($0|0)!=(0);
 $cmp53 = ($call$i30|0)<(0);
 $or$cond1 = $tobool52 | $cmp53;
 if (!($or$cond1)) {
  $retval$0 = 0;
  return ($retval$0|0);
 }
 (_emscripten_futex_wake(($arrayidx41$pre$phiZ2D|0),1)|0);
 $retval$0 = 0;
 return ($retval$0|0);
}
function _pthread_mutexattr_init($a) {
 $a = $a|0;
 var label = 0, sp = 0;
 sp = STACKTOP;
 store4($a,0);
 return 0;
}
function _pthread_mutex_init($m,$a) {
 $m = $m|0;
 $a = $a|0;
 var $$compoundliteral$sroa$0 = 0, $0 = 0, $tobool = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 32|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(32|0);
 $$compoundliteral$sroa$0 = sp;
 ; store8($$compoundliteral$sroa$0,i64_const(0,0),4); store8($$compoundliteral$sroa$0+8|0,i64_const(0,0),4); store8($$compoundliteral$sroa$0+16|0,i64_const(0,0),4); store4($$compoundliteral$sroa$0+24|0,0,4);
 ; store8($m,load8($$compoundliteral$sroa$0,4),4); store8($m+8 | 0,load8($$compoundliteral$sroa$0+8 | 0,4),4); store8($m+16 | 0,load8($$compoundliteral$sroa$0+16 | 0,4),4); store4($m+24 | 0,load4($$compoundliteral$sroa$0+24 | 0,4),4);
 $tobool = ($a|0)==(0|0);
 if ($tobool) {
  STACKTOP = sp;return 0;
 }
 $0 = load4($a);
 store4($m,$0);
 STACKTOP = sp;return 0;
}
// Copyright 2016 The Emscripten Authors.  All rights reserved.
// Emscripten is available under two separate licenses, the MIT license and the
// University of Illinois/NCSA Open Source License.  Both these licenses can be
// found in the LICENSE file.


// Copyright 2016 The Emscripten Authors.  All rights reserved.
// Emscripten is available under two separate licenses, the MIT license and the
// University of Illinois/NCSA Open Source License.  Both these licenses can be
// found in the LICENSE file.

var Fetch = {
  xhrs: [],

  // The web worker that runs proxied file I/O requests. (this field is populated on demand, start as undefined to save code size)
  // worker: undefined,

  // Specifies an instance to the IndexedDB database. The database is opened
  // as a preload step before the Emscripten application starts. (this field is populated on demand, start as undefined to save code size)
  // dbInstance: undefined,

  setu64: function(addr, val) {
    HEAPU32[addr >> 2] = val;
    HEAPU32[addr + 4 >> 2] = (val / 4294967296)|0;
  },

  openDatabase: function(dbname, dbversion, onsuccess, onerror) {
    try {
      var openRequest = indexedDB.open(dbname, dbversion);
    } catch (e) { return onerror(e); }

    openRequest.onupgradeneeded = function(event) {
      var db = event.target.result;
      if (db.objectStoreNames.contains('FILES')) {
        db.deleteObjectStore('FILES');
      }
      db.createObjectStore('FILES');
    };
    openRequest.onsuccess = function(event) { onsuccess(event.target.result); };
    openRequest.onerror = function(error) { onerror(error); };
  },

  initFetchWorker: function() {
    var stackSize = 128*1024;
    var stack = allocate(stackSize>>2, "i32*", ALLOC_DYNAMIC);
    Fetch.worker.postMessage({cmd: 'init', DYNAMICTOP_PTR: DYNAMICTOP_PTR, STACKTOP: stack, STACK_MAX: stack + stackSize, queuePtr: _fetch_work_queue, buffer: HEAPU8.buffer});
  },

  staticInit: function() {
    var isMainThread = (typeof ENVIRONMENT_IS_FETCH_WORKER === 'undefined' && !ENVIRONMENT_IS_PTHREAD);

    var onsuccess = function(db) {
      Fetch.dbInstance = db;

      if (isMainThread) {
        Fetch.initFetchWorker();
        removeRunDependency('library_fetch_init');
      }
    };
    var onerror = function() {
      Fetch.dbInstance = false;

      if (isMainThread) {
        Fetch.initFetchWorker();
        removeRunDependency('library_fetch_init');
      }
    };
    Fetch.openDatabase('emscripten_filesystem', 1, onsuccess, onerror);

    if (isMainThread) {
      addRunDependency('library_fetch_init');

      // Allow HTML module to configure the location where the 'worker.js' file will be loaded from,
      // via Module.locateFile() function. If not specified, then the default URL 'worker.js' relative
      // to the main html file is loaded.
      var fetchJs = locateFile('missile-multi-thread-v20221120.fetch.js');
      Fetch.worker = new Worker(fetchJs);
      Fetch.worker.onmessage = function(e) {
        out('fetch-worker sent a message: ' + e.filename + ':' + e.lineno + ': ' + e.message);
      };
      Fetch.worker.onerror = function(e) {
        err('fetch-worker sent an error! ' + e.filename + ':' + e.lineno + ': ' + e.message);
      };
    }
  }
}

function __emscripten_fetch_delete_cached_data(db, fetch, onsuccess, onerror) {
  if (!db) {
    onerror(fetch, 0, 'IndexedDB not available!');
    return;
  }

  var fetch_attr = fetch + 112;
  var path = HEAPU32[fetch_attr + 64 >> 2];
  if (!path) path = HEAPU32[fetch + 8 >> 2];
  var pathStr = UTF8ToString(path);

  try {
    var transaction = db.transaction(['FILES'], 'readwrite');
    var packages = transaction.objectStore('FILES');
    var request = packages.delete(pathStr);
    request.onsuccess = function(event) {
      var value = event.target.result;
      HEAPU32[fetch + 12 >> 2] = 0;
      Fetch.setu64(fetch + 16, 0);
      Fetch.setu64(fetch + 24, 0);
      Fetch.setu64(fetch + 32, 0);
      HEAPU16[fetch + 40 >> 1] = 4; // Mimic XHR readyState 4 === 'DONE: The operation is complete'
      HEAPU16[fetch + 42 >> 1] = 200; // Mimic XHR HTTP status code 200 "OK"
      stringToUTF8("OK", fetch + 44, 64);
      onsuccess(fetch, 0, value);
    };
    request.onerror = function(error) {
      HEAPU16[fetch + 40 >> 1] = 4; // Mimic XHR readyState 4 === 'DONE: The operation is complete'
      HEAPU16[fetch + 42 >> 1] = 404; // Mimic XHR HTTP status code 404 "Not Found"
      stringToUTF8("Not Found", fetch + 44, 64);
      onerror(fetch, 0, error);
    };
  } catch(e) {
    onerror(fetch, 0, e);
  }
}

function __emscripten_fetch_load_cached_data(db, fetch, onsuccess, onerror) {
  if (!db) {
    onerror(fetch, 0, 'IndexedDB not available!');
    return;
  }

  var fetch_attr = fetch + 112;
  var path = HEAPU32[fetch_attr + 64 >> 2];
  if (!path) path = HEAPU32[fetch + 8 >> 2];
  var pathStr = UTF8ToString(path);

  try {
    var transaction = db.transaction(['FILES'], 'readonly');
    var packages = transaction.objectStore('FILES');
    var getRequest = packages.get(pathStr);
    getRequest.onsuccess = function(event) {
      if (event.target.result) {
        var value = event.target.result;
        var len = value.byteLength || value.length;
        // The data pointer malloc()ed here has the same lifetime as the emscripten_fetch_t structure itself has, and is
        // freed when emscripten_fetch_close() is called.
        var ptr = _malloc(len);
        HEAPU8.set(new Uint8Array(value), ptr);
        HEAPU32[fetch + 12 >> 2] = ptr;
        Fetch.setu64(fetch + 16, len);
        Fetch.setu64(fetch + 24, 0);
        Fetch.setu64(fetch + 32, len);
        HEAPU16[fetch + 40 >> 1] = 4; // Mimic XHR readyState 4 === 'DONE: The operation is complete'
        HEAPU16[fetch + 42 >> 1] = 200; // Mimic XHR HTTP status code 200 "OK"
        stringToUTF8("OK", fetch + 44, 64);
        onsuccess(fetch, 0, value);
      } else {
        // Succeeded to load, but the load came back with the value of undefined, treat that as an error since we never store undefined in db.
        HEAPU16[fetch + 40 >> 1] = 4; // Mimic XHR readyState 4 === 'DONE: The operation is complete'
        HEAPU16[fetch + 42 >> 1] = 404; // Mimic XHR HTTP status code 404 "Not Found"
        stringToUTF8("Not Found", fetch + 44, 64);
        onerror(fetch, 0, 'no data');
      }
    };
    getRequest.onerror = function(error) {
      HEAPU16[fetch + 40 >> 1] = 4; // Mimic XHR readyState 4 === 'DONE: The operation is complete'
      HEAPU16[fetch + 42 >> 1] = 404; // Mimic XHR HTTP status code 404 "Not Found"
      stringToUTF8("Not Found", fetch + 44, 64);
      onerror(fetch, 0, error);
    };
  } catch(e) {
    onerror(fetch, 0, e);
  }
}

function __emscripten_fetch_cache_data(db, fetch, data, onsuccess, onerror) {
  if (!db) {
    onerror(fetch, 0, 'IndexedDB not available!');
    return;
  }

  var fetch_attr = fetch + 112;
  var destinationPath = HEAPU32[fetch_attr + 64 >> 2];
  if (!destinationPath) destinationPath = HEAPU32[fetch + 8 >> 2];
  var destinationPathStr = UTF8ToString(destinationPath);

  try {
    var transaction = db.transaction(['FILES'], 'readwrite');
    var packages = transaction.objectStore('FILES');
    var putRequest = packages.put(data, destinationPathStr);
    putRequest.onsuccess = function(event) {
      HEAPU16[fetch + 40 >> 1] = 4; // Mimic XHR readyState 4 === 'DONE: The operation is complete'
      HEAPU16[fetch + 42 >> 1] = 200; // Mimic XHR HTTP status code 200 "OK"
      stringToUTF8("OK", fetch + 44, 64);
      onsuccess(fetch, 0, destinationPathStr);
    };
    putRequest.onerror = function(error) {
      // Most likely we got an error if IndexedDB is unwilling to store any more data for this page.
      // TODO: Can we identify and break down different IndexedDB-provided errors and convert those
      // to more HTTP status codes for more information?
      HEAPU16[fetch + 40 >> 1] = 4; // Mimic XHR readyState 4 === 'DONE: The operation is complete'
      HEAPU16[fetch + 42 >> 1] = 413; // Mimic XHR HTTP status code 413 "Payload Too Large"
      stringToUTF8("Payload Too Large", fetch + 44, 64);
      onerror(fetch, 0, error);
    };
  } catch(e) {
    onerror(fetch, 0, e);
  }
}

function __emscripten_fetch_xhr(fetch, onsuccess, onerror, onprogress, onreadystatechange) {
  var url = HEAPU32[fetch + 8 >> 2];
  if (!url) {
    onerror(fetch, 0, 'no url specified!');
    return;
  }
  var url_ = UTF8ToString(url);

  var fetch_attr = fetch + 112;
  var requestMethod = UTF8ToString(fetch_attr);
  if (!requestMethod) requestMethod = 'GET';
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

  var xhr = new XMLHttpRequest();
  xhr.withCredentials = withCredentials;
  xhr.open(requestMethod, url_, !fetchAttrSynchronous, userNameStr, passwordStr);
  if (!fetchAttrSynchronous) xhr.timeout = timeoutMsecs; // XHR timeout field is only accessible in async XHRs, and must be set after .open() but before .send().
  xhr.url_ = url_; // Save the url for debugging purposes (and for comparing to the responseURL that server side advertised)
  assert(!fetchAttrStreamData, 'streaming uses moz-chunked-arraybuffer which is no longer supported; TODO: rewrite using fetch()');
  xhr.responseType = 'arraybuffer';

  if (overriddenMimeType) {
    xhr.overrideMimeType(overriddenMimeTypeStr);
  }
  if (requestHeaders) {
    for(;;) {
      var key = HEAPU32[requestHeaders >> 2];
      if (!key) break;
      var value = HEAPU32[requestHeaders + 4 >> 2];
      if (!value) break;
      requestHeaders += 8;
      var keyStr = UTF8ToString(key);
      var valueStr = UTF8ToString(value);
      xhr.setRequestHeader(keyStr, valueStr);
    }
  }
  Fetch.xhrs.push(xhr);
  var id = Fetch.xhrs.length;
  HEAPU32[fetch + 0 >> 2] = id;
  var data = (dataPtr && dataLength) ? HEAPU8.slice(dataPtr, dataPtr + dataLength) : null;
  // TODO: Support specifying custom headers to the request.

  xhr.onload = function(e) {
    var len = xhr.response ? xhr.response.byteLength : 0;
    var ptr = 0;
    var ptrLen = 0;
    if (fetchAttrLoadToMemory && !fetchAttrStreamData) {
      ptrLen = len;
      // The data pointer malloc()ed here has the same lifetime as the emscripten_fetch_t structure itself has, and is
      // freed when emscripten_fetch_close() is called.
      ptr = _malloc(ptrLen);
      HEAPU8.set(new Uint8Array(xhr.response), ptr);
    }
    HEAPU32[fetch + 12 >> 2] = ptr;
    Fetch.setu64(fetch + 16, ptrLen);
    Fetch.setu64(fetch + 24, 0);
    if (len) {
      // If the final XHR.onload handler receives the bytedata to compute total length, report that,
      // otherwise don't write anything out here, which will retain the latest byte size reported in
      // the most recent XHR.onprogress handler.
      Fetch.setu64(fetch + 32, len);
    }
    HEAPU16[fetch + 40 >> 1] = xhr.readyState;
    if (xhr.readyState === 4 && xhr.status === 0) {
      if (len > 0) xhr.status = 200; // If loading files from a source that does not give HTTP status code, assume success if we got data bytes.
      else xhr.status = 404; // Conversely, no data bytes is 404.
    }
    HEAPU16[fetch + 42 >> 1] = xhr.status;
    if (xhr.statusText) stringToUTF8(xhr.statusText, fetch + 44, 64);
    if (xhr.status >= 200 && xhr.status < 300) {
      if (onsuccess) onsuccess(fetch, xhr, e);
    } else {
      if (onerror) onerror(fetch, xhr, e);
    }
  };
  xhr.onerror = function(e) {
    var status = xhr.status; // XXX TODO: Overwriting xhr.status doesn't work here, so don't override anywhere else either.
    if (xhr.readyState === 4 && status === 0) status = 404; // If no error recorded, pretend it was 404 Not Found.
    HEAPU32[fetch + 12 >> 2] = 0;
    Fetch.setu64(fetch + 16, 0);
    Fetch.setu64(fetch + 24, 0);
    Fetch.setu64(fetch + 32, 0);
    HEAPU16[fetch + 40 >> 1] = xhr.readyState;
    HEAPU16[fetch + 42 >> 1] = status;
    if (onerror) onerror(fetch, xhr, e);
  };
  xhr.ontimeout = function(e) {
    if (onerror) onerror(fetch, xhr, e);
  };
  xhr.onprogress = function(e) {
    var ptrLen = (fetchAttrLoadToMemory && fetchAttrStreamData && xhr.response) ? xhr.response.byteLength : 0;
    var ptr = 0;
    if (fetchAttrLoadToMemory && fetchAttrStreamData) {
      // The data pointer malloc()ed here has the same lifetime as the emscripten_fetch_t structure itself has, and is
      // freed when emscripten_fetch_close() is called.
      ptr = _malloc(ptrLen);
      HEAPU8.set(new Uint8Array(xhr.response), ptr);
    }
    HEAPU32[fetch + 12 >> 2] = ptr;
    Fetch.setu64(fetch + 16, ptrLen);
    Fetch.setu64(fetch + 24, e.loaded - ptrLen);
    Fetch.setu64(fetch + 32, e.total);
    HEAPU16[fetch + 40 >> 1] = xhr.readyState;
    if (xhr.readyState >= 3 && xhr.status === 0 && e.loaded > 0) xhr.status = 200; // If loading files from a source that does not give HTTP status code, assume success if we get data bytes
    HEAPU16[fetch + 42 >> 1] = xhr.status;
    if (xhr.statusText) stringToUTF8(xhr.statusText, fetch + 44, 64);
    if (onprogress) onprogress(fetch, xhr, e);
  };
  xhr.onreadystatechange = function(e) {
    HEAPU16[fetch + 40 >> 1] = xhr.readyState;
    if (xhr.readyState >= 2) {
      HEAPU16[fetch + 42 >> 1] = xhr.status;
    }
    if (onreadystatechange) onreadystatechange(fetch, xhr, e);
  };
  try {
    xhr.send(data);
  } catch(e) {
    if (onerror) onerror(fetch, xhr, e);
  }
}

function emscripten_start_fetch(fetch, successcb, errorcb, progresscb, readystatechangecb) {
  if (typeof noExitRuntime !== 'undefined') noExitRuntime = true; // If we are the main Emscripten runtime, we should not be closing down.

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
    else if (successcb) successcb(fetch);
  };

  var reportProgress = function(fetch, xhr, e) {
    if (onprogress) dynCall_vi(onprogress, fetch);
    else if (progresscb) progresscb(fetch);
  };

  var reportError = function(fetch, xhr, e) {
    if (onerror) dynCall_vi(onerror, fetch);
    else if (errorcb) errorcb(fetch);
  };

  var reportReadyStateChange = function(fetch, xhr, e) {
    if (onreadystatechange) dynCall_vi(onreadystatechange, fetch);
    else if (readystatechangecb) readystatechangecb(fetch);
  };

  var performUncachedXhr = function(fetch, xhr, e) {
    __emscripten_fetch_xhr(fetch, reportSuccess, reportError, reportProgress, reportReadyStateChange);
  };

  var cacheResultAndReportSuccess = function(fetch, xhr, e) {
    var storeSuccess = function(fetch, xhr, e) {
      if (onsuccess) dynCall_vi(onsuccess, fetch);
      else if (successcb) successcb(fetch);
    };
    var storeError = function(fetch, xhr, e) {
      if (onsuccess) dynCall_vi(onsuccess, fetch);
      else if (successcb) successcb(fetch);
    };
    __emscripten_fetch_cache_data(Fetch.dbInstance, fetch, xhr.response, storeSuccess, storeError);
  };

  var performCachedXhr = function(fetch, xhr, e) {
    __emscripten_fetch_xhr(fetch, cacheResultAndReportSuccess, reportError, reportProgress, reportReadyStateChange);
  };

  if (requestMethod === 'EM_IDB_STORE') {
    // TODO(?): Here we perform a clone of the data, because storing shared typed arrays to IndexedDB does not seem to be allowed.
    var ptr = HEAPU32[fetch_attr + 84 >> 2];
    __emscripten_fetch_cache_data(Fetch.dbInstance, fetch, HEAPU8.slice(ptr, ptr + HEAPU32[fetch_attr + 88 >> 2]), reportSuccess, reportError);
  } else if (requestMethod === 'EM_IDB_DELETE') {
    __emscripten_fetch_delete_cached_data(Fetch.dbInstance, fetch, reportSuccess, reportError);
  } else if (!fetchAttrReplace) {
    __emscripten_fetch_load_cached_data(Fetch.dbInstance, fetch, reportSuccess, fetchAttrNoDownload ? reportError : (fetchAttrPersistFile ? performCachedXhr : performUncachedXhr));
  } else if (!fetchAttrNoDownload) {
    __emscripten_fetch_xhr(fetch, fetchAttrPersistFile ? cacheResultAndReportSuccess : reportSuccess, reportError, reportProgress, reportReadyStateChange);
  } else {
    return 0; // todo: free
  }
  return fetch;
}

function _fetch_get_response_headers_length(id) {
    return lengthBytesUTF8(Fetch.xhrs[id-1].getAllResponseHeaders()) + 1;
}

function _fetch_get_response_headers(id, dst, dstSizeBytes) {
    var responseHeaders = Fetch.xhrs[id-1].getAllResponseHeaders();
    var lengthBytes = lengthBytesUTF8(responseHeaders) + 1;
    stringToUTF8(responseHeaders, dst, dstSizeBytes);
    return Math.min(lengthBytes, dstSizeBytes);
}

//Delete the xhr JS object, allowing it to be garbage collected.
function _fetch_free(id) {
  //Note: should just be [id], but indexes off by 1 (see: #8803)
  delete Fetch.xhrs[id-1];
}



if (typeof Atomics === 'undefined') {
  // Polyfill singlethreaded atomics ops from http://lars-t-hansen.github.io/ecmascript_sharedmem/shmem.html#Atomics.add
  // No thread-safety needed since we don't have multithreading support.
  Atomics = {};
  Atomics['add'] = function(t, i, v) { var w = t[i]; t[i] += v; return w; }
  Atomics['and'] = function(t, i, v) { var w = t[i]; t[i] &= v; return w; }
  Atomics['compareExchange'] = function(t, i, e, r) { var w = t[i]; if (w == e) t[i] = r; return w; }
  Atomics['exchange'] = function(t, i, v) { var w = t[i]; t[i] = v; return w; }
  Atomics['wait'] = function(t, i, v, o) { if (t[i] != v) return 'not-equal'; else return 'timed-out'; }
  Atomics['notify'] = function(t, i, c) { return 0; }
  Atomics['wakeOrRequeue'] = function(t, i1, c, i2, v) { return 0; }
  Atomics['isLockFree'] = function(s) { return true; }
  Atomics['load'] = function(t, i) { return t[i]; }
  Atomics['or'] = function(t, i, v) { var w = t[i]; t[i] |= v; return w; }
  Atomics['store'] = function(t, i, v) { t[i] = v; return v; }
  Atomics['sub'] = function(t, i, v) { var w = t[i]; t[i] -= v; return w; }
  Atomics['xor'] = function(t, i, v) { var w = t[i]; t[i] ^= v; return w; }
}

var Atomics_add = Atomics.add;
var Atomics_and = Atomics.and;
var Atomics_compareExchange = Atomics.compareExchange;
var Atomics_exchange = Atomics.exchange;
var Atomics_wait = Atomics.wait;
var Atomics_wake = Atomics.wake;
var Atomics_wakeOrRequeue = Atomics.wakeOrRequeue;
var Atomics_isLockFree = Atomics.isLockFree;
var Atomics_load = Atomics.load;
var Atomics_or = Atomics.or;
var Atomics_store = Atomics.store;
var Atomics_sub = Atomics.sub;
var Atomics_xor = Atomics.xor;

function load1(ptr) { return HEAP8[ptr>>2]; }
function store1(ptr, value) { HEAP8[ptr>>2] = value; }
function load2(ptr) { return HEAP16[ptr>>2]; }
function store2(ptr, value) { HEAP16[ptr>>2] = value; }
function load4(ptr) { return HEAP32[ptr>>2]; }
function store4(ptr, value) { HEAP32[ptr>>2] = value; }

var ENVIRONMENT_IS_FETCH_WORKER = true;
var ENVIRONMENT_IS_WORKER = true;
var ENVIRONMENT_IS_PTHREAD = true;
var __pthread_is_main_runtime_thread=0;
var DYNAMICTOP_PTR = 0;
var nan = NaN;
var inf = Infinity;

function _emscripten_asm_const_v() {}

function assert(condition) {
  if (!condition) console.error('assert failure!');
}

Fetch.staticInit();

var queuePtr = 0;
var buffer = null;
var STACKTOP = 0;
var STACK_MAX = 0;
var HEAP8 = null;
var HEAPU8 = null;
var HEAP16 = null;
var HEAPU16 = null;
var HEAP32 = null;
var HEAPU32 = null;

function processWorkQueue() {
  if (!queuePtr) return;
  var numQueuedItems = Atomics_load(HEAPU32, queuePtr + 4 >> 2);
  if (numQueuedItems == 0) return;

  var queuedOperations = Atomics_load(HEAPU32, queuePtr >> 2);
  var queueSize = Atomics_load(HEAPU32, queuePtr + 8 >> 2);
  for(var i = 0; i < numQueuedItems; ++i) {
    var fetch = Atomics_load(HEAPU32, (queuedOperations >> 2)+i);
    function successcb(fetch) {
      Atomics.compareExchange(HEAPU32, fetch + 108 >> 2, 1, 2);
      Atomics.wake(HEAP32, fetch + 108 >> 2, 1);
    }
    function errorcb(fetch) {
      Atomics.compareExchange(HEAPU32, fetch + 108 >> 2, 1, 2);
      Atomics.wake(HEAP32, fetch + 108 >> 2, 1);
    }
    function progresscb(fetch) {
    }
    try {
      emscripten_start_fetch(fetch, successcb, errorcb, progresscb);
    } catch(e) {
      console.error(e);
    }
    /*
    if (interval != undefined) {
      clearInterval(interval);
      interval = undefined;
    }
    */
  }
  Atomics_store(HEAPU32, queuePtr + 4 >> 2, 0);
}

interval = 0;
this.onmessage = function(e) {
  if (e.data.cmd == 'init') {
    queuePtr = e.data.queuePtr;
    buffer = e.data.buffer;
    STACKTOP = e.data.STACKTOP;
    STACK_MAX = e.data.STACK_MAX;
    DYNAMICTOP_PTR = e.data.DYNAMICTOP_PTR;
    HEAP8 = new Int8Array(buffer);
    HEAPU8 = new Uint8Array(buffer);
    HEAP16 = new Int16Array(buffer);
    HEAPU16 = new Uint16Array(buffer);
    HEAP32 = new Int32Array(buffer);
    HEAPU32 = new Uint32Array(buffer);
    interval = setInterval(processWorkQueue, 100);
  }
}


