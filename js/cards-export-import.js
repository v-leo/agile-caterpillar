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
    Caterpillar.ExpImp.__initExportImportDialogs__();
    Caterpillar.ExpImp.__initHotKeys__();
});

Caterpillar.ExpImp = new function () {
    var _this = this;

    //Need for tests
    this.__setThis__ = function (t) {
        _this = t;
    };

    var exportHolder = {};
    var MESSAGE_REMOVE_TASKS = "All existed tasks for imported stories will be permanently deleted and cannot be recovered. Are you sure?";
    var TITLE_REMOVE_TASKS = "Remove tasks?";

    var ADD_ACTION = {
        APPEND:"append",
        PREPEND:"prepend",
        REPLACE:"replace",
        APPEND_AFTER:"append-after"
    };

    var FORMAT = {
        JSON:"json",
        WIKI:"wiki",
        TEXT:"text"
    };

    this.__getExportDialog__ = function () {
        return $("#dialog-export");
    };

    this.__getExportTextarea__ = function () {
        return _this.__getExportDialog__().find(">textarea.export-text");
    };

    this.__getExportFormat__ = function () {
        return _this.__getExportDialog__().find("input[name='exportFormat']:checked");
    };

    this.__getExportRange__ = function () {
        return _this.__getExportDialog__().find("input[name='exportRange']:checked");
    };

    this.__getImportDialog__ = function () {
        return $("#dialog-import");
    };

    this.__getImportTextarea__ = function () {
        return _this.__getImportDialog__().find(">textarea.import-text");
    };

    this.__getImportFormat__ = function () {
        return _this.__getImportDialog__().find("input[name='importFormat']:checked");
    };

    this.__getImportRule__ = function () {
        return _this.__getImportDialog__().find("input[name='importRule']:checked");
    };

    this.__getImportAppendAfterInput__ = function () {
        return _this.__getImportDialog__().find("#append-after-input");
    };

    this.__initHotKeys__ = function() {
        if (Caterpillar.HotKeys) {
            Caterpillar.HotKeys.registerHotKey({
                keyCode: 69,
                shiftKey: true,
                callback: _this.openExportDialog,
                condition: Caterpillar.HotKeys.notInputNotTextareaNotOverlay
            });

            Caterpillar.HotKeys.registerHotKey({
                keyCode: 73,
                shiftKey: true,
                callback: _this.openImportDialog,
                condition: Caterpillar.HotKeys.notInputNotTextareaNotOverlay
            });
        }
    };

    this.__initExportImportDialogs__ = function () {
        var exportDialog = _this.__getExportDialog__();
        exportDialog.find(".export-format-button-set").buttonset().disableSelection();
        exportDialog.find(".export-range-button-set").buttonset().disableSelection();

        exportDialog.dialog({
            autoOpen:false,
            resizable:false,
            height:450,
            width:650,
            modal:true,
            buttons:{
                Ok:function () {
                    $(this).dialog("close");
                }
            },
            close:function (event) {
                event.stopPropagation();
                _this.__getExportTextarea__().val("");
                exportHolder = {};
            }
        });

        exportDialog.find("input[name=exportFormat], input[name=exportRange]").change(function () {
            _this.__updateExportText__();
            _this.__getExportTextarea__().focus();
        });

        var importDialog = _this.__getImportDialog__();
        importDialog.find(".import-format-button-set").buttonset().disableSelection();
        importDialog.find(".import-rule-button-set").buttonset().disableSelection();
        _this.__getImportAppendAfterInput__().prop('disabled', true).addClass("ui-state-disabled");

        importDialog.dialog({
            autoOpen:false,
            resizable:false,
            height:450,
            width:650,
            modal:true,
            buttons:{
                "Import":function () {
                    _this.onImportTasksStories();
                },
                Cancel:function () {
                    $(this).dialog("close");
                }
            },
            close:function (event) {
                event.stopPropagation();
            }
        });

        importDialog.find("input[name=importFormat], input[name=importRule]").change(function () {
            _this.__getImportTextarea__().focus();
        });

        importDialog.find("input[name=importRule]").change(function () {
            var input = _this.__getImportAppendAfterInput__();
            if ($("#import-rule-append-after").is(":checked") == true) {
                input.prop('disabled', false).removeClass("ui-state-disabled");
                _this.__getImportAppendAfterInput__().val(Caterpillar.DomService.getAllCardsNoCondition().length);
                input.focus();
                Caterpillar.Util.setInputSelection(input[0], 0, input.val().length);
            } else {
                input.prop('disabled', true).addClass("ui-state-disabled");
            }
        });

        $("#append-after-input").keydown(function (event) {
            if (event.which == 13 || event.which == 108) {
                _this.__getImportDialog__().parents(".ui-dialog").find(".ui-dialog-buttonpane button:first-child").focus();
                return false;
            } else {
                return event.which < 48 || Caterpillar.Util.isNumber(String.fromCharCode(event.which));
            }
        });

        importDialog.find(">textarea.import-text").keydown(function (event) {
            if ((event.which == 13 || event.which == 108) && event.ctrlKey) {
                _this.__getImportDialog__().parents(".ui-dialog").find(".ui-dialog-buttonpane button:first-child").click();
            }
        });


        var buttonSet = Caterpillar.DomService.getCardToolbarButtonSet(Caterpillar.DomService.getStoryCard());
        var importButton = $('<button class="import" title="Import stories or tasks (Shift+I)">Imp</button>');
        buttonSet.prepend(importButton);
        importButton.button(
            {label:"Imp",
                icons:{
                    primary:"ui-icon-arrowreturnthick-1-s"
                }
            }).click(function () {
                Caterpillar.ExpImp.openImportDialog();
            });

        var exportButton = $('<button class="export" title="Export story to wiki/text/json (Shift+E)">Exp</button>');
        buttonSet.prepend(exportButton);
        exportButton.button(
            {label:"Exp",
                icons:{
                    primary:"ui-icon-arrowreturnthick-1-n"
                }
            }).click(function () {
                Caterpillar.ExpImp.openExportDialog();
            });
    };

    this.__updateExportText__ = function () {
        var exportFormat = _this.__getExportFormat__().val();
        var range = _this.__getExportRange__().val();
        var text = "";

        if (range == "all") {
            if (!exportHolder.jsonAll) {
                var stories = Caterpillar.Storage.getAllStoriesFromStorage();
                exportHolder.jsonAll = stories;
                exportHolder.jsonAllStr = JSON.stringify(stories)
                    .replace(/\]\},\{/g, "]},\n\n{")
                    .replace(/^\[\{/g, "[\n{")
                    .replace(/\}\]$/g, "}\n]");
            }
            text = exportHolder.jsonAllStr;
        } else {
            if (!exportHolder.json) {
                exportHolder.json = Caterpillar.Core.currentStoryToJson();
                exportHolder.jsonStr = JSON.stringify(exportHolder.json);
            }
            text = exportHolder.jsonStr;
        }

        if (exportFormat == FORMAT.WIKI || (!Caterpillar.WikiConverter && exportFormat == FORMAT.TEXT)) {
            if (range == "all") {
                if (!exportHolder.wikiAll) {
                    exportHolder.wikiAll = _this.__generateExportWiki__(exportHolder.jsonAll, false);
                }
                text = exportHolder.wikiAll;
            } else {
                if (!exportHolder.wiki) {
                    exportHolder.wiki = _this.__generateExportWiki__([exportHolder.json], false);
                }
                text = exportHolder.wiki;
            }
        } else if (exportFormat == FORMAT.TEXT) {
            if (range == "all") {
                if (!exportHolder.textAll) {
                    exportHolder.textAll = _this.__generateExportText__(exportHolder.jsonAll, false);
                }
                text = exportHolder.textAll;

            } else {
                if (!exportHolder.text) {
                    exportHolder.text = _this.__generateExportText__([exportHolder.json], false);
                }
                text = exportHolder.text;
            }
        }

        _this.__getExportTextarea__().val(text);
    };

    this.__generateExportWiki__ = function (stories, excludeDisabled) {
        var resultText = "";
        for (var j = 0; j < stories.length; j++) {
            var story = stories[j];
            var text = "";
            var header = "'''" + story.id + " - " + Caterpillar.Util.estimationToString(story.eta) + "'''\n" +
                story.description.replace(/\s+$/g, "").replace(/(^|\n)/g, "$1>") + "\n";
            var tasks = story.tasks;
            for (var i = 0; i < tasks.length; i++) {
                var card = tasks[i];
                if (!excludeDisabled || !card.disabled) {
                    var cardDescription = card.description.replace(/^([#\*\-]|(('{3}?)(\d+|[a-zA-Z])('{3}?)[\.\)]('{3}?)))/g, "\n$1").replace(/\s+$/g, "");
                    if (cardDescription) {
                        cardDescription = cardDescription.replace(/\n/g, "\n>") + "\n>";
                    }
                    text = text + "'''" + (i + 1) + ".''' " + cardDescription + "'''" + Caterpillar.Util.estimationToString(card.eta) + "'''\n";
                }
            }
            resultText = resultText + header + text + "\n--------------------------------------------------\n";
        }
        return resultText.replace(/\s*-+\s*$/g, "");
    };

    this.__generateExportText__ = function (stories, excludeDisabled) {
        var resultText = "";
        var indent = "    ";
        for (var j = 0; j < stories.length; j++) {
            var story = stories[j];
            var text = "";
            var header = story.id + " - " + Caterpillar.Util.estimationToString(story.eta) + "\n" +
                _this.__addIndentIfNecessary__(Caterpillar.WikiConverter.wikiToText(story.description), indent).replace(/\s+$/g, "") + "\n";
            var tasks = story.tasks;
            for (var i = 0; i < tasks.length; i++) {
                var card = tasks[i];
                if (!excludeDisabled || !card.disabled) {
                    var cardDescription =
                        _this.__addIndentIfNecessary__(Caterpillar.WikiConverter.wikiToText(card.description)
                            .replace(/^(((\d+|[a-zA-Z])[\.\)])|\-)/g, "\n$1"), indent)
                            .replace(/\s+$/g, "");
                    if (cardDescription) {
                        cardDescription = cardDescription + "\n  ";
                    }
                    text = text + (i + 1) + ". " + cardDescription + Caterpillar.Util.estimationToString(card.eta) + "\n";
                }
            }
            resultText = resultText + header + text + "\n--------------------------------------------------\n";
        }
        return resultText.replace(/\s*-+\s*$/g, "");
    };

    this.__addIndentIfNecessary__ = function (str, indent) {
        if (/\n\d+[\.\)]/g.test(str)) {
            return str.replace(/\n/g, "\n" + indent);
        } else {
            return str;
        }
    };

    this.__importStory__ = function (story, taskAddRule, appendAfterIndex) {
        if (story) {
            var existedStory = Caterpillar.Storage.getStoryFromStorage(story.id);
            if (existedStory) {
                if (story.description) {
                    existedStory.description = story.description;
                }
                var existedTasks = existedStory.tasks;
                if (taskAddRule == ADD_ACTION.PREPEND || (taskAddRule == ADD_ACTION.APPEND_AFTER && !appendAfterIndex)) {
                    existedStory.tasks = story.tasks.concat(existedTasks);
                    existedStory.eta = Caterpillar.Util.addEstimation(existedStory.eta, story.eta);
                } else if (taskAddRule == ADD_ACTION.APPEND || (taskAddRule == ADD_ACTION.APPEND_AFTER && appendAfterIndex >= existedTasks.length)) {
                    existedStory.tasks = existedTasks.concat(story.tasks);
                    existedStory.eta = Caterpillar.Util.addEstimation(existedStory.eta, story.eta);
                } else if (taskAddRule == ADD_ACTION.APPEND_AFTER) {
                    Array.prototype.splice.apply(existedStory.tasks, [appendAfterIndex, 0].concat(story.tasks));
                    existedStory.eta = Caterpillar.Util.addEstimation(existedStory.eta, story.eta);
                } else {
                    existedStory.tasks = story.tasks;
                    existedStory.eta = story.eta;
                }
            } else {
                existedStory = story;
            }
            if (Caterpillar.Storage) {
                Caterpillar.Storage.saveOrUpdateStory(existedStory);
            }

            if (Caterpillar.History) {
                Caterpillar.History.addToStoryHistory(existedStory.id, existedStory.description);
            }
        }
    };

    this.__parseJsonToCards__ = function (jsonString) {
        var json = {};
        if (!/^\[\[/g.test(jsonString)) {
            jsonString = "[" + jsonString + "]";
        }
        try {
            json = JSON.parse(jsonString);
            return json;
        } catch (err) {
            Caterpillar.Util.alertError("Wrong json: " + err.message);
            return null;
        }
    };

    this.__parseStringToJsonStories__ = function (text) {
        var storyLines = text.split(/(\n|^)\s*-{4,}\s*(\n|$)/g);
        var stories = [];
        for (var i = 0; i < storyLines.length; i++) {
            var line = storyLines[i].trim();
            if (line.length > 0) {
                var story = Caterpillar.Util.parseStringToJsonStory(line, true, true, true);
                stories.push(story);
            }
        }
        return stories;
    };

    this.__importStories__ = function (stories, taskAddRule, appendAfterIndex, updateCurrentStory) {
        var importedStories = [];
        for (var i = 0; i < stories.length; i++) {
            var story = stories[i];
            _this.__importStory__(story, taskAddRule, appendAfterIndex);
            importedStories.push(story.id + "(" + story.tasks.length + " tasks)");
        }

        if (stories.length > 0 && updateCurrentStory == true) {
            Caterpillar.Core.refreshCurrentStory();
        }

        Caterpillar.Util.alertInfo(stories.length + " stories have been imported: " + importedStories.toString());
        _this.__getImportDialog__().dialog("close");
        _this.__getImportTextarea__().val("");
    };

    this.__validateAndImportStories__ = function (stories, taskAddRule, appendAfterIndex) {
        var storiesToImport = [];
        var unknownStoriesCount = 0;
        var updateCurrentStory = false;
        var repeatedStoriesCount = 0;

        if (stories && stories.length > 0) {
            var firstStory = stories[0];
            var currentStoryId = Caterpillar.DomService.getStoryIdValueInput().val().toUpperCase();
            if (stories.length == 1 && (!firstStory.id || firstStory.id.toUpperCase() == currentStoryId)) {
                firstStory.id = currentStoryId;
                storiesToImport = stories;
                updateCurrentStory = true;
            } else {
                var storyMap = {};
                for (var i = 0; i < stories.length; i++) {
                    var story = stories[i];
                    if (Caterpillar.Util.isValidStoryId(story.id)) {
                        storiesToImport.push(story);
                        var storyId = story.id.toUpperCase();
                        if (storyId == currentStoryId) {
                            updateCurrentStory = true;
                        }

                        var count = storyMap[storyId];
                        if (count) {
                            storyMap[storyId] = count + 1;
                            repeatedStoriesCount = repeatedStoriesCount + 1
                        } else {
                            storyMap[storyId] = 1;
                        }
                    } else {
                        unknownStoriesCount = unknownStoriesCount + 1;
                    }
                }
            }
        }

        if (storiesToImport.length > 0) {
            var confirmations = [];
            confirmations.push({
                condition:unknownStoriesCount > 0,
                message:unknownStoriesCount + " of " + stories.length +
                    " stories have empty or invalid story id, they well be skipped. Continue?",
                title:"Continue?"
            });
            confirmations.push({
                condition:repeatedStoriesCount > 0,
                message:repeatedStoriesCount + " of " + storiesToImport.length +
                    " stories have repeated story id. Continue?",
                title:"Continue?"
            });
            confirmations.push({
                condition:taskAddRule == "replace",
                message:MESSAGE_REMOVE_TASKS,
                title:TITLE_REMOVE_TASKS
            });

            Caterpillar.Util.executeWithConfirmations(confirmations, _this.__importStories__,
                [storiesToImport, taskAddRule, appendAfterIndex, updateCurrentStory])
        } else if (unknownStoriesCount > 0) {
            Caterpillar.Util.alertInfo(unknownStoriesCount + " of " + unknownStoriesCount +
                " stories have empty or invalid story id. There is nothing to import.");
            _this.__getImportTextarea__().focus();
        }
    };

    this.onImportTasksStories = function () {
        var text = _this.__getImportTextarea__().val().trim();

        if (text) {
            var importFormat = _this.__getImportFormat__().val();
            var importRule = _this.__getImportRule__().val();
            var appendAfterIndex = _this.__getImportAppendAfterInput__().val();

            var stories = [];
            if (importFormat == FORMAT.JSON) {
                stories = _this.__parseJsonToCards__(text);
            } else {
                stories = _this.__parseStringToJsonStories__(text);
            }

            _this.__validateAndImportStories__(stories, importRule, appendAfterIndex);
        } else {
            Caterpillar.Util.alertWarn("No stories/tasks to import.");
            _this.__getImportTextarea__().focus();
        }
    };

    this.openImportDialog = function () {
        var importDialog = _this.__getImportDialog__();
        if (!importDialog.dialog("isOpen")) {
            if (Caterpillar.ContextMenu) {
                Caterpillar.ContextMenu.closeTaskContextMenu();
            }

            importDialog.dialog("open");
            _this.__getImportTextarea__().focus();
        }
    };

    this.openExportDialog = function () {
        var exportDialog = _this.__getExportDialog__();
        if (!exportDialog.dialog("isOpen")) {
            if (Caterpillar.ContextMenu) {
                Caterpillar.ContextMenu.closeTaskContextMenu();
            }

            $("#export-range-current").attr("checked", true);
            exportDialog.find(".export-range-button-set input").button("refresh");

            _this.__updateExportText__();
            exportDialog.dialog("open");
            _this.__getExportTextarea__().focus();
        }
    };
};