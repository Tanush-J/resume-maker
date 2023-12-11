const express = require('express');
const cors = require('cors');
const puppeteer = require('puppeteer');
const { signInWithEmailAndPassword, createUserWithEmailAndPassword } = require('firebase/auth');
const { setDoc, doc } = require('@firebase/firestore');

const { auth, db } = require('./firebase')

const app = express();
const PORT = 5000;

app.use(cors())
app.use(express.json());

app.post('/download', async (req, res) => {
  const { componentHTML } = req.body;

  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();

  // Set content with HTML received from the client
  await page.setContent(componentHTML);
  await page.addScriptTag({ url: 'https://kit.fontawesome.com/eefca83aa3.js' })
  await page.addStyleTag({ path: '../client/src/components/resumeBuilder/mainResume.css' })

  // Generate PDF
  await page.waitForNetworkIdle({ idleTime: 5000 });
  const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
  await browser.close();
  // Send the PDF as a response
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename=generated.pdf');

  res.send(pdfBuffer);

})

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