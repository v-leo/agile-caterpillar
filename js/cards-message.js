/*
 Agile Caterpillar - v0.1
 https://github.com/v-leo/agile-caterpillar

 The MIT License (MIT)

 Copyright (c) 2013 Vladimir Leontyev

 Permission is hereby granted, free of charge, to any person obtaining a copy of
 this software and associated documentation files (the "Software"), to deal in
 the Software without restriction, including without limitation the rights to
 use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 the Software, and to permit persons to whom the Software is furnished to do so,
 subject to the following conditions:

 The above copyright notice and this permission notice shall be included in all
 copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
 FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
 IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
var Caterpillar = Caterpillar || {};

$(document).ready(function () {
    Caterpillar.Message.__initMessageDialogs__();
});

Caterpillar.Message = new function () {
    var _this = this;

    //Need for tests
    this.__setThis__ = function (t) {
        _this = t;
    };

    var CALLBACK_KEY = "callback";
    var CALLBACK_ARGS_KEY = "callback-args";

    this.__getConfirmDialog__ = function() {
        return $("#confirm-dialog");
    };

    this.__getMessageDialog__ = function() {
        return $("#message-dialog");
    };

    this.__initMessageDialogs__ = function() {
        _this.__getConfirmDialog__().dialog({
            autoOpen:false,
            resizable:true,
            minHeight:130,
            minWidth:500,
            modal:true,
            buttons:{
                "Yes":function () {
                    _this.__closeDialogAndRunCallback__(_this.__getConfirmDialog__());
                },
                Cancel:function () {
                    _this.__getConfirmDialog__().dialog("close");
                }
            },
            close:function (event) {
                event.stopPropagation();
            }
        });

        _this.__getMessageDialog__().dialog({
            autoOpen:false,
            resizable:true,
            minHeight:130,
            minWidth:500,
            modal:true,
            buttons:{
                Ok:function () {
                    _this.__closeDialogAndRunCallback__(_this.__getMessageDialog__());
                }
            },
            close:function (event) {
                event.stopPropagation();
            }
        });
    };

    this.__alertCustom__ = function(message, title, type, callback, callbackArgs) {
        var dialog = _this.__getMessageDialog__();
        var iconSpan = dialog.find("span.ui-icon");
        var dialogTitle = "Info";
        if (type) {
            var icon = "ui-icon-info";
            if (type == "error") {
                dialogTitle = "Error";
                icon = "ui-icon-notice";
            } else if (type == "warn") {
                dialogTitle = "Warning";
                icon = "ui-icon-alert";
            }
            iconSpan.attr("class", "ui-icon " + icon);
            iconSpan.css("display", "block");
        } else {
            iconSpan.css("display", "none");
        }

        if (title) {
            dialogTitle = dialogTitle + ": " + title;
        }

        _this.__setCallbackToDialog__(dialog, callback, callbackArgs);

        dialog.dialog("option", "title", dialogTitle);
        dialog.find("span.message").html(message);
        dialog.dialog("open");
    };

    this.__closeDialogAndRunCallback__ = function(dialog) {
        dialog.dialog("close");
        var callback = dialog.data(CALLBACK_KEY);
        if (callback) {
            callback.apply(this, dialog.data(CALLBACK_ARGS_KEY));
        }
    };

    this.__setCallbackToDialog__ = function(dialog, callback, args) {
        dialog.data(CALLBACK_KEY, callback);
        dialog.data(CALLBACK_ARGS_KEY, args);
    };

    this.alertInfo = function(message, title, callback, callbackArgs) {
        _this.__alertCustom__(message, title, "info", callback, callbackArgs);
    };

    this.alertWarn = function(message, title, callback, callbackArgs) {
        _this.__alertCustom__(message, title, "warn", callback, callbackArgs);
    };

    this.alertError = function(message, title, callback, callbackArgs) {
        _this.__alertCustom__(message, title, "error", callback, callbackArgs);
    };

    this.confirm = function(message, title, callback, callbackArgs) {
        var dialog = _this.__getConfirmDialog__();
        var dialogTitle = "Confirm";
        if (title) {
            dialogTitle = title;
        }

        _this.__setCallbackToDialog__(dialog, callback, callbackArgs);

        dialog.parents("div.ui-dialog").find("span.ui-dialog-title").html(dialogTitle);
        dialog.find("span.message").html(message);
        dialog.dialog("open");
    };
};