
// tailwind.config.js (or tailwind.config.mjs)
import withMT from "@material-tailwind/react/utils/withMT";

export default withMT({
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.{js,ts,jsx,tsx}",  // if you use /src
    "./public/**/*.html",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
});
