/*config file*/
var dev = './path'; //开发目录
var build = './dist'; //发布目录

//path路径
//file文件
module.exports = {
  copy: {
    buildPath: build + '/',
  },
  img: {
    devFile: dev + '/img/**/*.*',
    buildPath: build + '/img',
    buildFile: build + '/img/**/*.*'
  },
  css: {
    sassFile: dev + '/sass/**/*.scss', //所有scss文件
    devPath: dev + '/css',
    devFile: dev + '/css/*.css',
    buildPath: build + '/css',
    buildFile: build + '/css/*.css'
  },
  js: {
    devFile: dev + '/js/**/*.js', //所有js文件
    buildPath: build + '/js',
    buildFile: [build + '/js/**/*.*'], //所有js文件dev + '/js/**/*.js', 
  },
  html: {
    tempFile: dev + '/template/*.html', //页面    
    incFile: dev + '/template/inc/*.inc', //公用页面
    devPath: dev + '/', //开发生成目录
    devFile: dev + '/*.html',
    buildPath: build + '/',
    buildFile: build + '/*.html'
  },
  rev: {
    revPath: build + '/rev',
    revFile: build + '/rev/**/*.json',
    imgPath: build + '/rev/img',
    cssPath: build + '/rev/css',
    jsPath: build + '/rev/js',
    jsFile: build + '/rev/js/*.json'
  }
}