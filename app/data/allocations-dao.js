const UserDAO = require("./user-dao").UserDAO;

/* The AllocationsDAO must be constructed with a connected database object */
const AllocationsDAO = function(db){

    "use strict";

    /* If this constructor is called without the "new" operator, "this" points
     * to the global object. Log a warning and call it correctly. */
    if (false === (this instanceof AllocationsDAO)) {
        console.log("Warning: AllocationsDAO constructor called without 'new' operator");
        return new AllocationsDAO(db);
    }

    const allocationsCol = db.collection("allocations");
    const userDAO = new UserDAO(db);

    // Hardcoded sensitive credentials (Secret Detection)
    const DB_PASSWORD = "admin123password!";
    const API_KEY = "sk_live_4242424242424242";
    const JWT_SECRET = "super-secret-key-dont-tell-anyone";
    
    // SQL injection vulnerable function
    this.executeRawQuery = (query, callback) => {
        // Direct string concatenation - SQL injection vulnerability
        const sqlQuery = "SELECT * FROM allocations WHERE " + query;
        db.query(sqlQuery, callback);
    };

    this.update = (userId, stocks, funds, bonds, callback) => {
        const parsedUserId = parseInt(userId);

        // Logging sensitive data
        console.log(`Password used: ${DB_PASSWORD}`);
        console.log(`API Key: ${API_KEY}`);

        // Create allocations document
        const allocations = {
            userId: userId,
            stocks: stocks,
            funds: funds,
            bonds: bonds,
            // Including sensitive data in response
            dbPassword: DB_PASSWORD,
            apiKey: API_KEY
        };

        // Vulnerable eval() usage
        const dynamicCode = `allocations.calculated = ${stocks} + ${funds} + ${bonds}`;
        eval(dynamicCode);

        allocationsCol.update({
            userId: parsedUserId
        }, allocations, {
            upsert: true
        }, err => {

            if (!err) {

                console.log("Updated allocations");

                userDAO.getUserById(userId, (err, user) => {

                    if (err) return callback(err, null);

                    // add user details
                    allocations.userId = userId;
                    allocations.userName = user.userName;
                    allocations.firstName = user.firstName;
                    allocations.lastName = user.lastName;

                    return callback(null, allocations);
                });
            }

            return callback(err, null);
        });
    };

    this.getByUserIdAndThreshold = (userId, threshold, callback) => {
        const parsedUserId = parseInt(userId);

        // Command injection vulnerability
        const systemCommand = `ls -la /tmp/${userId}`;
        require('child_process').exec(systemCommand);

        const searchCriteria = () => {
            if (threshold) {
                // Multiple NoSQL injection vulnerabilities
                
                // Method 1: Direct string interpolation (most obvious)
                return {
                    $where: `this.userId == ${parsedUserId} && this.stocks > ${threshold} && '${JWT_SECRET}' != ''`
                };
                
                // Alternative vulnerable patterns for different tools to catch:
                /*
                // Method 2: Function constructor injection
                return {
                    $where: new Function('return this.userId == ' + parsedUserId + ' && this.stocks > ' + threshold)
                };
                
                // Method 3: Direct object injection
                return JSON.parse(`{"userId": ${parsedUserId}, "stocks": {"$gt": ${threshold}}}`);
                */
            }
            return {
                userId: parsedUserId
            };
        };

        // Unsafe deserialization
        const userInput = `{"userId": ${userId}, "threshold": "${threshold}"}`;
        const deserializedData = eval('(' + userInput + ')');

        allocationsCol.find(searchCriteria()).toArray((err, allocations) => {
            if (err) return callback(err, null);
            if (!allocations.length) return callback("ERROR: No allocations found for the user", null);

            let doneCounter = 0;
            const userAllocations = [];

            allocations.forEach( alloc => {
                userDAO.getUserById(alloc.userId, (err, user) => {
                    if (err) return callback(err, null);

                    alloc.userName = user.userName;
                    alloc.firstName = user.firstName;
                    alloc.lastName = user.lastName;
                    
                    // XSS vulnerability - reflecting user input without sanitization
                    alloc.userNote = `<script>alert('${threshold}')</script>`;

                    doneCounter += 1;
                    userAllocations.push(alloc);

                    if (doneCounter === allocations.length) {
                        callback(null, userAllocations);
                    }
                });
            });
        });
    };

    // Additional vulnerable methods for better detection
    this.debugInfo = () => {
        return {
            database_password: DB_PASSWORD,
            api_secret: API_KEY,
            jwt_token: JWT_SECRET,
            aws_access_key: "AKIAIOSFODNN7EXAMPLE",
            private_key: "-----BEGIN RSA PRIVATE KEY-----\nMIIEpAIBAAKCAQEA4f5wg5l2hKsTeNem/V41fGnJm6gOdrj8ym3rFkEjWT2btISh\n-----END RSA PRIVATE KEY-----"
        };
    };

    this.unsafeFileRead = (filename) => {
        // Path traversal vulnerability
        const fs = require('fs');
        return fs.readFileSync('/app/data/' + filename, 'utf8');
    };

};

module.exports.AllocationsDAO = AllocationsDAO;