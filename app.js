//imports
//npm libraries

//for environment variables
require('dotenv').config();

//local libraries
const app = require('./main');

//start app
app.listen(
    process.env.PORT || 3000, 
    process.env.SERVER || '0.0.0.0', 
    () => {
        console.log(`Start running the server in port ${process.env.PORT} and host of ${process.env.SERVER}`);
    }
);