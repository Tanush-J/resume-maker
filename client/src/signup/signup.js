import { useState } from "react";
import { toast } from "react-toastify";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { setDoc, doc } from "@firebase/firestore";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";

import { auth, db } from "../config_db/firebase";
import { setLoading } from "../redux/loadingSlice";

const Signup = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    dob: "",
    gender: ""
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const userRegistraion = () => {
    return createUserWithEmailAndPassword(auth, formData.email, formData.password)//creating user
    .then((res) => {
      const userUid = res.user.uid
      localStorage.setItem('yourpholio', JSON.stringify({ uid: userUid }))
      return setDoc(doc(db, "users", userUid), {
        name: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        dob: formData.dob,
        gender: formData.gender
      }) //adding user info firestore
    })
  }
  
  const submitHandler = (event) => {
    event.preventDefault();

    const isFormFilled = Object.values(formData).every((value) => value !== '');

    if(!isFormFilled){
      toast.error("Complete all fields");
      return;
    }
    
    if(formData.password.length < 6){
      toast.error("Password should be at least 6 characters");
      return;
    }
    
    // Validate email format using a simple regex (this is basic and can be enhanced)
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
    if (!emailRegex.test(formData.email)) {
      toast.error("Enter a valid email");
      return;
    }
    
    dispatch(setLoading(true));
    userRegistraion()
    .then(() => {
      dispatch(setLoading(false));
      toast.success("User registered successfully");
      navigate("/")
    })
    .catch((error) => {
      dispatch(setLoading(false));
      if(error.code === 'auth/email-already-in-use'){
        toast.error("Email is already in use");
      } else {
        toast.error("Error registering user");
      }
    })
  }

  return (
    <div className="signup-container">
      <form onSubmit={submitHandler} className="signup-form">
        <h2 className='Signuptext'>Sign Up</h2>
        <input type="text" placeholder="First Name" value={formData.firstName} name="firstName" onChange={handleChange} />
        <input type="text" placeholder="Last Name" value={formData.lastName} name="lastName" onChange={handleChange} />
        <input type="email" placeholder="Email" value={formData.email} name="email" onChange={handleChange} />
        <input type="password" placeholder="Password" value={formData.password} name="password" onChange={handleChange} />
        <input type="date" value={formData.dob} name="dob" onChange={handleChange} />

        <div className="gender-options">
          <label>
            <input 
              type="radio" 
              name="gender"
              value="male" 
              onChange={handleChange}
            />
            Male
          </label>
          <label>
            <input 
              type="radio" 
              name="gender"
              value="female" 
              onChange={handleChange}
            />
            Female
          </label>
          <label>
            <input 
              type="radio" 
              name="gender"
              value="other" 
              onChange={handleChange}
            />
            Other
          </label>
        </div>


        <button type="submit">Submit</button>
      </form>
    </div>
  );
}

export default Signup;
