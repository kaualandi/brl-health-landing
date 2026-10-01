import { app } from "./app";
import { config } from "./config";

app.listen(config.port);
console.log(`API ouvindo em http://localhost:${config.port}`);
