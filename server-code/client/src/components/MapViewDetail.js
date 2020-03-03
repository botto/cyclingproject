import React from 'react';
import mapboxgl from 'mapbox-gl';
import MapBoxGLDraw from 'mapbox-gl-draw';
import axios from 'axios';
import { Link } from 'react-router-dom';
import TripReview from './TripReview';

mapboxgl.accessToken =
  'pk.eyJ1IjoiamFjcXVlbGluZWNoZW4iLCJhIjoiY2s2ZHB5Y2RxMDkxbzNkbXA2bXVzM3JvbiJ9.pUyDxtMWjGqmGgX4JAdL7g';

export default class PlotView extends React.Component {
  // constructor(props) {
  //   super(props);
  state = {
    title: '',
    origin: [],
    origin_name: '',
    destination: [],
    destination_name: '',
    map: null,
    draw: null,
    lng: 5,
    lat: 34,
    zoom: 4,
    uuid: '',
    duration: '',
    distance: '',
    coordinates: [],
    waypoints: [],
    reviewTrip: false,
  };

  //
  removeRoute = () => {
    if (this.state.map.getSource('route')) {
      this.state.map.removeLayer('route');
      this.state.map.removeSource('route');
      //  document.getElementById('calculated-line').innerHTML = '';
    } else {
      return;
    }
  };

  updateRoute = () => {
    this.removeRoute(); // overwrite any existing layers
    let data = this.state.draw.getAll();
    let answer = document.getElementById('calculated-line');
    let lastFeature = data.features.length - 1;
    let coords = data.features[lastFeature].geometry.coordinates;
    let newCoords = coords.join(';');
    this.getMatch(newCoords);
  };

  getMatch = e => {
    let url =
      'https://api.mapbox.com/directions/v5/mapbox/cycling/' +
      e +
      '?geometries=geojson&steps=true&&access_token=' +
      mapboxgl.accessToken;

    let req = new XMLHttpRequest();
    console.log('req', req);
    req.responseType = 'json';
    req.open('GET', url, true);
    req.onload = () => {
      let jsonResponse = req.response;
      let arr = jsonResponse.routes[0].geometry.coordinates;
      console.log('jsonReponse', jsonResponse);
      this.setState(
        {
          distance: jsonResponse.routes[0].distance * 0.001,
          duration: jsonResponse.routes[0].duration / 60,
          coordinates: jsonResponse.routes[0].geometry.coordinates,
          uuid: jsonResponse.uuid,
          waypoints: jsonResponse.waypoints,
          origin: jsonResponse.routes[0].geometry.coordinates[0],
          destination: jsonResponse.routes[0].geometry.coordinates[arr.length - 1],
        },
        () => {
          console.log(this.state);

          this.reverseGeocode();
        }
      );
      // let distance = jsonResponse.routes[0].distance * 0.001;
      // let duration = jsonResponse.routes[0].duration / 60;
      console.log(jsonResponse);

      // document.getElementById('calculated-line').innerHTML =
      // 'Distance: ' + distance.toF + ' km<br>Duration: ' + duration.toF + ' minutes';
      let coords = jsonResponse.routes[0].geometry;
      // add the route to the map
      this.addRoute(coords);
      this.getInstructions(jsonResponse.routes[0]);
    };
    req.send();
  };

  addRoute = coords => {
    // check if the route is already loaded
    if (this.state.map.getSource('route')) {
      this.state.map.removeLayer('route');
      this.state.map.removeSource('route');
    } else {
      this.state.map.addLayer({
        id: 'route',
        type: 'line',
        source: {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: coords,
          },
        },
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#3b9ddd',
          'line-width': 8,
          'line-opacity': 0.8,
        },
      });
    }
  };

  getInstructions = data => {
    // Target the sidebar to add the instructions
    let directions = document.getElementById('directions');
    let legs = data.legs;
    let tripDirections = [];
    // Output the instructions for each step of each leg in the response object
    for (let i = 0; i < legs.length; i++) {
      let steps = legs[i].steps;
      for (let j = 0; j < steps.length; j++) {
        tripDirections.push('<br><li>' + steps[j].maneuver.instruction + '</li>');
      }
    }
    // directions.innerHTML = '<br><h2>Trip duration: ' + Math.floor(data.duration / 60) + ' min.</h2>' + tripDirections;
  };

  componentDidMount = () => {
    let userCoords = this.props.coordinates.map(element => {
      element.reverse();
      return element;
    });

    console.log('initial declaration', userCoords);

    const map = new mapboxgl.Map({
      container: this.mapContainer,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [this.state.lng, this.state.lat],
      zoom: this.state.zoom,
      duration: this.state.duration,
      distance: this.state.distance,
    });
    // console.log('duration', duration);
    const draw = new MapBoxGLDraw({
      displayControlsDefault: false,
      controls: {
        line_string: true,
        trash: true,
      },
      styles: [
        // ACTIVE (being drawn)
        // line stroke
        {
          id: 'gl-draw-line',
          type: 'line',
          filter: ['all', ['==', '$type', 'LineString'], ['!=', 'mode', 'static']],
          layout: {
            'line-cap': 'round',
            'line-join': 'round',
          },
          paint: {
            'line-color': '#3b9ddd',
            'line-dasharray': [0.2, 2],
            'line-width': 4,
            'line-opacity': 0.7,
          },
        },
        // vertex point halos
        {
          id: 'gl-draw-polygon-and-line-vertex-halo-active',
          type: 'circle',
          filter: ['all', ['==', 'meta', 'vertex'], ['==', '$type', 'Point'], ['!=', 'mode', 'static']],
          paint: {
            'circle-radius': 10,
            'circle-color': '#FFF',
          },
        },
        // vertex points
        {
          id: 'gl-draw-polygon-and-line-vertex-active',
          type: 'circle',
          filter: ['all', ['==', 'meta', 'vertex'], ['==', '$type', 'Point'], ['!=', 'mode', 'static']],
          paint: {
            'circle-radius': 6,
            'circle-color': '#3b9ddd',
          },
        },
      ],
    });

    map.on('load', () => {
      // console.log("On Load coords", userCoords);
      console.log('props', this.props);
      let workingCoords = [
        [40.998026998026, 14.098482998026],
        [41.020649020649, 14.098132020649],
        [41.020474020649, 14.110666020649],
        [41.024281020649, 14.107097020649],
        [41.044168020649, 14.100123020649],
        [41.044122020649, 14.087687020649],
        [41.065196020649, 14.101628020649],
        [41.086844020649, 14.102352020649],
        [41.087572020649, 14.104416020649],
        [41.093916020649, 14.106363020649],
        [41.097221020649, 14.104472020649],
        [41.108311020649, 14.109544020649],
        [41.130772020649, 14.060963020649],
        [41.134644020649, 14.064113020649],
        [41.137796020649, 14.053121020649],
      ];
      let userCoords = this.props.coordinates.map(element => {
        return element.reverse().map(el => {
          // let number = +el.toFixed(12);
          let difference = 12 - el.length;
          let number = Number(el.toFixed(11) + '1');
          return number;
        });
      });
      console.log('hacked userCoords', userCoords);
      console.log('Working Coords', workingCoords);
      map.addLayer({
        id: 'layer1',
        type: 'line',
        source: {
          type: 'geojson',
          data: {
            type: 'Feature',
            geometry: {
              type: 'LineString',
              coordinates: userCoords,
            },
          },
        },
        layout: {
          'line-join': 'round',

          'line-cap': 'round',
        },
        paint: {
          'line-color': '#888',
          'line-width': 8,
        },
      });

      // map.addSource("route", {
      //   type: "geojson",
      //   data: {
      //     type: "Feature",
      //     properties: {},
      //     geometry: {
      //       type: "LineString",
      //       coordinates: [userCoords]
      //     }
      //   }
      // });
      // map.addLayer({
      //   id: "route",
      //   type: "line",
      //   source: "route",
      //   layout: {
      //     "line-join": "round",
      //     "line-cap": "round"
      //   },
      //   paint: {
      //     "line-color": "#888",
      //     "line-width": 8
      //   }
      // });
    });

    this.setState({ map, draw }, () => {
      const { map, draw } = this.state;

      // add the draw tool to the map
      map.addControl(draw);

      // add create, update, or delete actions
      map.on('draw.create', this.updateRoute);
      map.on('draw.update', this.updateRoute);
      map.on('draw.delete', this.removeRoute);

      // Storing new coordinate (whatever the user interacts with)
      map.on('move', () => {
        this.setState({
          lng: map.getCenter().lng.toFixed(4),
          lat: map.getCenter().lat.toFixed(4),
          zoom: map.getZoom().toF,
        });
      });
    });
  };

  reverseGeocode = () => {
    // Reverse geocoding for Origin
    axios
      .get(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${this.state.origin[0]},${this.state.origin[1]}.json?access_token=${mapboxgl.accessToken}`
      )
      .then(response => {
        console.log('full', response);

        let features = response.data.features;
        console.log(features);

        const locality = features.find(el => el.place_type.includes('locality'));
        if (locality) {
          this.setState({ origin_name: locality.place_name });
          return;
        }

        const place = features.find(el => el.place_type.includes('place'));
        if (place) {
          this.setState({ origin_name: place.place_name });
          return;
        }

        const region = features.find(el => el.place_type.includes('region'));
        if (region) {
          this.setState({ origin_name: region.place_name });
          return;
        }
      });

    // Reverse geocoding with Destination
    axios
      .get(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${this.state.destination[0]},${this.state.destination[1]}.json?access_token=${mapboxgl.accessToken}`
      )
      .then(response => {
        console.log('full', response);

        let features = response.data.features;
        console.log(features);

        const locality = features.find(el => el.place_type.includes('locality'));
        if (locality) {
          this.setState({ destination_name: locality.place_name });
          return;
        }

        const place = features.find(el => el.place_type.includes('place'));
        if (place) {
          this.setState({ destination_name: place.place_name });
          return;
        }

        const region = features.find(el => el.place_type.includes('region'));
        if (region) {
          this.setState({ destination_name: region.place_name });
          return;
        }
      });
  };

  goToReviewTrip = () => {
    this.setState({
      reviewTrip: !this.state.reviewTrip,
    });
  };

  updateTitle = text => {
    this.setState({
      title: text,
    });
  };

  render() {
    let tripReviewCard;
    let text;
    if (this.state.reviewTrip) {
      text = 'Go Back';
      tripReviewCard = <TripReview tripData={this.state} updateTitle={this.updateTitle} />;
    } else {
      text = 'Review Trip';
    }

    return (
      <div>
        <div className="sidebarStyle">
          <div>
            Longitude: {this.state.lng} | Latitude: {this.state.lat} | Zoom: {this.state.zoom}
          </div>
          {tripReviewCard}
          <button onClick={this.goToReviewTrip}>{text}</button>
        </div>
        <div ref={el => (this.mapContainer = el)} className="mapContainer" />
      </div>
    );
  }
}

// ReactDOM.render(<App />, document.getElementById('app'));
