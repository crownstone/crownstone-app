import fetch from 'node-fetch';
const sha1 = require('sha-1');

const headers = {
  'Accept': 'application/json',
  'Content-Type': 'application/json',
  'Authorization': null,
};


export class MirrorDatabase {

  accessToken : string;
  userId      : string;

  spheres     : Record<string, SyncRequestResponse_Sphere> = {}; // this is the dump of cloud sync FULL
  user        : any = {};

  async login() {
    let result = await fetch(
      'http://localhost:3050/api/user/login',
      {
        method:"POST",
        headers,
        body: JSON.stringify({email: 'crownstone.main.test@gmail.com', password: sha1('testPassword')})
      }
    );

    let json         = await result.json();
    this.userId      = json.userId;
    this.accessToken = json.id;
  }

  async update() {
    if (!this.accessToken) { await this.login(); }
    let result = await fetch(
      'http://localhost:3050/api/sync',
      {
        method:"POST",
        headers: {...headers, Authorization: this.accessToken},
        body: JSON.stringify({sync: { type: "FULL" }})
      }
    );
    let json     = await result.json();
    this.spheres = json?.spheres;
    this.user    = json?.user?.data;
  }

}