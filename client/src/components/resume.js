
import { useDispatch } from 'react-redux';
import { setLoading } from '../redux/loadingSlice';  // Import loading action

import React, { useState, useEffect } from 'react';
import { doc, getDoc } from "firebase/firestore";
import { ref, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../config_db/firebase';
import { toast } from 'react-toastify';

const Resume = () => {
  const dispatch = useDispatch()
  const userId = JSON.parse(localStorage.getItem('yourpholio'))?.uid;
  const [profilePicURL, setProfilePicURL] = useState("https://w1.pngwing.com/pngs/132/484/png-transparent-circle-silhouette-avatar-user-upload-pixel-art-user-profile-document-black.png");
  const [resumeData, setResumeData] = useState({
    name: "",
    email: "",
    gender: "",
    dob: "",
    objective: "",
    experience: "",
    education: "",
    skills: ""
  });
  
  useEffect(() => {
    dispatch(setLoading(true));
    getDoc(doc(db, "resumes", userId))
    .then((fetchData) => {
      const data = fetchData.data();
      if(data){
        setResumeData((prevData) => ({
          ...prevData,
          objective: data.objective,
          experience: data.experience,
          education: data.education,
          skills: data.skills
        }))
      }
    })
    .catch(() => {
      toast.error("Could not load resume data");
    })

    getDoc(doc(db, "users", userId))
    .then((fetchData) => {
      const data = fetchData.data();
      if(data){
        setResumeData((prevData) => ({
          ...prevData,
          name: data.name,
          email: data.email,
          gender: data.gender,
          dob: data.dob
        }))
      }
    })
    .catch(() => {
      toast.error("Could not load resume data");
    })

    getDownloadURL(ref(storage, 'profile-images/' + userId))
    .then(url => {
      setProfilePicURL(url);
      dispatch(setLoading(false));
    })
    .catch((error) => {
      dispatch(setLoading(false));
      if(error.code !== 'storage/object-not-found'){
        toast.error("Could not load profile pic");
      }
    })
  }, [dispatch])

  return (
    <div className="profile-container">
      <img src={profilePicURL} alt="Profile Pic" className="profile-pic"/>
      
      <div className="info-container">
        <div>
          <span>Name:</span>
          <p>{resumeData.name}</p>
        </div>
        <div>
          <span>Email:</span>
          <p>{resumeData.email}</p>
        </div>
        <div>
          <span>Date of Birth:</span>
          <p>{resumeData.dob}</p>
        </div>
        <div>
          <span>Gender:</span>
          <p>{resumeData.gender}</p>
        </div>
        <div>
          <span>Objective:</span>
          <p>{resumeData.objective}</p>
        </div>
        <div>
          <span>Experience:</span>
          <p>{resumeData.experience}</p>
        </div>
        <div>
          <span>Education:</span>
          <p>{resumeData.education}</p>
        </div>
        <div>
          <span>Skills:</span>
          <p>{resumeData.skills}</p>
        </div>
      </div>
    </div>
  )
  
}

export default Resume;
