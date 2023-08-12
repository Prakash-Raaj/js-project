const express = require('express');
const path = require('path');
const { check, validationResult } = require('express-validator');
const session = require('express-session');
const fileupload = require('express-fileupload');
const myApp = express();
const mongoose = require('mongoose');

// mongoose.connect('mongodb://localhost:27017/cmsDB');
mongoose.connect('mongodb://127.0.0.1:27017/cmsDB');

const User = mongoose.model('User', {
  username: String,
  password: String,
});

const Page = mongoose.model('Page', {
  pagetitle: String,
  imgPath: String,
  description: String,
});

myApp.use(express.urlencoded({ extended: false }));

myApp.use(fileupload());

myApp.use(
  session({
    secret: 'Project',
    resave: false,
    saveUninitialized: true,
  })
);

// setting path to views folder
myApp.set('views', path.join(__dirname, 'views'));

// path to render static contents like, images, styles css etc,.
myApp.use(express.static(__dirname + '/public'));

myApp.set('view engine', 'ejs');

const folderPath = 'public/Images/';

myApp.get('/', (req, res) => {
  res.render('index');
});

myApp.get('/login', (req, res) => {
  res.render('login');
});

myApp.get('/signup', (req, res) => {
  res.render('signup');
});

myApp.get('/adminDashboard', (req, res) => {
  res.render('adminDashboard');
});

myApp.post(
  '/signup',
  [
    check(
      'username',
      'Please enter a valid email address'
    ).notEmpty(),
    check('password', 'must have atleast 8 characters').notEmpty(),
  ],
  function (req, res) {
    var username = req.body.username;
    var password = req.body.password;
    var reEnterPassword = req.body.rePassword;
    // console.log(req.body);

    var errors = validationResult(req);
    console.log(errors);

    console.log(errors.array());
    if (!errors.isEmpty()) {
      var formData = { errors: errors.array() };
      res.render('signup', formData);
    } else {
      if (password !== reEnterPassword) {
        var pasError = {
          errors: [
            {
              msg: 'Passwords dont match',
            },
          ],
        };
        res.render('signup', pasError);
      } else {
        var formData = {
          username: username,
          password: password,
        };
        var userData = new User(formData);
        userData.save().then(function () {
          console.log('User Created');
        });
        // res.render('login');
        res.redirect('/login');
      }
    }
  }
);

myApp.post(
  '/login',
  [
    check('username', 'Please enter a username').notEmpty(),
    check('password', 'must have atleast 8 characters').notEmpty(),
  ],
  (req, res) => {
    var errors = validationResult(req);
    var userData = {
      username: req.body.username,
      password: req.body.password,
    };
    if (!errors.isEmpty()) {
      var errorData = errors.array();
      res.render('login', errorData);
    } else {
      User.findOne(userData)
        .then((user) => {
          req.session.username = user.username;
          req.session.isLoggedIn = true;
          // res.render('adminDashboard');
          res.redirect('/adminDashboard');
        })
        .catch((err) => {
          console.log(err);
        });
    }
  }
);

myApp.get('/addpage', (req, res) => {
  res.render('addpage');
});

myApp.post('/addpage', (req, res) => {
  var imageFile = req.files.pageImg;
  var imageFileName = imageFile.name;
  var imagePath = folderPath + imageFileName;
  imageFile.mv(imagePath, function (err) {
    if (err) {
      console.log(err);
    }
  });
  var addData = {
    pagetitle: req.body.pagetitle,
    imgPath: '/Images/' + imageFileName,
    description: req.body.description,
  };
  var pageData = new Page(addData);
  pageData.save().then(function () {
    console.log('Page Added');
  });
  res.render('added');
});

myApp.get('/editPages', (req, res) => {
  Page.find({})
    .then((pages) => {
      // console.log('Pages length', pages.length);
      // console.log('The pages are', pages);
      res.render('editPages', { pages: pages });
    })
    .catch((err) => {
      console.log(err);
    });
});

myApp.get('/editpage/:pageId', (req, res) => {
  var pageId = req.params.pageId;
  Page.findOne({ _id: pageId })
    .then((page) => {
      // console.log('Edit page',page)
      res.render('editpage', page);
    })
    .catch((err) => {
      console.log(err);
    });
});

myApp.get('/delete/:pageId', (req, res) => {
  var pageId = req.params.pageId;
  Page.findOneAndDelete({ _id: pageId })
    .then(function () {
      res.render('delete');
    })
    .catch((err) => {
      console.log(err);
    });
});

myApp.post('/editpage/:pageId', (req, res) => {
  Page.findOne({ _id: req.params.pageId })
    .then((page) => {
      console.log('check for page page', page);
      var imagePath = page.imgPath;
      if (req.files !== null) {
        var imageFile = req.files.pageImg;
        var imageFileName = imageFile.name;
        imagePath = folderPath + imageFileName;
        imageFile.mv(imagePath, function (err) {
          if (err) {
            console.log(err);
          }
        });
      }

      var pageData = {
        pagetitle: req.body.pagetitle,
        imgPath: imagePath,
        description: req.body.description,
      };
      Page.findByIdAndUpdate(req.params.pageId, pageData)
        .then((page) => {
          console.log('Page updated', page);
          res.render('edited');
        })
        .catch((err) => {
          console.log(err);
        });
    })
    .catch((err) => {
      console.log(err);
    });
});

myApp.listen('8080');
console.log('App running on port 8080');
