import { HttpClient } from '@angular/common/http';
import { identifierName } from '@angular/compiler';
import { Injectable } from '@angular/core';
import { response } from 'express';

@Injectable({
  providedIn: 'root',
})
export class Adminservice {
  constructor(private http: HttpClient) {}

  GetAllCourses() {
    return this.http.get('https://localhost:44385/api/Admin/GetAllCourses');
  }

  Publishcourse(courseId: number) {
    return this.http.post(`https://localhost:44385/api/Admin/PublishCourse`, courseId);
  }

  DeleteCourseById(courseId: number) {
    return this.http.post(
      `https://localhost:44385/api/Admin/DeleteCourseWiseId/courses/${courseId}/delete`,
      {},
    );
  }

  getcoursebyid(courseId: number) {
    return this.http.get(`https://localhost:44385/api/Admin/GetCourseByid/CourseById/${courseId}`);
  }

  GetAllPayments() {
    return this.http.get<any[]>('https://localhost:44385/api/Admin/GetAllPayments/payments');
  }

  GetPaymentDetail(id: number) {
    return this.http.get<any>(`https://localhost:44385/api/Admin/GetPaymentDetail/payments/${id}`);
  }

  CheckPayment(paymentId: string) {
    return this.http.get<any>(
      `https://localhost:44385/api/Admin/CheckPayment/payments/check/${paymentId}`,
    );
  }

  // exams
  getAllExams() {
    return this.http.get<any[]>('https://localhost:44385/api/Admin/GetAllExams/exams');
  }

  deleteExam(id: number) {
    return this.http.delete<any>(`https://localhost:44385/api/Admin/DeleteExam/exams/${id}`);
  }

  getStudentsByExam(id: number) {
    return this.http.get<any[]>(
      `https://localhost:44385/api/Admin/GetStudentsByExam/exams/${id}/students`,
    );
  }

  // roles

  getRoles() {
    return this.http.get<any[]>('https://localhost:44385/api/Admin/GetRoles');
  }

  createRole(data: any) {
    return this.http.post('https://localhost:44385/api/Admin/CreateRole', data);
  }

  updateRole(id: number, data: any) {
    return this.http.put(`https://localhost:44385/api/Admin/UpdateRole/${id}`, data);
  }

  deleteRole(id: number) {
    return this.http.delete(`https://localhost:44385/api/Admin/DeleteRole/${id}`);
  }

  // dash
  GetDahsboardData() {
    return this.http.get(`https://localhost:44385/api/Admin/GetDashboardData/dashboarddata`);
  }

  GetAvgExamDetails() {
    return this.http.get(`https://localhost:44385/api/Admin/GetTopExams/top-exams`);
  }

  Getprofile() {
    return this.http.get('https://localhost:44385/api/Admin/GetUserProfile/MyProfile');
  }

  UpdateProfile(data: any) {
    return this.http.post(`https://localhost:44385/api/Admin/UpdateProfile/profile/update`, data);
  }
}
