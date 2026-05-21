import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { environment } from '@env';
import { HeaderComponent } from '@ui/header/header.component';
import { MockDataSwitcherComponent } from '@ui/mock-data-switcher/mock-data-switcher.component';
import { MockService } from '@mocks/mock.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HeaderComponent, MockDataSwitcherComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class App implements OnInit {
  private readonly mockService = inject(MockService);

  readonly useMocks = environment.useMocks;

  ngOnInit(): void {
    if (environment.useMocks) {
      this.mockService.mirageJsServer();
    }
  }
}
