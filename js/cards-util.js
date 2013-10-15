CardTool.Util = new function () {
    var _this = this;

    //Need for tests
    this.__setThis__ = function (t) {
        _this = t;
    };

    this.defaultProjectId = "CT";
    this.defaultIssueId = "0000";
    this.DASH = "-";
    this.defaultStoryId = this.defaultProjectId + this.DASH + this.defaultIssueId;

    this.ETA_MEASURE = "PEH";
    this.SPIKE = "Spike";


    this.isNotEmptyIssueId = function (issueId) {
        return _this.isNumber(issueId) && !/^0*$/.test(issueId)
    };

    this.isNumber = function (str) {
        return /^[0-9]+$/.test(str);
    };

    this.isAlphabet = function (str) {
        return /^[A-Za-z]+$/.test(str);
    };

    this.isAlphanumeric = function (str) {
        return /^[A-Za-z0-9]+$/.test(str);
    };

    this.checkAndFixNumberValue = function (value) {
        if (_this.isNumber(value)) {
            return value;
        } else {
            return value.split(/[^0-9]+/g).join("");
        }
    };

    this.checkAndFixProjectValue = function (value) {
        if (_this.isAlphabet(value)) {
            return value;
        } else {
            return value.split(/[^A-Za-z]+/g).join("");
        }
    };

    this.escapeHtmlTags = function (str) {
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    };

    this.isValidStoryId = function (storyId) {
        if (/^[A-Za-z]+-0+$/.test(storyId)) {
            return false;
        } else {
            return /^[A-Za-z]+-[0-9]+$/.test(storyId);
        }
    };

    this.checkAndFixStoryIdValue = function (val) {
        if (val) {
            var dashPos = val.indexOf(_this.DASH);
            if (dashPos > -1) {
                var projectId = val.substring(0, dashPos);
                var issueId = val.substring(dashPos + 1);

                projectId = _this.checkAndFixProjectValue(projectId);
                issueId = _this.checkAndFixNumberValue(issueId);

                return _this.generateStoryId(projectId, issueId);
            } else {
                var firstChar = val.substr(0, 1);
                if (_this.isNumber(firstChar)) {
                    return _this.generateStoryId(_this.defaultProjectId, _this.checkAndFixNumberValue(val));
                } else {
                    return _this.generateStoryId(_this.checkAndFixProjectValue(val), _this.defaultIssueId);
                }
            }
        } else {
            return _this.defaultStoryId;
        }
    };

    this.getProjectIdFromStoryId = function (issueId) {
        return issueId.substring(0, issueId.indexOf(_this.DASH));
    };

    this.getIssueIdFromStoryId = function (issueId) {
        return issueId.substring(issueId.lastIndexOf(_this.DASH) + 1);
    };

    this.generateStoryId = function (projectId, issueId) {
        return projectId + _this.DASH + issueId;
    };

    this.estimationToString = function (eta, spikeExist) {
        var res = _this.parseEstimation(eta);
        if (res == null) {
            return _this.SPIKE;
        } else {
            return "" + res + (spikeExist == true ? "+ " : " ") + _this.ETA_MEASURE;
        }
    };

    this.parseEstimation = function (value) {
        var estimation = parseInt(value);
        if (isNaN(estimation)) {
            return null;
        } else {
            return estimation;
        }
    };

    this.addEstimation = function () {
        var result = 0;
        for (var i = 0; i < arguments.length; i++) {
            var next = _this.parseEstimation(arguments[i]);
            result = result + (next == null ? 0 : next);
        }
        return result;
    };

    this.__callFunction__ = function (functionToCall, functionArgs) {
        if (functionToCall) {
            return functionToCall.apply(this, functionArgs);
        }
    };

    this.alertInfo = function (message, title, callback, callbackArgs) {
        if (CardTool.Message) {
            CardTool.Message.alertInfo(message, title, callback, callbackArgs);
        } else {
            alert(message);
            _this.__callFunction__(callback, callbackArgs);
        }
    };

    this.alertWarn = function (message, title, callback, callbackArgs) {
        if (CardTool.Message) {
            CardTool.Message.alertWarn(message, title, callback, callbackArgs);
        } else {
            alert(message);
            _this.__callFunction__(callback, callbackArgs);
        }
    };

    this.alertError = function (message, title, callback, callbackArgs) {
        if (CardTool.Message) {
            CardTool.Message.alertError(message, title, callback, callbackArgs);
        } else {
            alert(message);
            _this.__callFunction__(callback, callbackArgs);
        }
    };

    this.confirm = function (message, title, callback, callbackArgs) {
        if (CardTool.Message) {
            CardTool.Message.confirm(message, title, callback, callbackArgs);
        } else {
            if (confirm(message)) {
                _this.__callFunction__(callback, callbackArgs);
            }
        }
    };

    this.executeWithConfirmations = function (confirmItems, functionToCall, functionArgs) {
        var confirmItem = confirmItems.shift();
        if (confirmItem && confirmItem.condition == true) {
            _this.confirm(confirmItem.message, confirmItem.title, _this.executeWithConfirmations, [confirmItems, functionToCall, functionArgs]);
        } else if (confirmItems.length > 0) {
            _this.executeWithConfirmations(confirmItems, functionToCall, functionArgs);
        } else {
            _this.__callFunction__(functionToCall, functionArgs);
        }
    };

    this.__removeCodeBlocks__ = function (str) {
        return str.replace(/\{code(:\w+=\w+)?\}([\s\S]*?){code\}/g, "");
    };

    this.__parseAndUpdateEstimation__ = function (str, card) {
        var etaBasePattern = new RegExp("(?:^|\\s+)(?:\\W*)(\\d+)(?:\\s*(?:" + _this.ETA_MEASURE + "))(?:\\W*)(?:\\s+|$)", "i");
        if (etaBasePattern.test(str)) {
            var lines = str.split(/\n/g);
            for (var i = 0; i < lines.length; i++) {
                var line = lines[i];
                var etaMatches = etaBasePattern.exec(line);
                while (etaMatches && etaMatches.length > 1) {
                    var eta = parseInt(etaMatches[1]);
                    if (eta > 0) {
                        card.eta = card.eta + eta;
                    }
                    line = line.replace(etaMatches[0], "").trim();
                    etaMatches = etaBasePattern.exec(line);
                }
                lines[i] = line;
            }
            return lines.join("\n");
        } else {
            return str;
        }
    };

    this.__removeIndention__ = function (str) {
        var lineNum = str.split(/\n/g).length;
        if (lineNum > 1) {
            var regexp = /\n>/g;
            var indentNum = str.split(regexp).length;
            if (indentNum == lineNum) {
                str = str.replace(regexp, "\n");
            } else if (indentNum == 1) {
                regexp = /(\n) {4}]/g;
                if (str.split(regexp).length == lineNum) {
                    str = str.replace(regexp, "\n");
                }
            }
        }
        return str.replace(/^>/g, "").trim();
    };

    this.parseStringToJsonStory = function (str, tryParseStoryDescription, tryParseEstimation, skipCodeBlocks) {
        var storyBeginPattern = /^\W*([A-Za-z]+-[0-9]+)\W*/;
        var olSeparator = "\\#(?=[^#])";
        var ulDiscSeparator = "\\*(?=[^\\*])";
        var ulSquareSeparator = "\\-(?=[^\\-])";
        var taskSeparators = [
            "(?:'{3})?\\d+(?:'{3})?\\.(?:'{3})?", "(?:'{3})?\\d+(?:'{3})?\\)(?:'{3})?",
            "(?:'{3})?[A-Z](?:'{3})?\\.(?:'{3})?", "(?:'{3})?[A-Z](?:'{3})?\\)(?:'{3})?",
            "(?:'{3})?[a-z](?:'{3})?\\.(?:'{3})?", "(?:'{3})?[a-z](?:'{3})?\\)(?:'{3})?",
            olSeparator, ulDiscSeparator, ulSquareSeparator
        ];

        var storyString = "";
        var story = {
            eta:0,
            description:""
        };

        var actualSeparator;
        var taskStrings = [];
        var i;
        for (i = 0; i < taskSeparators.length; i++) {
            var regexp = taskSeparators[i];
            taskStrings = str.split(new RegExp("(^|\n)" + regexp, "g"));
            if (taskStrings && taskStrings.length > 1) {
                if (new RegExp("^" + regexp).test(str)) {
                    taskStrings.splice(0, 2);
                } else if (tryParseStoryDescription) {
                    storyString = taskStrings.shift();
                }
                actualSeparator = regexp;
                break;
            }
        }

        if (!actualSeparator) {
            taskStrings = str.split(/\n/g);
            if (tryParseStoryDescription && taskStrings && taskStrings.length > 0 && storyBeginPattern.test(taskStrings[0])) {
                storyString = taskStrings.shift();
            }
        }

        if (storyString) {
            if (storyBeginPattern.test(storyString)) {
                var storyIdMatcher = storyBeginPattern.exec(storyString);
                story.id = storyIdMatcher[1].trim();
                storyString = storyString.replace(storyIdMatcher[0], " ").trim();
            }
            if (tryParseEstimation) {
                storyString = _this.__parseAndUpdateEstimation__(storyString, story);
            }
            if (/\w+/g.test(storyString)) {
                story.description = _this.__removeIndention__(storyString);
            }
        }

        var tasks = [];
        var totalTaskEta = 0;

        for (i = 0; i < taskStrings.length; i++) {
            var taskString = taskStrings[i];
            if (taskString && taskString != "\n") {
                var task = {
                    eta:0,
                    description:""
                };

                if (actualSeparator == olSeparator) {
                    taskString = "#" + taskString;//.replace(/\n#/g, "\n*");
                } else if (actualSeparator == ulDiscSeparator) {
                    taskString = "*" + taskString;
                } else if (actualSeparator == ulSquareSeparator) {
                    taskString = "-" + taskString;
                }

                taskString = taskString.trim();
                if (skipCodeBlocks) {
                    taskString = _this.__removeCodeBlocks__(taskString);
                }
                if (tryParseEstimation) {
                    taskString = _this.__parseAndUpdateEstimation__(taskString, task);
                }
                task.description = _this.__removeIndention__(taskString);

                totalTaskEta = totalTaskEta + task.eta;
                tasks.push(task);
            }
        }

        if (story.eta < 1) {
            story.eta = totalTaskEta;
        }
        story.tasks = tasks;

        return story;
    };

    this.descriptionToHtml = function (description) {
        if (CardTool.WikiConverter) {
            return CardTool.WikiConverter.wikiToHtml(description);
        } else {
            return "<p>" + _this.escapeHtmlTags(description).replace(/\n/g, "<br/>") + "</p>";
        }
    };

    this.setInputSelection = function (field, start, end) {
        if (field.createTextRange) {
            var selRange = field.createTextRange();
            selRange.collapse(true);
            selRange.moveStart('character', start);
            selRange.moveEnd('character', end);
            selRange.select();
        } else if (field.setSelectionRange) {
            field.setSelectionRange(start, end);
        } else if (field.selectionStart) {
            field.selectionStart = start;
            field.selectionEnd = end;
        }
    };

    this.scrollToElement = function (element) {
        var win = $(window);
        var top = element.position().top;
        //noinspection JSValidateTypes
        var windowTop = win.scrollTop();
        var bottom = top + element.height();
        var windowBottom = win.height() + windowTop;

        if (top < windowTop) {
            //noinspection JSValidateTypes
            win.scrollTop(top);
        } else if (top != windowTop && bottom > windowBottom) {
            //noinspection JSValidateTypes
            win.scrollTop(windowTop + bottom - windowBottom);
        }
    };

    this.extend = function (Child, Parent) {
        var Proto = function () {
        };
        Proto.prototype = Parent.prototype;
        Child.prototype = new Proto();
        Child.prototype.constructor = Child;
        Child.superclass = Parent.prototype;
    };
};