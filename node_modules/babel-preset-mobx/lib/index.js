module.exports = function() {
    return {
        plugins: [
            'transform-decorators-legacy',
            'transform-class-properties',
            'transform-es2015-classes',
            ['transform-regenerator', { asyncGenerators: false }],
        ],
    };
};
