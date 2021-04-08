const db = require('../modules/dbModule');

describe('Test add, update and delete in System Administration page', () => {
    test('add user account with all empty fields', async () => {
        let admData = {
            username: "",
            pwd: "",
            isManager: "",
            employeeNum: ""
        };
        await expect(db.addAdm(admData)).rejects.toMatch("Some fields left blank");
    })

    test('add user account with some fields empty', async () => {
        let admData = {
            username: "Yiu Wing Lai",
            pwd: "",
            isManager: true,
            employeeNum: ""
        };
        await expect(db.addAdm(admData)).rejects.toMatch("Some fields left blank");
    })

    test('add user account with username already exists', async () => {
        let admData = {
            username: "manager",
            pwd: "12345678",
            isManager: true,
            employeeNum: "2"
        };
        await expect(db.addAdm(admData)).rejects.toMatch("This user already exists");
    })

    test('add user account with an employee number does not exist', async () => {
        let admData = {
            username: "Yiu Wing Lai",
            pwd: "12345678",
            isManager: true,
            employeeNum: "999"
        };
        await expect(db.addAdm(admData)).rejects.toMatch("This employee number does not exist");
    })

    test('add user account with same employee number with another user account', async () => {
        let admData = {
            username: "Yiu Wing Lai",
            pwd: "12345678",
            isManager: true,
            employeeNum: "1"
        };
        await expect(db.addAdm(admData)).rejects.toMatch("There is already an account for this employee number");
    })

    test('add user account', async () => {
        let admData = {
            username: "Yiu Wing Lai",
            pwd: "12345678",
            isManager: true,
            employeeNum: "2"
        };
        await expect(db.addAdm(admData)).resolves.toEqual("user account added");
    })

    test('update user account with no changes made', async () => {
        let admData = {
            username: "Yiu Wing Lai",
            pwd: "12345678",
            isManager: true,
            employeeNum: "2"
        };
        await expect(db.updateAdm(admData)).resolves.toEqual("User account successfully updated");
    })

    test('update user account with some fields empty', async () => {
        let admData = {
            username: "Yiu Wing Lai",
            pwd: "",
            isManager: true,
            employeeNum: ""
        };
        await expect(db.updateAdm(admData)).rejects.toMatch("Some fields left blank");
    })

    test('delete a user account', async () => {
        let usrNam = "Yiu Wing Lai";
        await expect(db.deleteAdmByNam(usrNam)).resolves.toEqual("User account successfully deleted");
    })
})