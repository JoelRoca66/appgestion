import { Component } from '@angular/core';
import { ToolbarModule } from 'primeng/toolbar';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'app-topbar',
  imports: [ToolbarModule, ButtonModule, TooltipModule],
  templateUrl: './topbar.html',
  styleUrl: './topbar.css',
})
export class Topbar {

}
