const db = require("../models");
const config = require("../config/auth.config");
const User = db.user;
const Role = db.role;
const fs = require('fs');

const Op = db.Sequelize.Op;

var jwt = require("jsonwebtoken");
var bcrypt = require("bcrypt");

exports.signup = (req, res) => {
    // Save User to Database
    let image=req.body.avatar;
    var base64Data = image.data.replace(/^data:image\/jpeg;base64,/, "");
    fs.writeFile('avatar.jpg', base64Data, 'base64', function(err) {
        console.log(err);
    });



        if (req.body.name) {
        User.findOne({
            where: {
                name: req.body.name
            }
        })
            .then(user => {
                if (!user) {

                    User.create({
                        username: req.body.username,
                        name: req.body.name,
                        email: req.body.email,
                        isTcp: req.body.isTcp,
                        avatar: image.title,
                        ocupation: req.body.ocupation,
                        password: bcrypt.hashSync(req.body.password, 8)
                    })
                        .then(user => {
                            if (req.body.roles) {
                                Role.findAll({
                                    where: {
                                        name: {
                                            [Op.or]: req.body.roles
                                        }
                                    }
                                }).then(roles => {
                                    user.setRoles(roles).then(() => {
                                        res.send({message: "User registered successfully!"});
                                    });
                                });
                            } else {
                                // user role = 1
                                user.setRoles([1]).then(() => {
                                    res.send({message: "User registered successfully!"});
                                });
                            }
                        })
                        .catch(err => {
                            res.status(500).send({message: err.message});
                        });

                }
                else {
                    return res.status(404).send({message: "This user exist "});

                }
            })

    }

};

exports.login = (req, res) => {
    User.findOne({
        where: {
            username: req.body.username
        }
    })
        .then(user => {
        if (!user) {
        return res.status(404).send({ message: "User Not found." });
    }

    var passwordIsValid = bcrypt.compareSync(
        req.body.password,
        user.password
    );

    if (!passwordIsValid) {
        return res.status(401).send({
            accessToken: null,
            message: "Invalid Password!"
        });
    }

    var token = jwt.sign({ id: user.id ,name: user.name}, config.secret, {
        expiresIn: 86400 // 24 hours
    });

    var authorities = [];
    user.getRoles().then(roles => {
        for (let i = 0; i < roles.length; i++) {
        authorities.push("ROLE_" + roles[i].name.toUpperCase());
    }
    res.status(200).send({
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        isTcp: user.isTcp,
        ocupation: user.ocupation,
        avatar: user.avatar,
        roles: authorities,
        accessToken: token
    });
});
})
.catch(err => {
        res.status(500).send({ message: err.message });
});
};
