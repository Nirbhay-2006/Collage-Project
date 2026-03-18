using ExamNest.Data;
using ExamNest.Models;
using ExamNest.Models.DTOs.Exam;
using ExamNest.Models.DTOs.Payment;
using ExamNest.Models.DTOs.User;
using ExamNest.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Identity.Client;
using Razorpay.Api;

namespace ExamNest.Controllers
{
    [Route("api/[controller]/[action]")]
    [ApiController]
	[Authorize(Roles ="Admin")]
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
        public async Task<IActionResult> GetAllTeacher()
        {
            var teachers = await _adminServices.GetAllTeacher();
            return Ok(teachers);
        }


        [HttpGet]
        public async Task<IActionResult> GetAllStudent()
        {
            var teachers = await _adminServices.GetAllStudent();
            return Ok(teachers);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetUserById(int id)
        {
            var teacher = await _adminServices.GetByIdAsync(id);
            if (teacher == null) return NotFound();

            return Ok(teacher);
        }

        [HttpPost("AddTeacher")]
        public async Task<IActionResult> CreateUser(UserCreateDTO dto)
        {
            var teacher = await _adminServices.CreateAsync(dto);
            return Ok(teacher);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateUser(int id, UserUpdateDTO dto)
        {
            var result = await _adminServices.UpdateAsync(id, dto);
            if (!result) return NotFound();

            return Ok("Teacher Updated Successfully");
        }

        [HttpPut("{id}")] // student
        public async Task<IActionResult> UpdateStudent(int id, UserUpdateDTO dto)
        {
            var result = await _adminServices.UpdateStudentAsync(id, dto);
            if (!result) return NotFound();

            return Ok("student Updated Successfully");
        }



        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteUser(int id)
        {
            var result = await _adminServices.DeleteAsync(id);
            if (!result) return NotFound();
            return Ok("Deleted Successfully");
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteStudent(int id)
        {
            var result = await _adminServices.DeleteStudentAsync(id);
            if (!result) return NotFound();
            return Ok("Deleted Successfully");
        }

        // course side

        [HttpGet]
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
		public async Task<IActionResult> GetRoles()
		{
			return Ok(await _context.Roles.ToListAsync());
		}

		// GET by ID
		[HttpGet("{id}")]
		public async Task<IActionResult> GetRole(int id)
		{
			var role = await _context.Roles.FindAsync(id);
			if (role == null) return NotFound();
			return Ok(role);
		}

		// CREATE
		[HttpPost]
		public async Task<IActionResult> CreateRole(Role role)
		{
			role.CreatedAt = DateTime.Now;
			_context.Roles.Add(role);
			await _context.SaveChangesAsync();
			return Ok(role);
		}

		// UPDATE
		[HttpPut("{id}")]
		public async Task<IActionResult> UpdateRole(int id, Role role)
		{
			if (id != role.RoleId) return BadRequest();

			_context.Entry(role).State = EntityState.Modified;
			await _context.SaveChangesAsync();

			return Ok(role);
		}

		// DELETE
		[HttpDelete("{id}")]
		public async Task<IActionResult> DeleteRole(int id)
		{
			var role = await _context.Roles.FindAsync(id);
			if (role == null) return NotFound();

			_context.Roles.Remove(role);
			await _context.SaveChangesAsync();

			return Ok();
		}

	}
}
