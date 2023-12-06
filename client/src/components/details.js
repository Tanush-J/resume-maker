import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { doc, setDoc, getDoc } from "firebase/firestore"; 
import { useDispatch } from "react-redux";

import { db, storage } from "../config_db/firebase";
import { uploadBytesResumable, ref, getDownloadURL } from "firebase/storage";
import { setLoading } from "../redux/loadingSlice";

const Details = () => {
  const dispatch = useDispatch();
  const userId = JSON.parse(localStorage.getItem('yourpholio'))?.uid;
  const [profilePicURL, setProfilePicURL] = useState(null);
  const [resumeUpdated, setResumeUpdated] = useState(false);
  const [resumeData, setResumeData] = useState({
    objective: "",
    experience: "",
    education: "",
    skills: ""
  });

  useEffect(() => {
    dispatch(setLoading(true));
    getDownloadURL(ref(storage, 'profile-images/' + userId))
      .then(url => {
        setProfilePicURL(url);
        dispatch(setLoading(false));
      })
      .catch((error) => {
        if(error.code !== 'storage/object-not-found'){ //user first time filling data
          dispatch(setLoading(false));
          toast.error("Could not load profile pic");
        }
      })
  }, [])

  useEffect(() => {
    dispatch(setLoading(true));
    getDoc(doc(db, "resumes", userId))
    .then((fetchData) => {
      const data = fetchData.data();
      if(data){
        setResumeData(() => ({
          objective: data.objective,
          experience: data.experience,
          education: data.education,
          skills: data.skills
        }))
      }
      dispatch(setLoading(false))
    })
    .catch(() => {
      dispatch(setLoading(false))
      toast.error("Could not load resume data");
    })
  }, [resumeUpdated])

  const handleSubmit = (event) => {
    event.preventDefault();
    
    if (!resumeData.objective || !resumeData.experience || !resumeData.education || !resumeData.skills) {
      toast.error("All fields are required!");
      return;
    }

    if (resumeData.objective.split(" ").length < 10) {
      toast.error("Objective should be at least 100 words");
      return;
    }

      // toast.error("You cannot modify name, email, date of birth, or gender.");
    if(userId){
      setDoc(doc(db, "resumes", userId), {
        objective: resumeData.objective,
        experience: resumeData.experience,
        education: resumeData.education,
        skills: resumeData.skills
      }).then(() => {
        toast.success("Resume updated successfully");
        setResumeUpdated(true);
      }).catch(() => {
        toast.error("Error updating resume");
      })  
    } else {
      toast.error("You need to be authenticated to update resume");
    }
  }

  const handleFileChange = (e) => {
    const storageRef = ref(storage, 'profile-images/' + userId)
    const uploadImg = e.target.files[0];
    const uploadTask = uploadBytesResumable(storageRef, uploadImg, {contentType: uploadImg.type})

    uploadTask.on('state_changed', ()=>{}, ()=>{
      toast.error("Error in updating image");
    }, ()=>{
      dispatch(setLoading(true));
      getDownloadURL(ref(storage, 'profile-images/' + userId))
      .then(url => {
        dispatch(setLoading(false));
        setProfilePicURL(url);
      })
      toast.success("Image updated");
    })
  }

  const handleOnChange = (e) => {
    const { name, value } = e.target;
    setResumeData(prevData => ({...prevData, [name]: value}));
  }
  
  return (
    <>
    <div className="profile-pic-container-upload">
      <label>
        <img src={profilePicURL || "https://w1.pngwing.com/pngs/132/484/png-transparent-circle-silhouette-avatar-user-upload-pixel-art-user-profile-document-black.png"} alt="Upload Profile" className="round-pic"/>
        <input type="file" accept=".jpg, .jpeg, .png" onChange={handleFileChange} style={{ display: 'none' }}/>
      </label>
    </div>

    <div className="form-container">
      
      <form onSubmit={handleSubmit} className='resume-input-form'>
        <div className="row">
          <label>
            Objective:
            <textarea name="objective" value={resumeData.objective} onChange={handleOnChange} ></textarea>
          </label>
          <label>
            Experience:
            <textarea name="experience" value={resumeData.experience} onChange={handleOnChange} ></textarea>
          </label>
        </div>
        <div className="row">
          <label>
            Education:
            <textarea name="education" value={resumeData.education} onChange={handleOnChange} ></textarea>
          </label>
          <label>
            Skills:
            <textarea type="text" name="skills" value={resumeData.skills} onChange={handleOnChange} ></textarea>
          </label>
        </div>
        <div className="submit-row">
          <input type="submit" value="Update" />
        </div>
      </form>
    </div>
    </>
  )
  
}

export default Details;
