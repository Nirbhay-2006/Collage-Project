import { CommonModule } from '@angular/common';
import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
  HostListener,
} from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { Studentservice } from '../Service/StudentService/studentservice';
import { Router } from '@angular/router';

@Component({
  selector: 'app-student-exam-attempt',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './student-exam-attempt.html',
  styleUrl: './student-exam-attempt.css',
})
export class StudentExamAttempt implements OnInit, OnDestroy {

  examData: any;
  selectedAnswers: any = {};

  remainingSeconds: number = 0;
  formattedTime: string = '00:00';
  timerInterval: any;

  isSubmitting = false;

  // ✅ VIOLATION CONTROL
  violationCount = 0;
  maxViolations = 3;

  constructor(
    private service: Studentservice,
    private router: Router,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.examData = history.state.examData;

    if (!this.examData) {
      this.router.navigate(['/student-dashboard']);
      return;
    }

    this.initTimer(this.examData);

    // ✅ Enter Fullscreen
    this.enterFullScreen();

    // ✅ Disable right click
    document.addEventListener('contextmenu', this.disableRightClick);

    // ✅ Tab switch detection
    document.addEventListener('visibilitychange', this.handleTabChange);
  }

  ngOnDestroy(): void {
    clearInterval(this.timerInterval);

    document.removeEventListener('contextmenu', this.disableRightClick);
    document.removeEventListener('visibilitychange', this.handleTabChange);
  }

  // ✅ HANDLE VIOLATION
  handleViolation(message: string) {
    this.violationCount++;

    alert(`${message} (Warning ${this.violationCount}/${this.maxViolations})`);

    if (this.violationCount >= this.maxViolations) {
      alert('Too many violations! Exam submitted.');
      this.autoSubmitExam();
    }
  }

  // ✅ FULLSCREEN
  enterFullScreen() {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem.requestFullscreen();
    }
  }

  exitFullScreen() {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
  }

  // ✅ BLOCK RIGHT CLICK
  disableRightClick = (event: any) => {
    event.preventDefault();
    this.handleViolation('Right click is not allowed');
  };

  // ✅ BLOCK KEYBOARD (SMART WAY)
  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {

    const blockedKeys = ['F12', 'F5', 'Escape', 'Tab'];

    if (
      blockedKeys.includes(event.key) ||
      event.ctrlKey ||
      event.altKey ||
      event.metaKey
    ) {
      event.preventDefault();
      this.handleViolation('Restricted key pressed');
    }
  }

  // ✅ BLOCK COPY / PASTE
  @HostListener('document:copy', ['$event'])
  @HostListener('document:paste', ['$event'])
  @HostListener('document:cut', ['$event'])
  blockClipboard(event: ClipboardEvent) {
    event.preventDefault();
    this.handleViolation('Copy/Paste not allowed');
  }

  // ✅ TAB SWITCH DETECTION
  handleTabChange = () => {
    if (document.hidden) {
      this.handleViolation('Tab switching is not allowed');
    }
  };

  // ✅ FULLSCREEN EXIT DETECTION
  @HostListener('document:fullscreenchange')
  onFullScreenChange() {
    if (!document.fullscreenElement && this.remainingSeconds > 0) {
      this.handleViolation('Exiting fullscreen is not allowed');
    }
  }

  // ✅ TIMER
  initTimer(data: any) {
    if (data?.remainingSeconds) {
      this.startTimer(data.remainingSeconds);
    }
  }

  startTimer(seconds: number) {
    this.remainingSeconds = seconds;
    this.updateTime();

    this.timerInterval = setInterval(() => {
      this.remainingSeconds--;
      this.updateTime();

      if (this.remainingSeconds === 300) {
        alert('Only 5 minutes left!');
      }

      if (this.remainingSeconds <= 0) {
        clearInterval(this.timerInterval);

        this.exitFullScreen();
        this.autoSubmitExam();
      }

      this.cd.detectChanges();
    }, 1000);
  }

  updateTime() {
    const mins = Math.floor(this.remainingSeconds / 60);
    const secs = this.remainingSeconds % 60;

    this.formattedTime =
      String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0');
  }

  // ✅ SELECT ANSWER
  selectAnswer(questionId: number, optionId: string) {
    this.selectedAnswers[questionId] = optionId;
  }

  // ✅ SUBMIT
  SubmitExam() {
    if (this.isSubmitting) return;
    this.isSubmitting = true;

    const payload = {
      examAttemptId: this.examData.attemptId,
      answers: this.examData.questions.map((q: any) => ({
        examQuestionId: q.examQuestionId,
        selectedOption: this.selectedAnswers[q.examQuestionId] ?? '',
      })),
    };

    this.service.SubmitExam(this.examData.examId, payload).subscribe({
      next: () => {
        alert('Exam submitted successfully!');
        this.router.navigate(['/student-dashboard/student-exam']);
      },
      error: (err) => {
        console.log(err);
        this.isSubmitting = false;
      },
    });
  }

  // ✅ AUTO SUBMIT
  autoSubmitExam() {
    setTimeout(() => this.SubmitExam(), 300);
  }
}
