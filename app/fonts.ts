import localFont from "next/font/local";

export const angie = localFont({
  src: "../public/fonts/Angie-Regular.ttf",
  variable: "--font-angie",
  display: "swap",
  weight: "400",
  fallback: ["Helvetica", "Arial", "sans-serif"],
});
