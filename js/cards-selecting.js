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


$(document).ready(function () {
    Caterpillar.Selecting.initCardsSelecting();
    Caterpillar.Selecting.__initHotKeys__();
});

Caterpillar.Selecting = new function () {
    var _this = this;

    //Need for tests
    this.__setThis__ = function (t) {
        _this = t;
    };

    var SELECT_ACTION = {
        UNSELECT:-1,
        NONE:0,
        SELECT:1,
        TOGGLE:2
    };


    this.getLastSelectedCard = function () {
        return Caterpillar.DomService.getTasksContainer().find(">li.last-selected");
    };

    this.getPrevUnselectedCard = function (card) {
        var next = Caterpillar.Core.getPrevCard(card);
        while (next.length > 0 && _this.isSelectedCard(next)) {
            next = Caterpillar.Core.getPrevCard(next);
        }
        return next;
    };

    this.getNextUnselectedCard = function (card) {
        var next = Caterpillar.Core.getNextCard(card);
        while (next.length > 0 && _this.isSelectedCard(next)) {
            next = Caterpillar.Core.getNextCard(next);
        }
        return next;
    };

    this.getLastSelectedCardOrStoryCard = function () {
        var lastSelectedCard = _this.getLastSelectedCard();
        if (lastSelectedCard.length == 0) {
            var storyCard = Caterpillar.DomService.getStoryCard();
            if (_this.isLastSelectedCard(storyCard)) {
                lastSelectedCard = storyCard;
            }
        }
        return lastSelectedCard;
    };

    this.getSelectedCards = function () {
        return Caterpillar.DomService.getTasksContainer().find(">li.ui-selected");
    };

    this.getLastSelectedOrSelectedCards = function () {
        var selectedCards = _this.getLastSelectedCard();
        if (selectedCards.length == 0 || _this.isSelectedCard(selectedCards)) {
            selectedCards = _this.getSelectedCards();
        }
        return selectedCards;
    };

    this.isSelectedCard = function (card) {
        return card.hasClass("ui-selected");
    };

    this.isLastSelectedCard = function (card) {
        return card.hasClass("last-selected");
    };


    this.selectCards = function (cards) {
        cards.addClass("ui-selected");
    };

    this.unSelectCards = function (cards) {
        cards.removeClass("ui-selected");
    };

    this.unSelectLastSelectedCard = function (card) {
        card.removeClass("last-selected");
    };

    this.__isAvailableForHotKeys__ = function (event) {
        return !Caterpillar.DomService.isTargetInputOrTextarea(event) &&
            !Caterpillar.DomService.isTargetContextMenu(event) &&
            !Caterpillar.DomService.isOverlayVisible();
    };


    this.initCardsSelecting = function () {
        $("div.task-card").live("mousedown", function (event) {
            _this.unSelectLastSelectedCard(Caterpillar.DomService.getStoryCard());
            if (Caterpillar.ContextMenu) {
                Caterpillar.ContextMenu.closeTaskContextMenu();
            }
            var card = $(this).parent();
            var isSelected = _this.isSelectedCard(card);
            if (event.which == 1 || event.which == 3) {
                if (event.which == 3 && !Caterpillar.DomService.isTargetInputOrTextarea(event)) {
                    event.preventDefault();
                }

                var lastSelectedCard = _this.getLastSelectedCard();
                _this.unSelectLastSelectedCard(lastSelectedCard);
                var unselect = false;

                var item;
                var i;
                if (event.which == 1 && event.shiftKey) {
                    var items = Caterpillar.Core.getAllCards();
                    var prevIndex = -1;
                    //noinspection JSCheckFunctionSignatures,JSValidateTypes
                    var nextIndex = items.index(card);
                    if (lastSelectedCard.length > 0) {
                        item = lastSelectedCard;
                        //noinspection JSValidateTypes,JSCheckFunctionSignatures
                        prevIndex = items.index(item);
                        if (!event.ctrlKey && isSelected &&
                            ((prevIndex < nextIndex && !_this.isSelectedCard(Caterpillar.Core.getPrevCard(item)) && _this.isAllSelectedBetween(prevIndex, nextIndex - 1) == true) ||
                                (prevIndex > nextIndex && !_this.isSelectedCard(Caterpillar.Core.getNextCard(item)) && _this.isAllSelectedBetween(nextIndex + 1, prevIndex) == true))) {
                            unselect = true;
                        }
                    } else {
                        var selectedCards = _this.getSelectedCards();
                        if (selectedCards.length > 0) {
                            lastSelectedCard = selectedCards.first();
                            //noinspection JSValidateTypes,JSCheckFunctionSignatures
                            prevIndex = items.index(lastSelectedCard);
                        }
                    }


                    if (prevIndex >= 0 && prevIndex != nextIndex) {
                        var min = Math.min(prevIndex, nextIndex);
                        var max = Math.max(prevIndex, nextIndex);

                        if (unselect == true) {
                            item = card;
                            if (prevIndex > nextIndex) {
                                _this.unSelectCards(item.nextAll("li.card-item"));
                                _this.unSelectCards(_this.getPrevUnselectedCard(item).prevAll("li.card-item"));
                            } else {
                                _this.unSelectCards(item.prevAll("li.card-item"));
                                _this.unSelectCards(_this.getNextUnselectedCard(item).nextAll("li.card-item"));
                            }

                            for (i = min; i <= max; i++) {
                                _this.unSelectCards($(items[i]));
                            }
                        } else {
                            if (!event.ctrlKey) {
                                item = lastSelectedCard;
                                if (prevIndex > nextIndex) {
                                    _this.unSelectCards(card.prevAll("li.card-item"));
                                    _this.unSelectCards(_this.getNextUnselectedCard(item).nextAll("li.card-item"));
                                } else {
                                    _this.unSelectCards(card.nextAll("li.card-item"));
                                    _this.unSelectCards(_this.getPrevUnselectedCard(item).prevAll("li.card-item"));
                                }
                            }

                            for (i = min; i <= max; i++) {
                                _this.selectCards($(items[i]));
                            }
                        }
                    }
                    _this.selectCards(card);
                    _this.setLastSelectedCard(card);
                } else if (event.ctrlKey && isSelected == true && event.which == 1) {
                    _this.setLastSelectedCard(lastSelectedCard);
                    _this.unSelectCards(card);
                } else {
                    _this.setLastSelectedCard(card);

                    if ((event.which == 1 && !event.ctrlKey) || (event.which == 3 && isSelected == false)) {
                        _this.unSelectCards(_this.getSelectedCards());
                    }

                    if (event.which == 1 /*|| event.ctrlKey || event.shiftKey*/) {
                        _this.selectCards(card);
                    }
                }
            } else if (event.which == 2) {
                event.preventDefault();
                if (isSelected) {
                    _this.unSelectCards(card);
                    _this.unSelectLastSelectedCard(card);
                } else {
                    _this.selectCards(card);
                    _this.setLastSelectedCard(card);
                }
            }
        });

        Caterpillar.DomService.getCardUiDiv(Caterpillar.DomService.getStoryCard()).mousedown(function (event) {
            if ((event.which == 1 && !event.ctrlKey && !event.shiftKey) || event.which == 3) {
                _this.unSelectCards(_this.getSelectedCards());
                _this.setLastSelectedCard($(this).parent());
            }
        });

        var htmlTag = $("html");

        htmlTag.keydown(function (event) {
            if (_this.__isAvailableForHotKeys__(event)) {
                var ctrlKey = true;//event.ctrlKey;
                var lastSelectedCard;
                var item;
                if (event.which == 37 || event.which == 38 || event.which == 39 || event.which == 40) {
                    var action = SELECT_ACTION.NONE;
                    var nextCardStep = 0;
                    if (event.which == 39) {
                        nextCardStep = 1;
                    } else if (event.which == 37) {
                        nextCardStep = -1;
                    } else if (event.which == 40) {
                        nextCardStep = 2;
                    } else if (event.which == 38) {
                        nextCardStep = -2;
                    }

                    //noinspection JSDuplicatedDeclaration
                    lastSelectedCard = _this.getLastSelectedCard();

                    if (event.shiftKey) {
                        action = SELECT_ACTION.SELECT;
                        if (lastSelectedCard) {
                            item = lastSelectedCard;
                            var isPrevCardSelected = _this.isSelectedCard(Caterpillar.Core.getPrevCard(item));
                            var isNextCardSelected = _this.isSelectedCard(Caterpillar.Core.getNextCard(item));

                            if (isPrevCardSelected == true && isNextCardSelected == true) {
                                if (!ctrlKey) {
                                    _this.unSelectCards(_this.getSelectedCards());
                                }
                            } else {
                                if (!ctrlKey) {
                                    _this.unSelectCards(_this.getNextUnselectedCard(item).nextAll("li.card-item"));
                                    _this.unSelectCards(_this.getPrevUnselectedCard(item).prevAll("li.card-item"));
                                }

                                if (nextCardStep > 0 && isNextCardSelected == true && isPrevCardSelected == false ||
                                    nextCardStep < 0 && isPrevCardSelected == true && isNextCardSelected == false) {
                                    action = SELECT_ACTION.UNSELECT;
                                }
                            }
                        }
                    } else if (!ctrlKey) {
                        _this.unSelectCards(_this.getSelectedCards());
                    }

                    var nextSelectedCard = _this.getNextCardToSelect(lastSelectedCard, nextCardStep, action, event.shiftKey);

                    _this.unSelectLastSelectedCard(Caterpillar.DomService.getStoryCard());
                    _this.setLastSelectedCard(nextSelectedCard);

                    if ((!ctrlKey || (event.shiftKey && action == SELECT_ACTION.UNSELECT))
                        && nextSelectedCard && !Caterpillar.DomService.isStoryCard(nextSelectedCard)) {
                        _this.selectCards(nextSelectedCard);
                    }

                    return false;
                } else if (event.which == 36) {
                    _this.unSelectLastSelectedCard(Caterpillar.DomService.getStoryCard());
                    lastSelectedCard = _this.getLastSelectedCard();
                    if (lastSelectedCard && event.shiftKey) {
                        item = lastSelectedCard;
                        if (!Caterpillar.Core.isFirstCard(item)) {
                            if (!ctrlKey) {
                                _this.unSelectCards(item.nextAll("li.card-item"));
                            }
                            _this.selectCards(Caterpillar.Core.getPrevAllCards(item));
                            _this.selectCards(lastSelectedCard);
                        }
                    }
                    //noinspection JSCheckFunctionSignatures
                    _this.setLastSelectedCard(Caterpillar.Core.getFirstCard());
                    return false;
                } else if (event.which == 35) {
                    _this.unSelectLastSelectedCard(Caterpillar.DomService.getStoryCard());
                    lastSelectedCard = _this.getLastSelectedCard();
                    if (lastSelectedCard && event.shiftKey) {
                        item = lastSelectedCard;
                        if (!Caterpillar.Core.isLastCard(item)) {
                            if (!ctrlKey) {
                                _this.unSelectCards(item.prevAll("li.card-item"));
                            }
                            _this.selectCards(Caterpillar.Core.getNextAllCards(item));
                            _this.selectCards(lastSelectedCard);
                        }
                    }
                    //noinspection JSCheckFunctionSignatures
                    _this.setLastSelectedCard(Caterpillar.Core.getLastCard());
                    return false;
                } else if (ctrlKey && event.which == 65) {
                    _this.unSelectLastSelectedCard(Caterpillar.DomService.getStoryCard());
                    //noinspection JSCheckFunctionSignatures
                    _this.selectCards(Caterpillar.Core.getAllCards());
                    return false;
                } else if (event.which == 32) {
                    _this.getLastSelectedCard().toggleClass("ui-selected");
                    return false;
                } else if (event.which == 27) {
                    var selectedCards = _this.getSelectedCards();
                    if (selectedCards.length > 0) {
                        _this.unSelectCards(selectedCards);
                    } else {
                        _this.unSelectLastSelectedCard(_this.getLastSelectedCard());
                        _this.unSelectLastSelectedCard(Caterpillar.DomService.getStoryCard());
                    }
                    return false;
                }
            }
            return true;
        });

        htmlTag.mousedown(function (event) {
            if (event.which == 1 && !event.ctrlKey && event.pageX > Caterpillar.DomService.getStoryPage().ctPrintable("pageWidth")) {
                _this.unSelectCards(_this.getSelectedCards());
                _this.unSelectLastSelectedCard(_this.getLastSelectedCard());
                _this.unSelectLastSelectedCard(Caterpillar.DomService.getStoryCard());
            }
        });
    };

    this.__initHotKeys__ = function () {
        Caterpillar.HotKeys.registerHotKey({
            keyCode:46,
            shiftKey:true,
            callback:function(){
                Caterpillar.Core.removeCards(_this.getLastSelectedOrSelectedCards(), true);
            },
            condition:Caterpillar.HotKeys.notInputNotTextareaNotOverlay
        });
        Caterpillar.HotKeys.registerHotKey({
            keyCode:46,
            callback:function(){
                Caterpillar.Core.removeCards(_this.getLastSelectedOrSelectedCards());
            },
            condition:Caterpillar.HotKeys.notInputNotTextareaNotOverlay
        });

        Caterpillar.HotKeys.registerHotKey({
            keyCode:83,
            shiftKey:true,
            callback:function(){
                Caterpillar.Core.splitCard(_this.getLastSelectedCard());
            },
            condition:Caterpillar.HotKeys.notInputNotTextareaNotOverlay
        });
        Caterpillar.HotKeys.registerHotKey({
            keyCode:85,
            shiftKey:true,
            callback:function(){
                Caterpillar.Core.unionCards(_this.getLastSelectedOrSelectedCards());
            },
            condition:Caterpillar.HotKeys.notInputNotTextareaNotOverlay
        });
        Caterpillar.HotKeys.registerHotKey({
            keyCode:[107, 187],
            callback:function(){
                Caterpillar.Core.enableCards(_this.getLastSelectedOrSelectedCards());
            },
            condition:Caterpillar.HotKeys.notInputNotTextareaNotOverlay
        });
        Caterpillar.HotKeys.registerHotKey({
            keyCode:[109, 189],
            callback:function(){
                Caterpillar.Core.disableCards(_this.getLastSelectedOrSelectedCards());
            },
            condition:Caterpillar.HotKeys.notInputNotTextareaNotOverlay
        });
        Caterpillar.HotKeys.registerHotKey({
            keyCode:[48, 96],
            callback:function(){
                Caterpillar.Selecting.setLastSelectedCard(Caterpillar.DomService.getStoryCard());
            },
            condition:Caterpillar.HotKeys.notInputNotTextareaNotOverlay
        });
        Caterpillar.HotKeys.registerHotKey({
            keyCode:[49, 50, 51, 52, 53, 54, 55, 56, 57, 97, 98, 99, 100, 101, 102, 103, 104, 105],
            callback:function(event){
                var index = event.which - (event.which > 95 ? 96 : 48);
                var cards = Caterpillar.DomService.getAllCardsNoCondition();
                if (cards.length >= index) {
                    //noinspection JSDuplicatedDeclaration
                    var card = $(cards[index - 1]);
                    if (!Caterpillar.DomService.isDisabledCard(card) || Caterpillar.DomService.isShowDisabledCards()) {
                        _this.setLastSelectedCard(card);
                    }
                }
            },
            condition:Caterpillar.HotKeys.notInputNotTextareaNotOverlay
        });
        Caterpillar.HotKeys.registerHotKey({
            keyCode:72,
            shiftKey:true,
            callback:function(){
                Caterpillar.DomService.getCardEtaSpan(Caterpillar.Selecting.getLastSelectedCardOrStoryCard()).trigger("click");
            },
            condition:Caterpillar.HotKeys.notInputNotTextareaNotOverlay
        });

        Caterpillar.HotKeys.registerHotKey({
            keyCode:[13,108],
            callback:function(){
                startEditCardDescription(Caterpillar.Selecting.getLastSelectedCardOrStoryCard());
            },
            condition:Caterpillar.HotKeys.notInputNotTextareaNotOverlayNotContextMenu
        });
    };

    this.isAllSelectedBetween = function (fromIndex, toIndex) {
        var cards = Caterpillar.DomService.getAllCardsNoCondition();
        var showHidden = Caterpillar.DomService.isShowDisabledCards();
        for (var i = fromIndex; i < toIndex; i++) {
            var card = $(cards[i]);
            if ((showHidden || !Caterpillar.DomService.isDisabledCard(card)) && !_this.isSelectedCard(card)) {
                return false;
            }
        }
        return true;
    };

    this.setLastSelectedCard = function (nextSelectedCard) {
        if (nextSelectedCard && nextSelectedCard.length > 0) {
            _this.unSelectLastSelectedCard(Caterpillar.DomService.getStoryCard());
            _this.unSelectLastSelectedCard(_this.getLastSelectedCard());
            nextSelectedCard.addClass("last-selected");
            Caterpillar.Util.scrollToElement(nextSelectedCard);
        }
    };

    /*function removeSelectionAfterLastSelected(cards) {
     var unselect = false;
     cards.each(function (index, el) {
     var card = $(el);
     if (isSelectedCard(card)) {
     if (unselect == true) {
     unSelectCards(card);
     }
     } else {
     unselect = true;
     }
     });
     }*/
    this.updateCardSelection = function (card, selectAction) {
        if (selectAction != SELECT_ACTION.NONE && card && card.length > 0) {
            if (selectAction == SELECT_ACTION.SELECT) {
                _this.selectCards(card);
            } else if (selectAction == SELECT_ACTION.UNSELECT) {
                _this.unSelectCards(card);
            } else if (selectAction == SELECT_ACTION.TOGGLE) {
                card.toggleClass("ui-selected");
            }
        }
    };

    this.getNextCardToSelect = function (lastSelectedCard, step, selectAction, shiftKey) {
        var nextSelectedCard = [];

        if (lastSelectedCard && lastSelectedCard.length > 0) {
            _this.updateCardSelection(lastSelectedCard, selectAction);
            var lastSelectedTask = lastSelectedCard;
            if (step > 0) {
                if (!shiftKey || !Caterpillar.Core.isLastCard(lastSelectedTask)) {
                    lastSelectedTask = Caterpillar.Core.getNextCard(lastSelectedTask);
                    _this.updateCardSelection(lastSelectedTask, selectAction);
                    if (step > 1 && !Caterpillar.Core.isLastCard(lastSelectedTask)) {
                        lastSelectedTask = Caterpillar.Core.getNextCard(lastSelectedTask);
                        _this.updateCardSelection(lastSelectedTask, selectAction);
                    }
                    nextSelectedCard = lastSelectedTask;
                } else {
                    nextSelectedCard = lastSelectedCard;
                }
            } else {
                if (!shiftKey || !Caterpillar.Core.isFirstCard(lastSelectedTask)) {
                    lastSelectedTask = Caterpillar.Core.getPrevCard(lastSelectedTask);
                    _this.updateCardSelection(lastSelectedTask, selectAction);
                    if (step < -1) {
                        if (!Caterpillar.Core.isFirstCard(lastSelectedTask)) {
                            lastSelectedTask = Caterpillar.Core.getPrevCard(lastSelectedTask);
                            _this.updateCardSelection(lastSelectedTask, selectAction);
                            nextSelectedCard = lastSelectedTask;
                        } else if (!shiftKey) {
                            nextSelectedCard = Caterpillar.DomService.getStoryCard();
                        } else {
                            nextSelectedCard = lastSelectedTask;
                        }
                    } else if (lastSelectedTask.length == 0 && !shiftKey) {
                        nextSelectedCard = Caterpillar.DomService.getStoryCard();
                    } else {
                        nextSelectedCard = lastSelectedTask;
                    }
                } else {
                    nextSelectedCard = lastSelectedCard;
                }
            }
        } else if (_this.isLastSelectedCard(Caterpillar.DomService.getStoryCard())) {
            if (shiftKey) {
                nextSelectedCard = Caterpillar.DomService.getStoryCard();
            } else if (step > 1) {
                nextSelectedCard = Caterpillar.Core.getNextCard(Caterpillar.Core.getFirstCard());
            }
        } else if (shiftKey) {
            nextSelectedCard = _this.getSelectedCards().first();
        }

        if (nextSelectedCard.length == 0) {
            if (step > 0) {
                nextSelectedCard = Caterpillar.Core.getFirstCard();
            } else {
                nextSelectedCard = Caterpillar.Core.getLastCard();
            }
        }

        return nextSelectedCard;
    };

    this.setLastSelectedCardAfterRemoveOrHide = function (removedCards) {
        var card;
        var lastSelected = _this.getLastSelectedCard();
        if (lastSelected.length == 0) {
            card = removedCards.first();
        } else if (_this.isSelectedCard(lastSelected) ||
            (removedCards.length == 1 && lastSelected[0] == removedCards[0])) {
            card = lastSelected;
        }

        if (card) {
            var cardToSelectNext = _this.getNextUnselectedCard(card);
            if (cardToSelectNext.length == 0) {
                cardToSelectNext = _this.getPrevUnselectedCard(card);
            }

            if (cardToSelectNext && cardToSelectNext.length > 0) {
                _this.setLastSelectedCard(cardToSelectNext);
            }
        }
        _this.unSelectCards(removedCards);
        _this.unSelectLastSelectedCard(removedCards);
    }

};

function startEditCardDescriptionInternal() {
    startEditCardDescription(Caterpillar.DomService.getCardDescriptionTextarea(Caterpillar.Selecting.getLastSelectedCardOrStoryCard()));
}
