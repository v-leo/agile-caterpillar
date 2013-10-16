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

(function ($, undefined) {
    $.widget("ct.ctEditOnClick", {
        options: {
            value: undefined,
            maxLength: undefined,
            viewClass: undefined,
            viewTitle: "Click to edit",

            ctrlEnterToFinish: false,
            selectOnStart: false,
            moveToEndOnStart: false,
            stopOnBlur: true,

            converter: undefined,
            keyValidator: undefined,

            //callbacks
            beforeStart: undefined,
            start: undefined,
            beforeUpdate: undefined,
            update: undefined,
            cancel: undefined
        },

        _inputView: null,

        _create: function () {
            var self = this;
            if (this.options.value === undefined) {
                this.options.value = this.element.val();
            }

            this._inputView = $('<div class="ct-editable-view"></div>').insertBefore(this.element);
            this._updateViewTitle(this.options.viewTitle);
            this._updateViewClass(this.options.viewClass);
            //this._hoverable(this._inputView);

            this.element.addClass("ct-editable-input");

            this.element.bind('keydown.' + this.widgetName, function (event) {
                if ((event.which === 13 || event.which === 108) && (!self.options.ctrlEnterToFinish || event.ctrlKey)) {
                    self._stopEdit(false);
                    self._updateValue(self.element.val());
                    return false;
                } else if (event.which === 27) {
                    self._stopEdit(true);
                    return false;
                } else if ($.isFunction(self.options.keyValidator)) {
                    return self.options.keyValidator.apply(self.element[0], [event, event.which]);
                } else {
                    return true;
                }
            });

            if (this.options.stopOnBlur === true) {
                this.element.bind('blur.' + this.widgetName, function () {
                    self._stopEdit(true);
                });
            }

            var startPosition = {x: 0, y: 0},
                started = false;
            this._inputView.mousedown(function (event) {
                if (event.which === 1 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) {
                    startPosition = {x: event.pageX, y: event.pageY};
                    started = true;
                }
            }).mouseup(function (event) {
                    if (started && event.which === 1 && Math.abs(startPosition.x - event.pageX) < 7 &&
                        Math.abs(startPosition.y - event.pageY) < 7) {
                        self.startEdit();
                    }
                });

            this._checkAndUpdateFuncOption("keyValidator", this.options.keyValidator);
            this._checkAndUpdateFuncOption("converter", this.options.converter);
            this._checkAndUpdateFuncOption("beforeStart", this.options.beforeStart);
            this._checkAndUpdateFuncOption("start", this.options.start);
            this._checkAndUpdateFuncOption("beforeUpdate", this.options.beforeUpdate);
            this._checkAndUpdateFuncOption("update", this.options.update);
            this._checkAndUpdateFuncOption("cancel", this.options.cancel);

            this._updateMaxLength(this.options.maxLength);
            this._updateValue(this.options.value, true, true);
        },

        _destroy: function () {
            this._inputView.remove();
            this.element.unbind('.' + this.widgetName);
            this.element.removeClass("ct-editable-input ct-editable-edit");
        },

        _updateMaxLength: function (maxLength) {
            var val = parseInt(maxLength);
            if (isNaN(val) || val < 0) {
                this.element.removeAttr("maxLength");
                return undefined;
            } else {
                this.element.attr("maxLength", val);
                return val;
            }
        },

        _updateViewClass: function (value) {
            if (this.options.viewClass) {
                this._inputView.removeClass(this.options.viewClass);
            }
            if (typeof value === "string") {
                this._inputView.addClass(value);
                return value;
            } else {
                if (value !== undefined && value !== null) {
                    console.warn("Unsupported value type for option 'viewClass'. Should be string, but got: " + $.type(value));
                }
                return "";
            }
        },

        _updateValue: function (value, explicitUpdate, initialUpdate) {
            var type = typeof value,
                oldValue = this.options.value;
            if (type !== "string" && type !== "number") {
                console.warn("Unsupported value type for option 'value'. Should be string or number, but got: " + $.type(value));
                value = "";
            }

            if (initialUpdate !== true) {
                if (oldValue === value) {
                    return;
                }

                if (false === this._trigger("beforeUpdate", null, {
                    element: this.element,
                    newValue: value,
                    oldValue: oldValue,
                    isUiUpdate: !explicitUpdate
                })) {
                    return;
                }
            }

            this.options.value = value;
            this.element.val(this.options.value);

            if ($.isFunction(this.options.converter)) {
                this._inputView.html(this.options.converter.apply(this.element[0], [this.options.value]));
            } else {
                this._inputView.text(this.options.value);
            }
            if (initialUpdate !== true) {
                this._trigger("update", null, {
                    element: this.element,
                    newValue: this.options.value,
                    oldValue: oldValue,
                    isUiUpdate: !explicitUpdate
                });
            }
        },

        _checkAndUpdateFuncOption: function (key, value) {
            if ($.isFunction(value) || value === null || value === undefined) {
                this.options[key] = value;
                return value;
            } else {
                console.warn("Unsupported value type for option '" + key + "'. Should be function, but got: " + $.type(value));
                this.options[key] = null;
                return null;
            }
        },

        _updateConverter: function (converter) {
            var result = this._checkAndUpdateFuncOption("converter", converter);
            this._updateValue(this.options.value, true, true);
            return result;
        },

        _updateViewTitle: function (value) {
            if (value && typeof value === "string") {
                this._inputView.attr("title", value);
                return value;
            } else {
                this._inputView.removeAttr("title");
                return "";
            }
        },

        _setOption: function (key, value) {
            if (value === undefined) {
                return this.options[key];
            }
            switch (key) {
                case "maxLength":
                    value = this._updateMaxLength(value);
                    break;
                case "value":
                    value = this._updateValue(value, true);
                    break;
                case "converter":
                    value = this._updateConverter(value);
                    break;
                case "viewTitle":
                    value = this._updateViewTitle(value);
                    break;
                case "beforeStart":
                case "start":
                case "beforeUpdate":
                case "update":
                case "cancel":
                case "keyValidator":
                    value = this._checkAndUpdateFuncOption(key, value);
                    break;
                case "viewClass":
                    value = this._updateViewClass(value);
                    break;
            }
            this._super("_setOption", key, value);
        },

        _stopEdit: function (cancelFlag) {
            this.element.removeClass("ct-editable-edit");
            this._inputView.removeClass("ct-editable-edit");
            if (cancelFlag === true) {
                this._trigger("cancel", null, {element: this.element});
            }
        },

        refresh: function () {
            this._updateValue(this.options.value, true, true);
        },

        stopEdit: function () {
            this._stopEdit(true);
        },

        startEdit: function () {
            if (false === this._trigger("beforeStart", null, {element: this.element})) {
                return;
            }
            this.element.addClass("ct-editable-edit");
            this._inputView.addClass("ct-editable-edit");
            this.element.focus();
            if (this.options.selectOnStart === true) {
                this.element.select();
            } else if (this.options.moveToEndOnStart === true) {
                var textLength = this.element[0].value.length;
                this.element[0].setSelectionRange(textLength, textLength);
                this.element.scrollTop(this.element[0].scrollHeight);
            }
            this._trigger("start", null, {element: this.element})
        },

        value: function () {
            return this.options.value;
        }
    });
})(jQuery);