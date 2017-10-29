var gulp = require("gulp");
var ts = require("gulp-typescript");
var uglify = require('gulp-uglify');
var sourcemaps = require('gulp-sourcemaps');
var noop = require("gulp-noop");
var assign = require('object-assign');
var gutil = require('gulp-util');
//var debug = require('gulp-debug-streams');

var releaseBuild = (gutil.env.release != undefined);

var outputBaseDir = releaseBuild ? "release" : "debug";

// Create a typescript project for the different configurations for
// frontend and backend.
// The outfile must be specified with a complete path or it will not
// be put into the right directory (see below)
var frontendProject = ts.createProject('src/ts/frontend/tsconfig.json');
var workerProject = ts.createProject('src/ts/worker/tsconfig.json');
var sharedProject = ts.createProject('src/ts/shared/tsconfig.json');

gutil.log("Output directory is", gutil.colors.cyan(outputBaseDir));

// Compile the typescript worker code using the tsconfig.json from the woker directory.
// The frontend config sources the shared config and adds some settings.
gulp.task("ts-worker", () => {
	//return workerProject.src()
	return gulp.src([
				"src/ts/worker/*.ts"
			])
		.pipe(releaseBuild ? noop() : sourcemaps.init())
		.pipe(workerProject(ts.reporter.longReporter()))
		.pipe(releaseBuild ? uglify() : noop() )
		.pipe(releaseBuild ? noop() : sourcemaps.write("."))
		.pipe(gulp.dest(outputBaseDir + "/js/worker"));
});

// Compile the typescript frontend code using the tsconfig.json from the frontend directory.
// The frontend config sources the shared config and adds some settings.
gulp.task("ts-frontend", () => {
	//return frontendProject.src()
	return gulp.src([
				"src/ts/frontend/*.ts"
			])
		.pipe(releaseBuild ? noop() : sourcemaps.init())
		.pipe(frontendProject(ts.reporter.longReporter()))
		.pipe(releaseBuild ? uglify() : noop())
		.pipe(releaseBuild ? noop() : sourcemaps.write("."))
		.pipe(gulp.dest(outputBaseDir + "/js/frontend"));
});

// Compile the shared typescript modules using the basic config from the shared directory.
gulp.task("ts-shared", () => {
	//return frontendProject.src()
	return gulp.src([
				"src/ts/shared/*.ts"
			])
		.pipe(releaseBuild ? noop() : sourcemaps.init())
		.pipe(sharedProject(ts.reporter.longReporter()))
		.pipe(releaseBuild ? uglify() : noop())
		.pipe(releaseBuild ? noop() : sourcemaps.write("."))
		.pipe(gulp.dest(outputBaseDir + "/js/shared"));
});

// Copy (and uglifly) all js files from the js directory to the output directory.
gulp.task("js", () => {
	return gulp.src([
				"src/js/**/*.js"
			])
		.pipe(releaseBuild ? noop() : sourcemaps.init())
		.pipe(releaseBuild ? uglify() : noop())
		.pipe(releaseBuild ? noop() : sourcemaps.write("."))
		.pipe(gulp.dest(outputBaseDir + "/js"));
});

// Copy the vendor js files and additional libraries to the output directory.
// In contrast to the "js" task this task does not alter the vender files in any way.
gulp.task("js-vendor", () => {
	return gulp.src([
				"src/libs/*.js",
				"node_modules/materialize-css/dist/js/materialize.min.js",
				"node_modules/jquery/dist/jquery.min.js",
				"node_modules/cytoscape/dist/cytoscape.min.js",
				"node_modules/requirejs/require.js"
			])
		.pipe(gulp.dest(outputBaseDir + "/js"));
});

// Process CSS files and copy them to the output directory.
gulp.task("css", () => {
	return gulp.src([
				"src/css/*.css",
				"node_modules/materialize-css/dist/css/materialize.min.css",
				"node_modules/mdi/css/materialdesignicons.min.css"
			])
		.pipe(gulp.dest(outputBaseDir + "/css/"));
});

// Process HTML files and copy them to the output directory.
gulp.task("html", () => {
	return gulp
		.src([
				"src/html/*.html"
			])
		.pipe(gulp.dest(outputBaseDir + "/"));
});

// Process all SVG images and copy them to the output directory.
gulp.task("images-svg", () => {
	return gulp
		.src([
				"src/images/*.svg"
			])
		.pipe(gulp.dest(outputBaseDir + "/images/"));
});

// Process fonts and copy them to the output directory
gulp.task("fonts", () => {
	return gulp
		.src([
				"node_modules/materialize-css/dist/fonts/**/*",
				"node_modules/mdi/fonts/*"
			])
		.pipe(gulp.dest(outputBaseDir + "/fonts"));
});

gulp.task("default", [
	"ts-worker",
	"ts-frontend",
	"ts-shared",
	"js",
	"js-vendor",
	"images-svg",
	"css",
	"html",
	"fonts"
]);