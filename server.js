const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: './config.env' });
const app = require('./app');

const DB = process.env.DATABASE.replace(
    '<PASSWORD>',
    process.env.DATABASE_PASSWORD
);

mongoose
    .connect(DB, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() => console.log('DB connection successful!'));
const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
    console.log(`App running on port ${port}`);
});
//unhandled rejection
process.on('unhandledRejection', (err) => {
    console.log(err.name, err.message);
    console.log('UNHANDLED REJECTION ** SHUTTING DOWN');
    server.close(() => {
        process.exit(1);
    });
});

// uncaught exception
process.on('uncaughtException', (err) => {
    console.log('UNCAUGHT EXCEPTION ** SHUTTING DOWN');
    console.log(err.name, err.message);
    server.close(() => {
        process.exit(1);
    });
});
// console.log(x);
