var lastStoryId = CardTool.Util.defaultStoryId;
var lastProjectId = CardTool.Util.defaultProjectId;
var lastIssueId = CardTool.Util.defaultIssueId;

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

    if (CardTool.DomService.isShowDisabledCards()) {
        CardTool.DomService.getStoryPage().printable({items: "li.card-item,div.story-item"});
    } else {
        CardTool.DomService.getStoryPage().printable({items: "li.card-item:not(.disabled-card),div.story-item"});
    }
    CardTool.Core.restoreStoryFromStorage();
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
    CardTool.DomService.getTasksContainer().sortable({
        items: "li.card-item",
        handle:"div.card-header",
        tolerance:"pointer",
        scroll:true,
        update:function () {
            CardTool.Core.updateTaskIndexes();
            CardTool.DomService.getStoryPage().printable("refresh");
            CardTool.Storage.updateLocalStorage(CardTool.Core.currentStoryToJson());
        }});
}


function initCardsBehaviour() {
    var storyCard = CardTool.DomService.getStoryCard();

    CardTool.Core.makeCardResizable(storyCard);
    initStoryToolbar();

    CardTool.DomService.getShowDisabledSwitcher().click(function () {
        CardTool.Core.setShowDisabledCards(!CardTool.DomService.isShowDisabledCards());
    });

    CardTool.DomService.getShowTotalInfoSwitcher().click(function () {
        CardTool.DomService.showTotalEstimation();
    });

    CardTool.DomService.getShowEnabledInfoSwitcher().click(function () {
        CardTool.DomService.showEnabledEstimation();
    });

    CardTool.DomService.getCardIdSpan(storyCard).click(
        function (event) {
            if (!event.ctrlKey && !event.shiftKey) {
                startEditStoryId();
            }
        });

    CardTool.DomService.__getAllCardEstimationSpans__().live("click",
        function (event) {
            if (!event.ctrlKey && !event.shiftKey) {
                startEditEstimation($(this));
            }
        });

    var startPosition = {x:0, y:0};
    var started = false;
    $(document).mouseup(function (e) {
        started = false;
        startPosition = null;
    });
    CardTool.DomService.__getAllCardContentTds__()
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
        });

    CardTool.DomService.getStoryIdInput()
        .keydown(function (event) {
            if (event.which == 13) {
                finishEditStoryId($(this));
                CardTool.DomService.getStoryIdInput().autocomplete("close");
                return false;
            } else if (event.which == 27) {
                CardTool.DomService.cancelEditing($(this));
                CardTool.DomService.getStoryIdInput().autocomplete("close").val(lastStoryId);
            } else {
                return event.which < 48 || event.which == 189 || CardTool.Util.isAlphanumeric(String.fromCharCode(event.which));
            }
        })
        .blur(function () {
            CardTool.DomService.cancelEditing($(this));
            CardTool.DomService.getStoryIdInput().val(lastStoryId);
        });

    CardTool.DomService.__getAllCardEstimationInputs__()
        .live("keydown", function (event) {
            if (event.which == 13) {
                finishEditEta($(this));
                return false;
            } else if (event.which == 27) {
                CardTool.DomService.cancelEditing($(this));
                return false;
            } else {
                return event.which < 48 || CardTool.Util.isNumber(String.fromCharCode(event.which));
            }
        })
        .live("blur", function () {
            CardTool.DomService.cancelEditing($(this));
        });

    CardTool.DomService.__getAllCardTextareas__()
        .live("keydown", function (event) {
            if (event.which == 13 && event.ctrlKey) {
                finishEditCardDescription($(this));
                return false;
            } else if (event.which == 27) {
                CardTool.DomService.cancelEditing($(this));
                return false;
            }
            return true;
        })
        .live("blur", function () {
            CardTool.DomService.cancelEditing($(this));
        });
}

function initStoryToolbar() {
    var buttonSet = CardTool.DomService.getCardToolbarButtonSet(CardTool.DomService.getStoryCard());
    CardTool.DomService.getAddNewToRightButton(buttonSet).button(
        {label:"New",
            icons:{
                secondary:"ui-icon-triangle-1-e"
            }
        }
    ).click(function () {
            CardTool.Core.addNewCardIfStoryIdValid(true);
        });

    CardTool.DomService.getRemoveStoryButton(buttonSet).button(
        {label:"Remove",
            icons:{
                primary:"ui-icon-trash"
            }
        }).click(function () {
            CardTool.Util.confirm(MESSAGE_REMOVE_STORY, TITLE_REMOVE_STORY, removeCurrentStory);
        });

    CardTool.DomService.getColorButton(buttonSet).button(
        {label:"Color",
            icons:{
                primary:"ui-icon-tag"
            }
        }).click(function (event) {
            CardTool.ContextMenu.showCardColorContextMenu(event, CardTool.DomService.getCardByChild($(this)));
        });

    buttonSet.buttonset();
}

function initHotKeys() {
    if (CardTool.HotKeys) {
        CardTool.HotKeys.registerHotKey({
            keyCode:78,
            shiftKey:true,
            callback:CardTool.Core.addNewCardIfStoryIdValid,
            condition:CardTool.HotKeys.notInputNotTextareaNotOverlay
        });

        CardTool.HotKeys.registerHotKey({
            keyCode:79,
            shiftKey:true,
            callback:function () {
                event.stopPropagation();
                startEditStoryId();
            },
            condition:CardTool.HotKeys.notInputNotTextareaNotOverlay
        });

        CardTool.HotKeys.registerHotKey({
            keyCode:[107, 187],
            shiftKey:true,
            callback:function () {
                CardTool.Core.setShowDisabledCards(true);
            },
            condition:CardTool.HotKeys.notInputNotTextareaNotOverlay
        });

        CardTool.HotKeys.registerHotKey({
            keyCode:[109, 189],
            shiftKey:true,
            callback:function () {
                CardTool.Core.setShowDisabledCards(false);
            },
            condition:CardTool.HotKeys.notInputNotTextareaNotOverlay
        });
    }
}


function updateStoryHistory() {
    if (CardTool.History) {
        CardTool.History.addToStoryHistory(CardTool.DomService.getStoryIdValueInput().val(),
            CardTool.DomService.getCardDescriptionValueInput(CardTool.DomService.getStoryCard()).val());
    }
}

function startEditCardDescription(triggerElement) {
    var card = CardTool.DomService.getCardByChild(triggerElement);
    if (card.length) {
        var textarea = CardTool.DomService.getCardDescriptionTextarea(card);
        CardTool.DomService.startEditInputOrTextarea(textarea);
        var textLength = textarea[0].value.length;
        textarea[0].setSelectionRange(textLength, textLength);
        textarea.scrollTop(textarea[0].scrollHeight);
    }
}

function startEditEstimation(etaSpan) {
    var card = CardTool.DomService.getCardByChild(etaSpan);
    if (CardTool.DomService.isStoryCard(card) && CardTool.DomService.getAllCardsNoCondition().length > 0) {
        CardTool.Util.alertWarn("You can change story estimation only for empty story.");
    } else {
        var input = CardTool.DomService.getCardEtaInput(card);
        CardTool.DomService.startEditInputOrTextarea(input);
        input.focus();
        input.select();
    }
}

function startEditStoryId() {
    var input = CardTool.DomService.getStoryIdInput();
    CardTool.DomService.startEditInputOrTextarea(input);
    input.focus();
    var dashIndex = input.val().indexOf(CardTool.Util.DASH);
    if (dashIndex > -1) {
        input[0].setSelectionRange(dashIndex + 1, input.val().length);
    }
}

function finishEditStoryId(input) {
    CardTool.DomService.cancelEditing(input);

    var value = CardTool.Util.checkAndFixStoryIdValue(input.val().trim().toUpperCase());
    CardTool.Storage.updateLastStoryId(value);

    CardTool.DomService.getCardIdSpan(CardTool.DomService.getStoryCard()).html(lastStoryId);
    CardTool.Storage.updateLocalStorage(CardTool.Core.currentStoryToJson());
    CardTool.Core.restoreStoryFromStorage(lastStoryId);
    updateStoryHistory();
}

function finishEditEta(input) {
    CardTool.DomService.cancelEditing(input);

    var card = CardTool.DomService.getCardByChild(input);

    var inputVal = CardTool.Util.checkAndFixNumberValue(input.val());
    var spanText = CardTool.Util.estimationToString(inputVal);

    CardTool.DomService.getCardEtaSpan(card).html(spanText);
    CardTool.DomService.getCardEtaValueInput(card).val(inputVal);

    if (!CardTool.DomService.isStoryCard(card)) {
        //noinspection JSCheckFunctionSignatures
        CardTool.Core.updateTotalEstimation();
    }

    CardTool.Storage.updateLocalStorage(CardTool.Core.currentStoryToJson());
}

function finishEditCardDescription(textarea) {
    CardTool.DomService.cancelEditing(textarea);
    var card = CardTool.DomService.getCardByChild(textarea);

    var div = CardTool.DomService.getCardContentDiv(card);
    div.html(CardTool.Util.descriptionToHtml(textarea[0].value));

    CardTool.Core.autoFitDescription(card);
    CardTool.DomService.getCardDescriptionValueInput(card).val(textarea[0].value);

    if (CardTool.DomService.isStoryCard(card)) {
        updateStoryHistory();
    }
    CardTool.Storage.updateLocalStorage(CardTool.Core.currentStoryToJson());
}

function removeCurrentStory() {
    if (CardTool.Util.isNotEmptyIssueId(lastIssueId)) {
        CardTool.Storage.deleteStoryFromStorage(lastStoryId);
        if (CardTool.History) {
            CardTool.History.deleteFromStoryHistory(lastStoryId);
        }
    }

    var newStory = CardTool.Util.generateStoryId(lastProjectId, CardTool.Util.defaultIssueId);
    CardTool.Core.restoreStoryFromStorage(newStory);
}