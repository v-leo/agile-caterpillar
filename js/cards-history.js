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
    Caterpillar.History.loadStoryHistory();
    Caterpillar.History.__initStoryHistoryAutocomplete__();
});

Caterpillar.History = new function() {
    var _this = this;

    //Need for tests
    this.__setThis__ = function (t) {
        _this = t;
    };

    var storyHistory = [];

    this.__initStoryHistoryAutocomplete__ = function () {
        var input = Caterpillar.DomService.getStoryIdInput();

        input.autocomplete({
            source:storyHistory,
            focus:function (event, ui) {
                input.val(ui.item.storyId);
                return false;
            },
            select:function (event, ui) {
                input.val(ui.item.storyId);
                return false;
            },
            search:function () {
                return input.is(":visible");
            }
        })/*.data("autocomplete")._renderItem = function (ul, item) {
            return $("<li>")
                .data("item.autocomplete", item)
                .append("<a>" + item.value + ": " + item.description + "</a>")
                .appendTo(ul);
        }*/;
    };

    this.loadStoryHistory = function () {
        storyHistory = [];
        var stories = Caterpillar.Storage.getAllStoriesFromStorage();
        for (var key in stories) {
            var historyItem = {};
            //noinspection JSUnfilteredForInLoop
            var story = stories[key];
            historyItem.storyId = story.id;
            historyItem.value = story.id + ": " + Caterpillar.Util.escapeHtmlTags(story.description);
            storyHistory.push(historyItem);
        }
    };

    this.addToStoryHistory = function (storyId, description) {
        if (Caterpillar.Util.isValidStoryId(storyId)) {
            var story = {};
            story.storyId = storyId;
            story.value = storyId + ": " + Caterpillar.Util.escapeHtmlTags(description);
            _this.deleteFromStoryHistory(storyId);
            storyHistory.unshift(story);
        }
    };

    this.deleteFromStoryHistory = function (storyId) {
        for (var i = 0; i < storyHistory.length; i++) {
            if (storyHistory[i].storyId == storyId) {
                storyHistory.splice(i, 1);
                break;
            }
        }
    };
};



