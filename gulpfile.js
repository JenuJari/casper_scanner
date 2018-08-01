var gulp = require('gulp');
var babel = require('gulp-babel');
var path = require('path');

var data = {
    rootdir : path.resolve(__dirname),
    outputdir : path.resolve(__dirname,'output')
};

gulp.task('cli', function () {

    return gulp.src('cli/**/*.jsx')
        .pipe(babel())
        .pipe(gulp.dest(data.outputdir));

});

gulp.task('52low', function () {

    return gulp.src('52low/**/*.jsx')
        .pipe(babel())
        .pipe(data.outputdir);

});