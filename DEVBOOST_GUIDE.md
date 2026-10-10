# 🚀 MERN DevBoost: Mission Control

> **Welcome to your new workspace!** 🎉 
> Your MERN stack is fully scaffolded, structured, and ready for action. No more boring setups. Let's get straight to the fun part: Coding!

---

## 🛠️ Step 1: Ignite the Servers

You have two main folders: `frontend` and `backend`. You will need **two separate terminals** to run them.

**Terminal 1: Backend**
```bash
cd backend
npm run dev
```
*(Runs the Express server on http://localhost:5000)*

**Terminal 2: Frontend**
```bash
cd frontend
npm run dev
```
*(Runs your fast Vite React app)*

---

## 🗄️ Step 2: Database Connection

By default, your app is looking for a **Local MongoDB** instance. You can see this in your `backend/.env` file:
> `MONGO_URI=mongodb://localhost:27017/VLU-CampusMarketWeb`

*(If you use MongoDB Atlas, just replace this URI with your Cloud Connection String.)*

---

## 🪄 Step 3: The Magic Command (Auto-CRUD)

Why write Models and Controllers manually? Let DevBoost do the heavy lifting!

1. Open VS Code Command Palette (`Ctrl + Shift + P` or `Cmd + Shift + P`).
2. Search and run: **`MERN: Generate API Resource (CRUD)`**
3. Type a resource name, for example: **`product`** and hit Enter.

*Boom! 💥 It will automatically create `Product.js` (Model), `productController.js`, and `productRoutes.js` with complete try-catch logic.*

---

## 🔌 Step 4: Link Your New Route in `app.js`

Once you generate a resource (like `product`), you must tell your Express app to use it. 
Open **`backend/app.js`** and add these two lines:

```javascript
// 1. Import your new route (Add this near the top)
const productRoutes = require('./routes/productRoutes');

// 2. Use the route (Add this below your other app.use statements)
app.use('/api/products', productRoutes);
```

---

## 🎨 Step 5: Want Tailwind CSS? (Optional)

We kept the UI clean so you can choose your tools. If you love **Tailwind CSS**, just run these in your `frontend` terminal:

```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

Then, open `tailwind.config.js` and update the content:
```javascript
content: [
  "./index.html",
  "./src/**/*.{js,ts,jsx,tsx}",
]
```

Finally, paste this at the very top of your `src/index.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

---
*Built with ❤️ by MERN DevBoost. Happy Hacking!*
