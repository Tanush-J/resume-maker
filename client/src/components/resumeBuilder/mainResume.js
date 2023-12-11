import './mainResume.css'

const MainResume = () => {
    return (
        <div className="resumeBackground">
            <div className="resumeBody">
                <div className="resumeHeader">
                    <h1>Tanush Jangid</h1> 
                    <div className="contactInfo">
                        <span><i class="fa-solid fa-phone fa-xs"></i>75887794480</span>
                        <span><i class="fa-solid fa-at fa-xs"></i>tanushjangid1234@gmail.com</span>
                        <span><i class="fa-solid fa-link fa-xs"></i>www.linkedin.com/in/tanush-jangid-496232194</span>
                        <span><i class="fa-solid fa-location-dot fa-xs"></i>Pune</span>
                    </div>
                </div>
                <div className="resumeInfoBody">
                    <div className="resumeBodyCol">
                        <div className="resumeExperienceSection">
                            <div className="sectionHeading">
                                <h2>Experience</h2>
                            </div>
                            <div className="itemObject">
                                <h3>Software Engineer Trainee</h3>
                                <h4>Capgemini</h4>
                                <div className="experienceItemIconContainer">
                                    <span><i class="fa-solid fa-calendar-days"></i>08/2022 - 12/2022&nbsp;</span>
                                    <span><i class="fa-solid fa-location-dot"></i>Pune</span>
                                </div>
                                <ul>
                                    <li>{`Contributed to a industry 4.0 project "Intelligence Operation Platform (IOP)" involving data integration from various factories and machines into Azure tables.`}</li>
                                    <li>{`My contribution to the project was to developed a user-friendly interface for creating, modifying, and deleting complex Key Performance Indicators`}</li>
                                    <li>{`These KPIs served to monitor and analyze crucial performance metrics such as design speed, up time, down time, and overall machine performance.`}</li>
                                </ul>
                            </div>
                        </div>
                        <div className="resumeProjectsSection">
                            <div className="sectionHeading">
                                <h2>Projects</h2>
                            </div>
                            <div className="itemObject">
                                <h3>{`Monitoring Of Indoor Hydroponic Farm System Using IOT and Machine Learning`}</h3>
                                <div className="linkField">
                                    <i class="fa-solid fa-link fa-xs"></i>
                                    <a href='https://docs.google.com/document/d/1pWMDoQ9_hkl8_vUoZID55tSH44DsGZlVX4EyZs82lBQ/edit'>{`https://docs.google.com/document/d/1pWMDoQ9_hkl8_vUoZID55tSH44DsGZlVX4EyZs82lBQ/edit`}</a>
                                </div>
                                <ul>
                                    <li>{`Aim of this project is to develop a remote hydroponic system that monitors various parameters and metrics for trained and untrained individuals.`}</li>
                                    <li>{`This was my final-year project, which involved creating a functional model with hardware components such as sensors, microcontroller, and actuators. The model communicated with software components like a web server and a website for data transmission and analytics.`}</li>
                                    <li>{`In our setup, we used multiple sensors for measuring pH, humidity, water level, and temperature. We also integrated a camera module to capture plant leaf images. These images were processed by a machine learning model to detect diseases, with the system offering suitable cures and preventive measures upon identification.`}</li>
                                </ul>
                            </div>
                            <div className="itemObject">
                                <h3>{`Foodle Website — A food detail website`}</h3>
                                <div className="linkField">
                                    <i class="fa-solid fa-link fa-xs"></i>
                                    <a href='https://foodles.onrender.com/'>{`https://foodles.onrender.com/`}</a>
                                </div>
                                <ul>
                                    <li>{`A food details website where you can learn about different food shops around you and the food items they sell.`}</li>
                                    <li>{`You can view the different dishes available and get the location of the shop where they sell them.`}</li>
                                    <li>{`You can also log in or sign up to leave a review for the dish.`}</li>
                                </ul>
                            </div>
                            <div className="itemObject">
                                <h3>{`E-Learn Website — An online E-learn website`}</h3>
                                <div className="linkField">
                                    <i class="fa-solid fa-link fa-xs"></i>
                                    <a href='https://github.com/Tanush-J/WTLmini'>{`https://github.com/Tanush-J/WTLmini`}</a>
                                </div>
                                <ul>
                                    <li>{`The aim of our project was to create an online learning platform website where you create your account Or sign in to the website, to view and watch different courses.`}</li>
                                    <li>{`This was my college mini-project for one of the subjects. So, my friend and I worked on this website.`}</li>
                                    <li>{`The website provides diverse courses that require login/signup for access. Users can view courses and post their own by creating a YouTube playlist and sharing the link on the site. The platform allows direct viewing of entire playlists on the website.`}</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                    <div className="resumeBodyCol">
                        <div className="resumeSkillSection">
                            <div className="sectionHeading">
                                <h2>Skills</h2>
                            </div>
                            <div className="itemObject skillContainer">
                                <span>HTML</span>
                                <span>CSS</span>
                                <span>Javascript</span>
                                <span>Typescript</span>
                                <span>React.js</span>
                                <span>Angular</span>
                                <span>Next.js</span>
                                <span>EJS</span>
                                <span>Node.js</span>
                                <span>Express.js</span>
                                <span>MongoDB</span>
                                <span>MySQL</span>
                            </div>
                        </div>
                        <div className="resumeFindMeOnlineSection">
                            <div className="sectionHeading">
                                <h2>Find Me Online</h2>
                            </div>
                            <div className="itemObject">
                                <div className='socialIconContainer'>
                                    <i class="fa-brands fa-github fa-xl"></i>
                                    <p>Github Profile</p>
                                </div>
                                <div className="linkField">{`https://github.com/Tanush-J`}</div>
                            </div>
                            <div className='itemSeperator'></div>
                            <div className="itemObject">
                                <div className='socialIconContainer'>
                                    <i className='fa-solid fa-briefcase fa-xl'></i>
                                    <p>Portfolio website</p>
                                </div>
                                <div className="linkField">{`https://tanushjangid-tanush-j.vercel.app/`}</div>
                            </div>
                            <div className='itemSeperator'></div>
                            <div className="itemObject">
                                <div className='socialIconContainer'>
                                    <i className='fa-brands fa-x-twitter fa-xl'></i>
                                    <p>Twitter Profile</p>
                                </div>
                                <div className="linkField">{`https://twitter.com/Tanush_Jangid`}</div>
                            </div>
                        </div>
                        <div className="resumeEducationSection">
                            <div className="sectionHeading">
                                <h2>Education</h2>
                            </div>
                            <div className="itemObject">
                                <div>
                                    <h3>{`B.Tech, Computer Science Engineering`}</h3>
                                    <h4>{`MIT WPU, Pune`}</h4>
                                    <span>2019 - 2023</span>
                                </div>
                                <div className='educationItemGpa'>
                                    <p>CGPA</p>
                                    <div>
                                        <span className='score'>9.55</span>
                                        <span> / </span>
                                        <span>10</span>
                                    </div>
                                </div>
                            </div>
                            <div className='itemSeperator'></div>
                            <div className="itemObject">
                                <div>
                                    <h3>{`Class XII`}</h3>
                                    <h4>{`Sri Chaitanaya Junior College`}</h4>
                                    <span>2018 - 2019</span>
                                </div>
                                <div className='educationItemGpa'>
                                    <p>Percentage</p>
                                    <div>
                                        <span className='score'>67</span>
                                        <span> / </span>
                                        <span>100</span>
                                    </div>
                                </div>
                            </div>
                            <div className='itemSeperator'></div>
                            <div className="itemObject">
                                <div>
                                    <h3>{`Class X`}</h3>
                                    <h4>{`Kendriya Vidhayala R.H.E`}</h4>
                                    <span>2016 - 2017</span>
                                </div>
                                <div className='educationItemGpa'>
                                    <p>CGPA</p>
                                    <div>
                                        <span className='score'>9.00</span>
                                        <span> / </span>
                                        <span>10</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="resumeTrainingCoursesSection">
                            <div className="sectionHeading">
                                <h2>Training / Courses</h2>
                            </div>
                            <div className="itemObject">
                                <h4>{`OCI 2023 Certified Foundation Associate`}</h4>
                                <p>{`Certified course from oracle university`}</p>
                            </div>
                            <div className='itemSeperator'></div>
                            <div className="itemObject">
                                <h4>{`React - The Complete Guide 2023`}</h4>
                                <p>{`Udemy course covering fundamental and advanced react and redux concepts.`}</p>
                            </div>
                            <div className='itemSeperator'></div>
                            <div className="itemObject">
                                <h4>{`The Web Developer Bootcamp 2022`}</h4>
                                <p>{`Udemy course covering HTML, CSS, Javascript, Express.js, Node.js and MongoDB concepts.`}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default MainResume;