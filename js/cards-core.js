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

Caterpillar.Core = new function () {
    var _this = this;

    //Need for tests
    this.__setThis__ = function (t) {
        _this = t;
    };

    this.MIN_CARD_WIDTH = 366;
    this.MAX_CARD_WIDTH = 746;

    this.addNewCard = function (updateStorageFlag, position, beforeFlag) {
        var cardTemplate = Caterpillar.DomService.getTaskCardTemplate().clone();
        cardTemplate.removeAttr("id");

        if (Caterpillar.Selecting) {
            Caterpillar.Selecting.unSelectCards(cardTemplate);
            Caterpillar.Selecting.unSelectLastSelectedCard(cardTemplate);
        }

        if (position && position.length > 0) {
            if (beforeFlag) {
                position.before(cardTemplate);
            } else {
                position.after(cardTemplate);
            }
            _this.updateTaskIndexes();
        } else {
            var taskIndex = Caterpillar.DomService.getAllCardsNoCondition().length + 1;
            Caterpillar.DomService.getTasksContainer().append(cardTemplate);
            _this.updateTaskIndex(lastStoryId, cardTemplate, taskIndex);
            //noinspection JSValidateTypes
            $(window).scrollTop($(document).height());
        }
        Caterpillar.DomService.getStoryPage().ctPrintable("refresh");

        //init card estimation input
        Caterpillar.DomService.getCardEtaInput(cardTemplate).ctEditOnClick({
            selectOnStart: true,
            maxLength: 2,
            value: 0,
            keyValidator: function (event, which) {
                return (which < 48 && which != 32) || !isNaN(parseInt(String.fromCharCode(which)));
            },
            converter: function (value) {
                value = Caterpillar.Util.checkAndFixNumberValue(value);
                return Caterpillar.Util.estimationToString(value);
            },
            beforeUpdate: function (event, el, value) {
                return !value || !isNaN(parseInt(value));
            },
            update: function (event, el, value) {
                var card = Caterpillar.DomService.getCardByChild($(el));
                Caterpillar.DomService.getCardEtaValueInput(card).val(value);
                Caterpillar.Core.updateTotalEstimation();
                if (Caterpillar.Storage) {
                    Caterpillar.Storage.saveOrUpdateStory(Caterpillar.Core.currentStoryToJson());
                }
            }
        });

        //init card description textarea
        Caterpillar.DomService.getCardDescriptionTextarea(cardTemplate).ctEditOnClick({
            value: "Task description",
            viewClass: "content-div",
            moveToEndOnStart: true,
            ctrlEnterToFinish: true,
            converter: Caterpillar.Util.descriptionToHtml,
            update: function (event, el, value) {
                var card = Caterpillar.DomService.getCardByChild($(el));
                Caterpillar.DomService.getCardDescriptionValueInput(card).val(value);
                Caterpillar.Core.autoFitDescription(card);
                if (Caterpillar.Storage) {
                    Caterpillar.Storage.saveOrUpdateStory(Caterpillar.Core.currentStoryToJson());
                }
            }
        });

        _this.initTaskToolbar(cardTemplate);
        _this.makeCardResizable(cardTemplate);
        if (updateStorageFlag && Caterpillar.Storage) {
            Caterpillar.Storage.saveOrUpdateStory(_this.currentStoryToJson());
        }

        return cardTemplate;
    };

    this.addNewCardIfStoryIdValid = function (prependFlag) {
        if (Caterpillar.Util.isValidStoryId(Caterpillar.DomService.getStoryIdValueInput().val())) {
            var updateEstimation = Caterpillar.DomService.getAllCardsNoCondition().length == 0;
            var card;
            if (prependFlag == true) {
                card = _this.addNewCard(true, _this.getFirstCard(), true);
            } else {
                card = _this.addNewCard(true);
            }
            if (Caterpillar.Selecting) {
                Caterpillar.Selecting.setLastSelectedCard(card);
            }
            if (updateEstimation) {
                //noinspection JSCheckFunctionSignatures
                _this.updateTotalEstimation();
            }
        } else {
            Caterpillar.Util.alertWarn(MESSAGE_NULL_STORY_ID, TITLE_NULL_STORY_ID, startEditStoryId);
        }
    };

    this.updateTaskIndexes = function () {
        Caterpillar.DomService.getAllCardsNoCondition().each(function (index, cardElement) {
            _this.updateTaskIndex(lastStoryId, $(cardElement), index + 1);
        });
    };

    this.updateTaskIndex = function (storyId, card, index) {
        var span = Caterpillar.DomService.getCardIdSpan(card);
        span.html(storyId + " [" + index + "]");
    };

    this.disableCards = function (cards) {
        if (cards.length > 0) {
            Caterpillar.DomService.makeCardDisabled(cards);
            if (!Caterpillar.DomService.isShowDisabledCards()) {
                _this.updateHiddenEndingCardsDiv();
                if (Caterpillar.Selecting) {
                    Caterpillar.Selecting.setLastSelectedCardAfterRemoveOrHide(cards);
                }
                Caterpillar.DomService.getStoryPage().ctPrintable("refresh");
            }
            _this.updateStoryInfoVisibility();
            //noinspection JSCheckFunctionSignatures
            _this.updateTotalEstimation();
            Caterpillar.Storage.saveOrUpdateStory(_this.currentStoryToJson());
        }
    };

    this.changeCardColor = function (cards, color, updateStorage) {
        if (cards.length > 0) {
            cards.removeClass("card-color-red card-color-yellow card-color-green card-color-blue card-color-purple");
            cards.removeData("card-color");
            switch (color) {
                case "red":
                    cards.addClass("card-color-red");
                    cards.data("card-color", "red");
                    break;
                case "yellow":
                    cards.addClass("card-color-yellow");
                    cards.data("card-color", "yellow");
                    break;
                case "green":
                    cards.addClass("card-color-green");
                    cards.data("card-color", "green");
                    break;
                case "blue":
                    cards.addClass("card-color-blue");
                    cards.data("card-color", "blue");
                    break;
                case "purple":
                    cards.addClass("card-color-purple");
                    cards.data("card-color", "purple");
                    break;
            }
            if (updateStorage === true) {
                Caterpillar.Storage.saveOrUpdateStory(_this.currentStoryToJson());
            }
        }
    };

    this.enableCards = function (cards) {
        if (cards.length > 0) {
            Caterpillar.DomService.makeCardEnabled(cards);
            if (!Caterpillar.DomService.isShowDisabledCards()) {
                _this.updateHiddenEndingCardsDiv();
                Caterpillar.DomService.getStoryPage().ctPrintable("refresh");
            }
            _this.updateStoryInfoVisibility();
            //noinspection JSCheckFunctionSignatures
            _this.updateTotalEstimation();
            Caterpillar.Storage.saveOrUpdateStory(_this.currentStoryToJson());
        }
    };

    this.removeCards = function (cards, withoutConfirmation) {
        if (cards.length > 0 && !Caterpillar.DomService.isStoryCard(cards)) {
            if (withoutConfirmation == true) {
                if (Caterpillar.Selecting) {
                    Caterpillar.Selecting.setLastSelectedCardAfterRemoveOrHide(cards);
                }

                cards.each(function (index, el) {
                    $(el).remove();
                });
                _this.updateHiddenEndingCardsDiv();
                _this.updateStoryInfoVisibility();
                //noinspection JSCheckFunctionSignatures
                _this.updateTotalEstimation();
                _this.updateTaskIndexes();
                Caterpillar.DomService.getStoryPage().ctPrintable("refresh");
                Caterpillar.Storage.saveOrUpdateStory(_this.currentStoryToJson());
            } else {
                Caterpillar.Util.confirm(MESSAGE_REMOVE_TASKS_ON_DELETE, TITLE_REMOVE_TASKS_ON_DELETE,
                    _this.removeCards, [cards, true]);
            }
        }
    };

    this.updateCard = function (card, cardJson) {
        var isStory = Caterpillar.DomService.isStoryCard(card);

        if (isStory == true) {
            Caterpillar.DomService.getCardIdSpan(card).html(cardJson.id);
            Caterpillar.DomService.getStoryIdInput().val(cardJson.id);
            Caterpillar.DomService.getStoryIdValueInput().val(cardJson.id);
            Caterpillar.DomService.getCardEtaSpan(card).html(Caterpillar.Util.estimationToString(cardJson.eta));

            var etaVal = Caterpillar.Util.parseEstimation(cardJson.eta);
            etaVal = etaVal != null ? etaVal : "";
            Caterpillar.DomService.getCardEtaInput(card).val(etaVal);
            Caterpillar.DomService.getCardEtaValueInput(card).val(etaVal);

            var div = Caterpillar.DomService.getCardContentDiv(card);
            var description = cardJson.description;
            if (!description) {
                if (Caterpillar.Util.isValidStoryId(cardJson.id) || !Caterpillar.HotKeys) {
                    description = "Story description";
                } else {
                    description = "Press Shift+O to open or create a story";
                }
            }
            div.html(Caterpillar.Util.descriptionToHtml(description));
            Caterpillar.DomService.getCardDescriptionTextarea(card).val(description);
            Caterpillar.DomService.getCardDescriptionValueInput(card).val(description);
        } else {
            Caterpillar.DomService.getCardEtaInput(card).ctEditOnClick("option", "value", cardJson.eta);
            Caterpillar.DomService.getCardDescriptionTextarea(card).ctEditOnClick("option", "value", cardJson.description);
        }

        if (cardJson.width) {
            var cardWidth = Math.min(Math.max(cardJson.width, _this.MIN_CARD_WIDTH), _this.MAX_CARD_WIDTH);
            Caterpillar.DomService.getCardUiDiv(card).width(cardWidth);
        }
        _this.changeCardColor(card, cardJson.type, false);
        _this.autoFitDescription(card);
    };

    this.updateTotalEstimation = function (notResetStoryEta) {
        var disabledTotalEta = 0;
        var enabledTotalEta = 0;
        var disabledCount = 0;
        var enabledCount = 0;
        var disabledSpikeExist = false;
        var enabledSpikeExist = false;
        var cards = Caterpillar.DomService.getAllCardsNoCondition();

        if (cards.length == 0) {
            Caterpillar.DomService.showStoryEstimation();
        } else {
            if (!Caterpillar.DomService.isShownTotalEstimation() && !Caterpillar.DomService.isShownEnabledEstimation()) {
                Caterpillar.DomService.showEnabledEstimation();
            }
        }

        if (cards.length > 0 || notResetStoryEta != true) {
            cards.each(function (index, el) {
                var card = $(el);
                var disabled = Caterpillar.DomService.isDisabledCard(card);
                var eta = Caterpillar.Util.parseEstimation(Caterpillar.DomService.getCardEtaValueInput(card).val());
                if (disabled) {
                    if (eta == null) {
                        disabledSpikeExist = true;
                    } else {
                        disabledTotalEta = disabledTotalEta + eta;
                    }
                    disabledCount++;
                } else {
                    if (eta == null) {
                        enabledSpikeExist = true;
                    } else {
                        enabledTotalEta = enabledTotalEta + eta;
                    }
                    enabledCount++;
                }
            });

            var totalEta = disabledTotalEta + enabledTotalEta;
            var storyCard = Caterpillar.DomService.getStoryCard();
            Caterpillar.DomService.getCardEtaValueInput(storyCard).val(totalEta);
            Caterpillar.DomService.getCardEtaInput(storyCard).val(totalEta);
            Caterpillar.DomService.getStoryStoryEtaSpan().html(Caterpillar.Util.estimationToString(0));
        }

        var disabledSpanText = "" + disabledTotalEta;
        var enabledSpanText = "" + enabledTotalEta;
        var totalSpanText = "" + totalEta;
        if (enabledSpikeExist || disabledSpikeExist) {
            totalSpanText = totalSpanText + "+";
        }
        if (enabledSpikeExist) {
            enabledSpanText = enabledSpanText + "+";
        }
        if (disabledSpikeExist) {
            disabledSpanText = disabledSpanText + "+";
        }
        totalSpanText = totalSpanText + " " + Caterpillar.Settings.etaMeasure;
        disabledSpanText = disabledSpanText + " " + Caterpillar.Settings.etaMeasure;
        enabledSpanText = enabledSpanText + " " + Caterpillar.Settings.etaMeasure;

        Caterpillar.DomService.getDisabledInfoSpan().html(disabledCount + " (" + disabledSpanText + ")");
        Caterpillar.DomService.getEnabledInfoSpan().html(enabledCount + " (" + enabledSpanText + ")");
        Caterpillar.DomService.getTotalInfoSpan().html(disabledCount + enabledCount + " (" + totalSpanText + ")");
        Caterpillar.DomService.getStoryTotalEtaSpan().html(totalSpanText);
        Caterpillar.DomService.getStoryEnabledEtaSpan().html(enabledSpanText);
    };

    this.splitCard = function (cardToSplit) {
        if (cardToSplit.length > 0) {
            var description = Caterpillar.DomService.getCardDescriptionValueInput(cardToSplit).val();
            var tasks = Caterpillar.Util.parseStringToJsonStory(description, false, false, false).tasks;
            if (tasks && tasks.length > 1) {
                var disabled = Caterpillar.DomService.isDisabledCard(cardToSplit);
                var color = cardToSplit.data("card-color");
                var etaToSplit = Caterpillar.Util.parseEstimation(Caterpillar.DomService.getCardEtaValueInput(cardToSplit).val());
                etaToSplit = etaToSplit ? etaToSplit : 0;
                var mod = etaToSplit % tasks.length;
                var nat = Math.floor(etaToSplit / tasks.length);
                var lastAdded;
                for (var i = tasks.length - 1; i >= 0; i--) {
                    var task = tasks[i];
                    lastAdded = _this.createNewTaskCard(
                        {eta: nat + ((mod - i) > 0 ? 1 : 0), description: task.description, disabled: disabled, type: color}, cardToSplit);
                }
                _this.removeCards(cardToSplit, true);
                Caterpillar.Util.scrollToElement(lastAdded);
            } else {
                Caterpillar.Util.alertInfo("There is nothing to split.", "Split task");
            }
        }
    };

    this.unionCards = function (cards) {
        if (cards.length > 1) {
            var newDescription = "";
            var newEstimation = 0;
            var enabled = false;
            cards.each(function (index, el) {
                var card = $(el);
                newEstimation = Caterpillar.Util.addEstimation(newEstimation, Caterpillar.DomService.getCardEtaValueInput(card).val());
                newDescription = newDescription + "\n" + Caterpillar.DomService.getCardDescriptionValueInput(card).val().replace(/(\s+\n)|(\s+$)/g, "");
                enabled = enabled || !Caterpillar.DomService.isDisabledCard(card);
            });
            var color = cards.first().data("card-color");
            newDescription = newDescription.substr(1);
            var card = _this.createNewTaskCard({eta: newEstimation, description: newDescription, disabled: !enabled, type: color}, cards.first());
            _this.removeCards(cards, true);
            if (Caterpillar.Selecting) {
                Caterpillar.Selecting.setLastSelectedCard(card);
            }
            Caterpillar.Util.scrollToElement(card);
        }
    };

    this.createNewTaskCard = function (cardJson, pos) {
        var cardTemplate = _this.addNewCard(false, pos);
        if (cardJson.disabled) {
            Caterpillar.DomService.makeCardDisabled(cardTemplate);
        }
        _this.updateCard(cardTemplate, cardJson);
        return cardTemplate;
    };


    this.makeCardResizable = function (card) {
        Caterpillar.DomService.getCardUiDiv(card).resizable({
            handles: "e",
            stop: function (event, ui) {
                var card = ui.element;
                _this.autoFitDescription(card);
                Caterpillar.DomService.getStoryPage().ctPrintable("refresh");
                Caterpillar.Storage.saveOrUpdateStory(_this.currentStoryToJson());
            }
        });
    };

    this.initTaskToolbar = function (card) {
        var buttonSet = Caterpillar.DomService.getCardToolbarButtonSet(card);
        Caterpillar.DomService.getAddNewToRightButton(buttonSet).button(
            {label: "New",
                icons: {
                    secondary: "ui-icon-triangle-1-e"
                }
            }
        ).click(function () {
                _this.addNewCard(true, Caterpillar.DomService.getCardByChild($(this)), false);
            });

        Caterpillar.DomService.getAddNewToLeftButton(buttonSet).button(
            {label: "New",
                icons: {
                    primary: "ui-icon-triangle-1-w"
                }
            }
        ).click(function () {
                _this.addNewCard(true, Caterpillar.DomService.getCardByChild($(this)), true);
            });

        Caterpillar.DomService.getDisableTaskButton(buttonSet).button(
            {label: "Disable",
                icons: {
                    primary: "ui-icon-cancel"
                }
            }).click(function () {
                _this.disableCards(Caterpillar.DomService.getCardByChild($(this)));
            });

        Caterpillar.DomService.getEnableTaskButton(buttonSet).button(
            {label: "Enable",
                icons: {
                    primary: "ui-icon-plus"
                }
            }).click(function () {
                _this.enableCards(Caterpillar.DomService.getCardByChild($(this)));
            });

        Caterpillar.DomService.getRemoveTaskButton(buttonSet).button(
            {label: "Remove",
                icons: {
                    primary: "ui-icon-trash"
                }
            }).click(function (event) {
                _this.removeCards(Caterpillar.DomService.getCardByChild($(this)), event.shiftKey);
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
    };

    this.currentStoryToJson = function () {
        var story;
        var storyId = Caterpillar.DomService.getStoryIdValueInput().val();
        var issueId = Caterpillar.Util.getIssueIdFromStoryId(storyId);
        if (storyId && Caterpillar.Util.isNotEmptyIssueId(issueId)) {
            story = _this.cardToJson(Caterpillar.DomService.getStoryCard());
            story.id = storyId;

            var tasks = [];
            Caterpillar.DomService.getAllCardsNoCondition().each(function (index, card) {
                tasks.push(_this.cardToJson($(card)));
            });
            story.tasks = tasks;
        }
        return story;
    };

    this.cardToJson = function (card) {
        var cardJson = {};
        cardJson.eta = Caterpillar.Util.parseEstimation(Caterpillar.DomService.getCardEtaValueInput(card).val());
        cardJson.description = Caterpillar.DomService.getCardDescriptionValueInput(card).val();
        if (Caterpillar.DomService.isDisabledCard(card)) {
            cardJson.disabled = true;
        }
        var color = card.data("card-color");
        if (color) {
            cardJson.type = color;
        }
        var width = Caterpillar.DomService.getCardUiDiv(card).width();
        if (width > _this.MIN_CARD_WIDTH) {
            cardJson.width = Math.min(width, _this.MAX_CARD_WIDTH);
        }
        return cardJson;
    };

    this.getNextCard = function (card) {
        return __getNextCard__(card);
    };

    this.getPrevCard = function (card) {
        return __getNextCard__(card, true);
    };

    function __getNextCard__(card, reverse) {
        var next = reverse && card.prev() || card.next();
        if (next.length && !next.hasClass("card-item")) {
            return __getNextCard__(next, reverse);
        } else if (!Caterpillar.DomService.isShowDisabledCards()) {
            if (next.length && Caterpillar.DomService.isDisabledCard(next)) {
                return __getNextCard__(next, reverse);
            }
        }
        return next;
    }

    this.getAllCards = function () {
        if (Caterpillar.DomService.isShowDisabledCards()) {
            return Caterpillar.DomService.getAllCardsNoCondition();
        } else {
            return Caterpillar.DomService.filterOutDisabledCards(Caterpillar.DomService.getAllCardsNoCondition());
        }
    };


    this.getNextAllCards = function (card) {
        return __getNextAllCards__(card);
    };

    this.getPrevAllCards = function (card) {
        return __getNextAllCards__(card, true);
    };


    function __getNextAllCards__(card, reverse) {
        var selector = "li.card-item";
        if (Caterpillar.DomService.isShowDisabledCards()) {
            return reverse && card.prevAll(selector) || card.nextAll(selector);
        } else {
            return Caterpillar.DomService.filterOutDisabledCards((reverse && card.prevAll(selector) || card.nextAll(selector)));
        }
    }

    this.getLastCard = function () {
        var lastCard = Caterpillar.DomService.getLastCardNoCondition();
        if (Caterpillar.DomService.isDisabledCard(lastCard) && !Caterpillar.DomService.isShowDisabledCards()) {
            lastCard = _this.getPrevCard(lastCard);
        }
        return lastCard;
    };


    this.getFirstCard = function () {
        var firstCard = Caterpillar.DomService.getFirstCardNoCondition();
        if (Caterpillar.DomService.isDisabledCard(firstCard) && !Caterpillar.DomService.isShowDisabledCards()) {
            firstCard = _this.getNextCard(firstCard);
        }
        return firstCard;
    };

    this.isLastCard = function (card) {
        return card[0] == Caterpillar.Core.getLastCard()[0];
    };

    this.isFirstCard = function (card) {
        return card[0] == Caterpillar.Core.getFirstCard()[0];
    };

    this.removeAllTaskCards = function () {
        Caterpillar.DomService.getAllCardsNoCondition().remove();
    };

    this.updateStoryInfoVisibility = function () {
        var disabledCardsCount = Caterpillar.DomService.getDisabledCards().length;
        if (disabledCardsCount > 0) {
            Caterpillar.DomService.getStoryInfoTr().show();
        } else {
            Caterpillar.DomService.getStoryInfoTr().hide();
        }
    };

    this.setShowDisabledCards = function (flag) {
        var isShowDisabled = Caterpillar.DomService.isShowDisabledCards();
        if (flag != isShowDisabled) {
            if (Caterpillar.Selecting) {
                var disabledCards = Caterpillar.DomService.getDisabledCards();
                Caterpillar.Selecting.unSelectLastSelectedCard(disabledCards);
                Caterpillar.Selecting.unSelectCards(disabledCards);
            }
            Caterpillar.DomService.setShowDisabledCards(!isShowDisabled);
            _this.updateHiddenEndingCardsDiv();
            if (isShowDisabled) {
                Caterpillar.DomService.getStoryPage().ctPrintable("option", "items", "li.card-item:not(.disabled-card),div.story-item");
            } else {
                Caterpillar.DomService.getStoryPage().ctPrintable("option", "items", "li.card-item,div.story-item");
            }
            if (flag) {
                _this.autoFitDescription(Caterpillar.DomService.getDisabledCards());
            }
        }
    };

    this.updateHiddenEndingCardsDiv = function () {
        var lastCard = Caterpillar.DomService.getLastCardNoCondition();
        var div = Caterpillar.DomService.getHiddenEndingCardsDiv();
        if (Caterpillar.DomService.isDisabledCard(lastCard) && !Caterpillar.DomService.isShowDisabledCards()) {
            div.show();
        } else {
            div.hide();
        }
    };

    this.autoFitDescription = function (cards) {
        cards.each(function (index, el) {
            var card = $(el);
            var contentTd = Caterpillar.DomService.getCardContentTd(card);
            var isStory = Caterpillar.DomService.isStoryCard(card);
            var fontSize = isStory && 20 || 16;
            var maxHeight = isStory && 190 || 205;
            contentTd.css("font-size", fontSize + "pt");
            while (fontSize >= 9 && contentTd.height() > maxHeight) {
                fontSize = fontSize - 1;
                contentTd.css("font-size", fontSize + "pt");
            }
        });
    };

    this.restoreStoryFromStorage = function (storyId) {
        if (storyId) {
            Caterpillar.Storage.updateLastStoryId(storyId);
        } else if (window.localStorage && window.localStorage.agileCaterpillarLastStoryId) {
            Caterpillar.Storage.updateLastStoryId(window.localStorage.agileCaterpillarLastStoryId);
        }

        Caterpillar.Core.removeAllTaskCards();
        var storyCard = Caterpillar.DomService.getStoryCard();
        Caterpillar.Core.updateCard(storyCard, {id: lastStoryId, eta: 0, description: "", width: Caterpillar.Core.MIN_CARD_WIDTH, type: "default"});

        var isNew = false;
        var tasks;
        var story = Caterpillar.Storage.getStoryFromStorage(lastStoryId);
        if (story) {
            tasks = story.tasks;
            Caterpillar.Core.updateCard(storyCard, story);
        } else if (Caterpillar.Util.isValidStoryId(lastStoryId)) {
            var projectId = Caterpillar.Util.getProjectIdFromStoryId(lastStoryId);
            story = Caterpillar.Settings.getDefaultStory(projectId);
            story.id = lastStoryId;
            Caterpillar.Core.updateCard(storyCard, story);
            tasks = story.tasks;
            isNew = true;
        }

        if (tasks && tasks.length > 0) {
            var spikeExist = false;
            for (var i = 0; i < tasks.length; i++) {
                var task = tasks[i];
                if (task) {
                    Caterpillar.Core.createNewTaskCard(task);
                    if (Caterpillar.Util.parseEstimation(task.eta) == null) {
                        spikeExist = true;
                    }
                }
            }
        }

        Caterpillar.Core.updateHiddenEndingCardsDiv();
        Caterpillar.Core.updateStoryInfoVisibility();
        Caterpillar.Core.updateTotalEstimation(true);
        if (isNew == true) {
            Caterpillar.Storage.saveOrUpdateStory(_this.currentStoryToJson());
        }
        //noinspection JSValidateTypes
        $(window).scrollTop(0);
    };
};
