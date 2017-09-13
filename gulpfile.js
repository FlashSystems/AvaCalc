var gulp = require("gulp");
var ts = require("gulp-typescript");
var uglify = require('gulp-uglify');
var sourcemaps = require('gulp-sourcemaps');
var noop = require("gulp-noop");
var assign = require('object-assign');
var gutil = require('gulp-util');

var releaseBuild = (gutil.env.release != undefined);

var outputTarget = "ES5";
var outputBaseDir = releaseBuild ? "release" : "debug";
var typeScriptDefaults = {
	'target': outputTarget,
	'removeComments': true,
	'noImplicitAny': true,
	'noImplicitReturns': true,
	'noFallthroughCasesInSwitch': true,
	'noImplicitThis': true,
	'alwaysStrict': true,
	'typeRoots': [ "src/ts/types", "node_modules/@types" ]
}


gutil.log("Output directory is", gutil.colors.cyan(outputBaseDir));

// Compile the typescript code
gulp.task("ts-worker", () => {
	return gulp
		.src([
			"src/ts/shared/*.ts",
			"src/ts/worker/*.ts"
			])
		.pipe(releaseBuild ? noop() : sourcemaps.init())
		.pipe(ts(assign(typeScriptDefaults, {
			'lib': [ "WebWorker", "ES6"],
			'types': [ ]
		})))
		.pipe(releaseBuild ? uglify() : noop() )
		.pipe(releaseBuild ? noop() : sourcemaps.write("../maps"))
		.pipe(gulp.dest(outputBaseDir + "/js/"));
});

gulp.task("ts-frontend", () => {
	return gulp
		.src([
			"src/ts/shared/*.ts",
			"src/ts/frontend/*.ts"
			])
		.pipe(releaseBuild ? noop() : sourcemaps.init())
		.pipe(ts(assign(typeScriptDefaults, {
			'lib': [ "ES6", "dom" ],
			'types': [ "jquery", "jquery-savefile", "materialize-css", "cytoscape", "compat" ],
		})))
		.pipe(releaseBuild ? uglify() : noop())
		.pipe(releaseBuild ? noop() : sourcemaps.write("../maps"))
		.pipe(gulp.dest(outputBaseDir + "/js/"));
});

gulp.task("css", () => {
	return gulp
		.src("src/css/*.css")
		.pipe(gulp.dest(outputBaseDir + "/css/"));
});

gulp.task("html", () => {
	return gulp
		.src("src/html/*.html")
		.pipe(gulp.dest(outputBaseDir + "/"));
});

gulp.task("images-svg", () => {
	return gulp
		.src("src/images/*.svg")
		.pipe(gulp.dest(outputBaseDir + "/images/"));
});

// Copy the files from the libraries
gulp.task("libs-css", () => {
	return gulp
		.src([
			"node_modules/materialize-css/dist/css/materialize.min.css",
			"node_modules/mdi/css/materialdesignicons.min.css"
			])
		.pipe(gulp.dest(outputBaseDir + "/css"));
});

gulp.task("libs-fonts", () => {
	return gulp
		.src([
			"node_modules/materialize-css/dist/fonts/**/*",
			"node_modules/mdi/fonts/*"
			])
		.pipe(gulp.dest(outputBaseDir + "/fonts"));
});

gulp.task("libs-vendor-js", () => {
	return gulp
		.src([
			"node_modules/materialize-css/dist/js/materialize.min.js",
			"node_modules/jquery/dist/jquery.min.js",
			"node_modules/cytoscape/dist/cytoscape.min.js",
			])
		.pipe(gulp.dest(outputBaseDir + "/js"));
});

gulp.task("libs-my-js", () => {
	return gulp
		.src([
			"src/libs/*.js"
			])
		.pipe(releaseBuild ? uglify() : noop())
		.pipe(gulp.dest(outputBaseDir + "/js"));
});

gulp.task("default", [
	"libs-css",
	"libs-fonts",
	"libs-vendor-js",
	"libs-my-js",
	"ts-worker",
	"ts-frontend",
	"images-svg",
	"css",
	"html"
]);