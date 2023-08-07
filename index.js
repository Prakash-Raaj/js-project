const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const { check, validationResult } = require('express-vaildator');
const myApp = express();

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

myApp.post(
  '/login',
  [
    check('username', 'Please enter username').notEmpty(),
    check('password', 'Please enter password').notEmpty(),
  ],
  function (req, res) {
    var userData = {
      username: req.body.username,
      password: req.body.password,
    };

    User.findOne(userData)
      .then((user) => {
        req.session.username = user.username;
        req.isLoggedIn = true;
        res.render('adminDashboard');
      })
      .catch((err) => {
        console.log(err);
        res.render('login');
      });
  }
);

myApp.listen('8080');
console.log('App running on port 8080');
