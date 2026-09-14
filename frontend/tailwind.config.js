/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        gym: {
          bg: "#121212", // page background — matches the logo's slate-black wall
          panel: "#1b1b1b", // cards / sidebar
          panel2: "#222222", // nested surfaces, inputs
          border: "#303030",
          gold: "#F2B705", // primary brand accent, from the "B" / "GYM" lettering
          goldSoft: "#8a6c17",
          silver: "#D7DAE0", // from the chrome "FITNESS" lettering
          text: "#EDEDED",
          muted: "#9A9A9A",
        },
        status: {
          active: "#3FBF66",
          activeBg: "rgba(63,191,102,0.12)",
          expiring: "#F2B705",
          expiringBg: "rgba(242,183,5,0.12)",
          expired: "#E5484D",
          expiredBg: "rgba(229,72,77,0.12)",
        },
      },
      fontFamily: {
        display: ["'Bebas Neue'", "sans-serif"],
        body: ["'Inter'", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
