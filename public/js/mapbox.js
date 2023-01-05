/* eslint-disable */

export const displayMap = (locations) => {
    mapboxgl.accessToken =
        'pk.eyJ1IjoiZHVuZ21haXZuIiwiYSI6ImNsYml1MThkcjBwbHgzb28wMzhyamYxZnUifQ.XWEIe38C29L3W-_JNT751g';
    var map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/dungmaivn/clbj4muw3000l14qshfquzzml',
        scrollZoom: false,
        // center: [-118.113491, 34.111745],
        // zoom: 6,
        // interactive: false,
    });
    const bounds = new mapboxgl.LngLatBounds();
    locations.forEach((loc) => {
        //Create marker
        const el = document.createElement('div');
        el.className = 'marker';

        // add Marker
        new mapboxgl.Marker({
            element: el,
            anchor: 'bottom',
        })
            .setLngLat(loc.coordinates)
            .addTo(map);

        // add popup
        new mapboxgl.Popup({ offset: 30 })
            .setLngLat(loc.coordinates)
            .setHTML(`<p>Day ${loc.day} : ${loc.description} </p>`)
            .addTo(map);
        bounds.extend(loc.coordinates);
    });

    map.fitBounds(bounds, {
        padding: {
            top: 200,
            bottom: 150,
            left: 100,
            right: 100,
        },
    });
};
