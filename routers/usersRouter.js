require('dotenv').config()
const fs = require("fs");
const { validateUser } = require("../userHelpers");
const express = require("express");
const router = express.Router();
// const { v4: uuidv4 } = require("uuid");
var jwt = require('jsonwebtoken');
const serverConfig = require('../serverConfig')
const { auth } = require('../middlewares/auth')
const User = require('../models/User')

require('../mongoConnect')



//login

router.post("/login", async (req, res, next) => {
    const { username, password } = req.body
    const user = await User.findOne({ username })
    if (!user) return next({ status: 401, message: "username or passord is incorrect" })
    if (user.password !== password) next({ status: 401, message: "username or passord is incorrect" })
    const payload = { id: user.id }
    const token = jwt.sign(payload, serverConfig.secret, { expiresIn: "2h" })
    return res.status(200).send({ message: "Logged in Successfully", token })
})

 //Post register 
router.post("/", async (req, res, next) => {
    try {
        console.log(req.body);
        const { username, age, password } = req.body;
        const user = new User({ username, age, password })
        await user.save()
        res.send({ message: "sucess" });
    } catch (error) {
        next({ status: 422, message: error.message });
    }
});


// Getting by id
router.get("/:id", auth, async (req, res, next) => {
    try {
        const query = { _id: req.params.id }
        const users = await User.find(query, { username: 1, age: 1, _id: 0 })
        res.status(200).send(users)
    }
    catch (error) {
        next({ status: 500, internalMessage: error.message });
    }
})


// editing using id
router.patch("/users/:userId", auth, async (req, res, next) => {
    if (req.user.id !== req.params.userId) next({ status: 403, message: "Authorization error" })
    try {
        const { password, age } = req.body
         req.user.password = password
         req.user.age = age
        await req.user.save()
        res.send("sucess")
    } catch (error) {
        next({ status: 500, internalMessage: error.message });
    }

});

// to get user by age
router.get('/', auth, async (req, res, next) => {
    try {
        const query = req.query.age ? { age: req.query.age } : {}
        const users = await User.find(query, { username: 1, age: 1, _id: 0 })
        res.send(users)
    } catch (error) {
        next({ status: 500, internalMessage: error.message });
    }
})



// Delete 
router.delete("/:id", auth, async (req, res, next) => {
    try {
        if (req.user.id !== req.params.userId) next({ status: 403, message: "Authorization error" })
        await User.findByIdAndDelete(req.user.id)
        res.status(200).send({ message: "user deleted" })
    }
    catch (error) {
        next({ status: 500, internalMessage: error.message });
    }
})








module.exports = router;
