// export class FileUpload {

//     onChangeImg(event: any) {
//         const file = event.target.files[0];
//         const data = new FormData();
//         data.append('file', file);
//         data.append('upload_preset', 'xkxkuuas');
//         data.append('cloud_name', 'dq6jwuhda');
//         const publicId = `${file.name.split('.')[0]}_${new Date().toISOString()}`;
//         data.append('public_id', publicId);
    
//         this.uploadSignature(data).subscribe((imageData: any) => {
//           this.imageUrl = imageData.url;
//           this.registrationForm.patchValue({
//             signatureUrl: imageData.url
//           });
//         });
//       }
    
//       onSubmit() {
//         console.log(this.registrationForm.value);
//         // Handle form submission
//       }
//       uploadSignature(data: FormData): Observable<any> {
//         return this.http.post('https://api.cloudinary.com/v1_1/dq6jwuhda/image/upload', data);
//       }
    
// } 