const express = require("express");
const app = express();
const path = require("path");
const bodyParser = require("body-parser");
const exphbs = require("express-handlebars");
const db = require(path.join(__dirname, "/modules/dbModule"));
const clientSessions = require("client-sessions");

const HTTP_PORT = process.env.PORT || 8080;

app.use(bodyParser.urlencoded({ 
    extended: true
})); 

app.use(express.static(path.join(__dirname, "public")));

app.use(express.static(path.join(__dirname, "views")));

app.engine(".hbs", exphbs({
    extname: ".hbs",
    defaultLayout: false
}))

app.set("view engine", ".hbs");

app.use(clientSessions({
    cookieName: 'session',
    secret: 'northstarhrmgmt',
    duration: 24 * 60 * 60 * 1000,
    activeDuration: 1000 * 60 * 5
}));

const user = {
    username: "admin",
    pwd: "admin",
    isManager: true
}

// ROUTES
app.get("/", (req, res) => {
    res.render("home", {layout: false, user: req.session.user})
})

app.get("/dashboard", (req, res) => {
    res.render("dashboard", {user: req.session.user, layout: false})
})

app.get("/login", (req, res) => {
    res.render("login", {user: req.session.user, layout: false})
})

app.post("/login", (req, res) => {
    const username = req.body.username;
    const pwd = req.body.pwd;
    // validation here (go to the database)
    console.log(username, pwd)
    if (username === "" || pwd === "") {
        return res.render("login", {errorMsg: "Both fields are required!", user: req.session.user, layout: false});
    }
    if (username === user.username && pwd === user.pwd) {
        req.session.user = {
            username: user.username,
        };
        res.redirect("/dashboard")
    } else {
        res.render("login", {errorMsg: "The login credentials do not match.", user: req.session.user, layout: false});
    }

});

app.get("/logout", (req, res) => {
    req.session.reset();
    res.redirect("/");
})

app.get("/about", (req, res) => {
    res.render("about", {layout: false})
})

app.get("/employees", (req, res) => {
    if (req.query.department) {
        db.getEmployeesByDepartment(req.query.department)
        .then((data) => {
            if (data.length > 0) {
                res.render("employees", {employees: data, user: req.session.user});
            } else {
                res.render("employees", {message: "no results", user: req.session.user});
            }
        }).catch(() => {
            res.render("employees", {message: "Encountered error"});})
    } else {
        db.getAllEmployees()
        .then((data) => {
            if (data.length > 0) {
                res.render("employees", {employees: data, user: req.session.user});
            } else {
                res.render("employees", {message: "no results", user: req.session.user});
            }}
        ).catch(() => {
            res.render("employees", {message: "Encountered error"});
        })
    }
});

app.get("/departments", (req, res) => {
    db.getDepartments()
    .then((data) => {
        if (data.length > 0) {
            res.render("departments", {departments: data, user: req.session.user});
        } else {
            res.render("departments", {message: "no results", user: req.session.user})
    }}).catch(() => {
        res.render("departments", {message: "Encountered error"});
    })
});

// INITIALIZE
db.initialize().then(() => {
    app.listen(HTTP_PORT, ()=>{
        console.log("listening on: " + HTTP_PORT);
    });
}).catch((err) => {
    console.log(err);
})