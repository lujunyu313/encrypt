var fs = require('fs');
var path = require('path');
var crypto = require('crypto');
var res_dir = "./test"; //资源路径
var key = 20140101; //密匙

var walk = function(dir, done) {
  var results = [];
  fs.readdir(dir, function(err, list) {
    var pending = list.length;
    if (!pending) return done(null, results);
    list.forEach(function(file) {
      file = dir + '/' + file;
      fs.stat(file, function(err, stat) {
        if (stat && stat.isDirectory()) {
          walk(file, function(err, res) {
            results = results.concat(res);
            if (!--pending) done(null, results);
          });
        } else {
          results.push(file);
          if (!--pending) done(null, results);
        }
      });
    });
  });
};

var mkdirSync = function(url, mode, cb) {
  var arr = url.split("/");
  mode = mode || 0755;
  cb = cb || function(){};

  if(arr[0]===".") {
    arr.shift();
  }

  if(arr[0]==="..") {
    arr.splice(0, 2, arr[0] + "/" + arr[1]);
  }

  function inner(cur) {
    if(!fs.existsSync(cur)) {
      fs.mkdirSync(cur, mode);
    }
    if(arr.length) {
      inner(cur + "/" + arr.shift());
    } else {
      cb();
    }
  }
  arr.length && inner(arr.shift());
};

walk(res_dir, function(err, files) {
  if (err) {
    console.log('[ERROR] when read files ', err);
  }

  files = files.filter(function(file) {
    return /(\.xpng$)|(\.xwebp$)|(\.xjpg$)/.test(file);
  });

  files.forEach(function(file) {
    console.log("解密" + file);

    /*
    *分离路径和文件名
    */
    // var url = file.split("/");
    // var name = url.pop();
    // var len = name.length;
    // var dir = path.join(res_dir,file.slice(res_dir.length, file.length - len));

    // name = name.split('.');
    // var fileName = name[0] + "." + name[1].slice(1, name[1].length);

    var dir = "";
    if(/(\.xpng)/.test(file)) {
        dir = file.replace(/(xpng)/, "png");
    } else if(/(\.xwebp)/.test(file)) {
        dir = file.replace(/(xwebp)/, "webp");
    } else if(/(\.xjpg)/.test(file)) {
        dir = file.replace(/(xjpg)/, "jpg");
    } 

    //创建文件
   // mkdirSync(dir);

    fs.readFile(file, function(err, data) {
      if (err) {
        console.error(err);
        return;
      }
      var len = data.length;
      var buf = new Buffer(data);
      for (var i = 0; i < len; i++) {
        buf[i] = data[i] ^ key;
      }

      fs.writeFile(dir, buf, function(err) {
        if (err) {
          console.error(err);
          console.log(dir + "导出失败");
          return;
        }
        console.log(dir + "导出成功");
        fs.unlink(file, function(e){
          if(e) {
            console.log(e);
          }
        });
      });
    });
  });
});