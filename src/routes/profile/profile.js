const express = require('express');
const server = express();
const Users = require('../../models/users');
const isAuth = require('../../middleware/isAuth');
const passwordManager = require('../../services/passwordManager');
const multer  = require('multer')
const fs = require('fs')
const path = require('path')
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './src/uploads')
    },
    filename: (req, file, cb) => {
        const index = file.originalname.lastIndexOf('.')
        const extension = file.originalname.slice(index + 1)
        cb(null,  req.session.passport.user._id + '.' + extension)
    }
})
const upload = multer({ storage: storage })

server.post('/profile/change-password', isAuth, async (req, res) => {
    const user = await Users.findById({ _id: req.session.passport.user._id });
    const { confirmOldPass, newPassword } = req.body;

    if (!user) {
        return res.status(404).json({
            msg: "User not found"
        })
    }
    let confirm;
    await passwordManager.comparePassword(confirmOldPass, user.password).then((result) => {
        confirm = result;
    });
    if (confirm) {
        await Users.findByIdAndUpdate({ _id: req.session.passport.user._id }, { password: await passwordManager.encryptPassword(newPassword) });
        return res.status(200).json({
            msg: "password changed successfully"
        })
    }
    return res.status(402).json({
        msg: "Wrong password"
    })
})

server.put('/profile/avatar', 
    isAuth,
    (req, res, next) => {
    //middleware to delete the existing avatar of the user
    const files = fs.readdirSync('./src/uploads')
    files.forEach(file => {
        if (file.includes(req.session.passport.user._id))
            fs.unlinkSync(`./src/uploads/${file}`)
    })
    next()
    }, 
    upload.single('file'),
    (req, res) => {
    res.status(200).json({
        msg: 'Avatar uploaded successfully!',
        file: req.file
    })
})

server.get('/profile/avatar', isAuth, async (req, res) => {
    await fs.readdir('./src/uploads', (err, files) => {
        if(err) {
            return res.status(400).json({
                msg: `Error encountered: ${err}`
            })
    }

    let foundFile = false

    files.forEach(async file => {
        if (file.includes(req.session.passport.user._id)){
            foundFile = true
            await res.sendFile(file, { root: './src/uploads' }, (err) => {
                if (err) {
                    return res.status(400).json({
                        msg: `Error encountered: ${err}`
                    })
                } 
            })
        }
    })

    if(foundFile === false)
        res.status(404).json({
            msg: 'No avatar',
        })
})
          
})

module.exports = server;
