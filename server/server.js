const express = require('express');
const { signInWithEmailAndPassword, createUserWithEmailAndPassword } = require('firebase/auth');
const { setDoc, doc } = require('@firebase/firestore');

const { auth, db } = require('./firebase')

const app = express();
const PORT = 5000;

app.use(express.json());

app.post('/signin', (req, res) => {
    const formData = req.body;
    signInWithEmailAndPassword(auth, formData.email, formData.password)
    .then((resData) => {
      res.status(202).json({ message: "Signed in successfully", uid: resData.user.uid });
    })
    .catch(error => {
      if(error.code === 'auth/invalid-login-credentials'){
        res.status(400).json({ message: "Invalid email or password" });
      } else {
        res.status(500).json({ message: "Error signing in"});
      }
    })
})

app.post('/signup', (req, res) => {
    const formData = req.body;
    let userUid = '';
    createUserWithEmailAndPassword(auth, formData.email, formData.password)//creating user
    .then((resData) => {
      userUid = resData.user.uid;
      return setDoc(doc(db, "users", userUid), {
        name: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        dob: formData.dob,
        gender: formData.gender
      }) //adding user info firestore
    })
    .then(() => {
        res.status(201).json({ message: 'User registered successfully', uid: userUid });
    })
    .catch(error => {
        console.log(error)
        if(error.code === 'auth/email-already-in-use'){
            res.status(400).json({ message: "Email is already in use"});
        } else {
            res.status(500).json({ message: "Error registering user"});
        }
    })
})

app.listen(PORT , () => {
    console.log(`Server listening at http://localhost:${PORT}`)
});