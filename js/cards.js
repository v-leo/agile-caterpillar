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
    initStoryCard();
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
        handle: "div.card-label",
        tolerance: "pointer",
        scroll: true,
        update: function () {
            Caterpillar.Core.updateTaskIndexes();
            Caterpillar.DomService.getStoryPage().ctPrintable("refresh");
            if (Caterpillar.Storage) {
                Caterpillar.Storage.saveOrUpdateStory(Caterpillar.Core.currentStoryToJson());
            }
        }});
}


function initStoryCardToolbar() {
    var buttonSet = Caterpillar.DomService.getCardToolbarButtonSet(Caterpillar.DomService.getStoryCard());
    Caterpillar.DomService.getAddNewToRightButton(buttonSet).button(
        {label: "New",
            icons: {
                secondary: "ui-icon-triangle-1-e"
            }
        }
    ).click(function () {
            Caterpillar.Core.addNewCardIfStoryIdValid(true);
        });

    Caterpillar.DomService.getRemoveStoryButton(buttonSet).button(
        {label: "Remove",
            icons: {
                primary: "ui-icon-trash"
            }
        }).click(function () {
            Caterpillar.Util.confirm(MESSAGE_REMOVE_STORY, TITLE_REMOVE_STORY, Caterpillar.Core.removeCurrentStory);
        });

    Caterpillar.DomService.getColorButton(buttonSet).button(
        {label: "Color",
            icons: {
                primary: "ui-icon-tag"
            }
        }).click(function (event) {
            Caterpillar.ContextMenu.showCardColorContextMenu(event, Caterpillar.DomService.getCardByChild($(this)));
        });

    buttonSet.buttonset();
}

function initStoryCard() {
    var storyCard = Caterpillar.DomService.getStoryCard();

    Caterpillar.Core.makeCardResizable(storyCard);
    initStoryCardToolbar();

    Caterpillar.DomService.getShowDisabledSwitcher().click(function () {
        Caterpillar.Core.setShowDisabledCards(!Caterpillar.DomService.isShowDisabledCards());
    });

    Caterpillar.DomService.getShowTotalInfoSwitcher().click(function () {
        Caterpillar.DomService.showTotalEstimation();
    });

    Caterpillar.DomService.getShowEnabledInfoSwitcher().click(function () {
        Caterpillar.DomService.showEnabledEstimation();
    });


    Caterpillar.DomService.getStoryIdInput().ctEditOnClick({
        value: Caterpillar.Util.defaultStoryId,
        viewTitle: "Create/Open story (Shift+O)",
        converter: function (value) {
            return Caterpillar.Util.checkAndFixStoryIdValue(value.toUpperCase());
        },
        keyValidator: function(event, which) {
            return which < 48 || which == 189 || Caterpillar.Util.isAlphanumeric(String.fromCharCode(which))
        },
        start: function(event, data) {
            var dashIndex = data.element.val().indexOf(Caterpillar.Util.DASH);
            if (dashIndex > -1) {
                data.element[0].setSelectionRange(dashIndex + 1, data.element.val().length);
            }
        },
        create: function() {
            var el = $(this);
            Caterpillar.DomService.getStoryIdValueInput().val(el.ctEditOnClick("option", "value"));
        },
        update: function (event, data) {
            Caterpillar.DomService.getStoryIdValueInput().val(data.newValue);
            Caterpillar.DomService.getStoryIdInput().autocomplete("close");
            if (Caterpillar.Storage) {
                Caterpillar.Storage.updateLastStoryId(data.newValue);
            }
            updateStoryHistory();

            if (data.isUiUpdate) {
                //Caterpillar.Storage.saveOrUpdateStory(Caterpillar.Core.currentStoryToJson());
                Caterpillar.Core.restoreStoryFromStorage(lastStoryId);
            }
        },
        cancel: function (event, data) {
            data.element.ctEditOnClick("refresh");
        }
    });

    Caterpillar.DomService.getCardEtaInput(storyCard).ctEditOnClick({
        selectOnStart: true,
        maxLength: 3,
        value: 0,
        viewTitle: "Story estimation",
        viewClass: "story-eta",
        keyValidator: function (event, which) {
            return (which < 48 && which != 32) || !isNaN(parseInt(String.fromCharCode(which)));
        },
        converter: function (value) {
            value = Caterpillar.Util.checkAndFixNumberValue(value);
            return Caterpillar.Util.estimationToString(value);
        },
        create: function() {
            var el = $(this);
            var card = Caterpillar.DomService.getCardByChild(el);
            Caterpillar.DomService.getCardEtaValueInput(card).val(el.ctEditOnClick("option", "value"));
        },
        beforeStart: function() {
            if (Caterpillar.DomService.getAllCardsNoCondition().length > 0) {
                Caterpillar.Util.alertWarn("You can change story estimation only for empty story.");
                return false;
            }
            return true;
        },
        beforeUpdate: function (event, data) {
            return !data.newValue || !isNaN(parseInt(data.newValue));
        },
        update: function (event, data) {
            var card = Caterpillar.DomService.getCardByChild(data.element);
            Caterpillar.DomService.getCardEtaValueInput(card).val(data.newValue);
            if (data.isUiUpdate && Caterpillar.Storage) {
                Caterpillar.Storage.saveOrUpdateStory(Caterpillar.Core.currentStoryToJson());
            }
        }
    });

    Caterpillar.DomService.getCardDescriptionTextarea(storyCard).ctEditOnClick({
        value: "Story description",
        viewClass: "content-div",
        moveToEndOnStart: true,
        ctrlEnterToFinish: true,
        converter: Caterpillar.Util.descriptionToHtml,
        create: function() {
            var el = $(this);
            var card = Caterpillar.DomService.getCardByChild(el);
            Caterpillar.DomService.getCardDescriptionValueInput(card).val(el.ctEditOnClick("option", "value"));
            Caterpillar.Core.autoFitDescription(card);
        },
        update: function (event, data) {
            var card = Caterpillar.DomService.getCardByChild(data.element);
            Caterpillar.DomService.getCardDescriptionValueInput(card).val(data.newValue);
            Caterpillar.Core.autoFitDescription(card);
            updateStoryHistory();
            if (data.isUiUpdate && Caterpillar.Storage) {
                Caterpillar.Storage.saveOrUpdateStory(Caterpillar.Core.currentStoryToJson());
            }
        }
    });
}

function updateStoryHistory() {
    if (Caterpillar.History) {
        Caterpillar.History.addToStoryHistory(Caterpillar.DomService.getStoryIdValueInput().val(),
            Caterpillar.DomService.getCardDescriptionValueInput(Caterpillar.DomService.getStoryCard()).val());
    }
}


function initHotKeys() {
    if (Caterpillar.HotKeys) {
        Caterpillar.HotKeys.registerHotKey({
            keyCode: 78,
            shiftKey: true,
            callback: Caterpillar.Core.addNewCardIfStoryIdValid,
            condition: Caterpillar.HotKeys.notInputNotTextareaNotOverlay
        });

        Caterpillar.HotKeys.registerHotKey({
            keyCode: 79,
            shiftKey: true,
            callback: function () {
                event.stopPropagation();
                Caterpillar.DomService.getStoryIdInput().ctEditOnClick("startEdit")
            },
            condition: Caterpillar.HotKeys.notInputNotTextareaNotOverlay
        });

        Caterpillar.HotKeys.registerHotKey({
            keyCode: [107, 187],
            shiftKey: true,
            callback: function () {
                Caterpillar.Core.setShowDisabledCards(true);
            },
            condition: Caterpillar.HotKeys.notInputNotTextareaNotOverlay
        });

        Caterpillar.HotKeys.registerHotKey({
            keyCode: [109, 189],
            shiftKey: true,
            callback: function () {
                Caterpillar.Core.setShowDisabledCards(false);
            },
            condition: Caterpillar.HotKeys.notInputNotTextareaNotOverlay
        });
    }
}

/*
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
 */


/*function startEditStoryId() {
    var input = Caterpillar.DomService.getStoryIdInput();
    Caterpillar.DomService.startEditInputOrTextarea(input);
    input.focus();
    var dashIndex = input.val().indexOf(Caterpillar.Util.DASH);
    if (dashIndex > -1) {
        input[0].setSelectionRange(dashIndex + 1, input.val().length);
    }
}*/

/*
function finishEditStoryId(input) {
    Caterpillar.DomService.cancelEditing(input);

    var value = Caterpillar.Util.checkAndFixStoryIdValue(input.val().trim().toUpperCase());
    if (Caterpillar.Storage) {
        Caterpillar.Storage.updateLastStoryId(value);
    }

    Caterpillar.DomService.getCardIdSpan(Caterpillar.DomService.getStoryCard()).html(lastStoryId);
    if (Caterpillar.Storage) {
        Caterpillar.Storage.saveOrUpdateStory(Caterpillar.Core.currentStoryToJson());
    }
    Caterpillar.Core.restoreStoryFromStorage(lastStoryId);
    updateStoryHistory();
}
*/

/* .click(
 function (event) {
 if (!event.ctrlKey && !event.shiftKey) {
 startEditStoryId();
 }
 });*/

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
