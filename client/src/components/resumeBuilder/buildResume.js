import ReactDomServer from 'react-dom/server'

import classes from './buildResume.module.css';
import MainResume from './mainResume';

const BuildResume = () => {

  const buttonHandle = async () => {
      const data = ReactDomServer.renderToStaticMarkup(<MainResume />)
      fetch('http://localhost:5000/download', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify({
              componentHTML: data
          })
      })
      .then((response) => {
          if (response.ok) {
            return response.blob();
          } else {
            throw new Error('Failed to generate PDF');
          }
        })
        .then((blob) => {
          // Create a link element to trigger the download
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'generated.pdf';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
        })
        .catch((error) => {
          console.error(error);
        });
      console.log(data);
  }

  return (
      <>
          <button onClick={buttonHandle}>Download</button>
          <div className={classes.container}>
            <MainResume />
          </div>
      </>
  )
}

export default BuildResume;