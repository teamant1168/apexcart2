import { Component } from '@angular/core';

import { NotificationService } from '../../notification/notification.service';
import { SharedModule } from '../../shared/shared.module';

@Component({
    selector: 'app-toast',
    imports: [SharedModule],
    templateUrl: './toast.component.html',
    styleUrls: ['./toast.component.css']
})
export class ToastComponent {
  duration=3000;
constructor(public toast:NotificationService){}
}
