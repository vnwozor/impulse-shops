# Impulse.shops

Online store for **Impulse.shops by Mainroadlife** (luxury, fashion and lifestyle accessories, Lagos).

| Folder | What it is | Local address |
| --- | --- | --- |
| `frontend/` | The shop customers use (React + Vite) | http://localhost:5173 |
| `admin/` | The owner's dashboard (React + Vite) | http://localhost:5174 |
| `backend/` | API, data and image uploads (Node + Express) | http://localhost:4000 |

## Run it locally

```bash
npm run install:all
```

Then in three terminals:

```bash
npm run dev:api
npm run dev:store
npm run dev:admin
```

The admin sign-in email and password are in `backend/.env` (`ADMIN_EMAIL`, `ADMIN_PASSWORD`). Change both before going live.

With no `MONGO_URI` set, data is kept in `backend/data/db.json` and sample products are loaded on first start. `npm --prefix backend run seed:reset` wipes the data and reloads the samples.

## What the owner can control from the admin

- **Products**: add, edit, delete, hide, feature, mark as new; images (upload, reorder, cover); price and sale price; stock; sizes/lengths; details.
- **Categories**: add, rename, reorder, cover images.
- **Orders**: status (pending → confirmed → processing → shipped → delivered, or cancelled, which returns stock), payment status, private notes, one-tap WhatsApp to the customer.
- **Customers**: everyone who ordered, plus the newsletter list, both exportable as CSV.
- **Homepage**: announcement bar, hero slides (images, headline, button), section titles, story block, sourcing block.
- **Pages & FAQ**: About, Authenticity, Delivery, Returns, Privacy, FAQ.
- **Delivery**: zones by state with fees and timings, free-delivery threshold, pickup.
- **Payments**: Paystack card payments, bank transfer details, finish-on-WhatsApp.
- **Store details**: contact, WhatsApp number, social links.

## Going live

1. **Database**: create a free MongoDB Atlas cluster and set `MONGO_URI` in the backend environment.
2. **Images**: create a Cloudinary account and set the three `CLOUDINARY_*` values. Without them, uploads are saved on the server's disk, which most hosts wipe on redeploy.
3. **Card payments**: set `PAYSTACK_SECRET_KEY` (use the test key first). Card payment appears at checkout automatically.
4. **Backend** (Render, Railway, a VPS…): set every value from `backend/.env.example`, including `STORE_URL` and `ALLOWED_ORIGINS`.
5. **Storefront and admin** (Vercel, Netlify…): build each folder with `npm run build` and set:
   - `VITE_API_URL` = the backend's address (both apps)
   - `VITE_STORE_URL` = the shop's address (admin only, for "View website" links)
   - Add a rewrite of every path to `/index.html` so page links work on refresh.

The sample products use photos from Unsplash. Replace them with your own photos from the admin.
