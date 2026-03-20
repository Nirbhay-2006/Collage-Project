using System.Security.Claims;
using ExamNest.Data;
using ExamNest.Models;
using ExamNest.Models.DTOs;
using ExamNest.Models.DTOs.Exam;
using ExamNest.Models.DTOs.Payment;
using ExamNest.Models.DTOs.User;
using ExamNest.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Identity.Client;
using Razorpay.Api;

namespace ExamNest.Controllers
{
    [Route("api/[controller]/[action]")]
    [ApiController]
	//[Authorize(Roles ="Admin")]
	public class AdminController : Controller
    {
        private readonly AdminServices _adminServices;
        private readonly AppDbContext _context;
		private readonly IConfiguration _config;

		public AdminController(AdminServices adminServices, AppDbContext context, IConfiguration config) {
            _adminServices = adminServices;
            _context = context;
			_config = config;
        }

        // teacher side
        [HttpGet]
		[Authorize(Roles = "Admin")]
		public async Task<IActionResult> GetAllTeacher()
        {
            var teachers = await _adminServices.GetAllTeacher();
            return Ok(teachers);
        }



        [HttpGet]
		[Authorize(Roles = "Admin")]
		public async Task<IActionResult> GetAllStudent()
        {
            var teachers = await _adminServices.GetAllStudent();
            return Ok(teachers);
        }

        [HttpGet("{id}")]
		[Authorize(Roles = "Admin")]

		public async Task<IActionResult> GetUserById(int id)
        {
            var teacher = await _adminServices.GetByIdAsync(id);
            if (teacher == null) return NotFound();

            return Ok(teacher);
        }

        [HttpPost("AddTeacher")]
		[Authorize(Roles = "Admin")]

		public async Task<IActionResult> CreateUser(UserCreateDTO dto)
        {
            var teacher = await _adminServices.CreateAsync(dto);
            return Ok(teacher);
        }

        [HttpPut("{id}")]
		[Authorize(Roles = "Admin")]

		public async Task<IActionResult> UpdateUser(int id, UserUpdateDTO dto)
        {
            var result = await _adminServices.UpdateAsync(id, dto);
            if (!result) return NotFound();

            return Ok("Teacher Updated Successfully");
        }

        [HttpPut("{id}")] // student		
		[Authorize(Roles = "Admin")]

		public async Task<IActionResult> UpdateStudent(int id, UserUpdateDTO dto)
        {
            var result = await _adminServices.UpdateStudentAsync(id, dto);
            if (!result) return NotFound();

			return Ok(new
			{
				success = true,
				message = "Student updated successfully"
			});
		}



        [HttpDelete("{id}")]
		[Authorize(Roles = "Admin")]

		public async Task<IActionResult> DeleteUser(int id)
        {
            var result = await _adminServices.DeleteAsync(id);
            if (!result) return NotFound();
            return Ok("Deleted Successfully");
        }

        [HttpDelete("{id}")]
		[Authorize(Roles = "Admin")]

		public async Task<IActionResult> DeleteStudent(int id)
        {
            var result = await _adminServices.DeleteStudentAsync(id);
            if (!result) return NotFound();
            return Ok("Deleted Successfully");
        }

        // course side

        [HttpGet]
		[Authorize(Roles = "Admin")]

		public async Task<IActionResult> GetAllCourses()
        {
            var allcourse = await _adminServices.GetAllCourses();
			var result = allcourse.Select(c => new {
				c.CourseId,
				c.Title,
				c.Description,
				c.Fees,
				c.StartDate,
				c.EndDate,
				c.IsPublished,
                c.CreatedAt,
                TeacherName = c.Teacher != null ? c.Teacher.Username : "Unknown",

			}).ToList();

			if (result == null)
            {
                return Conflict("Course Is Not Found !!!");
            }
            return Ok(result);
        }

        [HttpPost]
		[Authorize(Roles = "Admin")]

		public async Task<IActionResult> PublishCourse([FromBody] int courseId)
        {
            var course = await _adminServices.PublishCourse(courseId);
            if(course == null)
            {
                return NotFound("Course Is Not Found !!");
            }
            return Ok(new
            {
                message = "Course Was Published"
            });
        }

		[HttpPost("courses/{courseId}/delete")]
		[Authorize(Roles = "Admin")]

		public async Task<IActionResult> DeleteCourseWiseId(int courseId)
		{
			var course = await _context.Courses
				.FirstOrDefaultAsync(r => r.CourseId == courseId);

			if (course == null)
			{
				return NotFound(new { message = "Course not found!" });
			}

			var hasOrders = await _context.Orders
				.AnyAsync(o => o.CourseId == courseId);

			if (hasOrders)
			{
				return BadRequest(new
				{
					message = "Cannot delete course because orders exist for this course."
				});
			}

			_context.Courses.Remove(course);
			await _context.SaveChangesAsync();

			return Ok(new
			{
				message = "Course deleted successfully!"
			});
		}


		// payment

		[HttpGet("payments")]
		[Authorize(Roles = "Admin")]

		public async Task<IActionResult> GetAllPayments()
		{
			var payments = await (
				from p in _context.Payments
				join o in _context.Orders on p.OrderId equals o.Id
				join c in _context.Courses on o.CourseId equals c.CourseId
				join u in _context.Users on o.StudentId equals u.UserId
				join s in _context.Subscriptions
					on new { o.StudentId, o.CourseId }
					equals new { s.StudentId, s.CourseId } into sub
				from s in sub.DefaultIfEmpty()

				select new PaymentDetailDto
				{
					PaymentId = p.Id,
					RazorpayPaymentId = p.RazorpayPaymentId,
					Amount = p.Amount,
					Status = p.Status,
					PaymentDate = p.CreatedAt,

					CourseTitle = c.Title,
					CourseFees = c.Fees,

					StudentName = u.FirstName + " " + u.LastName,
					StudentEmail = u.Email,

					OrderId = o.OrderId,
					SubscriptionStatus = s != null ? s.Status : "N/A"
				}
			).ToListAsync();

			return Ok(payments);
		}

		[HttpGet("payments/{id}")]
		[Authorize(Roles = "Admin")]

		public async Task<IActionResult> GetPaymentDetail(int id)
		{
			var payment = await (
				from p in _context.Payments
				join o in _context.Orders on p.OrderId equals o.Id
				join c in _context.Courses on o.CourseId equals c.CourseId
				join u in _context.Users on o.StudentId equals u.UserId
				join s in _context.Subscriptions
					on new { o.StudentId, o.CourseId }
					equals new { s.StudentId, s.CourseId } into sub
				from s in sub.DefaultIfEmpty()

				where p.Id == id

				select new PaymentDetailDto
				{
					PaymentId = p.Id,
					RazorpayPaymentId = p.RazorpayPaymentId,
					Amount = p.Amount,
					Status = p.Status,
					PaymentDate = p.CreatedAt,

					CourseTitle = c.Title,
					CourseFees = c.Fees,

					StudentName = u.FirstName + " " + u.LastName,
					StudentEmail = u.Email,

					OrderId = o.OrderId,
					SubscriptionStatus = s != null ? s.Status : "N/A"
				}
			).FirstOrDefaultAsync();

			if (payment == null)
				return NotFound(new { message = "Payment not found" });

			return Ok(payment);
		}



		[HttpGet("payments/check/{paymentId}")]
		[Authorize(Roles = "Admin")]

		public async Task<IActionResult> CheckPayment(string paymentId)
		{
			var payment = await _context.Payments
				.FirstOrDefaultAsync(p => p.RazorpayPaymentId == paymentId);

			if (payment == null)
			{
				return NotFound(new { message = "Payment not found" });
			}

			try
			{
				string key = _config["Razorpay:Key"]!;
				string secret = _config["Razorpay:SecretKey"]!;

				RazorpayClient client = new RazorpayClient(key, secret);

				Payment razorPayment = client.Payment.Fetch(paymentId);

				return Ok(new
				{
					razorpayPaymentId = paymentId,
					status = razorPayment["status"]?.ToString(),
					amount = razorPayment["amount"] != null
					   ? Convert.ToDecimal(razorPayment["amount"]) / 100
					   : 0,
					method = razorPayment["method"]?.ToString(),
					email = razorPayment["email"]?.ToString(),
					contact = razorPayment["contact"]?.ToString()
				});
			}
			catch (Exception ex)
			{
				return StatusCode(500, new
				{
					message = "Error checking payment",
					error = ex.Message
				});
			}
		}

		// exams 

		[HttpGet("exams")]
		[Authorize(Roles = "Admin")]

		public async Task<IActionResult> GetAllExams()
		{
			var exams = await _context.Exams
				.Select(e => new
				{
					e.ExamId,
					e.Title,
					e.Description,
					e.CourseId,
					e.TeacherId,
					e.StartAt,
					e.EndAt,
					e.DurationMinutes,
					e.RandomQuestionCount,
					e.CreatedAt
				})
				.ToListAsync();

			return Ok(exams);
		}


		[HttpDelete("exams/{id}")]
		[Authorize(Roles = "Admin")]

		public async Task<IActionResult> DeleteExam(int id)
		{
			var exam = await _context.Exams.FindAsync(id);

			if (exam == null)
				return NotFound(new { message = "Exam not found" });

			// ❗ prevent delete if attempts exist
			//var hasAttempts = await _context.ExamAttempts
			//	.AnyAsync(a => a.ExamId == id);

			//if (hasAttempts)
			//	return BadRequest(new
			//	{
			//		message = "already attempted this exam"
			//	});

			_context.Exams.Remove(exam);
			await _context.SaveChangesAsync();

			return Ok(new { message = "Exam deleted successfully" });
		}

		[HttpGet("exams/{examId}/students")]
		[Authorize(Roles = "Admin")]

		public async Task<IActionResult> GetStudentsByExam(int examId)
		{
			var students = await (
				from attempt in _context.ExamAttempts
				join user in _context.Users
					on attempt.StudentId equals user.UserId

				where attempt.ExamId == examId

				select new ExamStudentDto
				{
					UserId = user.UserId,
					Name = user.FirstName + " " + user.LastName,
					Email = user.Email,
					MaxScore = attempt.MaxScore,
					Score = attempt.TotalScore,
					Status = attempt.Status
				}
			).ToListAsync();

			return Ok(students);
		}

		// role side
		[HttpGet]
		[Authorize(Roles = "Admin")]

		public async Task<IActionResult> GetRoles()
		{
			return Ok(await _context.Roles.ToListAsync());
		}

		// GET by ID
		[HttpGet("{id}")]
		[Authorize(Roles = "Admin")]

		public async Task<IActionResult> GetRole(int id)
		{
			var role = await _context.Roles.FindAsync(id);
			if (role == null) return NotFound();
			return Ok(role);
		}

		// CREATE
		[HttpPost]
		[Authorize(Roles = "Admin")]

		public async Task<IActionResult> CreateRole(Role role)
		{
			role.CreatedAt = DateTime.Now;
			_context.Roles.Add(role);
			await _context.SaveChangesAsync();
			return Ok(role);
		}

		// UPDATE
		[HttpPut("{id}")]
		[Authorize(Roles = "Admin")]

		public async Task<IActionResult> UpdateRole(int id, Role role)
		{
			if (id != role.RoleId) return BadRequest();

			_context.Entry(role).State = EntityState.Modified;
			await _context.SaveChangesAsync();

			return Ok(role);
		}

		// DELETE
		[HttpDelete("{id}")]
		[Authorize(Roles = "Admin")]

		public async Task<IActionResult> DeleteRole(int id)
		{
			var role = await _context.Roles.FindAsync(id);
			if (role == null) return NotFound();

			_context.Roles.Remove(role);
			await _context.SaveChangesAsync();

			return Ok();
		}


        // dashboard side
        [HttpGet("dashboarddata")]
		[Authorize(Roles = "Admin")]

		public async Task<IActionResult> GetDashboardData()
        {
            // Students Count
            var totalStudents = await _context.Users
                .Where(u => u.Role!.RoleName == "Student")
                .CountAsync();

            // Teachers Count
            var totalTeachers = await _context.Users
                .Where(u => u.Role!.RoleName == "Teacher")
                .CountAsync();

            // Exams Count
            var totalExams = await _context.Exams
                .CountAsync();

            // Attempts Status
            var submittedAttempts = await _context.ExamAttempts
                .Where(a => a.Status == "Submitted")
                .CountAsync();

            var pendingAttempts = await _context.ExamAttempts
                .Where(a => a.Status == "InProgress")
                .CountAsync();

            // Total Earnings (handle null safely)
            var totalEarnings = await _context.Payments
                .Where(p => p.Order!.Status == "Paid")
                .SumAsync(p => (decimal?)p.Amount) ?? 0;

            // total course
            var totalcourse = await _context.Courses.CountAsync();

            var publishedcourse = await _context.Courses
                .CountAsync(r => r.IsPublished);
            // Final Response
            return Ok(new
            {
                totalStudents = totalStudents,      // 0 if none
                totalTeachers = totalTeachers,     // 0 if none
                totalExams = totalExams,           // 0 if none
                submittedAttempts = submittedAttempts,
                pendingAttempts = pendingAttempts,
                totalEarnings = totalEarnings,
				totalcourse = totalcourse,
				publishedcourse = publishedcourse
            });
        }

        [HttpGet("top-exams")]
		[Authorize(Roles = "Admin")]

		public async Task<IActionResult> GetTopExams()
        {
            // Step 1: Get top 3 exams
            var exams = await (
                from e in _context.Exams
                join c in _context.Courses on e.CourseId equals c.CourseId
                join u in _context.Users on e.TeacherId equals u.UserId

                orderby e.CreatedAt descending

                select new
                {
                    e.ExamId,
                    ExamTitle = e.Title,
                    CourseName = c.Title,
                    CreatedDate = e.CreatedAt,
                    IsPublished = c.IsPublished,
                    TeacherName = u.FirstName + " " + u.LastName
                }
            )
            .Take(3)
            .ToListAsync();

            // Step 2: Calculate Avg % (separately)
            var result = exams.Select(e => new
            {
                e.ExamTitle,
                e.CourseName,
                e.CreatedDate,
                e.IsPublished,
                e.TeacherName,

                AvgPercentage = Math.Round(
                    _context.ExamAttemptAnswers
                        .Where(a => a.ExamAttempt!.ExamId == e.ExamId)
                        .AsEnumerable() // ✅ switch to memory
                        .GroupBy(a => a.ExamAttemptId)
                        .Select(g => (g.Sum(x => x.MarksAwarded) * 100.0) / g.Count())
                        .DefaultIfEmpty(0)
                        .Average(),
                2)
            });

            return Ok(result);
        }

        [HttpGet("CourseById/{CourseId}")]
		[Authorize(Roles = "Admin")]

		public async Task<IActionResult> GetCourseByid(int CourseId)
        {
            var course = await _context.Courses
                .Include(r => r.Teacher)
				.Include(r=>r.CourseMedias)
                .Where(r => r.CourseId == CourseId)
                .Select(r => new
                {
                    CourseId = r.CourseId,
                    Title = r.Title,
                    Description = r.Description,
                    StartDate = r.StartDate,
                    EndDate = r.EndDate,
                    IsPublished = r.IsPublished,
                    Fees = r.Fees,
                    ThumbnailUrl = r.ThumbailUrl,
                    TeacherId = r.TeacherId,
                    TeacherName = r.Teacher!.FirstName + " " +r.Teacher.LastName, // 👈 extra useful
                    CreatedAt = r.CreatedAt,
                    Videos = r.CourseMedias!.Select(m => new
                    {
                        CourseMediaId = m.CourseMediaId,
                        FileName = m.FileName,
                        FilePath = m.FilePath,
                        FileType = m.FileType
                    }).ToList()
                })
                .FirstOrDefaultAsync();

            if (course == null)
            {
                return NotFound("Course Not Found!");
            }

            return Ok(course);
        }

        [HttpGet("MyProfile")]
		[Authorize(Roles = "Teacher,Admin,Student")]
        public async Task<IActionResult> GetUserProfile()
        {
            // extract user id from JWT 'sub'
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                            ?? User.FindFirst("sub")?.Value;

            if (!int.TryParse(userIdClaim, out int userId))
            {
                return Unauthorized("Invalid token: sub claim missing or not integer");
            }

            var user = await _context.Users
                .Where(u => u.UserId == userId)
                .Select(u => new UserProfileDto
                {
                    UserId = u.UserId,
                    FirstName = u.FirstName,
                    MiddleName = u.MiddleName,
                    LastName = u.LastName,
                    Email = u.Email,
                    Username = u.Username,
                    Phone = u.Phone,
                    RoleId = u.RoleId,
                    IsActive = u.IsActive,
                    LastLoginAt = u.LastLoginAt,
                    CreatedAt = u.CreatedAt,
                    UpdatedAt = u.UpdatedAt
                })
                .FirstOrDefaultAsync();

            if (user == null) return NotFound("User not found!");

            return Ok(user);
        }

		[HttpPost("profile/update")]
		[Authorize(Roles = "Teacher,Admin,Student")]
		public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileDto model)
		{
			// 🔐 Get userId from JWT
			var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
							  ?? User.FindFirst("sub")?.Value;

			if (!int.TryParse(userIdClaim, out int userId))
			{
				return Unauthorized("Invalid token");
			}

			var user = await _context.Users.FindAsync(userId);

			if (user == null)
				return NotFound("User not found");

			// ✅ Update fields
			user.FirstName = model.FirstName;
			user.MiddleName = model.MiddleName;
			user.LastName = model.LastName;
			user.Email = model.Email;
			user.Phone = model.Phone;

			user.UpdatedAt = DateTime.UtcNow;

			await _context.SaveChangesAsync();

			return Ok(new
			{
				success = true,
				message = "Profile updated successfully"
			});
		}
	}
}
