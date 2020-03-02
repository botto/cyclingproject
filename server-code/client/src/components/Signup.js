import React, { Component } from "react";
import axios from "axios";

export default class Signup extends Component {
  state = {
    email: "",
    password: "",
    message: ""
  };

  handleChange = event => {
    this.setState({
      [event.target.name]: event.target.value
    });
  };

  handleSubmit = event => {
    event.preventDefault();
    axios
      .post("/api/auth/signup", {
        email: this.state.email,
        password: this.state.password
      })
      .then(response => {
        // redirect
        // update state for user in <App/>
        this.props.setUser(response.data);
        this.props.history.push("/");
      })
      .catch(err => {
        console.log("error test", err.response.data.message);
        this.setState({
          message: err.response.data.message
        });
      });
  };

  render() {
    return (
      <div className="auth-wrapper">
        <div className="auth-box">
          <h2>Create an Account</h2>

          <div className="auth-form">
            <form onSubmit={this.handleSubmit}>
              <div>
                <label htmlFor="email"></label>
                <input
                  type="text"
                  id="email"
                  name="email"
                  placeholder="Email"
                  value={this.state.email}
                  onChange={this.handleChange}
                />
              </div>

              <div>
                <label htmlFor="password"></label>
                <input
                  type="password"
                  name="password"
                  id="password"
                  placeholder="Password"
                  value={this.state.password}
                  onChange={this.handleChange}
                />
              </div>
              <div>
                <button className="auth-btn" type="submit">
                  Sign up
                </button>
              </div>
            </form>
          </div>
          {this.state.message && <p>{this.state.message}</p>}
        </div>
      </div>
    );
  }
}