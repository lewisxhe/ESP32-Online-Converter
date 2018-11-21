var xhr = null;
var convert_button = null;
var progress_status = null;
var progress_action = null;
var progress_image = null;
var progress_bar = null;
var progress_banner = null;
var progress_percent = null;

var min_file_size = 100;
var max_file_size = 104857600 * 2;

var upload_hold = false;
var upload_result_url = '';

var custom_action = '';
var custom_setformat = '';
var custom_validelements = null;

function bytesToSize(bytes, trim) {
    var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes < 1) return '0 Byte';
    var i = Math.floor(Math.log(bytes) / Math.log(1024));
    if (trim) {
        return (bytes / Math.pow(1024, i)).toFixed(2).replace(/\.?0*$/, '') + ' ' + sizes[i];
    }
    else {
        return (bytes / Math.pow(1024, i)).toFixed(1) + ' ' + sizes[i];
    }
}

function sendData(sendurl) {
    var form = document.getElementById('form');
    if (!form) return;

    var file = document.getElementById('file');
    if (file) {
        if (file.value == '') {
            var l = document.getElementById('file-label');
            if (l) alert(l.innerHTML.replace(':', '.'));
            return;
        }
        if (file.files) {
            if (file.files.length) {
                if (file.files.length == 1) {
                    if (file.files[0].size > max_file_size) {
                        alert('This file is too big (' + bytesToSize(file.files[0].size, true) + '), the maximum upload file size is ' + bytesToSize(max_file_size, true) + '.');
                        return;
                    }
                    if (file.files[0].size < min_file_size) {
                        alert('This file is too small (' + bytesToSize(file.files[0].size, true) + '), the minimum upload file size is ' + bytesToSize(min_file_size, true) + '.');
                        return;
                    }
                }
            }
        }
    }

    var url = document.getElementById('url');
    if (url) {
        var url_value = document.getElementById('url').value;
        if (url_value == '' || url_value == 'http://' || url_value == 'https://') {
            var l = document.getElementById('file-label');
            if (l) alert(l.innerHTML.replace(':', '.'));
            return;
        }
        if (!validElement(url)) return;
    }
    var show = document.getElementById('show-option');
    if (show) {
        if (show.checked) {
            if (!validElements('option')) return;
        }
    }

    if (custom_action != '') {
        if (typeof custom_validelements === "function") {
            if (!custom_validelements()) return;
        }
    }

    convert_button = document.getElementById('convert-button');
    progress_status = document.getElementById('progress-status');
    progress_action = document.getElementById('progress-action');

    var source = document.getElementById('source');
    if (!source) {
        return;
    }

    if (!supportAjaxUploadWithProgress() || (source.value == 'url')) {
        convert_button.disabled = true;
        form.submit();
        return;
    }

    uploadClear();
    progress_image = document.createElement('img');
    progress_image.setAttribute('id', 'progress-image');
    progress_image.setAttribute('src', '/img/progressbar.gif');
    progress_image.setAttribute('style', 'height:12px;width:80px;');
    progress_bar = document.getElementById('progress-bar');
    progress_bar.appendChild(progress_image);
    if (progress_action != null) progress_action.innerHTML = '(<a href="#" onclick="cancelUpload();return false;">cancel</a>)';
    if (progress_status != null) progress_status.innerHTML = 'uploading';
    var formData = new FormData(form);
    xhr = new XMLHttpRequest();
    xhr.upload.addEventListener('progress', uploadProgress, false);
    xhr.addEventListener('abort', uploadAbort, false);
    xhr.addEventListener('error', uploadError, false);
    xhr.addEventListener('load', uploadThrough, false);
    xhr.open('POST', sendurl, true);
    xhr.send(formData);
    convert_button.disabled = true;
}

var uploaded = 0, prevUpload = 0, speed = 0, total = 0, remainingBytes = 0, timeRemaining = 0;

function uploadProgress(e) {
    if (xhr == null) { return; }
    if (e.lengthComputable && xhr != null) {
        progress_percent = document.getElementById('progress-percent');
        if (progress_percent == null) {
            if (progress_image != null) {
                progress_bar.removeChild(progress_image);
                progress_image = null;
            }
            progress_banner = document.createElement('div');
            progress_banner.setAttribute('class', 'progress-banner');
            progress_banner.setAttribute('style', 'border-color:#acacac');
            progress_bar.appendChild(progress_banner);
            progress_percent = document.createElement('div');
            progress_percent.setAttribute('id', 'progress-percent');
            progress_percent.setAttribute('class', 'progress-percent');
            progress_banner.appendChild(progress_percent);
        }
        uploaded = e.loaded;
        total = e.total;
        if (e.total > max_file_size) {
            uploadAbort();
            alert('The file must be less than ' + bytesToSize(max_file_size, true));
            return;
        }
        var percentage = Math.round((e.loaded / e.total) * 100);
        if (progress_status != null) progress_status.innerHTML = bytesToSize(e.loaded, false) + '/' + bytesToSize(e.total, false);
        if (progress_percent != null) progress_percent.setAttribute('style', 'width:' + percentage + '%');
    }
}

function needClear() {
    if (progress_percent != null) return true;
    if (progress_banner != null) return true;
    if (progress_image != null) return true;
    if (xhr != null) return true;
    return false;
}

function uploadAbort() {
    var flag = needClear();
    uploadClear();
    if (flag) alert('Upload canceled.');
}

function uploadError() {
    var flag = needClear();
    uploadClear();
    if (flag) alert('Failed to upload.');
}

function uploadClear() {
    if (progress_status != null) progress_status.innerHTML = '';
    if (progress_action != null) progress_action.innerHTML = '';
    if (progress_percent != null) {
        progress_banner.removeChild(progress_percent);
        progress_percent = null;
    }
    if (progress_banner != null) {
        progress_bar.removeChild(progress_banner);
        progress_banner = null;
    }
    if (progress_image != null) {
        progress_bar.removeChild(progress_image);
        progress_image = null;
    }
    if (xhr != null) xhr = null;
    if (convert_button != null) {
        if (convert_button.disabled) {
            convert_button.disabled = false;
        }
    }
    upload_hold = false;
    upload_result_url = '';
}

function uploadThrough() {
    if (xhr == null) { return; }
    if (progress_status != null) progress_status.innerHTML = 'completed';
    if (progress_action != null) progress_action.innerHTML = '';

    var form = document.getElementById('form');
    if (!form) {
        uploadError();
        return;
    }
    var url = '';
    var text = xhr.responseText;
    if ((text.substring(0, 7) === 'http://') || (text.substring(0, 8) === 'https://')) {
        url = text;
    }
    if ((url == null) || (url == form.action) || (url == '')) {
        uploadError();
        return;
    }
    if (upload_hold) {
        upload_result_url = url;
        return;
    }
    window.location = url;
}

function supportAjaxUploadWithProgress() {
    return (window.FormData !== undefined) && supportAjaxUploadProgressEvents();
    function supportAjaxUploadProgressEvents() {
        var x = new XMLHttpRequest();
        return !!(x && ('upload' in x) && ('onprogress' in x.upload));
    };
}

function validElement(input) {
    var flag = true;
    if (input == null) return true;
    if (input.type != 'text' || input.disabled) return true;
    if (!input.value) return true;
    if (input.value == null) return true;
    input.value = input.value.trim();
    if (input.value == '') return true;

    if (input.validity) {
        if (input.validity.valid !== true) flag = false;
    }
    else {
        var pattern = input.getAttribute('pattern');
        if (pattern) {
            if (pattern != '') {
                var regx = new RegExp(pattern);
                if (!regx.test(input.value)) flag = false;
            }
        }
    }

    var id = input.getAttribute('id');
    var id_end = id.substring(id.length - 2);
    if (!flag) {
        var title = input.getAttribute('title');
        var item_id = id + '-item';
        if (id_end == '-1') item_id = id.substring(0, id.length - 2) + '-item';
        if (id_end == '-2') item_id = id.substring(0, id.length - 2) + '-item';
        var item = document.getElementById(item_id);
        if (item) title = item.innerHTML + ' ' + title.toLowerCase();
        alert(title);
        if (input.focus) input.focus();
        if (input.select) input.select();
        return false;
    }

    if (id_end == '-1' || id_end == '-2') {
        var two_value_id = id.substring(0, id.length - 2);
        var item = document.getElementById(two_value_id + '-item');
        if (id_end == '-1') two_value_id = two_value_id + '-2';
        if (id_end == '-2') two_value_id = two_value_id + '-1';
        if (two_value_id != '') {
            var e = document.getElementById(two_value_id);
            if (e) {
                e.value = e.value.trim();
                if (e.value == null || e.value == '') {
                    if (item) alert('Please enter two values for ' + item.innerHTML.toLowerCase().replace(':', '') + '.');
                    else alert('Please enter two values.');
                    return false;
                }
            }
        }
    }

    return true;
}

function validElements(id) {
    var nodes = document.getElementById(id).getElementsByTagName('input');
    for (var i = 0; i < nodes.length; i++) {
        if (!validElement(nodes[i])) return false;
    }
    return true;
}

function setSource() {
    var e = document.getElementById('source');
    if (!e) return;
    if (e.value == 'file') { setFile(); setFileAccept(); }
    else setURL();
}

function setFile() {
    var i = document.getElementById('file-input');
    if (!i) return;
    var e = document.getElementById('url');
    if (e) i.removeChild(e);
    e = document.getElementById('file');
    if (e) return;
    e = document.createElement('input');
    e.setAttribute('id', 'file');
    e.setAttribute('name', 'file');
    e.setAttribute('type', 'file');
    e.setAttribute('class', 'input-file');
    e.setAttribute('value', '');
    e.setAttribute('onclick', 'setFormat()');
    if (custom_setformat != '') e.setAttribute('onclick', custom_setformat);
    i.appendChild(e);
    var l = document.getElementById('file-label');
    if (l) l.innerHTML = 'Select a file to upload and convert:';
    if (l && (custom_action != '')) l.innerHTML = 'Select a file to upload and ' + custom_action + ':';
    var h = document.getElementById('hint');
    if (h) h.innerHTML = '(max file size ' + bytesToSize(max_file_size, true) + ')';
}

function setURL() {
    var i = document.getElementById('file-input');
    if (!i) return;
    var e = document.getElementById('file');
    if (e) i.removeChild(e);
    e = document.getElementById('url');
    if (e) return;
    e = document.createElement('input');
    e.setAttribute('id', 'url');
    e.setAttribute('name', 'url');
    e.setAttribute('type', 'text');
    e.setAttribute('class', 'input-file');
    e.setAttribute('value', 'http://');
    e.setAttribute('maxlength', '100');
    e.setAttribute('pattern', '^(ht|f)tp(s?)\:\/\/[0-9a-zA-Z]([-.\w]*[0-9a-zA-Z])*(:(0-9)*)*(\/?)([a-zA-Z0-9\-\.\?\,\/\+&amp;%\$#_]*)?$');
    e.setAttribute('title', 'Match only http://..., ftp://... or https://...');
    i.appendChild(e);
    var l = document.getElementById('file-label');
    if (l) l.innerHTML = 'Enter URL of the file to convert:';
    if (l && (custom_action != '')) l.innerHTML = 'Enter URL of the file to ' + custom_action + ':';
    var h = document.getElementById('hint');
    if (h) h.innerHTML = '(e.g. http://..., max file size ' + bytesToSize(max_file_size, true) + ')';
    uploadClear();
}

var formatArray = new Array();
var acceptArray = new Array();

function setFormat() {
    var e = document.getElementById('format');
    if (!e) return;
    var f = document.getElementById('from');
    if (!f) return;
    var t = document.getElementById('to');
    if (!t) return;
    var ft = e.value.toLowerCase().split(' to ');
    if (ft.length != 2) return;
    f.value = ft[0].replace(' ', '-');
    t.value = ft[1];
    setFileAccept();
}

function setFileAccept() {
    if (formatArray.length != acceptArray.length) return;
    var e = document.getElementById('file');
    if (!e) return;
    var b = getBrowser();
    if (!b) return;
    var f = document.getElementById('from');
    if (!f) return;
    var a = '';
    if ((f.value != '') && (f.value.length <= 4)) {
        a = '.' + f.value;
    }
    for (var i = 0; i < formatArray.length; i++) {
        if (formatArray[i] == f.value) {
            a = acceptArray[i];
            break;
        }
    }
    if (a == '') return;
    if (e.getAttribute('accept') == a) return;
    b.name = b.name.toLowerCase();
    if ((b.name == 'ie' && b.version >= 10) || (b.name == 'chrome' && b.version >= 16) || (b.name == 'safari' && b.version >= 6) || (b.name == 'firefox' && b.version >= 9) || (b.name == 'opera' && b.version >= 11)) {
        e.setAttribute('accept', a);
    }
    if (e.value && (e.value != '')) {
        var n = e.value.lastIndexOf('.');
        if (n >= 0) {
            var s = e.value.substr(n).toLowerCase();
            if (a.indexOf(s) < 0) e.value = '';
        }
    }
}

function getBrowser() {
    var ua = navigator.userAgent, tem, M = ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];
    if (/trident/i.test(M[1])) {
        tem = /\brv[ :]+(\d+)/g.exec(ua) || [];
        return { name: 'IE', version: (tem[1] || '') };
    }
    if (M[1] === 'Chrome') {
        tem = ua.match(/\bOPR\/(\d+)/)
        if (tem != null) { return { name: 'Opera', version: tem[1] }; }
    }
    M = M[2] ? [M[1], M[2]] : [navigator.appName, navigator.appVersion, '-?'];
    if ((tem = ua.match(/version\/(\d+)/i)) != null) { M.splice(1, 1, tem[1]); }
    return { name: M[0], version: M[1] };
}

function cancelUpload() {
    upload_hold = true;
    if (!confirm('Are you sure you want to stop uploading?')) {
        upload_hold = false;
        var u = upload_result_url;
        if (u != '') {
            window.location = u;
        }
    }
    else {
        upload_hold = false;
        if (xhr != null) xhr.abort();
        uploadAbort();
        uploadClear();
    }
}

var progress_preimage = null;

function preloadimage() {
    progress_preimage = new Image();
    progress_preimage.src = "/img/progressbar.gif";
}

if (progress_preimage == null) preloadimage();