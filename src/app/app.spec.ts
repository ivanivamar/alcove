import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { App } from './app';
import { routes } from './app.routes';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter(routes)],
    }).compileComponents();
  });

  it('defaults to the dark (Walnut) theme', () => {
    TestBed.createComponent(App).detectChanges();
    TestBed.tick();
    expect(document.documentElement.dataset['theme']).toBe('dark');
  });

  it('renders the rail and the bottom bar with the spec items', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const labels = (sel: string) =>
      Array.from(el.querySelectorAll(`${sel} .label`)).map((n) => n.textContent?.trim());

    expect(labels('alc-side-rail')).toEqual(['Library', 'Collections', 'Search', 'Import', 'Sync', 'Settings']);
    expect(labels('alc-bottom-bar')).toEqual(['Library', 'Collections', 'Search', 'Sync', 'Settings']);
  });

  it('redirects / to the library', async () => {
    const harness = await RouterTestingHarness.create('/');
    expect(harness.routeNativeElement?.querySelector('h1')?.textContent).toBe('Library');
  });
});
