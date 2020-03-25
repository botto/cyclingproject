import React, { Component } from "react";
import axios from "axios";
import MapView from "./MapViewDetail";

export default class TripDetail extends Component {
  state = {
    trip: null
  };

  componentDidMount() {
    const id = this.props.match.params.id;

    console.log("ide value", id);

    axios.get(`/api/trips/trip/${id}`).then(response => {
      console.log("response", response);
      this.setState({
        trip: response.data
      });
      console.log("Test the state:", this.state);
    });
  }

  render() {
    const trip = this.state.trip;

    if (!trip) {
      return <div>Jackie and the Ferry Boys</div>;
    }
    return (
      <>
        <MapView coordinates={trip.coordinates} origin={trip.origin} />
      </>
    );
  }
}
