import React, {Component} from 'react';
import {
  SafeAreaView,
  View,
  ScrollView,
  StyleSheet,
  Image,
  StatusBar,
  TouchableOpacity,
  Text,
  Dimensions,
  AppState,
  Linking,
} from 'react-native';
import RNFS from 'react-native-fs';
import ImagePicker from 'react-native-image-crop-picker';
import AsyncStorage from '@react-native-community/async-storage';
import ScreenBrightness from 'react-native-screen-brightness';

class App extends Component {
  constructor(props) {
    super(props);
    this.handleChoosePhoto = this.handleChoosePhoto.bind(this);
    this.scaleHeight = this.scaleHeight.bind(this);

    this.state = {
      passportImage: undefined,
      imageWidth: 375,
      imageHeight: 500,
      imageExists: false,
      appState: AppState.currentState,
    };

    ScreenBrightness.getBrightness().then(brightness => {
      this.setState({previousBrightness: brightness});
      ScreenBrightness.setBrightness(1);
      console.log('App has loaded!', 1);
    });

    this._loadValue();
  }

  componentDidMount() {
    this.appStateSubscription = AppState.addEventListener(
      'change',
      nextAppState => {
        if (
          this.state.appState.match(/inactive|background/) &&
          nextAppState === 'active'
        ) {
          ScreenBrightness.getBrightness().then(brightness => {
            this.setState({previousBrightness: brightness});
          });
          ScreenBrightness.setBrightness(1);
          console.log('App has come to the foreground!', 1);
        } else if (
          this.state.appState.match(/active/) &&
          nextAppState === 'background'
        ) {
          ScreenBrightness.setBrightness(this.state.previousBrightness);
          console.log(
            'App has gone to the background!',
            this.state.previousBrightness,
          );
        }
        this.setState({appState: nextAppState});
      },
    );
  }

  componentWillUnmount() {
    this.appStateSubscription.remove();
    ScreenBrightness.setBrightness(this.state.previousBrightness);
    console.log('App has closed!', this.state.previousBrightness);
  }

  _loadValue = async () => {
    let passportImage, imageHeight, imageWidth;
    try {
      await AsyncStorage.removeItem('@PassportStore:passportImage');
      passportImage = await AsyncStorage.getItem(
        '@PassportStore:passportImage',
      );
      imageHeight = await AsyncStorage.getItem('@PassportStore:imageHeight');
      imageWidth = await AsyncStorage.getItem('@PassportStore:imageWidth');
    } catch (error) {
      // Error retrieving data
    }

    if (passportImage !== '') {
      this.setState({
        passportImage: passportImage,
        imageHeight: imageHeight ? JSON.parse(imageHeight) : 500,
        imageWidth: imageWidth ? JSON.parse(imageWidth) : 375,
      });
    }
    RNFS.exists(passportImage).then(exists => {
      if (exists) {
        this.setState({
          imageExists: true,
        });
      } else {
        this.setState({
          imageExists: false,
          passportImage: undefined,
        });
      }
    });
  };

  handleChoosePhoto() {
    ImagePicker.openPicker({
      forceJpg: true,
      cropping: false,
    })
      .then(image => {
        const imagePath = `${RNFS.DocumentDirectoryPath}/passportImage.jpg`;
        RNFS.unlink(imagePath)
          .then(() => {
            console.log('FILE DELETED');
            RNFS.copyFile(`file://${image.path}`, imagePath)
              .then(res => {})
              .catch(err => {
                console.log('ERROR: image file write failed!!!');
                console.log(err.message, err.code);
              });
            try {
              AsyncStorage.setItem('@PassportStore:passportImage', imagePath);
              AsyncStorage.setItem(
                '@PassportStore:imageHeight',
                JSON.stringify(image.height),
              );
              AsyncStorage.setItem(
                '@PassportStore:imageWidth',
                JSON.stringify(image.width),
              );
              console.log('saved image name');
              this.setState({
                passportImage: imagePath,
                imageHeight: JSON.parse(image.height),
                imageWidth: JSON.parse(image.width),
                imageExists: true,
              });
              console.log('saved in state', imagePath, image.height);
            } catch (error) {
              // Error retrieving data
            }
          })
          .catch(err => {
            console.log(err.message);
            RNFS.copyFile(`file://${image.path}`, imagePath)
              .then(res => {})
              .catch(err => {
                console.log('ERROR: image file write failed!!!');
                console.log(err.message, err.code);
              });
            try {
              AsyncStorage.setItem('@PassportStore:passportImage', imagePath);
              AsyncStorage.setItem(
                '@PassportStore:imageHeight',
                JSON.stringify(image.height),
              );
              AsyncStorage.setItem(
                '@PassportStore:imageWidth',
                JSON.stringify(image.width),
              );
              console.log('saved image name');
              this.setState({
                passportImage: imagePath,
                imageHeight: JSON.parse(image.height),
                imageWidth: JSON.parse(image.width),
                imageExists: true,
              });
              console.log('saved in state', imagePath, image.height);
            } catch (error) {
              // Error retrieving data
            }
          });
      })
      .catch(() => {
        // Error opening image picker
      });
  }

  scaleHeight(desiredWidth) {
    return (desiredWidth / this.state.imageWidth) * this.state.imageHeight;
  }

  openLink() {
    Linking.openURL('https://gov.bc.ca/vaccinecard').catch(err =>
      console.error('Error', err),
    );
  }

  render() {
    let passportImage, imageHeight;
    if (this.state.passportImage !== undefined) {
      passportImage = `${RNFS.DocumentDirectoryPath}/passportImage.jpg`;
      imageHeight = this.scaleHeight(Dimensions.get('window').width);
    }

    if (this.state.imageExists) {
      return (
        <View style={styles.mainContainer}>
          <SafeAreaView>
            <StatusBar barStyle={'dark-content'} />
          </SafeAreaView>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={{paddingBottom: 34}}>
            {this.state.passportImage !== undefined && (
              <>
                <Image
                  style={[styles.image, {height: imageHeight}]}
                  source={{uri: passportImage}}
                  resizeMode="contain"
                />
                <TouchableOpacity
                  style={styles.button}
                  onPress={this.handleChoosePhoto}>
                  <Text style={styles.buttonText}>Change image</Text>
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
        </View>
      );
    } else {
      return (
        <View style={styles.mainContainer}>
          <SafeAreaView>
            <StatusBar barStyle={'dark-content'} />
          </SafeAreaView>
          <View style={styles.welcomeContainer}>
            <View style={styles.innerContainer}>
              <View></View>
              <View style={styles.middleText}>
                <Text style={[styles.welcomeText, {fontSize: 84}]}>
                  📄
                </Text>
                <Text style={[styles.welcomeText, {fontWeight: 'bold', fontSize: 24}]}>
                  Passport wallet
                </Text>
                <Text style={styles.welcomeText}>
                  An easy way to show a screenshot of important documents.
                </Text>
                <View style={{alignSelf: 'center'}}>
                  <TouchableOpacity
                    style={styles.buttonPrimary}
                    onPress={this.handleChoosePhoto}>
                    <Text style={styles.buttonTextPrimary}>
                      Select your document screenshot
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
              <View>
                <TouchableOpacity onPress={this.openLink}>
                  <Text style={styles.helpText}>
                    To get a screenshot of your BC vaccine passport,
                    follow instructions at{' '}
                    <Text style={{textDecorationLine: 'underline'}}>
                      gov.bc.ca/vaccinecard
                    </Text>
                    .
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      );
    }
  }
}

const styles = StyleSheet.create({
  mainContainer: {
    backgroundColor: 'white',
    height: Dimensions.get('window').height,
  },
  scrollView: {
    flex: 1,
  },
  image: {
    flex: 1,
    alignSelf: 'stretch',
    width: Dimensions.get('window').width,
  },
  button: {
    backgroundColor: '#FFFFFF',
    borderColor: '#888',
    borderWidth: 1,
    borderRadius: 50,
    margin: 24,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 7,
    },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 15,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'black',
    textAlign: 'center',
    padding: 24,
  },
  buttonPrimary: {
    backgroundColor: 'white',
    borderColor: '#888',
    borderWidth: 1,
    borderRadius: 50,
    margin: 24,
    marginTop: 8,
    alignSelf: 'flex-start',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 7,
    },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 15,
  },
  buttonTextPrimary: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'black',
    textAlign: 'center',
    padding: 16,
    paddingLeft: 32,
    paddingRight: 32,
    flexDirection: 'row',
  },
  welcomeContainer: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 18,
    padding: 32,
    paddingBottom: 8,
    paddingTop: 0,
    textAlign: 'center',
  },
  helpText: {
    fontSize: 14,
    padding: 32,
    textAlign: 'center',
    color: '#666',
  },
  innerContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingBottom: 24,
  },
});

export default App;
