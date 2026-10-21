import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Icon } from '../../shared/icon/icon';
import { RAIL_BOTTOM, RAIL_TOP } from '../nav-items';

@Component({
  selector: 'alc-side-rail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, Icon],
  templateUrl: './side-rail.html',
  styleUrl: './side-rail.css',
})
export class SideRail {
  protected readonly top = RAIL_TOP;
  protected readonly bottom = RAIL_BOTTOM;
}
