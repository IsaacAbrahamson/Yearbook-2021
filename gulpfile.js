// Setup file structure
const devEnv = (process.env.NODE_ENV !== 'production')
const src = 'src/'
const dist = 'dist/'

// Load plugins
const gulp = require('gulp')
const newer = require('gulp-newer')
const pug = require('gulp-pug')
const noop = require('gulp-noop')
const htmlmin = require('gulp-htmlmin')
const sourcemaps = devEnv ? require('gulp-sourcemaps') : null
const sass = require('gulp-dart-sass')
const postcss = require('gulp-postcss')
const autoprefixer = require('autoprefixer')
const mqpacker = require('css-mqpacker')
const cssnano = require('cssnano')
const browserSync = require('browser-sync').create()
const cleaner = require('gulp-clean')
const surge = require('gulp-surge')
const log = require('fancy-log')
const minify = require('gulp-minify')
const fs = require('fs')
const path = require('path')
const data = require('gulp-data')
const run = require('gulp-run')
const flatmap = require('gulp-flatmap')



// Remove previous build and create clean /dist folder
function clean() {
  return gulp.src(dist, {read: false, allowEmpty: true})
  .pipe(cleaner())
  .on('end', () => log.info(`${dist} cleaned and ready to build`))
}
exports.clean = clean



// Move images from /src to /dist
function images() {
  return gulp.src(src + 'img/**/*')
  .pipe(newer(dist + 'img/'))
  .pipe(gulp.dest(dist + 'img/'))
}
exports.images = images



// Render views based on data
// Data is attached to view based on filename
// E.g. /views/events.pug will have data built from /data/events.json
// Do not build individual groups pages as they have specialized rendering
function views() {
  return gulp.src(['src/views/*.pug', '!src/views/groups-*.pug'])
  .pipe(data(view => {
    // Grab JSON data file based on view name
    const viewName = path.basename(view.path, '.pug')
    const jsonpath = './src/data/' + viewName + '.json'
    // Skip data process if there is no JSON matching a view
    if (fs.existsSync(jsonpath)) {
      // Parse JSON data
      let json = fs.readFileSync(jsonpath)
      log.info(`JSON data ${jsonpath} matched with ${view.path}`)
      return JSON.parse(json)
    }
    else noop()
  }))  
  
  // Render into HTML
  .pipe(pug())
  .on('end', () => log.info(`All views rendered`))
  
  // Minimize in production environments
  .pipe(devEnv ? noop() : htmlmin({ collapseWhitespace: true }))
  .on('end', () => devEnv ? log.info(`HTML minify skipped for development environment`) : log.info(`HTML minified for production`))
  .pipe(gulp.dest(dist + '/'))
}
exports.views = views



// Render groups list into subgroups
function render_subgroups() {
  return run(`python ./render_list.py ./src/views/groups-subgroups.pug ./src/data/groups.json ./dist name`).exec()
  .on('error', err => {
    log.warn(err.toString())
    process.exit(-1)
  })
}
exports.render_subgroups = render_subgroups

// Render group detail pages
function render_groups_detail() {
  return gulp.src('./src/data/subgroups/*.json')
  // Grab every subgroup data file and run the render script for each
  .pipe(flatmap((stream, file) => {   
    // Render subgroup detail pages 
    return run(`python ./render_list.py ./src/views/groups-detail.pug ./src/data/subgroups/${file.basename} ./dist name`).exec()
    .on('error', err => {
      console.log(err.toString())
      process.exit(-1)
    })
  }))
}
exports.render_groups_detail = render_groups_detail



// Process Sass into CSS
// Run sourcemaps if not production
// Minify and prefix CSS
// Stream changes for live reload
function styles() {
  return gulp.src(src + 'css/**/*')
  .pipe(sourcemaps ? sourcemaps.init() : noop())
  .pipe(sass({outputStyle: 'compressed'}).on('error', sass.logError))
  .on('end', () => log.info(`All styles processed`))
  .pipe(postcss([ autoprefixer, mqpacker, cssnano ]))
  .pipe(sourcemaps ? sourcemaps.write() : noop())
  .on('end', () => log.info(`All styles minified and prefixed`))
  .pipe(gulp.dest(dist + 'css/'))
  .pipe(browserSync.stream())
}
exports.styles = styles



// Move updated assets to /dist
function assets() {
  return gulp.src([src + 'assets/**/*'])  
  .pipe(newer(dist + '/'))
  .pipe(gulp.dest(dist + 'assets/'))
  .on('end', () => log.info(`All assets moved to ${dist}`))
}
exports.assets = assets



// Move updated scripts to /dist
function js() {
  return gulp.src(src + 'js/**/*')
  .pipe(newer(dist + '/'))
  .pipe(devEnv ? noop() : minify())
  .on('end', () => devEnv ? log.info('JavaScript minify not ran for development environment') : log.info('JavaScript minified for production'))
  .pipe(gulp.dest(dist + 'js/'))
}
exports.js = js



// Live local server
// Automatically watch and rebuild website on changes and refresh connected browsers
function watch(done) {
  // setup browser-sync
  browserSync.init({
    server: { baseDir: "./dist" }
  })

  // reload when image changes
  gulp.watch(src + 'img/**/*', images)
  gulp.watch(dist + "img/**/*").on('change', browserSync.reload)

  // reload when asset changes
  gulp.watch(src + 'assets/**/*', assets)
  gulp.watch(dist + "assets/**/*").on('change', browserSync.reload)

  // reload when html changes
  gulp.watch(src + 'views/**/*', gulp.series(views, render_subgroups, render_groups_detail))  
  gulp.watch(dist + '*.html').on('change', browserSync.reload)

  // css is automatically injected when changed so no reload
  gulp.watch(src + 'css/**/*', styles)

  // reload when javascript changes
  gulp.watch(src + 'js/**/*', js)
  gulp.watch(dist + 'js/*.js').on('change', browserSync.reload)

  // reload when data changes
  gulp.watch(src + 'data/**/*', gulp.series(views, render_subgroups, render_groups_detail))
  gulp.watch(dist + '*.html').on('change', browserSync.reload)

  done()
}
exports.watch = watch;



// Deploy a public demo to test and show changes
function testserver() {
  let project = './dist'
  let domain = `totallynotvintage.surge.sh`
  return surge({ project, domain })
}
exports.testserver = testserver;



// Build project from scratch
// clean directory
// optimize images
// Concurrently process views, styles, scripts, and move assets to /dist
exports.build = gulp.series(
  exports.clean,
  exports.images,
  gulp.parallel(exports.views, exports.styles, exports.js, exports.assets),
  exports.render_subgroups,
  exports.render_groups_detail
)