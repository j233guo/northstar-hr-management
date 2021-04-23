const express = require("express");
const app = express();
const path = require("path");
const bodyParser = require("body-parser");
const exphbs = require("express-handlebars");
const db = require(path.join(__dirname, "/modules/dbModule"));
const clientSessions = require("client-sessions");
const prompts = require('prompts');
const hash = require("object-hash");
const { response } = require("express");


// SETUP
const HTTP_PORT = process.env.PORT || 8080;

app.use(bodyParser.urlencoded({ 
    extended: true
})); 

app.use(express.static(path.join(__dirname, "public")));

app.use(express.static(path.join(__dirname, "views")));

app.engine(".hbs", exphbs({
    extname: ".hbs",
    defaultLayout: false,
    helpers: {
        equal: function (lvalue, rvalue, options) {
            if (arguments.length < 3)
                throw new Error("Handlebars Helper equal needs 2 parameters");
            if (lvalue != rvalue) {
                return options.inverse(this);
            } else {
                return options.fn(this);
            }
        }
    }
}))

app.set("view engine", ".hbs");

app.use(clientSessions({
    cookieName: 'session',
    secret: 'northstarhrmgmt',
    duration: 5 * 60 * 1000,
    activeDuration: 1000 * 60,
    cookie: {
        ephemeral: true, // when true, cookie expires when the browser closes
        secure: false // when true, cookie will only be sent over SSL. use key 'secureProxy' instead if you handle SSL not in your node process
    }
}));

// ROUTES
app.get("/", (req, res) => {
    res.render("home", {user: req.session.user})
})

app.get("/login", (req, res) => {
    res.render("login", {user: req.session.user, layout: false})
})

app.post("/login", (req, res) => {
    const username = req.body.username;
    const pwd = req.body.pwd;
    if (username === "" && pwd === "") {
        return res.render("login", {errorMsg: "Username and Password are required!", user: req.session.user, layout: false});
    } else if (username !== "" && pwd === "") {
        return res.render("login", {errorMsg: "Password is required!", user: req.session.user, layout: false});
    } else if (username === "" && pwd !== "") {
        return res.render("login", {errorMsg: "Username is required!", user: req.session.user, layout: false});
    }
    db.validateLogin(req.body).then((usr)=>{
        if(!usr) {
            res.render("login", {errorMsg: "Username does not exist!", user: req.session.user, layout: false});
        } else if (usr.pwd !== hash(pwd)) {
            res.render("login", {errorMsg: "The login credentials do not match!", user: req.session.user, layout: false});
        } else {
            req.session.user = {
                username: usr.username,
                isManager: usr.isManager,
                employeeNum: usr.employeeNum
            };
            db.addLog({activityId:'',activityType:'login',activityTime:Date.now(),description: usr.username})
            .then(() => {
                res.redirect("/dashboard")
            }).catch((err) => {
                res.status(500).send(err);
            })
 
        }        
    }).catch((err)=>{
        res.render("login", {errorMsg: `An error occurred: ${err}`, user: req.session.user, layout: false});
    });
});

app.get("/dashboard", (req, res) => {
    res.render("dashboard", {user: req.session.user, layout: false})
})

app.get("/logout", (req, res) => {
    db.addLog({activityId:'',activityType:'logout',activityTime:Date.now(),description: req.session.user.username})
    .then(() => {
            req.session.reset();
            res.redirect("/");
        }).catch((err) => {
        res.status(500).send(err);
    })
})

app.get("/about", (req, res) => {
    res.render("about", {user: req.session.user})
})

// EMPLOYEES
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

app.get("/employees/add", (req,res)=>{
    db.getDepartments().then((data) => {
        res.render("addEmployee", {departments: data, user: req.session.user});
    }).catch(() => {
        res.render("addEmployee", {departments: [], user: req.session.user});
    }) 
}); 

app.post("/employees/add", (req, res)=>{
    db.addEmployee(req.body)
    .then(() => {
        res.redirect("/employees")
    }).catch((err) => {
        res.status(500).send(err);
    })
});

app.get("/employees/delete/:empNum", (req, res) => {
    db.deleteEmployeeByNum(req.params.empNum)
    .then(() => {
        res.redirect("/employees");
    }).catch((err) => {
        res.status(500).send(err);
    })
})

app.get("/employee/:empNum", (req, res) => {
    // initialize an empty object to store the values
    let viewData = {};
    db.getEmployeeByNum(req.params.empNum).then((data) => {
        if (data) {
            viewData.employee = data; //store employee data in the "viewData" object as "employee"
        } else {
            viewData.employee = null; // set employee to null if none were returned
        }
    }).catch(() => {
        viewData.employee = null; // set employee to null if there was an error
    }).then(db.getDepartments)
    .then((data) => {
        viewData.departments = data; // store department data in the "viewData" object as "departments"
        // loop through viewData.departments and once we have found the departmentId that matches
        // the employee's "department" value, add a "selected" property to the matching
        // viewData.departments object
        for (let i = 0; i < viewData.departments.length; i++) {
            if (viewData.departments[i].departmentId == viewData.employee.department) {
                viewData.departments[i].selected = true;
            }
        }
    }).catch(() => {
        viewData.departments = []; // set departments to empty if there was an error
    }).then(() => {
        if (viewData.employee == null) { // if no employee - return an error
            res.status(404).send("Employee Not Found");
        } else {
            res.render("updateEmployee", { viewData: viewData, user: req.session.user}); // render the "employee" view
        }
    });
});

app.post("/employee/update", (req, res) => {
    db.updateEmployee(req.body)
    .then(() => {
        if (req.session.user.isManager) {
            res.redirect("/employees");
        } else {
            res.redirect("/dashboard")
        } 
    }).catch((err) => {
        res.status(500).send(err);
    })
});

app.post("/employee/search", (req, res) => {
    res.redirect("/employee/" + req.body.employeeNum);
});

// DEPARTMENTS
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

app.get("/departments/add", (req,res)=>{
    res.render("addDepartment", {user: req.session.user});
}); 

app.post("/departments/add", (req, res)=>{
    db.addDepartment(req.body)
    .then(() => {
        res.redirect("/departments")
    }).catch((err) => {
        res.status(500).send(err);
    })
});

app.get("/departments/delete/:id", (req, res) => {
    db.deleteDepartmentById(req.params.id)
    .then(() => {
        res.redirect("/departments");
    }).catch((err) => {
        res.status(500).send(err);
    })
});

app.get("/department/:id", (req, res) => {
    db.getDepartmentById(req.params.id)
    .then((data) => {
        if (data) {
            res.render("updateDepartment", {department: data, user: req.session.user});
        } else {
            res.status(404).send("Department Not Found");
        }
    }).catch(() => {
        res.render("updateDepartment", {message: "Encountered Error", user: req.session.user});
    })
});

app.post("/department/update", (req, res) => {
    db.updateDepartment(req.body)
    .then(() => {res.redirect("/departments");})
    .catch((err) => {
        res.status(500).send(err);
    })
});

app.post("/department/search", (req, res) => {
    res.redirect("/department/" + req.body.departmentId)
});

// SYSADMS
app.get("/sysadms", (req, res) => {
    db.getAdms()
    .then((data) => {
        if (data.length > 0) {
            res.render("sysadms", {sysadms: data, user: req.session.user});
        } else {
            res.render("sysadms", {errorMsg: "no results", user: req.session.user})
    }}).catch(() => {
        res.render("sysadms", {errorMsg: "Encountered error"});
    })
});

app.get("/sysadms/add", (req,res)=>{
    res.render("addSysAdm", {user: req.session.user});
}); 

app.post("/sysadms/add", (req, res)=>{
    db.addAdm(req.body)
    .then(() => {
        res.redirect("/sysadms")
    }).catch((err) => {
        res.render("addSysAdm", {errorMsg: err, user: req.session.user});
    })    
});

app.get("/sysadms/delete/:usrNam", (req, res) => {
    db.deleteAdmByNam(req.params.usrNam)
    .then(() => {
        res.redirect("/sysadms");
    }).catch((err) => {
        res.status(500).send(err);
    })
})

app.get("/sysadm/:usrNam", (req, res) => {
    db.getAdmByNam(req.params.usrNam)
    .then((data) => {
        if (data) {
            res.render("updateSysAdm", {sysadm: data, user: req.session.user});
        } else {
            res.render("sysadms", {errorMsg: "User Account Not Found", user: req.session.user});
        }
    }).catch(() => {
        res.render("updateSysAdm", {errorMsg: "Encountered Error", user: req.session.user});
    })
});

app.post("/sysadm/update", (req, res) => {
    req.body.isManager = (req.body.isManager) ? true: false;
    db.updateAdm(req.body)
    .then(() => {res.redirect("/sysadms");})
    .catch((err) => {
        res.render("updateSysAdm", {sysadm: req.body, errorMsg: err, user: req.session.user});
    })
});

app.post("/sysadm/search", (req, res) => {
    if (req.body.username != "") {
        res.redirect("/sysadm/" + req.body.username)
    } else {
        res.redirect("/sysadms")
    }
});

// INITIALIZE
db.initialize().then(() => {
    app.listen(HTTP_PORT, ()=>{
        console.log("listening on: " + HTTP_PORT);
    });
}).catch((err) => {
    console.log(err);
})

// MISC
app.use((req, res) => {
    res.status(404).send("Page Does Not Exist");
});

module.exports = app;