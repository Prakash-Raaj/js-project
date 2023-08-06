const express = require('express');
const path = require('path');
const myApp = express();

myApp.use(express.urlencoded({ extended: false }));

// setting path to views folder
myApp.set('views', path.join(__dirname, 'views'));

// path to render static contents like, images, styles css etc,.
myApp.use(express.static(__dirname + '/public'));

myApp.set('view engine', 'ejs');

myApp.get('/', (req, res) => {
  res.render('index');
});

myApp.listen('8080');
console.log('App running on port 8080');
