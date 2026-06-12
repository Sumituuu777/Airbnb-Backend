//core modules
const express=require('express');
//local modules
const { getAddhome, postAddhome, getEdithome, postEdithome, getDeletehome, getHostHomes } = require('../controllers/hostcontroller');

const hostRouter=express.Router();

hostRouter.get("/add-home",getAddhome)

hostRouter.post("/add-home",postAddhome)
hostRouter.get("/edit-home/:homeId",getEdithome)
hostRouter.post("/edit-home",postEdithome)
hostRouter.get("/delete-home/:homeId",getDeletehome)
hostRouter.get('/host-homes',getHostHomes)

//named export
exports.hostRouter=hostRouter;