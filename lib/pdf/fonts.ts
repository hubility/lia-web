import path from "node:path";
import { Font } from "@react-pdf/renderer";

const dir = path.join(process.cwd(), "public", "fonts", "Outfit", "static");

Font.register({
  family: "Outfit",
  fonts: [
    { src: path.join(dir, "Outfit-Regular.ttf"), fontWeight: 400 },
    { src: path.join(dir, "Outfit-Medium.ttf"), fontWeight: 500 },
    { src: path.join(dir, "Outfit-SemiBold.ttf"), fontWeight: 600 },
    { src: path.join(dir, "Outfit-Bold.ttf"), fontWeight: 700 },
  ],
});

// Evita que react-pdf corte palabras con guiones a mitad de línea.
Font.registerHyphenationCallback((word) => [word]);
