const db = require('../utilities/db');

test('should connect to the postgresql database', () => {
    return db.connect().then(data => {
        expect(data).toBeTruthy();
    });
});

test('should disconnect to the postgresql database using sequelize', () => {
    return db.disconnect().then(data => {
        expect(data).toBeTruthy();
    });
});