CardTool.Storage = new function () {
    var _this = this;

    //Need for tests
    this.__setThis__ = function (t) {
        _this = t;
    };

    //var lastIssueId;
    var storageItemPrefix = "cardStorage";

    var defaultCardTemplates = {"CS":[
        {eta:0, description:"Acceptance tests"},
        {eta:0, description:"Integration task"}
    ]};

    this.updateLocalStorage = function (story) {
        if (window.localStorage && story && story.id) {
            window.localStorage[storageItemPrefix + story.id] = JSON.stringify(story);
        }
    };

    this.getDefaultTasks = function (projectId) {
        return defaultCardTemplates[projectId];
    };

    this.getStoryFromStorage = function (storyId) {
        var story;
        if (window.localStorage && storyId && storyId.length > 0) {
            storyId = storyId.toUpperCase();
            var issueId = CardTool.Util.getIssueIdFromStoryId(storyId);
            if (issueId && CardTool.Util.isNotEmptyIssueId(issueId)) {
                var cardsStr = window.localStorage[storageItemPrefix + storyId];
                if (cardsStr) {
                    var parsedStory = JSON.parse(cardsStr);
                    story = parsedStory;
                    if (parsedStory && parsedStory.length) {
                        //convert old format
                        story = convertOldFormat(parsedStory);
                        window.localStorage[storageItemPrefix + storyId] = JSON.stringify(story);
                    } else if (parsedStory && parsedStory.hasOwnProperty("peh")) {
                        //convert peh fields to eta
                        story = convertPehToEtaFormat(parsedStory);
                        window.localStorage[storageItemPrefix + storyId] = JSON.stringify(story);
                    }
                }
            }
        }
        return story;
    };

    this.getAllStoriesFromStorage = function () {
        var stories = [];
        if (window.localStorage) {
            var pos = storageItemPrefix.length;
            for (var key in window.localStorage) {
                //noinspection JSUnfilteredForInLoop
                if (key.substr(0, pos) == storageItemPrefix) {
                    //noinspection JSUnfilteredForInLoop
                    var storyId = key.substr(pos);
                    var story = _this.getStoryFromStorage(storyId);
                    if (story) {
                        stories.push(story);
                    }
                }
            }
        }
        if (stories.length > 1) {
            stories.sort(function (story1, story2) {
                if (story1.id > story2.id) {
                    return 1;
                } else if (story1.id < story2.id) {
                    return -1;
                } else {
                    return 0;
                }
            });
        }
        return stories;
    };

    this.deleteStoryFromStorage = function (storyId) {
        if (window.localStorage) {
            delete window.localStorage[storageItemPrefix + storyId];
        }
    };

    this.getLastStoryId = function () {
        return lastStoryId;
    };

    this.updateLastStoryId = function (id) {
        if (id) {
            var projectId = CardTool.Util.getProjectIdFromStoryId(id);
            lastIssueId = CardTool.Util.getIssueIdFromStoryId(id);

            lastProjectId = projectId || lastProjectId;
            lastIssueId = CardTool.Util.isNotEmptyIssueId(lastIssueId) ? lastIssueId : CardTool.Util.defaultIssueId;
        } else {
            lastIssueId = CardTool.Util.defaultIssueId;
        }

        lastStoryId = CardTool.Util.generateStoryId(lastProjectId, lastIssueId);
        if (window.localStorage) {
            window.localStorage.cardToolLastIssueId = lastStoryId;
        }
    };

    function convertOldFormat(cards) {
        var story = {};
        var tasks = [];
        for (var i = 0; i < cards.length; i++) {
            var card = cards[i];
            if (card["isStory"] == true) {
                story.id = card.id;
                //noinspection JSUnresolvedVariable
                story.eta = CardTool.Util.parseEstimation(card.peh);
                story.description = card.description;
            } else {
                var task = {};
                //noinspection JSUnresolvedVariable
                task.eta = CardTool.Util.parseEstimation(card.peh);
                task.description = card.description;
                tasks.push(task);
            }
        }
        story.tasks = tasks;
        return story;
    }

    function convertPehToEtaFormat(oldStory) {
        //noinspection JSUnresolvedVariable
        var story = {
            id:oldStory.id,
            eta:CardTool.Util.parseEstimation(oldStory.peh),
            description:oldStory.description
        };
        var tasks = [];
        var oldTasks = oldStory.tasks;
        if (oldTasks) {
            for (var i = 0; i < oldTasks.length; i++) {
                var card = oldTasks[i];
                //noinspection JSUnresolvedVariable
                var task = {
                    eta:CardTool.Util.parseEstimation(card.peh),
                    description:card.description
                };
                tasks.push(task);
            }
        }
        story.tasks = tasks;
        return story;
    }

};