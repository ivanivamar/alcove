import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRouteSnapshot, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { ThemeService } from './core/theme.service';
import { BottomBar } from './shell/bottom-bar/bottom-bar';
import { SideRail } from './shell/side-rail/side-rail';

@Component({
  selector: 'alc-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, SideRail, BottomBar],
  templateUrl: './app.html',
  styleUrl: './app.css',
  host: { '[class.immersive]': 'immersive()' },
})
export class App {
  private readonly router = inject(Router);

  /** Routes with `data: { immersive: true }` (the reader) fill the window, without rail or bar. */
  protected readonly immersive = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map(() => isImmersive(this.router.routerState.snapshot.root)),
    ),
    { initialValue: false },
  );

  constructor() {
    // Instantiate early so html[data-theme] stays in sync with the stored preference.
    inject(ThemeService);
  }
}

function isImmersive(route: ActivatedRouteSnapshot | null): boolean {
  for (; route; route = route.firstChild) {
    if (route.data['immersive']) return true;
  }
  return false;
}
