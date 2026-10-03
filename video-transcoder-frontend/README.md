# all steps:
1.  creating new project folder
npm create vite@latest video-transcoder-frontend

2.  dependies installation
cd video-transcoder-frontend
npm install

3. install libraries:

npm install react-router-dom axios react-player

react-router-dom	Upload page aur Preview page ke beech navigation ke liye
axios	Backend ko HTTP requests bhejne ke liye (upload, preview, download)
react-player	Browser mein video play karne ke liye

4. installling tailwind css

npm install tailwindcss @tailwindcss/vite

5. change file in vite.config.js
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
})

6. remove all content of index.css and import this
@import "tailwindcss";

7. run project and check
npm run dev

8. make project structure

src/
├── api/
│   ├── axios.js
│   └── videoApi.js
├── pages/
│   ├── UploadPage.jsx
│   └── PreviewPage.jsx
├── App.jsx
├── main.jsx
└── index.css   (already done)

9. 
✅ Frontend — Poora Checklist
Kaam	                                  Status
Project setup (Vite + React + Tailwind)	✅ Done
Upload page UI (drag-drop, file select)	✅ Done
Upload progress bar	✅ Done
Upload API call (Axios)	✅ Done
Error handling (jaisa abhi dikha)	✅ Done
Routing (Upload page → Preview page)	✅ Done
Preview page UI (original + transcoded video players)	✅ Done
Show button logic (preview API call)	✅ Done
Download button logic (blob download)	✅ Done

10. To check review page if exist or not without backend
http://localhost:5174/preview/test123

it looks like loading video details .....

bec it didn't get video detail yet now bec of backend so lets put fake details in frontend for now

