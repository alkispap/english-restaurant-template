/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [75],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "example.com"
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com"
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com"
      },
      {
        protocol: "https",
        hostname: "lh4.googleusercontent.com"
      },
      {
        protocol: "https",
        hostname: "lh5.googleusercontent.com"
      },
      {
        protocol: "https",
        hostname: "lh6.googleusercontent.com"
      },
      {
        protocol: "https",
        hostname: "streetviewpixels-pa.googleapis.com"
      },
      {
        protocol: "https",
        hostname: "thecurryclub.uk"
      }
    ]
  }
};

export default nextConfig;
