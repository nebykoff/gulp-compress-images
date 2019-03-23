var gulp = require('gulp');
var imagemin = require('gulp-imagemin');
var jpegoptim = require('imagemin-jpegoptim');
var pngquant = require('imagemin-pngquant');
var fs = require('fs');

var data = require('gulp-data');
var exif = require('gulp-exif');
through2 = require('through2');
var rename = require("gulp-rename");

gulp.task('image-google', function () {
  return gulp.src('app/img/**/*')
    .pipe(imagemin([
      pngquant(),
      jpegoptim({
        progressive: true,
        max: 85,
        stripAll: true
      })
    ], {
      verbose: true
    }))
    .pipe(gulp.dest('dist/img'));
});

function addZero(time) {
  time = '' + time;
  if (time.length < 2) time = '0' + time;

  return time;
}

function formatDate(date) {
  var d = new Date(date),
    month = (d.getMonth() + 1),
    day = d.getDate(),
    year = d.getFullYear(),
    hour = d.getHours(),
    minutes = d.getMinutes(),
    seconds = d.getSeconds();

  month = addZero(month);
  day = addZero(day);
  hour = addZero(hour);
  minutes = addZero(minutes);
  seconds = addZero(seconds);

  var result = [year, month, day].join('-') + " " + [hour, minutes, seconds].join('-');
  return result;
}

var imagePathes = new Map();
gulp.task('image-lossless', function () {
  return gulp.src('app/img/**/*.+(jpg|JPG|jpeg|JPEG)')
    .pipe(exif())
    .pipe(data(function (file) { //Получение Даты съемки      
      imagePathes.set(file.path, null);
      try {
        var dateTimeOriginal = file.exif.exif['DateTimeOriginal'].replace(/\:/g, "-");        
        imagePathes.set(file.path, dateTimeOriginal);        
      } catch {
        console.log(file.path + " not have DateTimeOriginal");
      }
    }))
    /*.pipe(through2.obj(function (file, enc, cb) { //Получение даты модификации файла
      //Если из EXIF не удалось выудить дату, то берем ее из даты изменения файла
      if (imagePathes.get(file.path) == null) {
        imagePathes.set(file.path, formatDate(file.stat.mtime));
      }
      cb(null, file);
    }))*/
    .pipe(rename(function (path, file) { //Перименование файла       
      if (imagePathes.get(file.path) != null) {
        path.basename = imagePathes.get(file.path) + " " + path.basename;
        imagePathes.delete(file.path);
      }
    }))
    .pipe(imagemin([ //Сжатие JPEG
      jpegoptim({
        progressive: true,
        stripAll: false,
        stripExif: false,
        max: 80
      })
    ], {
      verbose: true
    }))
    .pipe(gulp.dest('dist/img'));
});