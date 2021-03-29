const Sequelize = require("sequelize");
const hash = require("object-hash");
const { response } = require("express");

var sequelize = new Sequelize(
    'd2ld2ku09851kr', 
    'oeizxsqetprcmc', 
    '5ef39859c1bbb57bd9eb781daf186d5d3bffb5f01576f2032106aa8ee2c47a72', 
    {
        host: 'ec2-54-167-168-52.compute-1.amazonaws.com',
        dialect: 'postgres',
        port: 5432,
        dialectOptions: {
            ssl: {rejectUnauthorized: false}
    }
});

var Employee = sequelize.define('Employee', {
    employeeNum: {
        type: Sequelize.INTEGER, 
        primaryKey: true, 
        autoIncrement: true
    }, 
    firstName: Sequelize.STRING,
    lastName: Sequelize.STRING,
    email: Sequelize.STRING,
    SSN: Sequelize.STRING,
    addressStreet: Sequelize.STRING,
    addressCity: Sequelize.STRING,
    addressState: Sequelize.STRING,
    addressPostal: Sequelize.STRING,
    isManager: Sequelize.BOOLEAN,
    employeeManagerNum: Sequelize.INTEGER,
    status: Sequelize.STRING,
    hireDate: Sequelize.STRING
}, {
    createdAt: false, 
    updatedAt: true
});

var Department = sequelize.define('Department', {
    departmentId: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    }, 
    departmentName: Sequelize.STRING
}, {
    createdAt: true,
    updatedAt: true
});

var SysAdm = sequelize.define('SysAdm', {
    username: {
        type: Sequelize.STRING,
        primaryKey: true,
        autoIncrement: false
    },
    pwd: Sequelize.STRING,
    isManager: Sequelize.BOOLEAN
}, {
    createdAt: true,
    updatedAt: true
});

Department.hasMany(Employee, {foreignKey: 'department'});

module.exports.initialize = () => {
    return new Promise((resolve, reject) => {
        sequelize.sync()
        .then(() => {
            resolve();
        }).catch((err) => {
            console.log(err);
            reject("unable to sync the database");
        });
    });
}

module.exports.getAllEmployees = function() {
    return new Promise((resolve, reject) => {
        Employee.findAll().then((data) => {
            data = data.map(value => value.dataValues);
            resolve(data);
        }).catch((err) => {
            console.log(err);
            reject("no results returned");
        });
    });
}

module.exports.getDepartments = function() {
    return new Promise((resolve, reject) => {
        Department.findAll().then((data) => {
            data = data.map(value => value.dataValues);
            resolve(data);
        }).catch((err) => {
            console.log(err);
            reject("no results returned");
        });
    });
}

module.exports.getSysAdms = function() {
    return new Promise((resolve, reject) => {
        SysAdm.findAll().then((data) => {
            data = data.map(value => value.dataValues);
            resolve(data);        
        }).catch((err) => {
            console.log(err);
            reject("no results returned");
        })
    })
}

module.exports.getEmployeesByDepartment = function(department) {
    return new Promise((resolve, reject) => {
        Employee.findAll({
            where: {department: department}
        }).then((data) => {
            data = data.map(value => value.dataValues);
            resolve(data);
        }).catch((err) => {
            console.log(err);
            reject("no results returned");
        });
    });
}

module.exports.getManagers = function() {
    return new Promise((resolve, reject) => {
        Employee.findAll({
            where: {isManager: true}
        }).then((data) => {
            data = data.map(value => value.dataValues);
            resolve(data);
        }).catch((err) => {
            console.log(err);
            reject("no results returned");
        });
    });
}

module.exports.getEmployeeByNum = function(num) {
    return new Promise((resolve, reject) => {
        Employee.findAll({
            where: {employeeNum: num}
        }).then((data) => {
            data = data.map(value => value.dataValues);
            resolve(data[0]);
        }).catch((err) => {
            console.log(err);
            reject("no results returned");
        });
    });
}

module.exports.getDepartmentById = function(id) {
    return new Promise((resolve, reject) => {
        Department.findAll({
            where: {departmentId: id}
        }).then((data) => {
            data = data.map(value => value.dataValues);
            resolve(data[0]);
        }).catch((err) => {
            console.log(err);
            reject("no results returned");
        });
    });
}

module.exports.getSysAdmByNam = function(nam) {
    return new Promise((resolve, reject) => {
        SysAdm.findAll({
            where: {username: nam}
        }).then((data) => {
            data = data.map(value => value.dataValues);
            resolve(data[0]);
        }).catch((err) => {
            console.log(err);
            reject("no results returned");
        });
    });
}

module.exports.addEmployee = function(employeeData) {
    return new Promise((resolve, reject) => {
        employeeData.isManager = (employeeData.isManager) ? true : false;
        for (let prop in employeeData) {
            if (employeeData[prop] == '') {
                employeeData[prop] = null;
            }
        }
        Employee.create(employeeData).then(() => {
            resolve("employee added");
        }).catch(() => {
            reject("unable to create employee");
        });
    });
}

module.exports.addDepartment = function(departmentData) {
    return new Promise((resolve, reject) => {
        for (let prop in departmentData) {
            if (departmentData[prop] == '') {
                departmentData[prop] = null;
            }
        }
        Department.findAll({
            where: {departmentName: departmentData.departmentName}
        }).then((data) => {
                if (data.length != 0) {
                    reject("duplicate department");
                } else {
                    Department.create(departmentData).then(() => {
                        resolve("department added");
                    }).catch(() => 
                            {
                                reject("unable to create department");
                            });
                }

            }
         ) 
        }
    );
}

module.exports.addSysAdm = function(sysadmData) {
    return new Promise((resolve, reject) => {
        for (let prop in sysadmData) {
            if (sysadmData[prop] == '') {
                sysadmData[prop] = null;
            }
        }
        sysadmData.pwd = hash(sysadmData.pwd);
        SysAdm.findAll({
            where: {username: sysadmData.username}
        }).then((data) => {
            if (data.length != 0) {
                reject("duplicate user name");
            } else {
                SysAdm.create(sysadmData).then(() => {
                    resolve("user account added");
                }).catch(() => {
                    reject("unable to create user account");
                });
                }
        }).catch(() => {
            reject("unable to create user account");
        })
    });
}

module.exports.updateEmployee = function(employeeData) {
    return new Promise((resolve, reject) => {
        employeeData.isManager = (employeeData.isManager) ? true : false;
        for (let prop in employeeData) {
            if (employeeData[prop] == '') {
                employeeData[prop] = null;
            }
        }
        Employee.update(employeeData,{
            where: {employeeNum: employeeData.employeeNum}
        }).then(() => {
            resolve("employee successfully updated");
        }).catch(() => {
            reject("unable to update employee");
        });
    });
}

module.exports.updateDepartment = function(departmentData) {
    return new Promise((resolve, reject) => {
        for (let prop in departmentData) {
            if (departmentData[prop] == '') {
                departmentData[prop] = null;
            }
        }
        Department.findAll({
            where: {departmentName: departmentData.departmentName}
        }).then((data) => {
                if (data.length != 0) {
                    reject("duplicate department");
                } else {
                    Department.update(departmentData,{
                        where: {departmentId: departmentData.departmentId}
                    }).then(() => {
                        resolve("department successfully updated");
                    }).catch(() => 
                            {
                                reject("unable to update department");
                            });
                }

            })
        


        // Department.update(departmentData,{
        //     where: {departmentId: departmentData.departmentId}
        // }).then(() => {
        //     resolve("department successfully updated");
        // }).catch(() => {
        //     reject("unable to update department");
        // });
          }
    );
}

module.exports.updateSysAdm = function(sysadmData) {
    return new Promise((resolve, reject) => {
        for (let prop in sysadmData) {
            if (sysadmData[prop] == '') {
                sysadmData[prop] = null;
            }
        }
        sysadmData.pwd = hash(sysadmData.pwd);
        SysAdm.update(sysadmData,{
            where: {username: sysadmData.username}
        }).then(() => {
            resolve("User account successfully updated");
        }).catch(() => {
            reject("unable to update user account");
        });
    });
}

module.exports.deleteEmployeeByNum = function(empNum) {
    return new Promise((resolve, reject) => {
        Employee.destroy({
            where: {employeeNum: empNum}
        }).then(() => {
            resolve("employee successfully deleted");
        }).catch(() =>{
            reject("unable to delete employee");
        })
    });
}

module.exports.deleteDepartmentById = function(id) {
    return new Promise((resolve, reject) => {

        Department.destroy({
            where: {departmentId: id}
        }).then(() => {
            resolve("department successfully deleted");
        }).catch(() =>{
            reject("unable to delete department");
        })
    });
}

module.exports.deleteSysAdmByNam = function(usrNam) {
    return new Promise((resolve, reject) => {
        SysAdm.destroy({
            where: {username: usrNam}
        }).then(() => {
            resolve("User account successfully deleted");
        }).catch(() =>{
            reject("unable to delete user account");
        })
    });
}

module.exports.askforConfirm = ()=>{
    return new Promise((resolve, reject) => {
    let receive = "";
    (async () => {
        const response = await prompts({
          type: 'text',
          name: 'value',
          message: 'Are you sure you want delete this record?',
          validate: value => (value != "yes") ? `reqest canclled` : true
        });
        receive = response.valye;
        console.log(response.value); // => { value: 24 }
    })().then(()=>{console.log("get value" + response);
        resolve(true);
        }
    ).catch((err)=>{
        console.log(err);
        reject(false);
    })
      



        // // const response = await prompts({
        //  prompts({
        //     type: 'text',
        //     name: 'value',
        //     message: 'Are you sure you want delete this record?',
        //    validate: value => (value != "yes") ? reject("cancelled") : resolve(true)
        // //   if (value==="yes") resolve(true);
        //   }).then((response)=>{
        //       console.log(response.value)
        //       resolve(true);
        //     }
        //   ).catch((err)=>{
        //       rehect(err);
        //   })
       
    })
}






module.exports.validateLogin = function(inputData) {
    inputData.pwd = hash(inputData.pwd);
    return new Promise((resolve, reject) => {
        SysAdm.findAll({
            where: {username: inputData.username}
        }).then((usr) => {
            resolve(usr[0]);
        }).catch(() =>{
            reject("username not found");
        })
    });
}

