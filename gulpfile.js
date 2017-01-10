var gulp = require('gulp');

//引入组件
var sass = require('gulp-sass'), //sass
	autoprefixer = require('gulp-autoprefixer'), //css加前缀（兼容-webkit内核）
	csslint = require('gulp-csslint'), //css检测
	cleancss = require('gulp-clean-css'), //css压缩
	jshint = require('gulp-jshint'), //js检测
	uglify = require('gulp-uglify'), //js压缩    
	fileinclude = require('gulp-file-include'), //引入公用文件
	useref = require('gulp-useref'), //合并htmlcss/js标签
	concat = require('gulp-concat'), //gulp-useref共同使用
	//制作精灵图  试用pc项目
	gulpPostcss = require('gulp-postcss'),
	postcss = require('postcss'),
	sprites = require('postcss-sprites').default,
	spritesmith = require('spritesmith'),
	//版本号
	rev = require('gulp-rev'),
	revCollector = require('gulp-rev-collector'),
	//else
	merge = require('merge-stream'), //合并任务流
	runSequence = require('run-sequence'), //逐个执行
	clean = require('gulp-clean'), //清除文件
	config = require('./config.js'); //加载项目配置

//检测css文件
gulp.task('css', function() {
	return gulp.src(config.css.sassFile)
		.pipe(sass().on('error', sass.logError)) //解析sass
		.pipe(csslint()) //检测css
		.pipe(autoprefixer({ //很多浏览器目前以兼容
			browsers: ['last 10 versions', 'safari 5', 'ie 8', 'ie 9', 'firefox 20', 'opera 12.1', 'ios 6', 'android 4'],
			cascade: false, //是否美化属性值换行
			remove: false //是否去掉不必要的前缀
		}))
		.pipe(gulp.dest(config.css.devPath)) //导出css
});

// 检测js文件
gulp.task('js', function() {
	return gulp.src(config.js.devFile)
		.pipe(jshint()) // 检查JS
});

//html引入公用文件
gulp.task('inc', function() {
	return gulp.src(config.html.tempFile)
		.pipe(fileinclude({
			prefix: '@@',
			basepath: '@file'
		})).pipe(gulp.dest(config.html.devPath));

});

//监听
gulp.task('watch', ['css', 'js', 'inc'], function() {
	gulp.watch(config.css.sassFile, ['css', 'inc']) //css直接刷新 偶尔有延迟
	gulp.watch(config.html.incFile, ['inc'])
	gulp.watch(config.html.tempFile, ['inc']);
});

//开发服
gulp.task('default', function() {
	gulp.start('css', 'js', 'inc');
});

/******************************正式服******************************/
//html页面合并 
gulp.task('html', function() {
	return gulp.src(config.html.devFile)
		.pipe(useref())
		.pipe(gulp.dest(config.html.buildPath));
});

//生成版本号 发布css js img 
gulp.task('rev', function() {
	var imgrev = gulp.src(config.img.devFile)
		.pipe(rev())
		.pipe(gulp.dest(config.img.buildPath))
		.pipe(rev.manifest())
		.pipe(gulp.dest(config.rev.imgPath)); //生成img到正式服

	var cssrev = gulp.src(config.css.devFile)
		//.pipe(cleancss()) //压缩css
		.pipe(rev())
		.pipe(gulp.dest(config.css.buildPath)) //生成css到正式服
		.pipe(rev.manifest())
		.pipe(gulp.dest(config.rev.cssPath)); //生成css版本号到正式服

	var jsrev = gulp.src(config.js.devFile)
		//.pipe(uglify()) //压缩js
		.pipe(rev())
		.pipe(gulp.dest(config.js.buildPath)) //生成js到开发服
		.pipe(rev.manifest())
		.pipe(gulp.dest(config.rev.jsPath));
	return merge(imgrev, cssrev, jsrev)
})

//html引入版本号 
gulp.task('htmlrev', function() {
	return gulp.src([config.rev.revFile, config.html.buildFile])
		.pipe(revCollector())
		.pipe(gulp.dest(config.html.buildPath));
});

//生成精灵图
var processors = [
	sprites({
		stylesheetPath: config.css.buildPath, //输出路径
		spritePath: config.img.buildPath, //输出路径
		spritesmith: {
			padding: 3
		},
		filterBy: function(image) {
			// Allow only png files
			if (image.url.indexOf('icon/') >= 0) {
				return Promise.resolve();
			}
			return Promise.reject();
		},
		hooks: {
			onUpdateRule: function(rule, token, image) {
				var backgroundSizeX = (image.spriteWidth / image.coords.width) * 100;
				var backgroundSizeY = (image.spriteHeight / image.coords.height) * 100;
				var backgroundPositionX = (image.coords.x / (image.spriteWidth - image.coords.width)) * 100;
				var backgroundPositionY = (image.coords.y / (image.spriteHeight - image.coords.height)) * 100;
				var hasSize = false;
				if (/(sprite.icon.png)/.test(image.spriteUrl)) {
					backgroundPositionX = -1 * image.coords.x + 'px ';
					backgroundPositionY = -1 * image.coords.y + 'px';
				} else {
					backgroundSizeX = isNaN(backgroundSizeX) ? 0 : backgroundSizeX.toFixed(3);
					backgroundSizeY = isNaN(backgroundSizeY) ? 0 : backgroundSizeY.toFixed(3);
					backgroundPositionX = isNaN(backgroundPositionX) ? 0 : (backgroundPositionX.toFixed(3) + '%');
					backgroundPositionY = isNaN(backgroundPositionY) ? 0 : (backgroundPositionY.toFixed(3) + '%');
					hasSize = true;
				}

				var version = (+new Date + '').substring(3);
				var imageUrl = image.spriteUrl + '?v=' + version;
				var backgroundImage = postcss.decl({
					prop: 'background-image',
					value: 'url(' + imageUrl + ')'
				});

				var backgroundSize = postcss.decl({
					prop: 'background-size',
					value: backgroundSizeX + '% ' + backgroundSizeY + '%'
				});

				var backgroundPosition = postcss.decl({
					prop: 'background-position',
					value: backgroundPositionX + ' ' + backgroundPositionY
				});

				rule.insertAfter(token, backgroundImage);
				rule.insertAfter(backgroundImage, backgroundPosition);
				hasSize && rule.insertAfter(backgroundPosition, backgroundSize);
			}
		},
		groupBy: function(image) {
			if (image.url.indexOf('icon/') >= 0) {
				return Promise.resolve('icon');
			}
			return Promise.reject();
		}
	})
];
gulp.task('sprites', function() {
	return gulp.src(config.css.buildFile)
		.pipe(gulpPostcss(processors))
		.pipe(gulp.dest(config.css.buildPath));
});

//清除文件 版本号
gulp.task("cleanrev", function() {
	return gulp.src(config.rev.revPath, {
			read: false
		})
		.pipe(clean({
			force: true
		}))
})

//清除发布文件夹
gulp.task('clean', function() {
	return gulp.src(config.copy.buildPath, {
			read: false
		})
		.pipe(clean({
			force: true
		}))
});

//导出文件
gulp.task('copy', function() {
	return gulp.src(config.img.buildFile)
		.pipe(gulp.dest(config.img.buildPath));
});

//发布web
gulp.task('web', ['clean'], function(callback) {
	runSequence(
		['default'], ['html'], ['rev'], ['copy'], ['htmlrev'], ['cleanrev'], callback);
});

//发布wap
gulp.task('wap', ['clean'], function(callback) {
	runSequence(
		['default'], ['html'], ['rev'], ['copy'], ['htmlrev'], ['cleanrev'], callback);
});