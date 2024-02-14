const request = require('supertest');
const app = require('../../server');
const db = require('../../models/models');
const bcrypt = require('bcrypt');

// Test data
const testUser = {
    username: 'test@example.com',
    password: 'TestPass123',
    first_name: 'Test',
    last_name: 'User'
};
let updatedPassword;
let _updatedUser;

function generateBasicAuthToken(username, password) {
    // Concatenate username and password with a colon
    const credentials = `${username}:${password}`;

    // Encode credentials using base64
    const encodedCredentials = Buffer.from(credentials, 'utf-8').toString('base64');

    // Construct Basic Auth token
    const basicAuthToken = `Basic ${encodedCredentials}`;

    return basicAuthToken;
}
describe('User API Endpoints', () => {
    beforeAll(async () => {
        await db.initializeDatabase()
            .then(() => {
                console.log("Database initialized and models synced.");
            })
            .catch((err) => {
                console.log("Failed to initialize database and sync models: " + err.message);
            });

    });

    afterAll(async () => {
        try {
            await db.user.destroy({ where: {}, truncate: true });
            await db.database.close(); // Close the database connection
        } catch (error) {
            console.error("Unable to close the database:", error);
            throw error;
        }
    });

    describe('Test 1: Create an account and validate existence', () => {
        it('should create a new user', async () => {
            const response = await request(app)
                .post('/v1/user')
                .send(testUser)
                .expect(201);

            expect(response.body).toMatchObject({
                username: testUser.username,
                first_name: testUser.first_name,
                last_name: testUser.last_name
            });

            // Check if the password is hashed
            const createdUser = await db.user.findOne({ where: { username: testUser.username } });
            expect(createdUser).toBeDefined();
            expect(bcrypt.compareSync(testUser.password, createdUser.password)).toBe(true);
        });

        it('should retrieve user details and validate existence', async () => {
            const response = await request(app)
                .get('/v1/user/self')
                .auth(testUser.username, testUser.password)
                .expect(200);

            expect(response.body).toMatchObject({
                username: testUser.username,
                first_name: testUser.first_name,
                last_name: testUser.last_name
            });
        });
    });

    describe('Test 2: Update account and validate update', () => {
        let authToken;

        beforeAll(async () => {
            // Authenticate user and get token
            const response = await request(app)
                .get('/v1/user/self')
                .auth(testUser.username, testUser.password)
                .expect(200);

            //console.log(response.header, "response")
            authToken = generateBasicAuthToken(testUser.username, testUser.password);
            console.log(authToken, "authtoken")
        });

        it('should update user details', async () => {
            const updatedUserData = {
                first_name: 'Updated',
                last_name: 'User',
                password: 'NewPass123'
            };

            updatedPassword = updatedUserData.password;

            await request(app)
                .put('/v1/user/self')
                .set('Authorization', authToken)
                .send(updatedUserData)
                .expect(204);

            // Check if user details are updated
            const updatedUser = await db.user.findOne({ where: { username: testUser.username } });
            _updatedUser = updatedUser;
            expect(updatedUser.first_name).toBe(updatedUserData.first_name);
            expect(updatedUser.last_name).toBe(updatedUserData.last_name);
            expect(bcrypt.compareSync(updatedUserData.password, updatedUser.password)).toBe(true);
        });

        it('should retrieve updated user details and validate', async () => {
            console.log(updatedPassword, "updatedpassword")
            const response = await request(app)
                .get('/v1/user/self')
                .auth(testUser.username, updatedPassword)
                .expect(200);

            expect(response.body).toMatchObject({
                username: testUser.username,
                first_name: _updatedUser.first_name,
                last_name: _updatedUser.last_name
            });
        });
    });
});
