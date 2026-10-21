import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Icon } from '../../shared/icon/icon';
import { BOTTOM_BAR } from '../nav-items';

@Component({
  selector: 'alc-bottom-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, Icon],
  templateUrl: './bottom-bar.html',
  styleUrl: './bottom-bar.css',
})
export class BottomBar {
  protected readonly items = BOTTOM_BAR;
}
