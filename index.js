//Importing the required modules
const express = require("express");
const path = require("path");
const { check, validationResult } = require("express-validator");
const session = require("express-session");
const fileupload = require("express-fileupload");
const myApp = express();
const mongoose = require("mongoose");

//Connecting to MongoDB Database
mongoose.connect("mongodb://127.0.0.1:27017/cmsDB");

//Defining User model
const User = mongoose.model("User", {
  username: String,
  password: String,
});

//Defining Page model
const Page = mongoose.model("Page", {
  pagetitle: String,
  imgPath: String,
  description: String,
});

//Setting the middleware
myApp.use(express.urlencoded({ extended: false }));
myApp.use(fileupload());
myApp.use(
  session({
    secret: "Project",
    resave: false,
    saveUninitialized: true,
  })
);

// setting path to views folder
myApp.set("views", path.join(__dirname, "views"));

// path to render static contents like, images, styles css etc,.
myApp.use(express.static(__dirname + "/public"));

myApp.set("view engine", "ejs");

//
const folderPath = "public/Images/";

//Route to home page
myApp.get("/", (req, res) => {
  Page.find({})
    .then((pages) => {
      console.log("Pages:", pages);
      res.render("index", { pages: pages, page: pages[0] });
    })
    .catch((err) => {
      console.log(err);
    });
});

//Route to Admin login page
myApp.get("/login", (req, res) => {
  Page.find({})
    .then((pages) => {
      console.log("Pages:", pages);
      res.render("login", { pages: pages, page: pages[0] });
    })
    .catch((err) => {
      console.log(err);
    });
});

//Route to Signup page
myApp.get("/signup", (req, res) => {
  Page.find({})
    .then((pages) => {
      console.log("Pages:", pages);
      res.render("signup", { pages: pages, page: pages[0] });
    })
    .catch((err) => {
      console.log(err);
    });
});

//Route to Admin Dashboard page
myApp.get("/adminDashboard", (req, res) => {
  res.render("adminDashboard");
});

//Signup submission functionality
myApp.post(
  "/signup",
  [
    check("username", "Please enter a valid email address").notEmpty(),
    check("password", "please enter valid password").notEmpty(),
  ],
  function (req, res) {
    var username = req.body.username;
    var password = req.body.password;
    var reEnterPassword = req.body.rePassword;
    //Validation results
    var errors = validationResult(req);
    console.log(errors);
    // Handle validation errors
    console.log(errors.array());
    Page.find({})
      .then((pages) => {
        if (!errors.isEmpty()) {
          var errorData = errors.array();
          res.render("signup", { pages: pages, errorData: errorData });
        } else {
          // Check password match
          if (password !== reEnterPassword) {
            var pasError = [
              {
                msg: "Passwords dont match",
              },
            ];
            res.render("signup", { pages: pages, errorData: pasError });
          } else {
            //Save user credentials
            var formData = {
              username: username,
              password: password,
            };
            var userData = new User(formData);
            userData.save().then(function () {
              console.log("User Created");
            });
            res.redirect("/login");
          }
        }
      })
      .catch((err) => {
        console.log(err);
      });
  }
);

// Login submission functionality
myApp.post(
  "/login",
  [
    check("username", "Please enter a username").notEmpty(),
    check("password", "Please enter valid password").notEmpty(),
  ],
  (req, res) => {
    var errors = validationResult(req);

    var userData = {
      username: req.body.username,
      password: req.body.password,
    };
    Page.find({})
      .then((pages) => {
        if (!errors.isEmpty()) {
          var errorData = errors.array();
          res.render("login", { pages: pages, errorData: errorData });
        } else {
          User.findOne(userData)
            .then((user) => {
              req.session.username = user.username;
              req.session.isLoggedIn = true;
              res.redirect("/adminDashboard");
            })
            .catch((err) => {
              console.log(err);
            });
        }
      })
      .catch((err) => {
        console.log(err);
      });
  }
);

//Route to add pages
myApp.get("/addpage", (req, res) => {
  req.session.isLoggedIn ? res.render("addpage") : res.redirect("login");
});

//add page submission functionality
myApp.post("/addpage", (req, res) => {
  var imageFile = req.files.pageImg;
  var imageFileName = imageFile.name;
  var imagePath = folderPath + imageFileName;
  imageFile.mv(imagePath, function (err) {
    if (err) {
      console.log(err);
    }
  });
  //Save page data to database
  var addData = {
    pagetitle: req.body.pagetitle,
    imgPath: "/Images/" + imageFileName,
    description: req.body.description,
  };
  var pageData = new Page(addData);
  pageData.save().then(function () {
    console.log("Page Added");
  });
  res.render("added");
});

//Route to edit page dashboard
myApp.get("/editPages", (req, res) => {
  //Retrieve all pages from database for editing
  req.session.isLoggedIn
    ? Page.find({})
        .then((pages) => {
          res.render("editPages", { pages: pages });
        })
        .catch((err) => {
          console.log(err);
        })
    : res.redirect("login");
});

//Route to edit one of the saved pages
myApp.get("/editpage/:pageId", (req, res) => {
  var pageId = req.params.pageId;
  //Finding specific page from database for editing
  Page.findOne({ _id: pageId })
    .then((page) => {
      res.render("editpage", page);
    })
    .catch((err) => {
      console.log(err);
    });
});

//Route to edit Specific page & its functionality
myApp.post("/editpage/:pageId", (req, res) => {
  // Find the page using pageId in the database to be edited
  Page.findOne({ _id: req.params.pageId })
    .then((page) => {
      console.log("check for page page", page);
      //Use already added image
      var imagePath = page.imgPath;
      //Update the new image if provided
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
      //Update the page in the database
      Page.findByIdAndUpdate(req.params.pageId, pageData)
        .then((page) => {
          console.log("Page updated", page);
          res.render("edited");
        })
        .catch((err) => {
          console.log(err);
        });
    })
    .catch((err) => {
      console.log(err);
    });
});

//Route to delete & its functionality
myApp.get("/delete/:pageId", (req, res) => {
  var pageId = req.params.pageId;
  // Find and delete a page in database
  Page.findOneAndDelete({ _id: pageId })
    .then(function () {
      res.render("delete");
    })
    .catch((err) => {
      console.log(err);
    });
});

//Route to logout
myApp.get("/logout", (req, res) => {
  req.session.isLoggedIn = true;
  Page.find({})
    .then((pages) => {
      res.render("logout", { pages: pages });
    })
    .catch((err) => {
      console.log(err);
    });
});

//Route to template page
myApp.get("/:pageId", (req, res) => {
  Page.find({})
    .then((pages) => {
      // Find and render a specific page by ID
      var pageId = req.params.pageId;
      Page.findById(pageId)
        .then((page) => {
          res.render("index", { pages: pages, page: page });
        })
        .catch((err) => {
          console.log(err);
        });
    })
    .catch((err) => {
      console.log(err);
    });
});

//Start the server
myApp.listen("8080");
console.log("App running on port 8080");
