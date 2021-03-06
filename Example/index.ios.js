import React, { Component } from 'react'
import {
  Text,
  View,
  Image,
  Slider,
  ScrollView,
  AppRegistry,
  TouchableOpacity,
} from 'react-native'

import {ImageCrop} from '../src/'

class Example extends Component {
  constructor(props) {
    super(props);
    this.state = {
      image: 'http://i.imgur.com/tCatS2c.jpg',
      height: 200,
      width: 300,
      zoom: 50,
      showNew: true,
      newImage: 'http://i.imgur.com/tCatS2c.jpg',
    };
  }

  render() {
    return (
      <ScrollView>
        <View>
          <ImageCrop
            ref={component => this._cropper = component}
            image={this.state.image}
            cropHeight={this.state.height}
            cropWidth={this.state.width}
            zoom={this.state.zoom}
            maxZoom={80}
            minZoom={20}
            panToMove={true}
            pinchToZoom={true}
          />
          <View style={{flex: 1, marginTop: 20}}>
            <Slider
              value={this.state.zoom}
              onValueChange={value => this.setState({zoom: value})}
              maximumValue={100}
              minimumValue={0}
              step={0.1}
            />
            <TouchableOpacity onPress={this.capture.bind(this)}>
              <View style={{flex: 1, alignItems: "center", justifyContent: "center",marginTop: 20}}>
                <Text style={{color: "grey", padding: 10}}>CAPTURE</Text>
              </View>
            </TouchableOpacity>

            <Image source={{ uri: this.state.newImage }} style={{height: this.state.height, width: this.state.width}} />

          </View>
        </View>
      </ScrollView>
    );
  }
  capture(){
    this.refs._cropper.crop()
    .then(res =>{
      this.setState({
        showNew: true,
        newImage: res,
      });
    })
  }
  getDimensions(){
    this.refs._cropper.fetchDimensions()
    .then(
      dimensions => {
        console.log(dimensions)
        console.log("cropped dimensions");
        console.log("height: "+dimensions.height);
        console.log("width: "+coords.width);
      }
    );
  }

  getCoordinates(){
    this.refs._cropper.fetchCoordinates()
    .then(
      coords => {
        console.log("center coordinates");
        console.log("centerX: "+coords.centerX);
        console.log("centerY: "+coords.centerY);
      }
    );
  }
}

AppRegistry.registerComponent('Example', () => Example)
