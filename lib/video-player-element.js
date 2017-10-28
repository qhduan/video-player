'use babel';

let VLC = require('./vlc');

class VideoPlayerElement extends HTMLElement {
  createdCallback() {
    this.vlc = new VLC();

    this.shadowRoot = this.createShadowRoot();

    this.initializeContent();
  }

  initializeContent() {
    this.videoElement = document.createElement('video');
    this.videoElement.setAttribute('autoplay', true);

    /**
    edited by qhduan
    make player auto-replay video
    */
    this.videoElement.setAttribute('loop', true);

    /**
    edited by qhduan
    make video center, crop the border
    */
    // this.videoElement.style.position = "absolute";
    // this.videoElement.style.left = "50%";
    // this.videoElement.style.top = "50%";
    // this.videoElement.style.display = "block";
    // this.videoElement.style.transform = "translate(-50%,-50%)";
    this.videoElement.style.minWidth = "100vw";
    this.videoElement.style.minHeight = "100vh";
    this.videoElement.style.objectFit = "cover";

    this.shadowRoot.appendChild(this.videoElement);
  }

  detachedCallback() {
    this.vlc.kill();
  }

  stop() {
    this.vlc.kill();
    this.videoElement.remove();
  }

  play(files) {
    if (!Array.isArray(files)) {
      return;
    }

    this.vlc.kill();

    this.videoElement.remove();
    this.initializeContent();

    let alwaysVLC = atom.config.get('video-player.alwaysVLC');
    if (alwaysVLC) {
      this._playWithVLC(files);
    } else {
      this._playWithHtml5Video(files);
    }
  }

  _playWithVLC(files) {
    let video = this.videoElement;
    this.vlc.streaming(files, () => this.reloadSrc());
    video.addEventListener('ended', () => this.reloadSrc());
    video.addEventListener('suspend', () => this.reloadSrc());

    let streamServer = `http://localhost:${this.vlc.port}`;
    video.setAttribute('src', streamServer);
  }

  _playWithHtml5Video(files) {
    let video = this.videoElement;
    let fallbackToVLC = () => {
      video.removeEventListener('error', fallbackToVLC);

      // If any error occured, try to play with VLC
      files.unshift(video.getAttribute('src'));
      this._playWithVLC(files);
    };
    video.setAttribute('src', files.shift());
    video.addEventListener('ended', () => {
      let file = files.shift();
      if(file) {
        video.setAttribute('src', file);
      }
    });
    video.addEventListener('error', fallbackToVLC);
  }

  reloadSrc() {
    let src = this.videoElement.getAttribute('src');
    this.videoElement.setAttribute('src', src);
  }

  toggleControl() {
    if (this.isControlVisible()) {
      this.hideControl();
    } else {
      this.showControl();
    }
  }
  isControlVisible() {
    return !!this.videoElement.getAttribute('controls');
  }
  showControl() {
    this.videoElement.setAttribute('controls', true);
  }
  hideControl() {
    this.videoElement.removeAttribute('controls');
  }

  pauseHtml5() {
    this.videoElement.pause();
  }

  resumeHtml5() {
    this.videoElement.play();
  }
};

module.exports = document.registerElement('video-player', {
  prototype: VideoPlayerElement.prototype
});
