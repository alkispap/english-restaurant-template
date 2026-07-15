export const featuredDiningHubs = [
  {
    title: "Southall",
    slug: "southall",
    image: "/images/homepage/dining-hubs/southall.webp",
    imageAlt: "Traffic and independent shops along The Broadway in Southall",
    credit: {
      title: "The Broadway, Southall - DSC07010",
      author: "Rept0n1x",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:The_Broadway,_Southall_-_DSC07010.JPG",
      licenseLabel: "CC BY-SA 3.0",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0/",
      note: "Resized and cropped for the homepage card."
    }
  },
  {
    title: "Wembley",
    slug: "wembley",
    image: "/images/homepage/dining-hubs/wembley.webp",
    imageAlt: "Parade of shops on Wembley High Road in north-west London",
    credit: {
      title: "Parade of shops, High Road, Wembley",
      author: "Christopher Hilton",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Parade_of_shops,_High_Road,_Wembley_-_geograph.org.uk_-_5121815.jpg",
      licenseLabel: "CC BY-SA 2.0",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/2.0/",
      note: "Resized and cropped for the homepage card."
    }
  },
  {
    title: "Harrow",
    slug: "harrow",
    image: "/images/homepage/dining-hubs/harrow.webp",
    imageAlt: "Station Road streetscape and local buildings in Harrow",
    credit: {
      title: "Station Road, Harrow",
      author: "Martin Addison",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Station_Road,_Harrow_-_geograph.org.uk_-_3919144.jpg",
      licenseLabel: "CC BY-SA 2.0",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/2.0/",
      note: "Resized and cropped for the homepage card."
    }
  },
  {
    title: "Tooting",
    slug: "tooting",
    image: "/images/homepage/dining-hubs/tooting.webp",
    imageAlt: "Busy intersection beside Tooting Broadway Underground station",
    credit: {
      title: "Tooting Broadway: A busy intersection",
      author: "Dr Neil Clifton",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Tooting_Broadway,_A_busy_intersection_-_geograph.org.uk_-_3540661.jpg",
      licenseLabel: "CC BY-SA 2.0",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/2.0/",
      note: "Resized and cropped for the homepage card."
    }
  },
  {
    title: "Brick Lane",
    slug: "brick-lane",
    image: "/images/homepage/dining-hubs/brick-lane.webp",
    imageAlt: "Indian and Bangladeshi restaurant signs on Brick Lane at night",
    credit: {
      title: "Brick Lane",
      author: "Tony Hisgett",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Brick_Lane.JPG",
      licenseLabel: "CC BY 2.0",
      licenseUrl: "https://creativecommons.org/licenses/by/2.0/",
      note: "Resized and cropped for the homepage card."
    }
  }
] as const;

export function getFeaturedDiningHub(slug: string) {
  return featuredDiningHubs.find((hub) => hub.slug === slug);
}
