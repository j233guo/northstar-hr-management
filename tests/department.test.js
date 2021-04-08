
const e = require("express");
const { resolve } = require("path");
const path = require("path");
const db = require(path.join(__dirname, "../modules/dbModule"));


test('This will successful for input new department', () => {
  return expect(
    db.addDepartment({departmentId:'',departmentName:'test 8c'})).resolves.toBe("department added");
 });

 test('This will reject for input exist department',  () => {
  return expect(
    db.addDepartment({departmentId:'',departmentName:'test 6'})).rejects.toBe("duplicate department");
 });

 
test('This will successful for input new department', () => {
  return expect(
    db.updateDepartment({departmentId:17,departmentName:'test 888'})).resolves.toBe("department successfully updated");
 });

 test('This will reject for input exist department',  () => {
  return expect(
    db.updateDepartment({departmentId:17,departmentName:''})).rejects.toBe("department name is empity");
 });