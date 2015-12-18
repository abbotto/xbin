/*!
 * xBin
 * Fetch Binaries with XHR
 * Author: Jared Abbott
 * Copyright 2015 Jared Abbott
 * Distributed under the MIT license
 * 
 * Usage:
 * xBin(url).then(function(response){
 *     // Encode the string w/ Base64
 *     var base64 = 'data:application/octet-stream;base64,'+btoa(response);
 * });
*/
var xBin = (function() {

    // Define a local copy of xBin
    xBin = function(url) {
        // Initiate xBin
        new xBin.fn.init(url);
        return xBin.fn.stack;
    };

    // Build the xBin object
    xBin.fn = xBin.prototype = {
        version: '1.0.0',
        constructor: xBin,
        url: '',
        response: [],
        stack: function() {
            return {
                then: xBin.fn.then
            }
        },
        init: function(url) {

            var request = window.XMLHttpRequest || ActiveXObject;
            var xhr = new request("MSXML2.XMLHTTP.3.0");
            var data = '';
            var buffer = '';
            var bufferLength = 0;

            // Retrieve the file
            xhr.open('GET', url, true);

            // XMLHttpRequest2-compliant browsers
            if (!!window.Uint8Array) {
                xhr.responseType = "arraybuffer";
            }
            // XMLHttpRequest-compliant browsers
            else if ('overrideMimeType' in xhr) {
                xhr.overrideMimeType('text\/plain; charset=x-user-defined');
            }
            // Microsoft.XMLHTTP-compliant browsers [IE9]
            else {
                xhr.setRequestHeader('Accept-Charset', 'x-user-defined');
            }

            xhr.onreadystatechange = function(e) {

                if (this.readyState == 4 && this.status == 200) {

                    // Handles most browsers with a fallback for IE9
                    if (!!window.Uint8Array || !!window.VBArray) {

                        // In IE9 and below the responseBody property returns a byte array in VBArray format 
                        // VBArray is not directly usable 'as is' with JavaScript.
                        // In IE9+ we can access the bytes by converting the VBArray to a JS-compatible array
                        // with the VBArray.toArray() method.
                        buffer = (!!window.Uint8Array) ? new Uint8Array(xhr.response) : xhr.responseBody.toArray();
                        data = String.fromCharCode.apply(null, buffer);
                    }
                    // IE8
                    else if (!!window.execScript) {

                       buffer = xhr.responseBody;

                       var parseVBArray = function (buffer) {

                            // VBScript
                            var VBScript = 
                                 "Function binToArrByteStr(buffer)\r\n"+
                                 "   binToArrByteStr = CStr(buffer)\r\n"+
                                 "End Function\r\n"+
                                 "Function binToArrByteStr_Last(buffer)\r\n"+
                                 "   Dim lastIndex\r\n"+
                                 "   lastIndex = LenB(buffer)\r\n"+
                                 "   if lastIndex mod 2 Then\r\n"+
                                 "       binToArrByteStr_Last = AscB( MidB( buffer, lastIndex, 1 ) )\r\n"+
                                 "   Else\r\n"+
                                 "       binToArrByteStr_Last = -1\r\n"+
                                 "   End If\r\n"+
                                 "End Function\r\n";

                            // Execute VBScript
                            window.execScript(VBScript);

                            // Mapper
                            var byteMapping = {};
                            for ( var i = 0; i < 256; i++ ) {
                                 for ( var j = 0; j < 256; j++ ) {
                                     byteMapping[String.fromCharCode(i + j * 256)] = String.fromCharCode(i) + String.fromCharCode(j);
                                 }
                            }

                            // Data
                            var rawBytes = binToArrByteStr(buffer);
                            var lastChr = binToArrByteStr_Last(buffer);
                            return rawBytes.replace(/[\s\S]/g, function( match ) { return byteMapping[match]; }) + lastChr;
                       }

                       data = parseVBArray(buffer);
                    }
                    // Other browsers
                    else {
                        buffer = xhr.responseText;
                        bufferLength = buffer.length;
                        for (var i = 0, len = bufferLength; i < len; ++i) {

                            // Throw away high-order bytes at offset i (f7)
                            data += String.fromCharCode(buffer.charCodeAt(i) & 255) // 255 === 0xff
                        }
                    }

                    // Return the binary
                    xBin.fn.response = data;
                }
            };

            xhr.send(null);
        },
        then: function(fn) {
            if (!!fn) {
                fn(xBin.fn.response);
            }
            return this;
        }
    };

    // Pass 'init' the xBin prototype for later instantiation
    xBin.fn.init.prototype = xBin.fn;

    // Return the xBin object and set window.xBin.xBin
    return xBin;
})();
