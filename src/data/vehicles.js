// Static placeholder fleet data — swap this for a real API call later, e.g.:
//   const res = await fetch('/api/vehicles')
//   const vehicles = await res.json()
//
// licenseFile / photos hold uploaded file info ({ name }) — real File objects
// once picked in the browser.
export const VEHICLES = [
  {
    id: 'v1',
    plate: '1 2 1 س س ش',
    model: 'Toyota Hiace',
    capacity: 13,
    color: 'White',
    licenseFile: { name: 'license.pdf' },
    photos: [{ name: 'front.jpg' }, { name: 'side.jpg' }, { name: 'back.jpg' }],
  },
  {
    id: 'v2',
    plate: '4 5 7 ب ر ع',
    model: 'Toyota Hiace',
    capacity: 13,
    color: 'White',
    licenseFile: { name: 'license.pdf' },
    photos: [{ name: 'front.jpg' }, { name: 'side.jpg' }, { name: 'back.jpg' }],
  },
  {
    id: 'v3',
    plate: '8 3 2 م ن ص',
    model: 'Hyundai H1',
    capacity: 9,
    color: 'Silver',
    licenseFile: null,
    photos: [],
  },
]
