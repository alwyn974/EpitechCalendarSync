import { Component, OnInit } from '@angular/core';
import {RawIntra, RawUser} from "epitech.js";

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss']
})
export class MainComponent implements OnInit {

  autologin : string = "https://intra.epitech.eu/auth-9cd3e63077933bbd70f7e75947a1941aad1aeaf4";
  isLogged : boolean = false;
  intra : RawIntra;
  user: RawUser | undefined;

  constructor() {
    this.intra = new RawIntra({
      autologin: this.autologin
    });
  }

  async ngOnInit(): Promise<void> {
    this.user = await this.intra.getUser();
    console.log(this.user);
  }


}
