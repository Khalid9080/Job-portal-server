

/*

1. After successful login: gerate a JWT token 
2. npm i jsonwebtoken, cookie-parser 
3. jwt.sign(payload, secret, {expiresIn: '1h'})
4. send token generated in the server side to the client side
      a. localStorage - easier
      b. httpOnly cookie - more secure

5. for sensitive or secure  or private or protected apis: send token to the server side
   server side: 
    app.use(cors({
        origin: ['http://localhost:5173'],
        credentials: true
    }));

    Client Side:
     use axios get, post, put, delete, patch for secure apis and must use: {credentials: true}



6. validate the token in the server side: 
        a. if valid: provide the data, 
        b. if invalid: make logout




*/