import { Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule } from '@angular/forms';
import { ChatService } from '../../services/chat.service';
import { RoomRequest } from '../../payloads/RoomRequest';
import { ChatRoomResponse } from '../../payloads/ChatRoomResponse';
import { MessageRequest } from '../../payloads/MessageRequst';
import { TimeFormatPipe } from '../../CustomPipes/TimeFormatPipe';
import { ChatRoomList } from '../../Models/ChatRoomList';
import { DatePipe, getLocaleFirstDayOfWeek, KeyValuePipe } from '@angular/common';
import { MessageResponse } from '../../payloads/MessageResponse';
import { LastSeenPipe } from '../../CustomPipes/LastSeenPipe';
import { forkJoin, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';
import { FileTypePipe } from '../../CustomPipes/file-type.pipe';
import { SafeResourceUrlPipe } from '../../CustomPipes/safe-resource-url.pipe';
import { MatIconModule } from '@angular/material/icon';
@Component({
  selector: 'app-chat-room',
  standalone: true,
  imports: [FormsModule, TimeFormatPipe, KeyValuePipe, DatePipe, LastSeenPipe, ReactiveFormsModule, FileTypePipe, SafeResourceUrlPipe, MatIconModule],
  templateUrl: './chat-room.component.html',
  styleUrl: './chat-room.component.scss',
})
export class ChatRoomComponent implements OnInit {

  chatRoomList: ChatRoomList[] = [];
  @ViewChild('pdfObject', { static: false }) pdfObject!: ElementRef;
  registrationForm!: FormGroup
  constructor(private chatService: ChatService, private http: HttpClient, private fb: FormBuilder) {
    this.chatService.connect();
    this.getMessage();
    this.senderId = localStorage.getItem('roomId')!;
    this.typingUser = []
    this.registrationForm = this.fb.group({
      signatureUrl: ['']
    });
  }


  ngOnInit(): void {
    this.fetchAllChatUsers();
    this.extractEventTypes();
  }
  roomRequest: RoomRequest = new RoomRequest();
  message: any;
  roomId: any;
  todayDate = new Date().toISOString().slice(0, 10);
  chatRoom: ChatRoomResponse = new ChatRoomResponse();
  messageRequest: MessageRequest = new MessageRequest();
  senderId: string = '';
  profileData: any = {
    userName: localStorage.getItem('roomId'),
    id: localStorage.getItem('roomId')
  }
  typingUser: ChatRoomList[] = []

  imageUrl: string[] = [];
  recieverId: string = ''

  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;

  public sendMessage(roomId: string) {

    // if (this.message == null && this.message == '' || this.imageUrl)
    //   return
    this.messageRequest.roomId = roomId;
    this.messageRequest.senderId = this.senderId;
    this.messageRequest.content = this.message.trim();
    if (this.imageUrl)
      this.messageRequest.attachments = this.imageUrl;
    this.chatService.sendMessage(this.messageRequest, 'send_message');
    setTimeout(() => {
      this.messageRequest = new MessageRequest();
      this.message = '';
      setTimeout(() => { this.adjustTextareaHeight(); }, 15);
    }, 10)
  }

  public getAllMessages(roomId: string, recieverId?: string) {
    if (recieverId) {
      this.recieverId = recieverId
      this.seenAllUnseenMessages(roomId, recieverId, this.senderId);
    }
    else
      this.seenAllUnseenGroupMessages(roomId, this.senderId);

    this.roomId = roomId
    this.chatRoomList.forEach(obj => obj.roomId == roomId ? (obj.unSeenMessageCount = 0) : obj)
    this.chatService.getAllMessage(roomId, this.senderId).subscribe((result: any) => {
      this.chatRoom = result.data.messages;
      this.chatRoom.messageList = new Map(Object.entries(result.data.messages.messageList));
      result.data.messages.messageList.forEach((obj: any) => {
        console.log(obj.attachments);
      })
      setTimeout(() => this.scrollToBottom(), 100);
    });
  }


  // socket io method
  public getMessage() {
    this.chatService.getMessage().subscribe({
      next: (data: any) => {
        if (data.roomId == this.chatRoom.roomId) {
          if (this.chatRoom.messageList.has(data.createdDate)) {

            // add new message into list
            this.chatRoom.messageList.get(data.createdDate)?.push(data);

            // update last message content and time 
            this.chatRoomList.forEach(obj => obj.roomId == this.roomId ? (obj.lastMessage = data.content, obj.lastMessageTime = data.localTime) : obj)
            // this.chatRoomList.forEach(obj => obj.roomId == this.roomId  && !obj.participants.find(e=>e.email!=data.senderId)? (obj.lastMessage = data.content, obj.lastMessageTime = data.localTime) : obj)
          } else {
            let arr: MessageResponse[] = [data]
            this.chatRoom.messageList.set(data.createdDate, arr);
          }
          setTimeout(() => this.scrollToBottom(), 50);
          if (data.senderId != this.senderId) {
            this.udpateStatus({ "recipientId": data.senderId, "senderId": this.senderId, "roomId": data.roomId, "isRecieved": true, "messageId": data.messageId, "isSeen": true, "bulkMessageSeen": false, "eventType": "MESSAGE_SEEN_STATUS" });
          }
        } else {
          this.chatRoomList.forEach((element: any) => {
            if (element.roomId == data.roomId && this.senderId != data.senderId) {
              element.unSeenMessageCount++;
              element.lastMessage = data.content;
              element.lastMessageTime = data.localTime;
            }
          });
        }
        this.stopTyping(data.roomId);
      },
    });
  }

  public stopTyping(roomId: string) {
    this.typingUser.forEach((obj) => {
      if (obj.roomId == roomId) {
        obj.isTyping = false
      }
    });
  }

  public clearTimeOut(data: any) {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  //seen messages
  public seenAllUnseenMessages(roomId: string, recieverId: string, senderId: string) {
    this.chatService.seenAllUnseenMessages({ "roomId": roomId, "recipientId": recieverId, "senderId": senderId }).subscribe({
      next: (data: any) => {
      },
      error: (er: any) => {
      }
    })
  }

  seenAllUnseenGroupMessages(roomId: string, senderId: string) {
    this.chatService.seenAllUnseenMessages({ "roomId": roomId, "recipientId": "", "senderId": senderId }).subscribe({
      next: (data: any) => {
      },
      error: (er: any) => {
      }
    })
  }

  //get chat users
  public fetchAllChatUsers() {
    this.chatService.fetchAllChatUsers().subscribe({
      next: (data: any) => {
        this.chatRoomList = data.chatList
      },
      error: (er: any) => {
      }
    })
  }

  //socket event subscribbe
  extractEventTypes() {
    this.chatService.onStatusChangeDetect().subscribe({
      next: (data: any) => {
        switch (data.eventType) {
          case "UPDATE_DOUBLE_CLICK":
            this.changesMessageTicksStatus(data);
            break;
          case "ONLINE_OFFLINE_STATUS":
            this.changeOnlinOfflineStatus(data);
            break;
          case "TYPING":
            this.changeTypingStatus(data);
            break;
          case "MESSAGE_SEEN_STATUS":
            this.changeMessageSeenStatus(data);
            break;
          case "DELETE_MESSAGE":
            this.deleteChatMessage(data);
            break;
          default:
            alert("Invalid invent type Got!!");
        }
      }
    })
  }

  deleteChatMessage(data: any) {
    this.chatRoom.messageList.forEach(el => {
      el.forEach(messages => {
        const index = el.findIndex(msg => msg.messageId === data.messageId);
        if (index > -1) {
          el.splice(index, 1);
        }
      })
    })
  }

  public changesMessageTicksStatus(data: any) {
    if (data.senderId != this.senderId) {
      this.chatRoom.messageList.forEach(message => {
        message.forEach(messageMap => {
          if (!messageMap.isRecieved) {
            messageMap.isRecieved = true
          }
        })
      })
    }
  }


  public changeTypingStatus(data: any) {
    this.resetTimeout(data);
    if (data.roomId != this.chatRoom.roomId) {
      let room: ChatRoomList = this.findChatRoom(data.roomId)!;
      if (room.roomId && !room.isTyping) {
        room.isTyping = true;
        let obj = this.updateTyping(room);
        this.typingUser.push(obj)
      }
    } else
      if (data.roomId == this.chatRoom.roomId) {
        this.chatRoom.isTyping = true
        this.updateTyping(this.chatRoom)
      }
  }

  public changeMessageSeenStatus(data: any) {
    if (data.roomId == this.roomId) {
      if (data.bulkMessageSeen) {
        // bulk message seen scenario
        const messagesIds = new Set(data.messageIds);
        this.chatRoom.messageList.forEach(obj => {
          obj.forEach(e => {
            if (messagesIds.has(e.messageId)) {
              e.isRecieved = data.isRecieved;
              e.isSeen = data.isSeen;
            }
          });
        })
      } else {
        // single message seen scenario
        this.chatRoom.messageList.forEach(obj => {
          const firstKey = Array.from(this.chatRoom.messageList.keys())[0];
          if (firstKey) {
            const firstValue = this.chatRoom.messageList.get(firstKey);
            // Now you have access to the first value associated with the first key
            firstValue?.forEach(obj => {
              if (obj.messageId == data.messageId) {
                obj.isRecieved = data.isRecieved;
                obj.isSeen = data.isSeen;
              }
            })
          } else {
            console.log('Map is empty');
          }
        });
      }
    }
  }
  public changeOnlinOfflineStatus(data: any) {
    // for all rooms 
    this.chatRoomList.forEach(obj => {
      obj.participants.forEach(obj2 => {
        if (obj2.email == data.connectedClientId) {
          obj2.isOnline = data.isOnline
          obj2.lastSeen = data.lastSeen
        }
      })
    })
    // case if  current room participant contain request client
    this.chatRoom.participants.forEach(obj => {
      if (obj.email == data.connectedClientId) {
        obj.isOnline = data.isOnline
        obj.lastSeen = data.lastSeen
      }
    })
  }


  public scrollToBottom() {
    try {
      this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight - this.scrollContainer.nativeElement.clientHeight;
    } catch (err) {
      console.error('Could not scroll to bottom:', err);
    }
  }


  public udpateStatus(data: any) {
    this.chatService.sendOnchangeStatus(data);
  }

  formatDateLabel(inputDateString: string): string {
    const inputDate = new Date(inputDateString); // Convert string to Date object

    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    if (this.isSameDay(inputDate, today)) {
      return 'Today';
    } else if (this.isSameDay(inputDate, yesterday)) {
      return 'Yesterday';
    } else {
      // Format other dates as needed, e.g., 'yyyy-MM-dd'
      return inputDate.toISOString().slice(0, 10);
    }
  }

  isSameDay(date1: Date, date2: Date): boolean {
    return date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate();
  }

  sendTypingStatus() {
    this.chatService.sendTypingStatus(this.chatRoom.roomId, this.recieverId);
  }

  private timeoutId: any;
  timer = 3000  // second
  updateTyping(data: any) {
    this.clearTimeOut(data)
    this.timeoutId = setTimeout(() => {
      data.isTyping = false
      console.log('user stopped typing');
    }, this.timer);

    return data;
  }


  public findChatRoom(roomId: string) {
    return this.chatRoomList.find(obj => obj.roomId == roomId);
  }

  resetTimeout(data: any) {
    // if (newDuration) {
    this.timer = 3000; // Update the timeout duration if a new value is provided
    //}//
    this.udpateStatus(data); // Restart the timeout with the new duration
  }

  // for message input box
  @ViewChild('messageTextarea') messageTextarea!: ElementRef;
  adjustTextareaHeight(event?: Event): void {
    const textarea = event ? event.target as HTMLTextAreaElement : this.messageTextarea.nativeElement;
    textarea.style.height = 'auto'; // Reset the height
    textarea.style.height = `${textarea.scrollHeight}px`; // Set the height to scroll height
  }


  selectedFiles: File[] = [];
  onChangeImg(event: any) {
    const files = event.target.files;

    console.log('Files selected:', files);

    if (files && files.length > 0) {
      this.selectedFiles = Array.from(files);
    } else {
      console.warn('No files selected.');
    }
  }

  onSubmit(roomId: string) {
    if (this.selectedFiles.length > 0) {
      const uploadObservables = [];
      for (let i = 0; i < this.selectedFiles.length; i++) {
        const file = this.selectedFiles[i];
        const publicId = `${file.name.split('.')[0]}_${new Date().toISOString()}`;

        const data = new FormData(); // Create new FormData for each file
        data.append('file', file);
        data.append('upload_preset', 'xkxkuuas');
        data.append('cloud_name', 'dq6jwuhda');
        data.append('public_id', publicId);
        data.append('folder', 'uploads'); // Specify the folder path here

        // Determine the appropriate endpoint based on file type
        let endpoint = '';
        if (file.type.startsWith('image/')) {
          endpoint = 'image';
        } else if (file.type.startsWith('video/')) {
          endpoint = 'video';
        } else if (file.type.startsWith('audio/')) {
          endpoint = 'raw';
        } else if (file.type === 'application/pdf') {
          endpoint = 'raw';
        } else {
          endpoint = 'files'
        }

        // Store the observable for each file upload
        if (endpoint) {
          uploadObservables.push(this.uploadFiles(data, endpoint));
        }
      }

      // Wait for all uploads to complete
      forkJoin(uploadObservables).subscribe(
        (responses: any[]) => {
          responses.forEach(response => {
            if (response.resource_type === 'image') {
              this.imageUrl.push(response.url);
            } else if (response.resource_type === 'video') {
              this.imageUrl.push(response.url);
            } else if (response.resource_type === 'raw') {
              this.imageUrl.push(response.url);
            }
          });
          alert('All files uploaded successfully');
          this.selectedFiles = []; // Clear selected files
          this.sendMessage(roomId);
        },
        (error) => {
          console.error('Upload error:', error);
        }
      );
    } else {
      console.error('No files selected for upload.');
    }
  }

  uploadFiles(data: FormData, folderName: string): Observable<any> {
    return this.http.post('https://api.cloudinary.com/v1_1/dq6jwuhda/' + folderName + '/upload', data);
  }

  showDownloadButton = true; // Flag to show/hide download button

  // Method to handle PDF download
  downloadPdf(): void {
    if (this.pdfObject && this.pdfObject.nativeElement) {
      const pdfElement = this.pdfObject.nativeElement as HTMLObjectElement;

      // Get PDF URL from object data attribute (sanitized)
      const pdfUrl = pdfElement.data;

      // Check if the file exists locally
      this.checkFileExists(pdfUrl)
        .then(exists => {
          if (exists) {
            // File exists, handle accordingly (e.g., hide download button)
            this.showDownloadButton = false;
            console.log('File exists locally.');
          } else {
            // File does not exist, initiate download
            this.initiateDownload(pdfUrl);
          }
        })
        .catch(error => {
          console.error('Error checking file existence:', error);
        });
    }
  }

  // Method to check if file exists locally
  private checkFileExists(url: string): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('HEAD', url);
      xhr.onload = () => {
        resolve(xhr.status === 200);
      };
      xhr.onerror = () => {
        reject(new Error('Error checking file existence.'));
      };
      xhr.send();
    });
  }

  // Method to initiate the download
  private initiateDownload(url: string): void {
    // Create a temporary link element
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('target', '_blank'); // Open in new tab
    link.setAttribute('download', 'document.pdf'); // Set default download file name

    // Append the link to the body
    document.body.appendChild(link);

    // Trigger the click event to start download
    link.click();

    // Clean up: remove the link from the DOM
    document.body.removeChild(link);
  }

  downloadAudio(item: string) {
    // Open a new window and initiate the download
    const newWindow = window.open(item, '_blank');
    if (newWindow) {
      newWindow.document.title = 'Downloading audio...';
    } else {
      console.error('Failed to open new window for download.');
    }
  }

  dropdownMessageId: string | null = null;

  setDropdown(messageId: string) {
    this.dropdownMessageId = messageId;
  }

  clearDropdown() {
    this.dropdownMessageId = null;
  }
  reply(messageId: string) {
    console.log('Reply clicked for messageId:', messageId);
    // Implement reply functionality here
    alert(messageId)
  }

  delete(messageId: string) {
    this.chatService.deleteMessage({ "messageId": messageId, "roomId": this.chatRoom.roomId, "senderId": this.senderId, "recipientId": this.recieverId });
  }
}
