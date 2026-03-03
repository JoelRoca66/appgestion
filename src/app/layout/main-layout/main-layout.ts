import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Topbar } from '../topbar/topbar';
import { Sidebar } from '../sidebar/sidebar';
import { ChatbotComponent } from '../../shared/components/chatbot/chatbot.component';

@Component({
  selector: 'app-main-layout-admin',
  imports: [RouterOutlet, Topbar, Sidebar, ChatbotComponent],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.css',
})
export class MainLayout {

}
