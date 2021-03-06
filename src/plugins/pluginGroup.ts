var grouper = require('group-css-media-queries');

function getGroupProcessor(less) {
	function GroupProcessor() { };
    GroupProcessor.prototype = {
        process: function (css, extra) {
            return grouper(css);
        }
    };

    return GroupProcessor;
};

function pluginGroupMediaQuery() {}

pluginGroupMediaQuery.prototype = {
    install: function(less, pluginManager) {
		var GroupProcessor = getGroupProcessor(less);
        pluginManager.addPostProcessor(new GroupProcessor());
    },
    printUsage: function () {
    },
    minVersion: [2, 0, 0]
};

module.exports = pluginGroupMediaQuery;