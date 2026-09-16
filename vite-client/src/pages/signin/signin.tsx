import { useState, type ChangeEvent, type FormEvent } from "react";
import { message } from "antd";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../firebase";
import { useDispatch } from "react-redux";

import { authenticate } from "../../redux/authSlice";
import { setLoading } from "../../redux/loadingSlice";
import { useNavigate } from "react-router-dom";

const Signin = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const submitHandler = (event: FormEvent) => {
    event.preventDefault();
    // Enhanced email regex
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    if (!emailRegex.test(formData.email)) {
      message.error("Invalid email format");
      return;
    }

    if (formData.password.length < 6) {
      message.error("Password should be at least 6 characters");
      return;
    }

    dispatch(setLoading(true));
    signInWithEmailAndPassword(auth, formData.email, formData.password)
    .then((res) => {
      localStorage.setItem('yourpholio', JSON.stringify({ uid: res.user.uid }))
      dispatch(authenticate(true));
      dispatch(setLoading(false));
      message.success("Signed in successfully");
      navigate("/")
    })
    .catch(error => {
      dispatch(setLoading(false));
      if(error.code === 'auth/invalid-login-credentials'){
        message.error("Invalid email or password");
      } else {
        message.error("Error signing in");
      }
    })

  }

  return (
    <div className="signin-container">
      <form onSubmit={submitHandler} className="signin-form">
        <h2 className='Signintext'>Sign In</h2>
        <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} />
        <input type="password" name="password" placeholder="Password" value={formData.password} onChange={handleChange} />
        <button type="submit">Submit</button>
      </form>
    </div>
  );
}

export default Signin;
