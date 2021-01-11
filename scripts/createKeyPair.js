#!/usr/bin/env node

//imports
//npm libraries
const fs = require('fs');
const crypto = require('crypto');
require('dotenv').config();

//local libraries


const generate = async () => {

    console.log('Starting to generate your key value pair in rsa folder.');

    //create a directory
    console.log('Creating a directory.');

    await fs.mkdir(
        'dsa',
        {
            recursive: true
        },
        (error, path) => {
            if (error) {
                console.log(`Error has been encountered while creating a directory: ${error}`);
                return;
            }

            console.log(`Successfully created ${path}`);
            return;
        }
    )

    //generate key value pair
    console.log('Generating key value pair.');

    const { privateKey, publicKey } = crypto.generateKeyPairSync('ec', {
        namedCurve: 'secp256k1',
        publicKeyEncoding: {
            type: 'spki',
            format: 'pem'
        },
        privateKeyEncoding: {
            type: 'pkcs8',
            format: 'pem'
        }
      });

    //write to files
    console.log('Writing private key and public key to the respective file.');

    console.log('Writing private key to file');
    await fs.writeFileSync(
        process.env.PRIVATE_KEY_PATH,
        privateKey
    );

    console.log('Successfully wrote private key to file');

    console.log('Writing public key to file');
    await fs.writeFileSync(
        process.env.PUBLIC_KEY_PATH,
        publicKey
    );

    console.log('Writing public key to public directory');
    await fs.writeFileSync(
        'public/public.pem',
        publicKey
    );

    console.log('Successfully wrote public key to file');

    console.log('Finished generating files.');
    process.exit();

}


generate();