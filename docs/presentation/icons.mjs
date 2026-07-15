import React from "react";
import ReactDOMServer from "react-dom/server";
import sharp from "sharp";
import fs from "fs";
import {
  FaCloud, FaShoppingCart, FaBoxOpen, FaChartLine, FaUsers, FaServer,
  FaDatabase, FaDocker, FaGithub, FaTerminal, FaRocket, FaGlobe, FaCogs,
  FaKey, FaShieldAlt, FaUserShield, FaCodeBranch, FaSyncAlt, FaCheckCircle,
  FaFileCode, FaLock, FaLayerGroup, FaHeartbeat, FaFlask, FaPuzzlePiece,
  FaGlobeAmericas, FaBolt, FaTshirt
} from "react-icons/fa";
import { SiReact, SiVite, SiReplit, SiGooglecloud, SiPostgresql } from "react-icons/si";

const icons = {
  cloud: FaCloud, cart: FaShoppingCart, box: FaBoxOpen, chart: FaChartLine,
  users: FaUsers, server: FaServer, database: FaDatabase, docker: FaDocker,
  github: FaGithub, terminal: FaTerminal, rocket: FaRocket, globe: FaGlobe,
  cogs: FaCogs, key: FaKey, shield: FaShieldAlt, usershield: FaUserShield,
  branch: FaCodeBranch, sync: FaSyncAlt, check: FaCheckCircle,
  filecode: FaFileCode, lock: FaLock, layers: FaLayerGroup,
  heartbeat: FaHeartbeat, flask: FaFlask, puzzle: FaPuzzlePiece,
  domain: FaGlobeAmericas, bolt: FaBolt, tshirt: FaTshirt,
  react: SiReact, vite: SiVite, replit: SiReplit, gcloud: SiGooglecloud,
  postgres: SiPostgresql
};

fs.mkdirSync("icons", { recursive: true });
for (const [name, Comp] of Object.entries(icons)) {
  const svg = ReactDOMServer.renderToStaticMarkup(
    React.createElement(Comp, { color: "#FFFFFF", size: 256 })
  );
  await sharp(Buffer.from(svg), { density: 300 })
    .resize(256, 256, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png().toFile(`icons/${name}.png`);
}
console.log("icons done:", Object.keys(icons).length);
