require("dotenv").config();

const app = require("./app");
console.log(require.resolve("./app"));
const connectDB = require("./config/db");

const PORT = process.env.PORT || 5000;

async function startServer() {
    try {
        await connectDB();

        app.listen(PORT, () => {
            console.log(`🚀 Server running on http://localhost:${PORT}`);
        });

    } catch (err) {
        console.error("❌ Startup Error:", err);
    }
}

startServer();