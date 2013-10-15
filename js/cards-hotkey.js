$(document).ready(function () {
    CardTool.HotKeys.__init__();
});

CardTool.HotKeys = new function () {
    var _this = this;

    //Need for tests
    this.__setThis__ = function (t) {
        _this = t;
    };

    var hotKeyCallbacks = [
        {},
        {},
        {},
        {},
        {},
        {},
        {},
        {}
    ];

    this.__closeContextMenu__ = function () {
        if (CardTool.ContextMenu) {
            CardTool.ContextMenu.closeTaskContextMenu();
        }
    };

    this.notInputNotTextareaNotOverlay = function (event) {
        return !CardTool.DomService.isTargetInputOrTextarea(event) && !CardTool.DomService.isOverlayVisible()
    };

    this.notInputNotTextareaNotOverlayNotContextMenu = function (event) {
        return _this.notInputNotTextareaNotOverlay(event) && !CardTool.DomService.isTargetContextMenu(event);
    };

    this.__init__ = function () {
        $("html").keydown(_this.trigger);
    };

    this.unRegisterHotKey = function (hotKey) {
        var keyCodeArray = (hotKey.keyCode instanceof Array) ? hotKey.keyCode : [hotKey.keyCode];
        var index = getCallbackArrayIndex({
            altKey:hotKey.altKey || false,
            shiftKey:hotKey.shiftKey || false,
            ctrlKey:hotKey.ctrlKey || false
        });
        for (var i = 0; i < keyCodeArray.length; i++) {
            delete hotKeyCallbacks[index]["" + keyCodeArray[i]];
        }
    };

    this.registerHotKey = function (hotKey) {
        if (hotKey.callback) {
            var index = getCallbackArrayIndex({
                altKey:hotKey.altKey || false,
                shiftKey:hotKey.shiftKey || false,
                ctrlKey:hotKey.ctrlKey || false
            });
            var keyCodeArray = (hotKey.keyCode instanceof Array) ? hotKey.keyCode : [hotKey.keyCode];
            for (var i = 0; i < keyCodeArray.length; i++) {
                var key = "" + keyCodeArray[i];
                var callbacks = hotKeyCallbacks[index];
                if (callbacks.hasOwnProperty(key)) {
                    console.log("Hot key is already registered: " +
                        _this.hotKeyToString({
                            keyCode:keyCodeArray[i],
                            altKey:hotKey.altKey,
                            shiftKey:hotKey.shiftKey,
                            ctrlKey:hotKey.ctrlKey}) + ". Callback has been replaced.");
                }
                callbacks[key] = [hotKey.callback, hotKey.condition];
                //console.log("Registered hotkey: " + _this.hotKeyToString({keyCode:keyCodeArray[i], altKey:hotKey.altKey, shiftKey:hotKey.shiftKey, ctrlKey:hotKey.ctrlKey}));
            }
        }
    };

    this.trigger = function (event) {
        var callback = getCallbackByEvent(event);
        if (callback && (!callback[1] || callback[1](event))) {
            _this.__closeContextMenu__();
            callback[0](event);
            return false;
        } else {
            return true;
        }
    };

    this.hotKeyToString = function (hotKey) {
        var str = (hotKey.ctrlKey ? "Ctrl" : "");
        str = str + (str && "+") + (hotKey.altKey ? "Alt" : "");
        str = str + (str && "+") + (hotKey.shiftKey ? "Shift" : "");
        if (hotKey.keyCode > 15 && hotKey.keyCode < 19) {
            return str;
        } else {
            return  str + (str && "+") + keyCodeToString(hotKey.keyCode);
        }
    };

    function getCallbackArrayIndex(hotKey) {
        return (hotKey.ctrlKey && 2) + (hotKey.altKey && 4) + (hotKey.shiftKey && 1);
    }

    function getCallbackByEvent(event) {
        return hotKeyCallbacks[getCallbackArrayIndex(event)]["" + event.which];
    }

    function keyCodeToString(keyCode) {
        if (keyCode > 47 && keyCode < 91) {
            return String.fromCharCode(keyCode).toUpperCase();
        }
        switch (keyCode) {
            case 8:
                return "Backspace";
            case 9:
                return "Tab";
            case 13:
            case 108:
                return "Enter";
            case 16:
                return "Shift";
            case 17:
                return "Ctrl";
            case 18:
                return "Alt";
            case 19:
                return "Pause/Break";
            case 20:
                return "CapsLock";
            case 27:
                return "Esc";
            case 32:
                return "Space";
            case 33:
                return "PgUp";
            case 34:
                return "PgDn";
            case 35:
                return "End";
            case 36:
                return "Home";
            case 37:
                return "Left";
            case 38:
                return "Up";
            case 39:
                return "Right";
            case 40:
                return "Down";
            case 45:
                return "Insert";
            case 46:
                return "Delete";
            case 91:
                return "LeftWin";
            case 92:
                return "RightWin";
            case 93:
                return "Menu";
            case 96:
                return "Num0";
            case 97:
                return "Num1";
            case 98:
                return "Num2";
            case 99:
                return "Num3";
            case 100:
                return "Num4";
            case 101:
                return "Num5";
            case 102:
                return "Num6";
            case 103:
                return "Num7";
            case 104:
                return "Num8";
            case 105:
                return "Num9";
            case 106:
                return "[*]";
            case 107:
                return "[+]";
            case 109:
                return "[-]";
            case 110:
                return "[.]";
            case 111:
                return "[/]";
            case 112:
                return "F1";
            case 113:
                return "F2";
            case 114:
                return "F3";
            case 115:
                return "F4";
            case 116:
                return "F5";
            case 117:
                return "F6";
            case 118:
                return "F7";
            case 119:
                return "F8";
            case 120:
                return "F9";
            case 121:
                return "F10";
            case 122:
                return "F11";
            case 123:
                return "F12";
            case 144:
                return "NumLock";
            case 145:
                return "ScrLock";
            case 186:
                return "[;]";
            case 187:
                return "[=]";
            case 188:
                return "[,]";
            case 189:
                return "[-]";
            case 190:
                return "[.]";
            case 191:
                return "[/]";
            case 192:
                return "[`]";
            case 219:
                return "\"[\"";
            case 220:
                return "[\\]";
            case 221:
                return "\"]\"";
            case 222:
                return "[']";
            default:
                return "Unknown";
        }
    }
};