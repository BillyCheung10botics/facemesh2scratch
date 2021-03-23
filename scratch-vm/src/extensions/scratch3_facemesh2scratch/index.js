const ArgumentType = require('../../extension-support/argument-type');
const BlockType = require('../../extension-support/block-type');
const Cast = require('../../util/cast');
const formatMessage = require('format-message');
const ml5 = require('ml5');

const Message = {
  getX: {
    'ja': '[PERSON_NUMBER] 人目の [KEYPOINT] 番目の部位のx座標',
    'ja-Hira': '[PERSON_NUMBER] にんめの [KEYPOINT] ばんめのぶいのxざひょう',
    'en': 'x of person no: [PERSON_NUMBER] , keypoint no: [KEYPOINT]'
  },
  getY: {
    'ja': '[PERSON_NUMBER] 人目の [KEYPOINT] 番目の部位のy座標',
    'ja-Hira': '[PERSON_NUMBER] にんめの [KEYPOINT] ばんめのぶいのyざひょう',
    'en': 'y of person no: [PERSON_NUMBER] , keypoint no: [KEYPOINT]'
  },
  peopleCount: {
    'ja': '人数',
    'ja-Hira': 'にんずう',
    'en': 'people count'
  },
  videoToggle: {
    'ja': 'ビデオを [VIDEO_STATE] にする',
    'ja-Hira': 'ビデオを [VIDEO_STATE] にする',
    'en': 'turn video [VIDEO_STATE]'
  },
  chooseCamera: {
    'ja': 'choose camera [CAMERA_CHOICE]',
    'ja-Hira': 'choose camera [CAMERA_CHOICE]',
    'en': 'choose camera [CAMERA_CHOICE]'
  },
  setRatio: {
    'ja': '倍率を [RATIO] にする',
    'ja-Hira': 'ばいりつを [RATIO] にする',
    'en': 'set ratio to [RATIO]'
  },
  setInterval: {
    'ja': '認識を [INTERVAL] 秒ごとに行う',
    'ja-Hira': 'にんしきを [INTERVAL] びょうごとにおこなう',
    'en': 'Label once every [INTERVAL] seconds'
  },
  on: {
    'ja': '入',
    'ja-Hira': 'いり',
    'en': 'on'
  },
  off: {
    'ja': '切',
    'ja-Hira': 'きり',
    'en': 'off'
  },
  video_on_flipped: {
    'ja': '左右反転',
    'ja-Hira': 'さゆうはんてん',
    'en': 'on flipped',
  },
  please_wait: {
    'ja': '準備に時間がかかります。少しの間、操作ができなくなりますがお待ち下さい。',
    'ja-Hira': 'じゅんびにじかんがかかります。すこしのあいだ、そうさができなくなりますがおまちください。',
    'en': 'Setup takes a while. The browser will get stuck, but please wait.'
  }
}
const AvailableLocales = ['en', 'ja', 'ja-Hira'];

var camera_list = []

class Scratch3Facemesh2ScratchBlocks {
    get PERSON_NUMBER_MENU () {
      let person_number_menu = []
      for (let i = 1; i <= 10; i++) {
        person_number_menu.push({text: String(i), value: String(i)})
      }
      return person_number_menu;
    }

    get KEYPOINT_MENU () {
      let keypoint_menu = [];
      for (let i = 1; i <= 468; i++) {
        keypoint_menu.push({text: String(i), value: String(i)})
      }
      return keypoint_menu;
    }

    get VIDEO_MENU () {
      return [
          {
            text: Message.off[this._locale],
            value: 'off'
          },
          {
            text: Message.on[this._locale],
            value: 'on'
          },
          {
            text: Message.video_on_flipped[this._locale],
            value: 'on-flipped'
          }
      ]
    }

    get INTERVAL_MENU () {
      return [
          {
            text: '0.1',
            value: '0.1'
          },
          {
            text: '0.2',
            value: '0.2'
          },
          {
            text: '0.5',
            value: '0.5'
          },
          {
            text: '1.0',
            value: '1.0'
          }
      ]
    }

    get RATIO_MENU () {
      return [
          {
            text: '0.5',
            value: '0.5'
          },
          {
            text: '0.75',
            value: '0.75'
          },
          {
            text: '1',
            value: '1'
          },
          {
            text: '1.5',
            value: '1.5'
          },
          {
            text: '2.0',
            value: '2.0'
          }
      ]
    }

    

    constructor (runtime) {
        this.runtime = runtime;
        this.faces = [];
        
        let video = document.createElement("video");
        video.width = 480;
        video.height = 360;
        video.autoplay = true;
        video.style.display = "none";
        this.video = video;
        this.ratio = 0.75;

        this.video.addEventListener('loadeddata', (event) => {
          alert(Message.please_wait[this._locale]);

          const facemesh = ml5.facemesh(this.video, function() {
            console.log("Model loaded!")
          });

          facemesh.on('predict', faces => {
            if (faces.length < this.faces.length) {
              this.faces.splice(faces.length);
            }
            faces.forEach((face, index) => {
              this.faces[index] = {keypoints: face.scaledMesh};
            });
          });
        });

        let media = navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        });

        media.then((stream) => {
            this.video.srcObject = stream;
            this.video.play();
        });

        let videoSelect = document.createElement('select');
        this.videoSelect = videoSelect;
        this.getStream().then(this.getDevices).then((deviceinfos) => {this.gotDevices(deviceinfos);this.getCameraList(deviceinfos);});
        
        this.runtime.ioDevices.video.enableVideo();
    }

    getDevices() {
        return navigator.mediaDevices.enumerateDevices();
    }
    
    gotDevices(deviceInfos) {
        console.log('Available input and output devices:', deviceInfos);
        for (const deviceInfo of deviceInfos) {
            if (deviceInfo.kind === 'videoinput') {
                const option = document.createElement('option');
                option.value = deviceInfo.deviceId;
                option.text = deviceInfo.label || `Camera ${this.videoSelect.length + 1}`;
                this.videoSelect.add(option);
            }
        }
    }
    
    getCameraList(deviceInfos) {
        camera_list = []
        for (const deviceInfo of deviceInfos) {
            if (deviceInfo.kind === 'videoinput') {
                camera_list.push({
                                       text: deviceInfo.label || `Camera ${this.videoSelect.length + 1}`, 
                                       value: deviceInfo.deviceId
                                      })
            }
        }
    }

    getStream() {
        if (window.stream) {
            window.stream.getTracks().forEach(track => {
                track.stop();
            });
        }
        const videoSource = this.videoSelect.value;
        
        const constraints = {
            audio: false,
            video: {
                    width: {ideal: 640},
                    height: {ideal: 480},  
                    deviceId: videoSource ? {exact: videoSource} : undefined
                    }
        };
        return navigator.mediaDevices.getUserMedia(constraints).
            then((stream) => this.gotStream(stream) ).catch(this.handleError);
    }
    
    gotStream(stream) {
        this.videoSelect.selectedIndex = [...this.videoSelect.options].
            findIndex(option => option.text === stream.getVideoTracks()[0].label);
    }
    
    handleError(error) {
        console.error('Error: ', error);
    }

    getInfo () {
        this._locale = this.setLocale();

        return {
            id: 'facemesh2scratch',
            name: 'Facemesh2Scratch',
            blocks: [
                {
                    opcode: 'getX',
                    blockType: BlockType.REPORTER,
                    text: Message.getX[this._locale],
                    arguments: {
                        PERSON_NUMBER: {
                            type: ArgumentType.STRING,
                            menu: 'personNumberMenu',
                            defaultValue: '1'
                        },
                        KEYPOINT: {
                            type: ArgumentType.STRING,
                            menu: 'keypointMenu',
                            defaultValue: '1'
                        }
                    }
                },
                {
                    opcode: 'getY',
                    blockType: BlockType.REPORTER,
                    text: Message.getY[this._locale],
                    arguments: {
                        PERSON_NUMBER: {
                            type: ArgumentType.STRING,
                            menu: 'personNumberMenu',
                            defaultValue: '1'
                        },
                        KEYPOINT: {
                            type: ArgumentType.STRING,
                            menu: 'keypointMenu',
                            defaultValue: '1'
                        }
                    }
                },
                {
                    opcode: 'getPeopleCount',
                    blockType: BlockType.REPORTER,
                    text: Message.peopleCount[this._locale]
                },
                {
                    opcode: 'videoToggle',
                    blockType: BlockType.COMMAND,
                    text: Message.videoToggle[this._locale],
                    arguments: {
                        VIDEO_STATE: {
                            type: ArgumentType.STRING,
                            menu: 'videoMenu',
                            defaultValue: 'off'
                        }
                    }
                },
                {
                    opcode: 'setRatio',
                    blockType: BlockType.COMMAND,
                    text: Message.setRatio[this._locale],
                    arguments: {
                        RATIO: {
                            type: ArgumentType.STRING,
                            menu: 'ratioMenu',
                            defaultValue: '0.75'
                        }
                    }
                },
                {
                    opcode: 'chooseCamera',
                    blockType: BlockType.COMMAND,
                    text: Message.chooseCamera[this._locale],
                    arguments: {
                        CAMERA_CHOICE: {
                            type: ArgumentType.STRING,
                            menu: 'cameraMenu',
                            defaultValue: 'Default'
                        }
                    }
                },

            ],
            menus: {
              personNumberMenu: {
                acceptReporters: true,
                items: this.PERSON_NUMBER_MENU
              },
              keypointMenu: {
                acceptReporters: true,
                items: this.KEYPOINT_MENU
              },
              videoMenu: {
                acceptReporters: true,
                items: this.VIDEO_MENU
              },
              ratioMenu: {
                acceptReporters: true,
                items: this.RATIO_MENU
              },
              intervalMenu: {
                acceptReporters: true,
                items: this.INTERVAL_MENU
              },
              cameraMenu: {
                acceptReporters: true,
                items: "getCameraMenu"
              }
            }
        };
    }

    

    getCameraMenu() {
      let camera_menu = [];
      if (camera_list.length === 0){
        return ["Default"]
      } else{
        for (let i = 0; i < camera_list.length; i++) {
          var d = new Date()
          camera_menu.push({text:  camera_list[i].text, value: camera_list[i].value});
        }
        return camera_menu;
      }
    }

    getX (args) {
      let personNumber = parseInt(args.PERSON_NUMBER, 10) - 1;
      let keypoint = parseInt(args.KEYPOINT, 10) - 1;

      if (this.faces[personNumber].keypoints && this.faces[personNumber].keypoints[keypoint]) {
        if (this.runtime.ioDevices.video.mirror === false) {
          return -1 * (240 - this.faces[personNumber].keypoints[keypoint][0] * this.ratio);
        } else {
          return 240 - this.faces[personNumber].keypoints[keypoint][0] * this.ratio;
        }
      } else {
        return "";
      }
    }

    getY (args) {
      let personNumber = parseInt(args.PERSON_NUMBER, 10) - 1;
      let keypoint = parseInt(args.KEYPOINT, 10) - 1;

      if (this.faces[personNumber].keypoints && this.faces[personNumber].keypoints[keypoint]) {
        return 180 - this.faces[personNumber].keypoints[keypoint][1] * this.ratio;
      } else {
        return "";
      }
    }

    getPeopleCount () {
      return this.faces.length;
    }

    videoToggle (args) {
      let state = args.VIDEO_STATE;
      if (state === 'off') {
        this.runtime.ioDevices.video.disableVideo();
      } else {
        this.runtime.ioDevices.video.enableVideo();
        this.runtime.ioDevices.video.mirror = state === "on";
      }
    }
    
    chooseCamera (args) {

      let selected = args.CAMERA_CHOICE;
      if (selected === "Default") {
        this.videoSelect.value = camera_list[0].value;
      } else {
        this.videoSelect.value = selected;
      }
      const videoSource = this.videoSelect.value;
      const constraints = {
          audio: false,
          video: {
                  width: {ideal: 640},
                  height: {ideal: 480},  
                  deviceId: videoSource ? {exact: videoSource} : undefined
                  }
      };
      let media = navigator.mediaDevices.getUserMedia(constraints);
      media.then((stream) => {
          this.runtime.ioDevices.video.provider._video.srcObject = stream;
          this.runtime.ioDevices.video.provider._video.play(); // Needed for Safari/Firefox, Chrome auto-plays.
          this.runtime.ioDevices.video.provider._track = stream.getTracks()[0];
          this.runtime.ioDevices.video.provider.enabled = true;
          this.video.srcObject = this.runtime.ioDevices.video.provider._video.srcObject;
      });
    }

    setRatio (args) {
      this.ratio = parseFloat(args.RATIO);
    }

    setLocale() {
      let locale = formatMessage.setup().locale;
      if (AvailableLocales.includes(locale)) {
        return locale;
      } else {
        return 'en';
      }
    }
}

module.exports = Scratch3Facemesh2ScratchBlocks;
