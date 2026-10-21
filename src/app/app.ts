import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './core/theme.service';
import { BottomBar } from './shell/bottom-bar/bottom-bar';
import { SideRail } from './shell/side-rail/side-rail';

@Component({
  selector: 'alc-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, SideRail, BottomBar],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  constructor() {
    // Instantiate early so html[data-theme] stays in sync with the stored preference.
    inject(ThemeService);
  }
}
