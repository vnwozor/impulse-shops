import { app, ready } from "./app.js";

await ready;

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`Impulse.shops API on http://localhost:${port}`));
