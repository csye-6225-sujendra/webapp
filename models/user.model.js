module.exports = (database, Sequelize) => {

    const { v4: uuidv4 } = require('uuid');

    const User = database.define("user", {
        id: {
            type: Sequelize.UUID,
            defaultValue: () => uuidv4(),
            primaryKey: true,
            allowNull: false,
            readOnly: true,
        },
        first_name: {
            type: Sequelize.STRING,
            allowNull: false,
        },
        last_name: {
            type: Sequelize.STRING,
            allowNull: false,
        },
        password: {
            type: Sequelize.STRING,
            allowNull: false,
            writeOnly: true,
        },
        username: {
            type: Sequelize.STRING,
            allowNull: false,
            unique: true,
            validate: {
                isEmail: true,
            },
        },
        verified: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
        verificationToken: {
            type: Sequelize.STRING,
            allowNull: true,
        },
        tokenExpiryDate: {
            type: Sequelize.DATE,
            allowNull: true,
        }
    }, {
        //timestamps: false, // Disable automatic timestamp fields createdAt and updatedAt
        updatedAt: 'account_updated',
        createdAt: 'account_created'
    },
    )

    return User
}