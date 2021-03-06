import React, { Component } from 'react'
import PropTypes from 'prop-types'
import {
  View,
  Image,
  PixelRatio,
  PanResponder
} from 'react-native'

import {Surface} from 'gl-react-native'
const {Image: GLImage} = require("./Image")

const imageDimensionsAfterZoom = (viewport, dimensions, zoom) => {
  const ImageRatio = dimensions.width/dimensions.height
  const ViewportRatio = viewport.width/viewport.height
  if (ImageRatio > ViewportRatio){
    return {
      height: Math.floor(viewport.height/zoom),
      width: Math.floor((viewport.height*ImageRatio)/zoom)
    }
  }
  else
    return {
      height: Math.floor((viewport.width/ImageRatio)/zoom),
      width: Math.floor(viewport.width/zoom)
    }
}

const movementFromZoom = (gestureState, viewport, dimensions, offsets, zoom) =>{
  let newPosX, newPosY
  // X-axis
  let widthOffset = dimensions.width-viewport.width
  let pxVsMovX = (1/dimensions.width)
  let moveX = (gestureState.dx*pxVsMovX) * zoom
  newPosX = (parseFloat(offsets.x) - parseFloat(moveX))

  // Y-axis
  let heightOffset = dimensions.height-viewport.height
  let pxVsMovY = (1/dimensions.height)
  let moveY = (gestureState.dy*pxVsMovY) * zoom
  newPosY = (parseFloat(offsets.y) - parseFloat(moveY))
  return {
    x: newPosX,
    y: newPosY,
  }
}


class ImageCrop extends Component {
  constructor(props) {
    super(props)
    this.state = {
      zoom: 1,

      //pan settings
      centerX: 0.5,
      centerY: 0.5,

        center_X: 0.5,
        center_Y: 0.5,
      //Image sizes
      imageHeight: 300,
      imageWidth: 300,
      imageDimHeight: 0,
      imageDimWidth: 0,
      currentCapture: '',

      //coordinates
      /*
      0,1 ---- 1,0
       |        |
       |        |
      0,0 ---- 1,1

      coord00: ,
      coord01: ,
      coord10: ,
      coord11: ,
      just use the center and the image dimensions instead
      */
    }

    Image.getSize(this.props.image, (width, height) => {
      //update state
      this.state.imageHeight = height; 
      this.state.imageWidth = width; 
    }, ()=>{
      if(this.props.originalImageWidth && this.props.originalImageWidth){
        this.state.imageHeight = this.props.originalImageHeight; 
        this.state.imageWidth = this.props.originalImageWidth; 
      }else{
          console.warn('Failed to get size for image: ' + this.props.image);
      }

    }
    );

    //
    //get dimensions after crop
    //

    let viewport = {height: this.props.cropHeight, width: this.props.cropWidth};
    let dimensions = {height: this.state.imageHeight, width: this.state.imageWidth};

    this._dimensionAfterZoom = imageDimensionsAfterZoom(
      viewport,
      dimensions,
      this.state.zoom
    );

    //################### set cordinates here
    this._centerCoordinates = {
      centerX: this.state.centerX,
      centerY: this.state.centerY
    }

    // todo, add resizable viewport
    this.state.imageDimHeight = this._dimensionAfterZoom.height; 
    this.state.imageDimWidth = this._dimensionAfterZoom.width; 

  }

  
  static getDerivedStateFromProps(nextProps, prevState){
    // https://hackernoon.com/replacing-componentwillreceiveprops-with-getderivedstatefromprops-c3956f7ce607
    if(nextProps.zoom && nextProps.zoom!==prevState.zoom){
      alert("next"+JSON.stringify(nextProps.zoom));
      let zoom_ = (100 - nextProps.zoom)/100;
      
      return {zoom: zoom_};
    }
    else return null;
 }
 
  componentDidUpdate(prevProps, prevState) {
    // https://hackernoon.com/replacing-componentwillreceiveprops-with-getderivedstatefromprops-c3956f7ce607
    //get dimensions after crop
    //
    if(prevState.zoom !== this.state.zoom){
      this._dimensionAfterZoom = imageDimensionsAfterZoom(
        {height: this.props.cropHeight, width: this.props.cropWidth},
        {height: this.state.imageHeight, width: this.state.imageWidth},
        this.state.zoom
      );
      this.setState({
        imageDimHeight: this._dimensionAfterZoom.height,
        imageDimWidth: this._dimensionAfterZoom.width
      });
    }
    
  }
// componentWillReceiveProps(nextProps){
//     if (this.props.zoom != nextProps.zoom) {
//       var zoom = (100 - nextProps.zoom)/100
//       this.setState({ zoom: zoom })
//     }

//     //
//     //get dimensions after crop
//     //
//     this._dimensionAfterZoom = imageDimensionsAfterZoom(
//       {height: this.props.cropHeight, width: this.props.cropWidth},
//       {height: this.state.imageHeight, width: this.state.imageWidth},
//       this.state.zoom
//     )

//     this.setState({
//       imageDimHeight: this._dimensionAfterZoom.height,
//       imageDimWidth: this._dimensionAfterZoom.width
//     })
//   }



  _panResponder = PanResponder.create({
    onStartShouldSetPanResponder: (evt, gestureState) => true,
    onStartShouldSetPanResponderCapture: (evt, gestureState) => true,
    onMoveShouldSetPanResponder: (evt, gestureState) => true,
    onMoveShouldSetPanResponderCapture: (evt, gestureState) => true,
    onPanResponderTerminationRequest: (evt, gestureState) => false,
    onShouldBlockNativeResponder: (evt, gestureState) => true,

    onPanResponderGrant: (evt, gestureState) => {
      //move variables
      this.offsetX = this.state.centerX
      this.offsetY = this.state.centerY

      //zoom variables
      this.zoomLastDistance=0
      this.zoomCurrentDistance=0
    },

    onPanResponderMove: (evt, gestureState) => {
      //We are moving the image
      if (evt.nativeEvent.changedTouches.length <= 1){
        var trackX = (gestureState.dx/this.props.cropWidth)*this.state.zoom
        var trackY = (gestureState.dy/this.props.cropHeight)*this.state.zoom
        var newPosX = (Number(this.offsetX) - Number(trackX))
        var newPosY = (Number(this.offsetY) - Number(trackY))
        if (newPosX> 1) newPosX = Number(1)
        if (newPosY> 1) newPosY = Number(1)
        if (newPosX< 0) newPosX = Number(0)
        if (newPosY< 0) newPosY = Number(0)

        var movement = movementFromZoom(
          gestureState,
          {width: this.props.cropWidth, height: this.props.cropHeight},
          {width: this.state.imageDimWidth, height: this.state.imageDimHeight},
          {x: this.offsetX, y: this.offsetY},
          this.state.zoom
        )

        if(this.props.setCoordinates){
          this.props.setCoordinates(movement.x, movement.y);
        }
        this.setState({centerX: movement.x, center_X: movement.x});
        this.setState({centerY: movement.y, center_Y: movement.y});

        //################### set cordinates here
        this._centerCoordinates = {
          centerX: this.state.centerX,
          centerY: this.state.centerY
        }


      }else{
      //We are zooming the image
        if (this.zoomLastDistance == 0){
          let a = evt.nativeEvent.changedTouches[0].locationX - evt.nativeEvent.changedTouches[1].locationX
          let b = evt.nativeEvent.changedTouches[0].locationY - evt.nativeEvent.changedTouches[1].locationY
          let c = Math.sqrt( a*a + b*b )
          this.zoomLastDistance = c.toFixed(1)
        }else{
          let a = evt.nativeEvent.changedTouches[0].locationX - evt.nativeEvent.changedTouches[1].locationX
          let b = evt.nativeEvent.changedTouches[0].locationY - evt.nativeEvent.changedTouches[1].locationY
          let c = Math.sqrt( a*a + b*b )
          this.zoomCurrentDistance = c.toFixed(1)

          //what is the zoom level
          var screenDiagonal = Math.sqrt(this.state.imageHeight*this.state.imageHeight + this.state.imageWidth*this.state.imageWidth)
          var distance = (this.zoomCurrentDistance-this.zoomLastDistance)/400
          var zoom = this.state.zoom-distance

          if (zoom<0)zoom=0.0000001
          if (zoom>1)zoom=1
          this.setState({
            zoom: zoom,
          })

          if(this.props.setZoom){
              this.props.setZoom(zoom);
          }
          //Set last distance..
          this.zoomLastDistance=this.zoomCurrentDistance
        }
      }
    }
  });


  render() {
    return (
        <View {...this._panResponder.panHandlers}>
          <Surface width={this.props.cropWidth} height={this.props.cropHeight} pixelRatio={this.props.pixelRatio} backgroundColor="transparent" ref="cropit">
		        <GLImage
		          source={{ uri: this.props.image}}
              imageSize={{height: this.state.imageHeight, width: this.state.imageWidth}}
		          resizeMode="cover"
		          zoom={this.state.zoom}
		          center={[this.state.centerX, this.state.centerY]}
		        />
          </Surface>
        </View>
    )
  }
  crop(){
    return this.refs.cropit.captureFrame({quality: this.props.quality, type: this.props.type, format: this.props.format, filePath: this.props.filePath})
  }
  fetchDimensions(){
    return this._dimensionAfterZoom;
  }
  fetchCoordinates(){
    return {
        centerX: this.state.center_X,
        centerY: this.state.center_Y
    };
  }
}
ImageCrop.defaultProps = {
  image: '',
  cropWidth: 300,
  cropHeight: 300,
  zoomFactor: 0,
  minZoom: 0,
  maxZoom: 100,
  quality: 1,
  pixelRatio: PixelRatio.get(),
  type: 'jpg',
  format: 'base64',
  filePath: ''
}
ImageCrop.propTypes = {
  image: PropTypes.string.isRequired,
  originalImageWidth: PropTypes.number,
  originalImageHeight: PropTypes.number,
  cropWidth: PropTypes.number.isRequired,
  cropHeight: PropTypes.number.isRequired,
  setCoordinates:  PropTypes.func,
  zoomFactor: PropTypes.number,
  maxZoom: PropTypes.number,
  minZoom: PropTypes.number,
  quality: PropTypes.number,
  pixelRatio: PropTypes.number,
  type: PropTypes.string,
  format: PropTypes.string,
  filePath: PropTypes.string
}
module.exports=ImageCrop
