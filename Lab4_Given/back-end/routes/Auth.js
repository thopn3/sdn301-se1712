import express from "express";
import createError from 'http-errors';
import User from "../models/User.js";
import bcrypt from 'bcrypt';
import {signAccessToken, signRefreshToken, verifyRefreshToken} from "../helpers/jwt_helper.js";

const AuthRouter = express.Router();

AuthRouter.post("/register", async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password)
            throw createError.BadRequest();

        const emailExist = await User.findOne({ 'email': email });
        if (emailExist)
            throw createError.Conflict(`${email} is already been registered.`);

        const hashPass = await bcrypt.hash(password, parseInt(process.env.PASSWORD_SECRET));
        const savedUser = await User.create({ email, password: hashPass });

        // const accessToken = await signAccessToken(savedUser.id)
        // res.send({ accessToken });
        res.send(savedUser);
    } catch (error) {
        next(error)
    }
});

AuthRouter.post("/login", async (req, res, next) => {
    try {
        const { email, password } = req.body;
        if (!email || !password)
            throw createError.BadRequest(`Invalid Email/Password`);

        const existUser = await User.findOne({ email: email }).exec();
        if (!existUser)
            throw createError.NotFound('User not registered');

        const isMatch = await bcrypt.compare(password, existUser.password);
        if (!isMatch)
            throw createError.Unauthorized('Email/Password not valid');

        const accessToken = await signAccessToken(existUser.id)
        const refreshToken = await signRefreshToken(existUser.id)

        // res.send({email, password});
        res.send({ accessToken, refreshToken })
    } catch (error) {
        next(error);
    }
});

AuthRouter.delete("/logout", async (req, res, next) => {
    res.send("Logout route");
});

AuthRouter.post("/refresh-token", async (req, res, next) => {
    // res.send("Refresh-Token route");
    try {
        const {refreshToken} = req.body;
        if(!refreshToken) throw createError.BadRequest();
        const userId = await verifyRefreshToken(refreshToken);

        if(userId){
            const accessToken = await signAccessToken(userId);
            const refreshToken = await signRefreshToken(userId);
            res.send({accessToken:accessToken, refreshToken: refreshToken});
        }
    } catch (error) {
        next(error);
    }
});

export default AuthRouter;