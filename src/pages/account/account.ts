import { AfterViewInit, Component, ViewEncapsulation } from '@angular/core';
import { User } from '../../models/models';
import { Storage } from '@ionic/storage';

@Component({
  selector: 'page-account',
  templateUrl: 'account.html',
})
export class AccountPage {
  user: User;
  users:User[]=[];
  constructor(
    private storage: Storage
  ) { 

    this.loadUserFromStorage()

    this.user=new User({
      id:1,
      userName:'ali',
      eMail:'alican@asd.com',
      password:'hackme',
      created_at: new Date(),
    })
  }

  save(){
    if(this.user){
      this.users.push(this.user)
      this.storage.set('users', this.users).then(res=>{
        this.loadUserFromStorage()
      });
    }
  }
  

  loadUserFromStorage(){
    this.storage.get('users').then(res=>{
      if(res){
        this.users=res;
      }
    });
  }

}