import * as messaging from "messaging";
import { settingsStorage } from "settings"
import * as babyconnect from "./babyconnect";

var bc;

function getTextSetting(key) {
  return JSON.parse(settingsStorage.getItem(key)).name;
}

settingsStorage.onchange = function(evt) {
  let email = getTextSetting("email");
  let password = getTextSetting("password");
  if (email && password) {
    bc = new babyconnect.BabyConnect(email, password);
    bc.getStatus().then(resp => {
      sendMessage(resp);
    });
  } else {
    bc = null;
  }
}

settingsStorage.onchange(null);

messaging.peerSocket.onopen = () => {
}

messaging.peerSocket.onerror = (err) => {
  console.log(`Connection error: ${err.code} - ${err.message}`);
}

messaging.peerSocket.onmessage = (evt) => {
  //console.log(JSON.stringify(evt.data));
  if (evt.data.command == "update" && bc != null) {
    bc.getStatus().then(resp => {
      sendMessage(resp);
    });
  }
}

function sendMessage(msg) {
  if (messaging.peerSocket.readyState === messaging.peerSocket.OPEN) {
    // Send the data to peer as a message
    messaging.peerSocket.send(msg);
  }
}
