import gulp from "gulp";
import sass from "gulp-sass";
import compiler_sass from "node-sass";
import browserSync from "browser-sync";
import cssnano from "cssnano";
import tildeImporter from "node-sass-tilde-importer";
import plumber from "gulp-plumber";
import postcss from "gulp-postcss";
import sourcemaps from "gulp-sourcemaps";
import pug from "gulp-pug";
import imagemin from "gulp-imagemin";

import browserify from "browserify";
import babelify from "babelify";
import source from "vinyl-source-stream";
import buffer from "vinyl-buffer";
import minify from "gulp-minify";

sass.compiler = compiler_sass;

// Variables de consiguracion
const server = browserSync.create();

const postcssPlugins = [
  cssnano({
    core: true,
    zindex: false,
    autoprefixer: {
      add: true,
      browsers: "> 1%, last 2 versions, Firefox ESR, Opera 12.1"
    }
  })
];

const sassDevConf = {
  importer: tildeImporter,
  outputStyle: "expanded",
};

// Server BroserSyc

function serverInit(done) {
  server.init({
    server: {
      baseDir: "./public"
    }
  });
  done();
}

// BrowserSync Reload
function browserSyncReload(done) {
  server.reload();
  done();
}

// Fuction watcher
function watchFiles() {
  gulp.watch("./src/scss/**/**", gulp.series("dev-styles"));
  gulp.watch("./src/js/**/**", gulp.series("scripts-dev"));
  gulp.watch("./src/pug/**/**", gulp.series("dev-pug", browserSyncReload));
}

gulp.task("dev-styles", () => {
  return gulp
    .src(['node_modules/bootstrap/scss/bootstrap.scss',"./src/scss/styles.scss"])
    .pipe(sourcemaps.init({ loadMaps: true }))
    .pipe(plumber())
    .pipe(sass(sassDevConf))
    .pipe(postcss(postcssPlugins))
    .pipe(sourcemaps.write("."))
    .pipe(gulp.dest("./public/assets/css"))
    .pipe(server.stream({ match: "**/*.css" }));
});

gulp.task("dev-pug", () => {
  return gulp
    .src("./src/pug/pages/**/*.pug")
    .pipe(plumber())
    .pipe(
      pug({
        pretty: true,
        basedir: "./src/pug"
      })
    )
    .pipe(gulp.dest("./public"));
});

gulp.task("scripts-dev", () => {
  return browserify("./src/js/index.js")
    .transform(babelify, {
      global: true // permite importar desde afuera (como node_modules)
    })
    .bundle()
    .on("error", function(err) {
      console.error(err);
      this.emit("end");
    })
    .pipe(source("scripts.js"))
    .pipe(buffer())
    .pipe(
      minify({
        ext: {
          src: "-min.js",
          min: ".js"
        }
      })
    )
    .pipe(sourcemaps.init({ loadMaps: true }))
    .pipe(sourcemaps.write("."))
    .pipe(gulp.dest("./public/assets/js"))
    .pipe(server.stream({ match: "**/*.js" }));
});

gulp.task('js', function() {
  return gulp.src(['./node_modules/bootstrap/dist/js/bootstrap.min.js', './src/js/popper.min.js', './src/js/jquery.min.js'])
      .pipe(gulp.dest("./public/assets/js"))
      .pipe(browserSync.stream({ match: "**/*.js" }));
});

gulp.task("media", () => {
  return gulp.src("./src/img/**/**").pipe(gulp.dest("./public/assets/img"));
});

gulp.task(
  "dev",
  gulp.series("dev-styles", "dev-pug", "scripts-dev","js", serverInit, watchFiles)
);
