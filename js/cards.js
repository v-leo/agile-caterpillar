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

var lastStoryId = Caterpillar.Util.defaultStoryId;
var lastProjectId = Caterpillar.Settings.defaultProjectId;
var lastIssueId = Caterpillar.Settings.defaultIssueId;

var MESSAGE_NULL_STORY_ID = "Please open story or create new one.";
var TITLE_NULL_STORY_ID = "Story id is not defined";
var MESSAGE_REMOVE_STORY = "Story will be permanently deleted and cannot be recovered. Are you sure?";
var TITLE_REMOVE_STORY = "Remove story?";
var MESSAGE_REMOVE_TASKS_ON_DELETE = "All selected tasks will be permanently deleted and cannot be recovered. Are you sure?";
var TITLE_REMOVE_TASKS_ON_DELETE = "Remove tasks?";


$(document).ready(function () {
    initCSS();
    initCardsBehaviour();
    initTasksContainer();
    initHotKeys();

    if (Caterpillar.DomService.isShowDisabledCards()) {
        Caterpillar.DomService.getStoryPage().ctPrintable({items: "li.card-item,div.story-item"});
    } else {
        Caterpillar.DomService.getStoryPage().ctPrintable({items: "li.card-item:not(.disabled-card),div.story-item"});
    }
    Caterpillar.Core.restoreStoryFromStorage();
});

function initCSS() {
    if ($.browser.webkit) {
        var cssStyle = $("<style>");
        cssStyle.attr("type", "text/css");
        cssStyle.html(
            "ol.wiki-list {margin: 0 0 0 1.27em;}\n" +
                ".wiki-list ol.wiki-list {margin: 0 0 0 1.2em;}\n" +
                ".wiki-list .wiki-list ol.wiki-list {margin: 0 0 0 1.2em;}\n" +
                "div.ol-list-container {margin: 0 0 0 -0.3em;}\n" +
                ".wiki-list ol.wiki-list div.ol-list-container {margin: 0 0 0 -0.28em;}\n" +

                "ul.wiki-list {margin: 0 0 0 1.1em;}\n" +
                ".wiki-list ul.wiki-list {margin: 0 0 0 1em;}\n" +
                "div.ul-list-container {margin: 0 0 0 -0.15em;}\n" +
                ".wiki-list ul.wiki-list div.ul-list-container {margin: 0 0 0 -0.08em;}\n" +

                "div.wiki-tab {margin: 0; padding: 0 0 0 0.94em;}\n");

        $("head").append(cssStyle);
    }
}

function initTasksContainer() {
    Caterpillar.DomService.getTasksContainer().sortable({
        items: "li.card-item",
        handle:"div.card-label",
        tolerance:"pointer",
        scroll:true,
        update:function () {
            Caterpillar.Core.updateTaskIndexes();
            Caterpillar.DomService.getStoryPage().ctPrintable("refresh");
            Caterpillar.Storage.saveOrUpdateStory(Caterpillar.Core.currentStoryToJson());
        }});
}


function initCardsBehaviour() {
    var storyCard = Caterpillar.DomService.getStoryCard();

    Caterpillar.Core.makeCardResizable(storyCard);
    initStoryToolbar();

    Caterpillar.DomService.getShowDisabledSwitcher().click(function () {
        Caterpillar.Core.setShowDisabledCards(!Caterpillar.DomService.isShowDisabledCards());
    });

    Caterpillar.DomService.getShowTotalInfoSwitcher().click(function () {
        Caterpillar.DomService.showTotalEstimation();
    });

    Caterpillar.DomService.getShowEnabledInfoSwitcher().click(function () {
        Caterpillar.DomService.showEnabledEstimation();
    });

    Caterpillar.DomService.getCardIdSpan(storyCard).click(
        function (event) {
            if (!event.ctrlKey && !event.shiftKey) {
                startEditStoryId();
            }
        });
//
    /*Caterpillar.DomService.__getAllCardEstimationSpans__().live("click",
        function (event) {
            if (!event.ctrlKey && !event.shiftKey) {
                startEditEstimation($(this));
            }
        });*/

    /*var startPosition = {x:0, y:0};
    var started = false;
    $(document).mouseup(function (e) {
        started = false;
        startPosition = null;
    });*/
    /*Caterpillar.DomService.__getAllCardContentTds__()
        .live("mousedown",
        function (event) {
            if (event.which == 1) {
                if ($(this).hasClass("edit") || event.ctrlKey || event.shiftKey || event.altKey || event.metaKey) {
                    return true;
                } else {
                    startPosition = {x:event.pageX, y:event.pageY};
                    started = true;
                }
            }
        }).live("mouseup",
        function (event) {
            if (event.which == 1 && started && Math.abs(startPosition.x - event.pageX) < 3 &&
                Math.abs(startPosition.y - event.pageY) < 7) {
                startEditCardDescription($(this));
            }
        });*/

    Caterpillar.DomService.getStoryIdInput()
        .keydown(function (event) {
            if (event.which == 13) {
                finishEditStoryId($(this));
                Caterpillar.DomService.getStoryIdInput().autocomplete("close");
                return false;
            } else if (event.which == 27) {
                Caterpillar.DomService.cancelEditing($(this));
                Caterpillar.DomService.getStoryIdInput().autocomplete("close").val(lastStoryId);
            } else {
                return event.which < 48 || event.which == 189 || Caterpillar.Util.isAlphanumeric(String.fromCharCode(event.which));
            }
        })
        .blur(function () {
            Caterpillar.DomService.cancelEditing($(this));
            Caterpillar.DomService.getStoryIdInput().val(lastStoryId);
        });

    /*Caterpillar.DomService.__getAllCardEstimationInputs__()
        .live("keydown", function (event) {
            if (event.which == 13) {
                finishEditEta($(this));
                return false;
            } else if (event.which == 27) {
                Caterpillar.DomService.cancelEditing($(this));
                return false;
            } else {
                return event.which < 48 || Caterpillar.Util.isNumber(String.fromCharCode(event.which));
            }
        })
        .live("blur", function () {
            Caterpillar.DomService.cancelEditing($(this));
        });*/

    /*Caterpillar.DomService.__getAllCardTextareas__()
        .live("keydown", function (event) {
            if (event.which == 13 && event.ctrlKey) {
                finishEditCardDescription($(this));
                return false;
            } else if (event.which == 27) {
                Caterpillar.DomService.cancelEditing($(this));
                return false;
            }
            return true;
        })
        .live("blur", function () {
            Caterpillar.DomService.cancelEditing($(this));
        });*/
}

function initStoryToolbar() {
    var buttonSet = Caterpillar.DomService.getCardToolbarButtonSet(Caterpillar.DomService.getStoryCard());
    Caterpillar.DomService.getAddNewToRightButton(buttonSet).button(
        {label:"New",
            icons:{
                secondary:"ui-icon-triangle-1-e"
            }
        }
    ).click(function () {
            Caterpillar.Core.addNewCardIfStoryIdValid(true);
        });

    Caterpillar.DomService.getRemoveStoryButton(buttonSet).button(
        {label:"Remove",
            icons:{
                primary:"ui-icon-trash"
            }
        }).click(function () {
            Caterpillar.Util.confirm(MESSAGE_REMOVE_STORY, TITLE_REMOVE_STORY, removeCurrentStory);
        });

    Caterpillar.DomService.getColorButton(buttonSet).button(
        {label:"Color",
            icons:{
                primary:"ui-icon-tag"
            }
        }).click(function (event) {
            Caterpillar.ContextMenu.showCardColorContextMenu(event, Caterpillar.DomService.getCardByChild($(this)));
        });

    buttonSet.buttonset();
}

function initHotKeys() {
    if (Caterpillar.HotKeys) {
        Caterpillar.HotKeys.registerHotKey({
            keyCode:78,
            shiftKey:true,
            callback:Caterpillar.Core.addNewCardIfStoryIdValid,
            condition:Caterpillar.HotKeys.notInputNotTextareaNotOverlay
        });

        Caterpillar.HotKeys.registerHotKey({
            keyCode:79,
            shiftKey:true,
            callback:function () {
                event.stopPropagation();
                startEditStoryId();
            },
            condition:Caterpillar.HotKeys.notInputNotTextareaNotOverlay
        });

        Caterpillar.HotKeys.registerHotKey({
            keyCode:[107, 187],
            shiftKey:true,
            callback:function () {
                Caterpillar.Core.setShowDisabledCards(true);
            },
            condition:Caterpillar.HotKeys.notInputNotTextareaNotOverlay
        });

        Caterpillar.HotKeys.registerHotKey({
            keyCode:[109, 189],
            shiftKey:true,
            callback:function () {
                Caterpillar.Core.setShowDisabledCards(false);
            },
            condition:Caterpillar.HotKeys.notInputNotTextareaNotOverlay
        });
    }
}


function updateStoryHistory() {
    if (Caterpillar.History) {
        Caterpillar.History.addToStoryHistory(Caterpillar.DomService.getStoryIdValueInput().val(),
            Caterpillar.DomService.getCardDescriptionValueInput(Caterpillar.DomService.getStoryCard()).val());
    }
}

/*function startEditCardDescription(triggerElement) {
    var card = Caterpillar.DomService.getCardByChild(triggerElement);
    if (card.length) {
        var textarea = Caterpillar.DomService.getCardDescriptionTextarea(card);
        Caterpillar.DomService.startEditInputOrTextarea(textarea);
        var textLength = textarea[0].value.length;
        textarea[0].setSelectionRange(textLength, textLength);
        textarea.scrollTop(textarea[0].scrollHeight);
    }
}*/

/*function startEditEstimation(etaSpan) {
    var card = Caterpillar.DomService.getCardByChild(etaSpan);
    if (Caterpillar.DomService.isStoryCard(card) && Caterpillar.DomService.getAllCardsNoCondition().length > 0) {
        Caterpillar.Util.alertWarn("You can change story estimation only for empty story.");
    } else {
        var input = Caterpillar.DomService.getCardEtaInput(card);
        Caterpillar.DomService.startEditInputOrTextarea(input);
        input.focus();
        input.select();
    }
}*/

function startEditStoryId() {
    var input = Caterpillar.DomService.getStoryIdInput();
    Caterpillar.DomService.startEditInputOrTextarea(input);
    input.focus();
    var dashIndex = input.val().indexOf(Caterpillar.Util.DASH);
    if (dashIndex > -1) {
        input[0].setSelectionRange(dashIndex + 1, input.val().length);
    }
}

function finishEditStoryId(input) {
    Caterpillar.DomService.cancelEditing(input);

    var value = Caterpillar.Util.checkAndFixStoryIdValue(input.val().trim().toUpperCase());
    Caterpillar.Storage.updateLastStoryId(value);

    Caterpillar.DomService.getCardIdSpan(Caterpillar.DomService.getStoryCard()).html(lastStoryId);
    Caterpillar.Storage.saveOrUpdateStory(Caterpillar.Core.currentStoryToJson());
    Caterpillar.Core.restoreStoryFromStorage(lastStoryId);
    updateStoryHistory();
}

/*function finishEditEta(input) {
    Caterpillar.DomService.cancelEditing(input);

    var card = Caterpillar.DomService.getCardByChild(input);

    var inputVal = Caterpillar.Util.checkAndFixNumberValue(input.val());
    var spanText = Caterpillar.Util.estimationToString(inputVal);

    Caterpillar.DomService.getCardEtaSpan(card).html(spanText);
    Caterpillar.DomService.getCardEtaValueInput(card).val(inputVal);

    if (!Caterpillar.DomService.isStoryCard(card)) {
        //noinspection JSCheckFunctionSignatures
        Caterpillar.Core.updateTotalEstimation();
    }

    Caterpillar.Storage.saveOrUpdateStory(Caterpillar.Core.currentStoryToJson());
}*/

/*function finishEditCardDescription(textarea) {
    Caterpillar.DomService.cancelEditing(textarea);
    var card = Caterpillar.DomService.getCardByChild(textarea);

    var div = Caterpillar.DomService.getCardContentDiv(card);
    div.html(Caterpillar.Util.descriptionToHtml(textarea[0].value));

    Caterpillar.Core.autoFitDescription(card);
    Caterpillar.DomService.getCardDescriptionValueInput(card).val(textarea[0].value);

    if (Caterpillar.DomService.isStoryCard(card)) {
        updateStoryHistory();
    }
    Caterpillar.Storage.saveOrUpdateStory(Caterpillar.Core.currentStoryToJson());
}*/

function removeCurrentStory() {
    if (Caterpillar.Util.isNotEmptyIssueId(lastIssueId)) {
        Caterpillar.Storage.deleteStoryFromStorage(lastStoryId);
        if (Caterpillar.History) {
            Caterpillar.History.deleteFromStoryHistory(lastStoryId);
        }
    }

    var newStory = Caterpillar.Util.generateStoryId(lastProjectId, Caterpillar.Settings.defaultIssueId);
    Caterpillar.Core.restoreStoryFromStorage(newStory);
}