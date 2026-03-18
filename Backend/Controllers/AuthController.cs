using ExamNest.Models.DTOs;
using ExamNest.Services;
using Microsoft.AspNetCore.Mvc;

namespace ExamNest.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;
        private readonly IGoogleAuthConfiguration _googleAuthConfiguration;

        public AuthController(IAuthService authService, IGoogleAuthConfiguration googleAuthConfiguration)
        {
            _authService = authService;
            _googleAuthConfiguration = googleAuthConfiguration;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequestDto request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var result = await _authService.RegisterAsync(request);

            if (!result.Success)
                return Conflict(result);

            return Ok(result);
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequestDto request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var result = await _authService.LoginAsync(request);

            if (!result.Success)
                return Unauthorized(result);

            return Ok(result);
        }

        [HttpPost("verify-email-otp")]
        public async Task<IActionResult> VerifyEmailOtp([FromBody] VerifyEmailOtpRequestDto request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var result = await _authService.VerifyEmailOtpAsync(request);
            if (!result.Success)
                return Conflict(result);

            return Ok(result);
        }

        [HttpPost("resend-email-otp")]
        public async Task<IActionResult> ResendEmailOtp([FromBody] ResendEmailOtpRequestDto request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var result = await _authService.ResendEmailOtpAsync(request);
            if (!result.Success)
                return BadRequest(result);

            return Ok(result);
        }


        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequestDto request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var result = await _authService.ForgotPasswordAsync(request);
            if (!result.Success)
                return BadRequest(result);

            return Ok(result);
        }

        [HttpPost("verify-forgot-password-otp")]
        public async Task<IActionResult> VerifyForgotPasswordOtp([FromBody] VerifyForgotPasswordOtpRequestDto request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var result = await _authService.VerifyForgotPasswordOtpAsync(request);
            if (!result.Success)
                return Conflict(result);

            return Ok(result);
        }

        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequestDto request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var result = await _authService.ResetPasswordAsync(request);
            if (!result.Success)
                return BadRequest(result);

            return Ok(result);
        }

        [HttpPost("google-login")]
        public async Task<IActionResult> GoogleLogin([FromBody] GoogleLoginRequestDto request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var result = await _authService.GoogleLoginAsync(request);
            if (!result.Success)
                return Unauthorized(result);

            return Ok(result);
        }

        [HttpGet("google-client-id")]
        public IActionResult GetGoogleClientId()
        {
            var googleClientId = _googleAuthConfiguration.GetFrontendClientId();

            if (string.IsNullOrWhiteSpace(googleClientId))
            {
                return NotFound(new { message = "Google OAuth client id is not configured." });
            }

            return Ok(new { clientId = googleClientId });
        }
    }
}
