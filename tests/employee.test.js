const request = require("supertest");
const app = require("../server")

describe("add employee", ()=>{
    test("add employee form", (done) => {
        request(app).get("/employees/add")
        .expect(200)
        .expect(/Add Employee/, done())
    })
})

describe("search an employee", ()=>{
    test("search for a valid employee", (done)=>{
        request(app).post("/employee/search")
        .send({employeeNum: 1})
        .expect(302)
        .expect(/Update Employee Information/, done())
    })
})

describe("search an employee", ()=>{
    test("search for an invalid employee", (done)=>{
        request(app).post("/employee/search")
        .send({employeeNum: 1003})
        .expect(302)
        .expect(/Employee Not Found/, done())
    })
})


