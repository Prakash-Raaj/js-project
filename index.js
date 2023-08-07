const express = require('express');
const path = require('path');
const { check, validationResult } = require('express-validator');
const myApp = express();
const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/cmsDB');

const User = mongoose.model('User', {
  username: String,
  password: String,
});
myApp.use(express.urlencoded({ extended: false }));

// setting path to views folder
myApp.set('views', path.join(__dirname, 'views'));

// path to render static contents like, images, styles css etc,.
myApp.use(express.static(__dirname + '/public'));

myApp.set('view engine', 'ejs');

myApp.get('/', (req, res) => {
  res.render('index');
});

myApp.get('/login', (req, res) => {
  res.render('login');
});

myApp.get('/signup', (req, res) => {
  res.render('signup');
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
        var passErr = {
          pasError: 'Minimum purchase should be of $10.',
        };
        res.render('signup', passErr);
      } else {
        var formData = {
          username: username,
          password: password,
        };
        var userData = new User(formData);
        userData.save().then(function () {
          console.log('User Created');
        });
        res.render('login');
      }
    }
  }
);

myApp.post(
  '/login',
  [
    check(
      'username',
      'Please enter a valid email address'
    ).notEmpty(),
    check('password', 'must have atleast 8 characters').notEmpty(),
  ],
  (req, res) => {
    var userData = {
      username: req.body.username,
      password: req.body.password,
    };

    User.findOne(userData).then((user) => {
      req.session.username = user.name;
      req.session.isLoggedIn = true;
    });
  }
);

myApp.listen('8080');
console.log('App running on port 8080');
