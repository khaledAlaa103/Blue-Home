// Photo behind each section's page banner (Unsplash, like the rest of the site's sample imagery).
const PHOTOS = {
  properties: 'photo-1486406146926-c627a92ad1ab',
  units: 'photo-1600607687939-ce8a6c25118c',
  lands: 'photo-1500382017468-9049fed747ef',
  all: 'photo-1613490493576-7fde63acd811',
  about: 'photo-1512917774080-9991f1c4c750',
  contact: 'photo-1560448204-e02f11c3d0e2',
}

function photo(id, width) {
  return `url("https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=70")`
}

export function bannerStyle(name) {
  const id = PHOTOS[name] || PHOTOS.all
  return { '--banner': photo(id, 1800), '--banner-sm': photo(id, 800) }
}
