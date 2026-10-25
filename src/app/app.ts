import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NtToast } from './compartido/toast';

@Component({
  selector: 'nt-root',
  templateUrl: './app.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, NtToast],
})
export class App {}
