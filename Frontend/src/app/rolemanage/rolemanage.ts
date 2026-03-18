import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Adminservice } from '../Service/AdminService/adminservice';
import { FormsModule, isFormControl } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { compileOpaqueAsyncClassMetadata } from '@angular/compiler';

declare var bootstrap: any;
@Component({
  selector: 'app-rolemanage',
  imports: [FormsModule, CommonModule],
  templateUrl: './rolemanage.html',
  styleUrl: './rolemanage.css',
})
export class Rolemanage implements OnInit {
  roles: any[] = [];
  roleData: any = { role_Id: 0, role_Name: '' };
  modal: any;
  isload = false;
  constructor(
    private service: Adminservice,
    private cd: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.loadRoles();
  }

  loadRoles() {
    this.isload = true;
    this.service.getRoles().subscribe({
      next: (res) => {
        this.isload = false;
        this.roles = res;
        this.cd.detectChanges();
      },
      error: (err) => {
        this.isload = false;
        this.cd.detectChanges();
      },
    });
  }

  openModal(data: any = null) {
    this.roleData = data ? { ...data } : { roleId: 0, roleName: '' };
    this.modal = new bootstrap.Modal(document.getElementById('roleModal'));
    this.modal.show();
  }

  saveRole() {
    if (this.roleData.roleId === 0) {
      this.service.createRole(this.roleData).subscribe(() => {
        this.modal.hide();
        this.loadRoles();
        this.cd.detectChanges();
      });
    } else {
      this.service.updateRole(this.roleData.roleId, this.roleData).subscribe(() => {
        this.modal.hide();
        this.loadRoles();
        this.cd.detectChanges();
      });
    }
  }

  deleteRole(id: number) {
    if (confirm('Delete this role?')) {
      this.service.deleteRole(id).subscribe(() => {
        this.loadRoles();
        this.cd.detectChanges();
      });
    }
  }
}
