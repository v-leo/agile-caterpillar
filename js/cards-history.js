$(document).ready(function () {
    CardTool.History.loadStoryHistory();
    CardTool.History.__initStoryHistoryAutocomplete__();
});

CardTool.History = new function() {
    var _this = this;

    //Need for tests
    this.__setThis__ = function (t) {
        _this = t;
    };

    var storyHistory = [];

    this.__initStoryHistoryAutocomplete__ = function () {
        var input = CardTool.DomService.getStoryIdInput();

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
        var stories = CardTool.Storage.getAllStoriesFromStorage();
        for (var key in stories) {
            var historyItem = {};
            //noinspection JSUnfilteredForInLoop
            var story = stories[key];
            historyItem.storyId = story.id;
            historyItem.value = story.id + ": " + CardTool.Util.escapeHtmlTags(story.description);
            storyHistory.push(historyItem);
        }
    };

    this.addToStoryHistory = function (storyId, description) {
        if (CardTool.Util.isValidStoryId(storyId)) {
            var story = {};
            story.storyId = storyId;
            story.value = storyId + ": " + CardTool.Util.escapeHtmlTags(description);
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



