import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// eslint-config-next 16 já é flat config nativa.
export default [...nextVitals, ...nextTs, { ignores: ["backend/**", ".next/**", "node_modules/**"] }];
