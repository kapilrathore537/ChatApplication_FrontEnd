import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ChatRoomComponent } from "./components/chat-room/chat-room.component";

@Component({
    selector: 'app-root',
    standalone: true,
    templateUrl: './app.component.html',
    styleUrl: './app.component.scss',
    imports: [RouterOutlet, ChatRoomComponent]
})
export class AppComponent {
  title = 'chat-app';
}
