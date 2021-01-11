# xman oauth2-server for node js

A xman oauth 2 server that uses PostgreSQL and NodeJS Techstack

## Requirements

Things that are needed to be installed before using the project

* Nodejs
* Node Package Manager
* PostgreSQL
* Private Key and Public Key ECDSA

## Installation guide

There are things to do before using the full functionality of the project

* npm install
* npm link 

**Notes**
* be sure that the following is not yet taken by another project in the symlink
1. **xman-syncdb**
2. **xman-addadmin**
3. **xman-generatekeys** 
4. **xman-createdb**
5. **xman-gmailtokengenerator**

## Usage

**Create Database**
* type **xman-createdb** to the command line inside the project directory

**Syncing of Database**
* type **xman-syncdb** to the command line inside the project directory

**Adding of new user to the Database**
* type **xman-adduser** to the command line inside the project directory

**Adding of admin to the Database**
* type **xman-addadmin** to the command line inside the project directory

**Adding of new private and public keys**
* type **xman-generatekeys** to the command line inside the project directory

**Generate Token from Google Credentials for Email Notification**
* type **xman-gmailtokengenerator** to the command line inside the project directory

**Starting the Project**
* type **npm start** in the command line inside the project directory

**Starting the Project in Debug Mode**
* type **npm run dev** in the command line inside the project directory

**Test the Project**
* type **npm test** in the command line inside the project directory
* type **npm run test-interactive** in the command line inside the project directory for a continuous testing

## API Documentation

All APIs are documented using Swagger UI. You can view it in the [Link](https://api-auth.xman.tech/docs/)
