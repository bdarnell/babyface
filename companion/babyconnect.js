import * as util from "../common/utils";

const LOGGED_OUT = 1;
const LOGGING_IN = 2;
const LOGGED_IN = 3;

export class BabyConnect {
  constructor(email, password) {
    this.email = email;
    this.password = password;
    this.state = LOGGED_OUT;
    this.cookie = "";
  }
  
  getStatus() {
    return this.login().then(() => {
      let usp = new URLSearchParams();
      let now = new Date();
      let today = `${util.zeroPad(now.getFullYear() % 100)}${util.zeroPad(now.getMonth()+1)}${util.zeroPad(now.getDate())}`
      usp.set("pdt", today);
      usp.set("cookie", this.cookie);
      return this.post("https://bcproxy.bdarnell.repl.co/status", usp.toString());
    }).then(resp => {
      if (!resp || !resp.summaries) {
        return {};
      }
      const sum = resp.summaries[0];
      let out = {
        lastBottle: Date.parse(sum.timeOfLastBottle),
        lastDiaper: Date.parse(sum.timeOfLastDiaper),
        lastNursing: Date.parse(sum.timeOfLastNursing),
        lastPumping: Date.parse(sum.timeOfLastPumping)
      }
      return out;
    });
  }
  
  login() {
    if (this.state == LOGGED_IN) {
      return Promise.resolve(null);
    } else if (this.state == LOGGING_IN) {
      //throw new Error("concurrent login");
      return Promise.resolve(null);
    }
    let usp = new URLSearchParams();
    usp.set("email", this.email);
    usp.set("pass", this.password);
    this.state = LOGGING_IN;
    return this.post("https://bcproxy.bdarnell.repl.co/login", 
                     usp.toString()).then(response => {
      // TODO: error handling 
      //console.log("login resp:", response);
      if (response.cookie) {
        this.cookie = response.cookie;
        this.state = LOGGED_IN;    
      } else {
        console.log("error getting cookie", response);
      }
    });
  }
  
  post(url, payload) {
    let headers = {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36",
    }
    //console.log("fetching: ", url, "payload: ", payload);
    return fetch(url, {
      method: "POST",
      body: payload,
      headers: headers,
      credentials: "include"
    }).then(response => {
      //console.log(response.ok, response.status, response.type, response.url);
      //response.headers.forEach(console.log);
      if (response.headers.get("content-type").startsWith("text/plain") || 
          response.headers.get("content-type").startsWith("application/json")) {
        // they return json with type text/plain
        return response.json();
      }
      return response.text();  // Just for debugging
    }).then(body => {
      //console.log("body: ", JSON.stringify(body));
      if (body.Code == 401) {
        this.state = LOGGED_OUT;
        return null;
      }
      return body;
    }).catch(err => {
      console.log("error: ", err, err.toString())
    })
  }
}