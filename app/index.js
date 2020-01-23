import clock from "clock";
import document from "document";
import { preferences } from "user-settings";
import * as messaging from "messaging";

clock.granularity = "seconds";

// Get a handle on the <text> element
const hourHand = document.getElementById("hours");
const minHand = document.getElementById("mins");
const secHand = document.getElementById("secs");

const pumpHand = document.getElementById("pump");
const bottleHand = document.getElementById("bottle");
const nurseHand = document.getElementById("nurse");
const diaperHand = document.getElementById("diaper");

const oneMinute = 60 * 1000;
const oneHour = 60 * oneMinute;

clock.ontick = (evt) => {
  let secs = evt.date.getSeconds();
  let mins = evt.date.getMinutes();
  let hours = evt.date.getHours() + (mins / 60);
  
  hourHand.groupTransform.rotate.angle = hours * 360 / 12;
  minHand.groupTransform.rotate.angle = mins * 360 / 60;
  secHand.groupTransform.rotate.angle = secs * 360 / 60;  

  requestData(5*oneMinute);
  }

var lastRequest = 0;

function requestData(maxStale) {
  let now = Date.now()
  if ((now - lastRequest) <=
      maxStale) {
    return
  }
  lastRequest = now;
  if (messaging.peerSocket.readyState === messaging.peerSocket.OPEN) {
    messaging.peerSocket.send({
      command: 'update'
    });
  }
}

messaging.peerSocket.onopen = function() {
  requestData(0);
}

messaging.peerSocket.onmessage = function(evt) {
  if (evt.data) {
    //console.log("received: ", JSON.stringify(evt.data));
    updateBCHands(evt.data);
  }
}

// Listen for the onerror event
messaging.peerSocket.onerror = function(err) {
  // Handle any errors
  console.log("Connection error: " + err.code + " - " + err.message);
}

function update(hand, time, categoryTime) {
  if (!time) {
    // Somehow got an empty update, just leave it as it was
    return;
  }
  let now = Date.now();
  let age = now - time;
  if (now - time > (6 * 3600 * 1000)) {
    // More than 6h old, don't show on current clock face
    // (Could technically show up to 12h, but it gets confusing as it gets
    // closer to wrapping around)
    hand.style.display = "none";
    return;
  }
  hand.style.display = "inline";
  
  let date = new Date(time);
  let mins = date.getMinutes();
  let hours = date.getHours() + (mins / 60);
  hand.groupTransform.rotate.angle = hours * 360 / 12;
  
  let categoryAge = now - categoryTime;
  if (categoryAge < 2 * oneHour) {
    hand.style.fill = "forestgreen";
  } else if (categoryAge < 3 * oneHour) {
    hand.style.fill = "gold";
  } else {
    hand.style.fill = "firebrick";
  }
}

function updateBCHands(msg) {
  let lastBreast = Math.max(msg.lastPumping, msg.lastNursing);
  let lastFeed = Math.max(msg.lastNursing, msg.lastBottle);
  update(pumpHand, msg.lastPumping, lastBreast);
  update(nurseHand, msg.lastNursing, Math.min(lastBreast, lastFeed));
  update(bottleHand, msg.lastBottle, lastFeed);
  update(diaperHand, msg.lastDiaper, msg.lastDiaper);
}