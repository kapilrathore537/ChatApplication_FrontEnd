import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import io from 'socket.io-client';
import { RoomRequest } from '../payloads/RoomRequest';
import { Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ChatService {





  baseUrl: string = 'http://localhost:8080/agency/chat'
  private socket: any;
  private url: string = 'ws://localhost:8085';
  private messageSubject = new Subject<any>();
  private onStatusChange = new Subject<any>();
  private messageQueue: any[] = []; // Queue for messages
  private isConnected: boolean = false;
  constructor(private http: HttpClient) { }

  connect(): void {
    this.socket = io(this.url, {
      path: '/socket.io',
      transports: ['websocket'],
      query: {
        room: localStorage.getItem('roomId'),
      },
    });

    console.log('Attempting to connect to WebSocket server...');

    this.socket.on('connect', (data: any) => {
      console.log('Connected to WebSocket server');
      this.isConnected = true;
      this.processMessageQueue(); // Process any queued messages on connection
    });

    this.socket.on('get_message', (message: any) => {
      console.log('Received message:', message);
      this.messageSubject.next(message);
    });

    // onStatusChange
    this.socket.on('onStatusChange', (message: any) => {
      // console.log('Received status:', message);
      this.onStatusChange.next(message);
    });

    // onStatusChange
    this.socket.on('ONLINE_OFFLINE_STATUS', (message: any) => {
      this.onStatusChange.next(message);
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
    });

    this.socket.on('connect_error', (error: any) => {
      console.error('Connection error:', error);
    });
  }

  // Method to get the message as an observable
  getMessage(): Observable<string> {
    return this.messageSubject.asObservable();
  }

  onStatusChangeDetect() {
    return this.onStatusChange.asObservable();
  }
  // public sendMessage(message: any, typeEvent: string): void {
  //   if (typeEvent != null)
  //     this.socket.emit(typeEvent, message);
  // }


  // Send message via WebSocket
  sendMessage(message: any, typeEvent: string): void {
    if (!this.isConnected) {
      // Queue the message if not connected
      this.messageQueue.push({ message, typeEvent });
      console.log('Message queued:', message);
    } else {
      // Send the message immediately
      this.socket.emit(typeEvent, message);
    }
  }

  // Process the message queue
  private processMessageQueue(): void {
    while (this.messageQueue.length > 0 && this.isConnected) {
      const { message, typeEvent } = this.messageQueue.shift();
      this.socket.emit(typeEvent, message);
      console.log('Sent queued message:', message);
    }
  }
  public sendOnchangeStatus(message: any) {
    this.socket.emit("onStatusChange", message);
  }

  public createRoom(roomRequest: RoomRequest) {
    return this.http.post(this.baseUrl + "/createRoom", roomRequest);
  }

  public getAllMessage(roomId: string, senderId: string) {
    let params = new HttpParams()
      .set('roomId', roomId)
      .set('senderId', senderId);
    return this.http.get(this.baseUrl, { params });
  }

  seenAllUnseenMessages(arg0: { roomId: any; recipientId: string; senderId: string }) {
    let form = new FormData();
    if (arg0.recipientId != null && arg0.recipientId != '')
      form.append('recipientId', arg0.recipientId);
    form.append('roomId', arg0.roomId);
    form.append('senderId', arg0.senderId);

    return this.http.put(this.baseUrl + "/seenMessages", form);
  }

  fetchAllChatUsers() {
    let senderId = localStorage.getItem('roomId')
    return this.http.get(this.baseUrl + "/getChatUsers?userId=" + senderId);
  }

  sendTypingStatus(roomId: string, recieverId: string) {
    let data = {
      roomId: roomId,
      recipientId: recieverId,
      eventType: "TYPING"
    }
    this.socket.emit("onStatusChange", data);
  }
  deleteMessage(arg0: { messageId: string; roomId: string; senderId: string; recipientId: string; }) {
    let data = {
      roomId: arg0.roomId,
      recipientId: arg0.recipientId,
      eventType: "DELETE_MESSAGE",
      messageId: arg0.messageId
    }
    this.socket.emit("onStatusChange", data);
  }

}
