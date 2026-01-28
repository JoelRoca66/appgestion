import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Topbar } from '../topbar/topbar';
import { Sidebar } from '../sidebar/sidebar';

@Component({
  selector: 'app-main-layout-admin',
  imports: [RouterOutlet, Topbar, Sidebar],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.css',
})
export class MainLayout {

}
